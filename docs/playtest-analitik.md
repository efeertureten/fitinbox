# Fit in Box: Arkadaş Playtest'i, Ölçüm Rehberi

Site: https://efeertureten.github.io/pack-jam-zero-gap/
Veriler: PostHog (EU Cloud, proje 336240). Tüm olaylar `release = v11-playtest` etiketiyle gelir. Yeni bir test turunda `src/analytics.config.json` içindeki `release` değerini değiştir (örn. `v12-playtest`); turlar böylece birbirine karışmaz.

## 1. Arkadaşlara kişisel link gönder

Her arkadaşa adını taşıyan bir link ver. Böylece PostHog'da kimin ne yaptığını isimle görürsün; e-posta ya da hesap istemeye gerek kalmaz.

```
https://efeertureten.github.io/pack-jam-zero-gap/?u=ali
https://efeertureten.github.io/pack-jam-zero-gap/?u=ayse
```

- Ad bir kez kaydedilir; arkadaşın sonradan linksiz girse de aynı kişi sayılır.
- Kendi testlerin için `?u=efe` kullan ve analizde onu filtrele. Hiç ölçülmek istemiyorsan `?noanalytics` ekle.
- İlk girişte küçük bir "Test sürümü" bildirimi çıkar. "Ölçme" diyen kişiden veri gelmez.

**Davet mesajı (WhatsApp için):**
> Yeni bir bulmaca oyunu yapıyorum, test eder misin? 🧳 Bavula eşyaları sığdırıyorsun. Telefondan aç, 10–15 dakika oyna, takıldığın yerde bırak; zorlandığın yer benim için en değerli veri. Link sana özel: https://efeertureten.github.io/pack-jam-zero-gap/?u=ADI
> Bittiğinde tek cümleyle söyle: en çok neyi sevdin, en çok neye sinir oldun?

## 2. Cevaplamak istediğimiz sorular

| Soru | Nereden bakılır | Sağlıklı sinyal |
|---|---|---|
| İlk dakika anlaşılıyor mu? | `tutorial_step` (gate, slide) `time_sec`; Bölüm 1 hunisi | İlk kapı dokunuşu < 10 sn, Bölüm 1'i bitirme > %90 |
| Zorluk eğrisi beklendiği gibi mi? | SQL 3.1 (bölüm tablosu) | Ferah > %90, Standart %70–85, ZOR %40–65, SÜPER ZOR %25–50 kazanma; ZOR'dan sonraki nefes bölümü yine > %85 |
| Nerede bırakıyorlar? | `level_end` outcome = quit/abandon, bölüme göre | Tek bir bölümde yığılma olmamalı |
| Hangi özellikler kullanılıyor? | `booster_use`, `booster_buy`, `screen_view` (shop, map, queue), autocapture tıklamaları | Vakum ve Silkele'yi en az %30 oyuncu bir kez denemeli |
| Nerede ne kadar süre geçiriyorlar? | SQL 3.3 (ekran süreleri), `session_end.screen_totals` | Oyun süresinin > %75'i `play` ekranında |
| Neye takılıyorlar? | SQL 3.5 (reddedilen hamleler) + oturum kayıtları | Aynı uyarı bir bölümde 3+ kez tekrarlanıyorsa kural anlaşılmamış |
| Telefonlarında akıcı mı? | `level_end`/`level_win` içindeki `fps_avg`, `slow_frame_pct` | fps_avg > 45, slow_frame_pct < %10 |
| Geri geliyorlar mı? | Retention (session_start → session_start) | Ertesi gün dönüş, arkadaş testi için > %30 iyi |

## 3. Hazır SQL sorguları (PostHog → SQL editor)

### 3.1 Bölüm zorluk tablosu
```sql
SELECT
  toInt(properties.level)                                   AS level,
  any(properties.tier)                                      AS tier,
  any(properties.grid)                                      AS grid,
  any(properties.gaps)                                      AS gaps,
  countIf(event = 'level_start')                            AS starts,
  countIf(event = 'level_win')                              AS wins,
  round(100 * countIf(event = 'level_win') / nullIf(countIf(event = 'level_start'), 0)) AS win_rate_pct,
  countIf(event = 'level_fail')                             AS out_of_space,
  countIf(event = 'level_end' AND properties.outcome = 'restart')            AS restarts,
  countIf(event = 'level_end' AND properties.outcome IN ('quit', 'abandon')) AS quits,
  round(avgIf(toFloat(properties.time_sec), event = 'level_win'))            AS avg_win_sec,
  round(avgIf(toFloat(properties.moves), event = 'level_win'), 1)            AS avg_win_moves,
  round(avgIf(toFloat(properties.stars), event = 'level_win'), 2)            AS avg_stars,
  countIf(event = 'booster_use')                            AS boosters,
  round(avgIf(toFloat(properties.fps_avg), event = 'level_win'))             AS fps
FROM events
WHERE event IN ('level_start', 'level_win', 'level_fail', 'level_end', 'booster_use')
  AND properties.release = 'v11-playtest'
  AND properties.tester != 'efe'
GROUP BY level
ORDER BY level
```
Okuma: `win_rate_pct` düşük ve `restarts` yüksekse bölüm zor. `quits` yüksek ama `out_of_space` düşükse bölüm sıkıcı ya da anlaşılmıyor. ZOR ve SÜPER ZOR'u, hemen sonrasındaki nefes bölümleriyle karşılaştır.

### 3.2 Oyuncu özeti (kim ne kadar oynadı)
```sql
SELECT
  properties.tester                                         AS tester,
  count(DISTINCT properties.$session_id)                    AS sessions,
  round(sumIf(toFloat(properties.duration_sec), event = 'session_end') / 60, 1) AS minutes,
  maxIf(toInt(properties.level), event = 'level_win')       AS best_level,
  countIf(event = 'level_win')                              AS wins,
  countIf(event = 'level_fail')                             AS out_of_space,
  countIf(event = 'booster_use')                            AS boosters,
  min(timestamp)                                            AS first_seen,
  max(timestamp)                                            AS last_seen
FROM events
WHERE properties.release = 'v11-playtest'
GROUP BY tester
ORDER BY minutes DESC
```

### 3.3 Ekran süreleri
```sql
SELECT properties.screen AS screen,
       round(sum(toFloat(properties.duration_sec)) / 60, 1) AS minutes,
       count() AS visits,
       round(avg(toFloat(properties.duration_sec)), 1) AS avg_sec
FROM events
WHERE event = 'screen_time' AND properties.release = 'v11-playtest'
GROUP BY screen
ORDER BY minutes DESC
```
Ekranlar: `home`, `play`, `shop`, `map`, `result`, `pause`, `fail`, `buy`, `queue`, `help`, `settings`.

### 3.4 Booster kullanımı
```sql
SELECT properties.kind AS booster, properties.source AS source,
       count() AS uses, count(DISTINCT properties.tester) AS players
FROM events
WHERE event = 'booster_use' AND properties.release = 'v11-playtest'
GROUP BY booster, source
ORDER BY uses DESC
```
`source`: `free` (bölümün kendi hakkı) ya da `owned` (satın alınmış veya sandıktan gelen). Satın almalar için `booster_buy`, jeton yetmeyince açılan pencere için `booster_offer` (`can_afford`) olaylarına bak.

### 3.5 En çok tekrarlanan uyarılar (neye takılıyorlar)
```sql
SELECT properties.reason AS reason, toInt(properties.level) AS level, count() AS times,
       count(DISTINCT properties.tester) AS players
FROM events
WHERE event = 'move_rejected' AND properties.release = 'v11-playtest'
GROUP BY reason, level
ORDER BY times DESC
LIMIT 30
```

## 4. PostHog'da kurulacak grafikler (Dashboard: "Playtest v11")

1. **Huni:** `session_start` → `level_start` (level = 1) → `level_win` (level = 1) → `level_win` (level = 3) → `level_win` (level = 10) → `level_win` (level = 15). İlk dakikada ve ilk zor bölümde nerede düştüklerini gösterir.
2. **Trend, Bar:** `level_start` ve `level_win`, `level` özelliğine göre kırılımlı. Zorluk testeresini görsel olarak görürsün.
3. **Trend:** `level_end`, `outcome`'a göre kırılımlı (restart, quit, abandon).
4. **Trend, Tablo:** `booster_use`, `kind`'a göre kırılımlı.
5. **Trend:** `screen_time`, toplam `duration_sec`, `screen`'e göre kırılımlı.
6. **Retention:** başlangıç ve dönüş olayı `session_start`.
7. **SQL tabloları:** 3.1 ve 3.2'yi "Save as insight" ile dashboard'a ekle.

## 5. Oturum kayıtları (en değerli kısım)

- Project Settings → Session Replay açık olmalı; tahtayı da görmek için "Capture canvas" seçeneğini aç.
- İzlenecek kayıtları filtrele:
  - `level_fail` olan oturumlar (Out of Space anları)
  - `level_end` outcome = `quit` olan oturumlar (nerede bıraktılar)
  - Bölüm 1–3'te 60 saniyeden uzun süren oturumlar (ilk deneyim takılması)
- Her kayıtta üç şeye bak: ilk 10 saniyede ne yapmaya çalıştı, hangi uyarıyı gördü, booster butonlarını fark etti mi.

## 6. Olay sözlüğü

| Olay | Ne zaman | Önemli özellikler |
|---|---|---|
| `session_start` | Sayfa açılınca | `entry`, `returning`, `referrer` |
| `screen_view` / `screen_time` | Ekran ya da pencere değişince | `screen`, `from`, `duration_sec`, `level` |
| `level_start` | Bölüm yüklenince | `level`, `tier`, `grid`, `gaps`, `queue`, `attempt` |
| `level_win` | Bavul kapanıp sonuç ekranı gelince | `time_sec` (aktif süre), `moves`, `stars`, `coins`, `first_clear`, `boosters_used`, `fps_avg` |
| `level_fail` | Out of Space ekranı | `reason` (no_entry / full / lid_stuck), `time_sec`, `moves`, `queue_left` |
| `level_end` | Bölüm kazanılmadan bitince | `outcome` (restart / quit / abandon / switch) + `level_win` ile aynı istatistikler |
| `booster_use` | Geri Al, Vakum, Silkele kullanılınca | `kind`, `source` |
| `booster_offer` / `booster_buy` | Hak bitince açılan pencere / satın alma | `kind`, `can_afford`, `price`, `where` |
| `move_rejected` | Turuncu uyarı gösterilince | `reason` (uyarı metni), `level` |
| `tutorial_step` | El ipucu adımı ilk kez başarılınca | `kind` (gate, slide, axis, towel, lid), `time_sec` |
| `chest_open` | Yıldız sandığı açılınca | `chest_no`, `kind`, `stars` |
| `session_end` | Sayfa kapanınca | `duration_sec`, `levels_started`, `levels_won`, `max_level`, `screen_totals` |
| `js_error` | Oyunda hata olunca | `message`, `source`, `line` |

Tüm olaylarda ortak alanlar: `release`, `platform`, `tester`, `screen_w`, `screen_h`, `dpr`, `touch`, `lang`. PostHog ayrıca cihaz, tarayıcı, ülke ve buton tıklamalarını (autocapture) kendisi ekler.

## 7. Teknik notlar

- Kod: `src/analytics.js` (`window.PJA` ve `trackEvent`). Yapılandırma: `src/analytics.config.json`. Proje anahtarı (`phc_…`) yalnızca veri yazar; herkese açık olması normaldir.
- Yapılandırma yalnızca web build'ine girer. `--target app` (iOS) build'inde hiçbir veri dışarı gönderilmez; olaylar cihazda kalır (`PJA.events()`). Uygulamada analitik açılacaksa önce `IOS_MAGAZA_PLANI.md` Adım 3'teki gizlilik ve izin adımları yapılmalı.
- `level_*.time_sec` aktif oyun süresidir: duraklatma, pencereler ve arka planda geçen süre sayılmaz. Sonuç ekranındaki saatin karşılığı `clock_sec`'tir.
