# Fit in Box — Native Mobil Dönüşüm (iOS + Android) ve Mağaza Hazırlığı

> **Nasıl kullanılır:** Bu dosyayı depo köküne (`pack-jam-zero-gap/`) koy, terminalde depo klasöründe `claude` çalıştır ve şunu yaz:
>
> ```
> IOS_MAGAZA_PLANI.md dosyasını oku. Adım 0'dan başlayarak sırayla uygula. Her adımın başında o adımın "Prompt" bölümünü görevin olarak al, "Ek gereksinimler"i de yap. Adım sonunda kabul kriterlerini kontrol et, işaretle, terminalde benim çalıştırmam gereken komutları göster ve bana kısa bir özet ver. "KARAR" yazan yerlerde ve benim yapmam gereken adımlarda (Apple/Google hesabı, imzalama, mağaza konsolları) dur ve bana sor.
> ```
>
> İstersen adımları tek tek de verebilirsin: `IOS_MAGAZA_PLANI.md'deki Adım 2'yi uygula`.

---

## Güncel durum (önce burayı oku)

> Son güncelleme: 5 Kasım 2026. Çalışma bundan sonra Mac'te sürecek. **Adım 0'dan başlama:** Adım 0, 1 ve 2'nin kodu `main`'de.

**Neredeyiz:** iOS projesi henüz hiç derlenmedi, uygulama gerçek iOS'ta hiç çalışmadı. Adım 3'e başlamadan önce aşağıdaki Mac kontrolleri bekleniyor. Bu en büyük belirsizlik, çünkü buraya kadarki testler Windows'ta yapıldı.

### Verilen kararlar (yeniden sorma)

| Konu | Karar |
| --- | --- |
| Uygulama adı | **Fit in Box** |
| Bundle ID | **`com.ergogames.fitinbox`** (planın önerisi yerine kullanıcının seçimi; mağazaya çıkınca değişmez) |
| iPad | İlk sürümde yok, yalnızca iPhone |
| Android | Sonraya bırakıldı: Adım 1b, Adım 2'deki geri tuşu ve Adım 6 yapılmadı |

Çalışma kuralları değişmedi: her adım ayrı commit, adım sonunda kullanıcı onayı, **push etmeden önce sor**. Depo herkese açık ve GitHub Pages açık; `main`'e push canlı web oyununu etkileyebilir.

### Mac'te ilk iş

Node 22+ ve Xcode 26+ gerekir (Capacitor 8). İlk Xcode build'i Capacitor paketini indirdiği için internet ister.

```bash
git clone https://github.com/efeertureten/pack-jam-zero-gap.git   # zaten klonluysa: git pull
cd pack-jam-zero-gap
npm install
npm run ios          # www/ üretir, ios/ projesine kopyalar, Xcode'u açar
npm run test:setup   # yalnızca ilk sefer: test tarayıcılarını indirir
npm test
```

### Açık kontroller

**Simülatörde (Adım 1 kabulü):**
- [ ] Proje Xcode'da derleniyor ve açılıyor
- [ ] Wi-Fi kapalıyken uygulama kapatılıp açılınca oyun açılıyor
- [ ] Açılışta beyaz flaş yok
- [ ] Option + sürükleme ve çift dokunmayla yakınlaşma yok, kenardan esneme yok
- [ ] Fredoka normal kalınlıkta (Windows'taki WebKit'te ince çiziliyordu; harf genişlikleri Chrome ile aynıydı, büyük olasılıkla o motorun kısıtı)
- [ ] `İ ğ Ğ ş Ş` göze batmıyor ("Boşluk", "Titreşim", "İlerlemeyi sıfırla"): Fredoka'da bu harfler yok, yedek fontla çiziliyor
- [ ] Çentik ve Home çubuğu boşlukları doğru

**Gerçek iPhone'da (Adım 2 kabulü, simülatör titreşmez):**
- [ ] Farklı şiddetlerde titreşim hissediliyor; bavul kapanışında `SUCCESS`
- [ ] Silkele ve havlu sıkıştırma `WARNING` veriyor (dizi kullandıkları için plan gereği). İkisi de olumlu hamle; kötü hissettirirse değiştir
- [ ] Titreşim ya da Ses kapalıyken titreşim yok
- [ ] Uygulama görev yöneticisinden kapatılıp açılınca ilerleme korunuyor
- [ ] Oynarken arka plana atınca ses kesiliyor, dönüşte duraklama ekranı geliyor

**Mac'te ilk kez:**
- [ ] `npm test` geçiyor. Bugüne kadar yalnızca Windows'ta çalıştı (200 kontrol, hepsi geçti). Windows'taki WebKit'te `AudioContext` olmadığı için ses kontrolleri WebKit'te ilk kez Mac'te devreye girebilir; küçük ayar gerekebilir

### Yapılanlar

| Commit | İçerik |
| --- | --- |
| `50da731` | Adım 0: v11 ana ekran görseli `src/page.html`'e alındı, build v11 ile bayt bayt aynıydı |
| `889195e` | Adım 1: Capacitor iOS, `vendor/` (CDN kopyalarıyla bayt bayt aynı), `--target app`, `.gitattributes` |
| `10f68f9` | Adım 2: `src/native.js`, titreşim, Preferences, yaşam döngüsü, Titreşim ayarı |
| `b1741f7` | Adım 2 düzeltmesi: açılışta hazırlanmamış arayüz görünmesin |
| `c37e19f` | `tests/run.js` ve `npm test` |

### Plandan sapmalar ve kod kararları

- **Eklenti erişimi:** Eklentilere `window.Capacitor.Plugins` üzerinden erişiliyor; iOS bunları sayfadan önce enjekte ediyor, sayfaya Capacitor JS'i yüklenmiyor. Tüm native çağrılar `src/native.js`'te.
- **Kayıt:** Yeni `pj-*` anahtarları `store.set()` / `store.remove()` ile yazılmalı, `localStorage`'a doğrudan yazılmamalı.
- **Açılış sırası:** `src/game.js`'in dış sarmalı `window.Native.ready(...)`. Web'de eşzamanlı çalışır, uygulamada önce kaydı geri yükler. Zaman aşımı bilerek yok: oyun erken başlarsa boş kayıt gerçeğinin üstüne yazar. Bedeli: native hiç yanıt vermezse oyun açılmaz.
- **`#app:not(.ready)`:** `start()` bitene kadar arayüz gizli. Bu olmadan açılışta doldurulmamış oyun arayüzü görünüyordu.
- **Kazanma titreşimi:** Tek çağıran yer değişti (`haptic(30)` → `hapticWin()`). Plan hem "çağıran yerler değişmesin" hem kazanmada `SUCCESS` istiyor; imza `ms` aldığı için başka yol yoktu.
- **40 ms kısıtlama:** Tek tek yerlere değil, tüm hafif vuruşlara (≤ 10 ms) uygulanıyor.
- **Web'de değişenler:** Ayarlarda Titreşim satırı var, Ses kapalıyken web'de de titreşim yok. `index.html` artık v11 ile aynı değil; bu beklenen bir durum.
- **Yakınlaşma:** `user-scalable=no` yalnızca `--target app` çıktısında; web'in viewport'una dokunulmadı.
- **Geçici açılış ekranı:** Şablonun splash'ı beyazdı ve beyaz flaş yapıyordu; üç PNG düz `#130B43` yapıldı.
- **`.gitattributes`:** `eol=lf` zorunlu, yoksa Windows'ta CRLF bayt kontrollerini bozuyor.
- **Planda olmayan ekler:** `tests/run.js` (iOS'un gerçek `native-bridge.js`'i ile çalışır, yalnızca Swift katmanını taklit eder; bilerek eklenen 9 hatanın hepsini yakaladı). `src/levels.baked.js` değişirse test kalır. Xcode ve cihaz denemesinin yerine geçmez.

### Sonraki adımlara notlar

- **Adım 3:** `docs/monetization-todo.md`'ye GSAP lisansını da yaz. 3.12.5 eski "no charge" lisansıyla geliyor; güncel lisans ticari kullanımı kapsıyor ama önceki sürümler eski şartlara bağlı kalıyor. Eski şartların uygulama içi satış için ne dediği doğrulanmadı.
- **Adım 4:** Fredoka'daki eksik `İ ğ Ğ ş Ş` burada çözülebilir (simülatörde göze batıyorsa harfleri fonta eklemek, OFL izin veriyor). Türkçe arayüzde "Level 1" yazısı duruyor. `CFBundleDevelopmentRegion` şu an `en`.
- **Adım 5:** Şablondan kalanlar düzeltilecek: `Info.plist`'te yatay yönler, `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone için `"1"`), `MARKETING_VERSION = 1.0` (`1.0.0` olacak), Capacitor ikonu, geçici splash. `UIRequiredDeviceCapabilities`'teki `armv7`'yi de gözden geçir. Zemin renkleri farklı: WebView `#130B43`, `html` `#1D1346`; cihazda sıçrama görünürse eşitle.

---

## Bağlam (Claude için)

- **Oyun:** Fit in Box. 3D bavul/kutu doldurma bulmacası, tek dosyalık HTML5 oyun (Three.js r128 + GSAP 3.12.5 + WebAudio ile sentezlenen ASMR sesleri).
- **Depo:** `efeertureten/pack-jam-zero-gap`, ana dal `main`. Depo adı eski proje adından kalma (Pack Jam: Zero Gap); oyun içinde görünen ad **Fit in Box**.
- **Build:** `index.html` elle düzenlenmez. `node tools/build.js` komutu `src/` klasöründen üretir:
  - `src/page.html`: head, CSS ve gövde. Gövde paylaşılan SVG sprite'larıyla başlar; build bu noktadan böler.
  - `src/engine.js`, `src/levels.js`, `src/levels.baked.js`, `src/icons.js`: ilk `<script>` bloğu (`window.PJ` motoru).
  - `src/hud-icons.js`, `src/home-icons.js`: HUD ve ana ekran ikonları (`window.Q7`, `window.Q8`).
  - `src/game.js`: oyun, arayüz, ses, kayıt.
- **İlgili fonksiyonlar (`src/game.js`):** `loadLevel`, `winSequence`, `openFail`, `closeFail`, `offerBoost(k)`, `buyBoost`, `useBoost`, `doUndo`, `doShake`, `haptic` (const), `toast`, `persist`, `sfx`. Booster anahtarları: `undo`, `vac`, `shake`. Fail ekranı: `#failOv` (`#fUndo`, `#fRestart`, `#fClose`). Satın alma ekranı: `#buyOv` (`#buyOk`).
- **Kayıt anahtarları (localStorage):** `pj-save-v1` (ana kayıt), `pj-level`, `pj-muted`, `pj-seen-help`, `pj-tut-*`.
- **Dış bağımlılıklar:** CDN'den three.js r128 ve GSAP 3.12.5; Google Fonts'tan Bungee, Fredoka 500/600/700, DM Mono 500.
- **Zaten uyumlu olanlar:** `viewport-fit=cover`, `env(safe-area-inset-*)`, pixel ratio ≤ 2, ilk dokunuşta WebAudio açılışı (`sfx.unlock`), `visibilitychange` ile otomatik duraklatma.

### Kesin kurallar
1. **Bulmaca motoruna, bölüm üretecine ve `src/levels.baked.js`'e dokunma.** `tools/bake.js` çalıştırma; çalıştırırsan 73, 74, 79 ve 89. bölümler değişir.
2. Web sürümü çalışmaya devam etmeli. Native koda `window.Capacitor?.isNativePlatform()` kontrolüyle geçilmeli, web'de güvenli fallback olmalı.
3. Her değişiklikten sonra `node tools/build.js` çalıştır, oyunu tarayıcıda aç, konsolda hata olmadığını kontrol et.
4. Her adım ayrı commit. Push etmeden önce bana sor.

---

## Adım 0: v11'i depoya al

Depoda şu an v10 var. v11, v10'dan yalnızca ana ekran resmiyle ayrılıyor (yeni bulutlu sahne, 1476×2048).

- [x] `fit-in-box-v11.html`'i depo köküne kopyala (dosyayı ben vereceğim, iste).
- [x] v11'deki `<img id="homeArt" ... src="data:image/webp;base64,...">` verisini `src/page.html`'deki aynı `src`'nin yerine koy.
- [x] `node tools/build.js && cmp index.html fit-in-box-v11.html`: birebir aynı olmalı. Sonra `fit-in-box-v11.html`'i sil ve commit at.

---

## Adım 1: Capacitor entegrasyonu ve native altyapı

**Prompt:** Proje klasöründeyim. Bu projeyi iOS ve Android için native bir mobil uygulamaya dönüştürmek istiyorum. Lütfen projeye Capacitor entegre et.
1. Gerekli npm paketlerini yükle (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`).
2. Capacitor'ı yapılandır (`capacitor.config.json`).
3. Web varlıklarını build alacak veya doğrudan `www` klasörüne yönlendirecek şekilde ayarla.
4. iOS platformunu ekle (`npx cap add ios`).
5. Bana bu adımları sırasıyla uygulat ve terminalde yapmam gereken komutları göster.

**Ek gereksinimler (eksikti):**
- [x] **1a. Çevrimdışı `www/` (Capacitor'dan önce):** Mağaza uygulaması internetsiz açılmalı.
  - three.js ve GSAP'i npm'den **aynı sürümlerle** al (`three@0.128.0`, `gsap@3.12.5`) ve `vendor/` klasörüne koy. Three.js sürümünü değiştirme.
  - Fontları woff2 olarak `vendor/fonts/` klasörüne indir (OFL lisans dosyalarıyla) ve yerel `@font-face` tanımları yaz. Bungee ve Fredoka'da Türkçe karakterleri (ı, ğ, ş, İ) kontrol et.
  - `node tools/build.js --target app` hedefini ekle: `www/index.html`'i yerel `vendor/` yollarıyla üretsin ve `vendor/`'u `www/` içine kopyalasın. **Parametresiz build bugünkü `index.html`'i bayt bayt aynı üretmeye devam etsin.**
  - `www/` klasörünü `.gitignore`'a ekle.
- [ ] **1b. Android de istendi (SONRAYA BIRAKILDI, kullanıcı kararı):** `@capacitor/android` kur, `npx cap add android` çalıştır. Android Studio ve JDK gerekir; kurulu değilse bana söyle.
- [x] `package.json` script'leri (`android` Android ile birlikte eklenecek):
  - `build:app` → `node tools/build.js --target app && npx cap sync`
  - `ios` → `npm run build:app && npx cap open ios`
  - `android` → `npm run build:app && npx cap open android`
- [x] `capacitor.config.json`:
  - `appId`: `com.ergogames.fitinbox` (kullanıcı kararı). Mağazaya çıktıktan sonra değiştirilemez.
  - `appName`: `Fit in Box` (kullanıcı kararı).
  - `webDir: "www"`, `backgroundColor: "#130B43"` (açılışta beyaz flaş olmasın).
  - `ios.contentInset: "never"`, `ios.scrollEnabled: false` (WKWebView'in esnemesini kapatır).
- [x] `ios/` (Android sonra) ve `android/` klasörleri **commit edilir** (Capacitor native projeleri kaynak koddur). Yalnızca build çıktıları ignore edilir: `ios/App/Pods`, `android/.gradle`, `android/app/build` vb.

**Benim çalıştıracağım komutlar (Claude listelesin):** `npm install`, `npm run build:app`, `npx cap open ios` (Xcode açılır), `npx cap open android`.

**Kabul:** Oyun iOS simülatöründe ve Android emülatöründe internet kapalıyken açılıyor; beyaz flaş, esneme ve yakınlaşma yok.

---

## Adım 2: Haptic feedback (titreşim)

**Prompt:** iOS cihazlarda `navigator.vibrate` çalışmadığı için ASMR hissini ve oyun içi dokunma geri bildirimlerini kaybetmeyelim. Lütfen projeye Capacitor Haptics eklentisini (`@capacitor/haptics`) kur. Mevcut kodundaki `haptic()` fonksiyonunu, Capacitor Haptics API'sini (hafif, orta, sert vuruşlar olacak şekilde) kullanacak ve web tarayıcısında çalışırken güvenli bir şekilde fallback (tarayıcı titreşimine) yapacak şekilde güncelle.

**Ek gereksinimler:**
- [x] `haptic(ms | ms[])` imzası korunsun, çağıran yerler değişmesin. Eşleme:
  - ≤ 10 ms → `impact({ style: 'LIGHT' })`
  - 11–20 ms → `MEDIUM`
  - > 20 ms → `HEAVY`
  - Dizi (ret/hata deseni, ör. `[8, 40, 8]`) → `notification({ type: 'WARNING' })`
  - Kazanma anı → `notification({ type: 'SUCCESS' })`
- [x] `pj-muted` açıkken ya da ayarlarda "Titreşim" kapalıyken titreşim yok. Ayarlara ayrı bir Titreşim anahtarı ekle (`pj-haptics`).
- [x] Çok sık tetiklenen yerlere (sürükleme sırasında her hücre geçişi) 40 ms'lik bir kısıtlama (throttle) koy; cihazda "vızıltı" hissi olmasın.
- [x] **(Eksikti) Kalıcı kayıt:** iOS depolama baskısında WKWebView `localStorage`'ını silebilir. `@capacitor/preferences` kur.
  - Açılışta `pj-*` anahtarlarını Preferences'tan `localStorage`'a geri yükle, sonra oyunu başlat.
  - Her `setItem('pj-…')` noktasını tek bir `store.set()` yardımcısına topla; bu yardımcı her ikisine de yazsın.
- [x] **(Eksikti) Uygulama yaşam döngüsü (Android geri tuşu Android ile birlikte, SONRAYA BIRAKILDI):** `@capacitor/app` ile `appStateChange` dinle. Arka plana geçince `openPause()` çağır ve WebAudio'yu `suspend()` et; geri gelince `resume()` et. Android'de geri tuşu (`backButton`) önce açık modali kapatsın, oyundaysa duraklatsın, ana ekrandaysa uygulamadan çıkış onayı sorsun.
- [x] **(Eksikti) Dokunma davranışı:** `src/page.html`'e `-webkit-touch-callout: none; user-select: none; -webkit-tap-highlight-color: transparent;` ekle. Native build'de `?level=` ve `hot` gibi debug parametrelerini kapat.

**Kabul:** Gerçek iPhone'da ve Android cihazda farklı şiddette titreşimler hissediliyor; web'de hata yok; uygulama kapatılıp açılınca ilerleme korunuyor; arka plana atınca ses kesiliyor.

---

## Adım 3: Analitik ve rewarded ad (ödüllü reklam) kancaları

**Prompt:** Oyunu monetize etmek ve oyuncu davranışlarını ölçmek için altyapı kuralım.
1. `loadLevel`, `winSequence`, `openFail` ve booster kullanım yerlerine basit bir analitik event tetikleyicisi (`trackEvent(eventName, data)`) ekle.
2. `offerBoost` ve `failOv` (Out of Space) ekranlarına oyuncunun jetonu bittiğinde "Reklam İzle Kazan" (Rewarded Video) akışını simüle eden bir buton ve `watchRewardedAd()` fonksiyonu entegre et.

**Ek gereksinimler:**
- [ ] **Adaptör yapısı:** `trackEvent` ve `watchRewardedAd` tek bir modülün (`src/game.js` içinde `Monet` nesnesi ya da ayrı bir `src/monet.js` + build şablonu) arkasında dursun. Şimdilik:
  - `trackEvent` → konsola yazar ve son 200 olayı bellekte tutar.
  - `watchRewardedAd` → 2–3 sn'lik sahte bir "reklam" katmanı gösterir, `Promise<{rewarded: boolean}>` döner.
  - Gerçek SDK sonradan bu iki fonksiyonun içine takılacak.
- [ ] **Olay listesi** (booster kullanım yeri `useBoost`):
  - `level_start {level, tier, grid, gaps}`
  - `level_win {level, timeSec, moves, stars, boostersUsed}`
  - `level_fail {level, reason, timeSec, moves}`
  - `booster_use {kind, level, source: 'free'|'coins'|'ad'}`
  - `booster_buy {kind, price}`
  - `ad_offer {placement}`, `ad_complete {placement, rewarded}`
  - `chest_open`, `tab_open {tab}`
- [ ] **Ödül kuralları:**
  - `offerBoost(k)`: jeton yetmiyorsa "Reklam izle: +1 {booster}" butonu.
  - `#failOv`: "Reklam izle: son hamleyi geri al ve devam et" butonu (bedava 1 Geri Al). Fail başına en fazla 1 kez.
  - Ödül yalnızca `rewarded: true` dönerse verilir.
  - Günlük üst sınır 10 (`pj-ads` anahtarında gün ve sayaç tutulur).
  - Bölüm 1–5'te reklam teklifi yok.
- [ ] **(Eksikti) Gerçek SDK'ya geçiş ayrı bir adım:** Bu adımda gerçek reklam ya da analitik SDK'sı **eklenmeyecek**. Eklendiğinde (örn. AdMob için `@capacitor-community/admob`, Firebase Analytics) şunlar zorunlu hale gelir. Hepsini `docs/monetization-todo.md` dosyasına not et:
  - iOS: App Tracking Transparency izni (`NSUserTrackingUsageDescription`), Info.plist'te `SKAdNetworkItems`, SDK'ların privacy manifestleri.
  - AB/Türkiye için onay ekranı (Google UMP / GDPR, KVKK).
  - App Store "App Privacy" ve Google Play "Data safety" yanıtları değişir.
  - Mağaza kaydında "Contains Ads" / "Reklam içerir" işaretlenir.
  - Gerçek parayla jeton satışı yapılacaksa iOS'ta **StoreKit IAP**, Android'de **Google Play Billing** zorunlu.

**Kabul:** Olaylar konsolda doğru verilerle görünüyor; sahte reklam akışı ödülü doğru veriyor; günlük sınır ve bölüm 1–5 kuralı çalışıyor.

---

## Adım 4: Çoklu dil (TR/EN)

**Prompt:** Oyunun pazarını genişletmek için Türkçe olan tüm arayüz metinlerini, butonları, toast mesajlarını, yardım ekranını ve seviye isimlerini İngilizce ve Türkçe destekleyen basit bir dil sözlüğü (`LANG` objesi) yapısına dönüştür. Cihazın diline (`navigator.language`) göre otomatik veya ayarlardan değiştirilebilir olsun.

**Ek gereksinimler:**
- [ ] `t(key, vars)` yardımcısı: `{n}` gibi yer tutucuları doldursun. Eksik anahtarda Türkçe'ye düşsün ve konsola uyarı yazsın.
- [ ] Statik HTML metinleri (`src/page.html`) için `data-i18n` ve `data-i18n-aria` öznitelikleri kullan. Dil değişince tek bir `applyLang()` hepsini güncellesin. `aria-label`'lar da çevrilsin.
- [ ] **Bölüm giriş metinleri `src/levels.js` içinde (`INTROS`).** Kural 1 gereği `levels.js`'i değiştirmek yerine çeviriyi oyun katmanında, bölüm numarasına göre yap (`LANG.en.intro[n]`).
- [ ] Booster adları, `BOOST_NAME`, Market açıklamaları, kuyruk sayfası, sonuç ve fail ekranları, ayarlar, el ipucu metinleri (`GUIDE`, `GUIDE_OK`), zorluk rozetleri (`ZOR` → `HARD`, `SÜPER ZOR` → `SUPER HARD`, `FERAH` → `EASY`) çevrilsin.
- [ ] Türkçe büyük harf dönüşümü için `toLocaleUpperCase('tr')` kullan; CSS `text-transform: uppercase` "i" harfini "I" yapar, TR'de "İ" olmalı. `<html lang>` aktif dile göre güncellensin.
- [ ] Dil sırası: `pj-lang` kayıtlı tercih → cihaz dili (`navigator.language` "tr" ile başlıyorsa TR) → EN. Ayarlarda TR/EN seçici.
- [ ] İngilizce metinler rozetlere ve butonlara sığıyor mu, telefon genişliğinde (375 px) ekran görüntüsüyle kontrol et.
- [ ] **(Eksikti) Native dil bildirimi:**
  - iOS `Info.plist`: `CFBundleLocalizations` = `[tr, en]`, `CFBundleDevelopmentRegion` = `tr`. Bu olmadan App Store dil listesinde yalnızca tek dil görünür.
  - Android: `res/values/strings.xml` (EN) ve `res/values-tr/strings.xml` (uygulama adı).

**Kabul:** Cihaz dili İngilizceyken oyun İngilizce açılıyor; ayarlardan değiştirince tüm ekranlar anında güncelleniyor; hiçbir yerde çevrilmemiş Türkçe metin kalmıyor.

---

## Adım 5: Xcode build ve App Store hazırlığı

**Prompt:** Capacitor iOS projemiz için Xcode üzerinden App Store'a çıkış hazırlığı yapıyoruz.
1. `Info.plist` dosyasına ekran yönlendirmesi (portrait/yatay kilidi), Status Bar ayarları ve uygulama adı (`Pack Jam: Zero Gap`) için yapılması gerekenleri listele.
2. İkon ve Splash Screen (Açılış ekranı) için Capacitor assets komutunun nasıl kullanılacağını açıkla.
3. Xcode'da projenin imzalanması (Signing & Capabilities) ve test için Simulator'e nasıl çalıştırılacağını adım adım anlat.

> **KARAR, uygulama adı:** Prompt'ta `Pack Jam: Zero Gap` yazıyor, ama oyunun içindeki başlık, ana ekran ve tüm yeni görseller **Fit in Box**. Mağaza adı ile oyun içi ad farklı olursa hem oyuncular için kafa karıştırıcı olur hem de inceleme sorun çıkarabilir. Claude başlamadan önce bana hangisi olacağını sorsun ve seçilen adı `capacitor.config.json`, `Info.plist` (`CFBundleDisplayName`, ana ekranda ≤ 12 karakter iyi görünür), Android `strings.xml` ve oyun içi başlıkta tutarlı yapsın. Mağazada aynı isimli uygulama var mı da kontrol edilmeli.

**Info.plist:**
- [ ] `UISupportedInterfaceOrientations`: yalnızca `UIInterfaceOrientationPortrait`.
- [ ] **KARAR, iPad desteği:** iPad'i desteklemeyeceksek Xcode → General → Supported Destinations'tan iPad'i kaldır. Destekleyeceksek `UISupportedInterfaceOrientations~ipad` (Portrait + PortraitUpsideDown) ve iPad ekran görüntüleri gerekir.
- [ ] `UIStatusBarHidden` = true, `UIViewControllerBasedStatusBarAppearance` = false. Bunun yerine `@capacitor/status-bar` ile çalışma anında da gizlenebilir.
- [ ] `UIRequiresFullScreen` = true (iPad'de bölünmüş ekranı kapatır, yön kilidinin çalışması için gerekir).
- [ ] `CFBundleDisplayName` = seçilen ad.
- [ ] **(Eksikti)** `ITSAppUsesNonExemptEncryption` = false (her yüklemede ihracat uyumluluğu sorusunu atlar).
- [ ] **(Eksikti)** `CFBundleLocalizations` (Adım 4).

**İkon ve açılış ekranı:**
- [ ] `npm i -D @capacitor/assets` kur.
- [ ] `assets/` klasörüne koy:
  - `icon-only.png`: 1024×1024, **saydamlık yok**, köşeler düz
  - Android uyarlanabilir ikon için `icon-foreground.png` ve `icon-background.png`
  - `splash.png` ve `splash-dark.png`: 2732×2732, arka plan `#130B43`
  - Görselleri ben vereceğim. Yoksa ana ekran sahnesinden geçici ikon taslağı üretip bana göster.
- [ ] `npx capacitor-assets generate --ios --android`, ardından `npx cap sync`.
- [ ] Splash'tan oyuna geçişte renk sıçraması olmasın: splash arka planı = `#app` arka planı.

**İmzalama ve simülatör (adım adım anlatılacak):**
- [ ] Apple Developer Program üyeliği (yıllık ücretli) aktif mi? Simülatör için gerekmez; gerçek cihaz testi (ücretsiz hesapla 7 günlük) ve App Store için gerekir.
- [ ] `npx cap open ios` → Xcode'da sol panelde App projesi → TARGETS: App → Signing & Capabilities:
  - "Automatically manage signing" açık
  - Team seç
  - Bundle Identifier = `appId`
- [ ] Üst bardan bir simülatör seç (örn. iPhone 16 Pro) → ▶ Run. Gerçek cihaz için iPhone'u kabloyla bağla, iPhone'da Geliştirici Modu'nu aç, cihazı seç ve ▶.
- [ ] General → Identity: Version `1.0.0`, Build `1`. Her yüklemede Build'i artır.

**(Eksikti) Gizlilik ve gönderim:**
- [ ] `PrivacyInfo.xcprivacy`: veri toplama yok, takip yok. `@capacitor/preferences` UserDefaults kullandığı için `NSPrivacyAccessedAPICategoryUserDefaults`, sebep `CA92.1`.
- [ ] App Store Connect → App Privacy: "Data Not Collected". Gerçek reklam ya da analitik eklenince değişir (Adım 3).
- [ ] App Store Connect'te uygulama kaydı: ad, birincil dil, Bundle ID, SKU, kategori (Games → Puzzle), yaş derecelendirmesi anketi (muhtemelen 4+).
- [ ] Ekran görüntüleri: güncel zorunlu boyutları App Store Connect'te doğrula (genelde iPhone 6.9" ve/veya 6.5"; iPad destekleniyorsa 13"). TR ve EN ayrı ayrı.
- [ ] Metinler (TR/EN): alt başlık (≤ 30), anahtar kelimeler (≤ 100), açıklama, "Bu sürümde yenilikler". Taslakları `store/metadata/` altına yaz, bana onaylat.
- [ ] Destek URL'si ve Gizlilik Politikası URL'si zorunlu: `docs/support.md`, `docs/privacy.md` (GitHub Pages ile yayınlanabilir; yayınlamayı bana sor).
- [ ] Product → Archive → Distribute App → App Store Connect → Upload → TestFlight iç testi (gerçek iPhone'da tam oturum) → inceleme notu (İngilizce) → Gönder.
- [ ] **Guideline 4.2 (minimum işlevsellik):** Web sarmalayıcılar reddedilebilir. Çevrimdışı çalışma, native titreşim, kalıcı kayıt ve tarayıcı izi bırakmayan arayüz bu riski azaltır. İnceleme notunda kısaca belirt.

---

## Adım 6 (eksikti): Google Play hazırlığı

Prompt 1'de Android de istendiği için:

- [ ] Android Studio'da `npx cap open android` → emülatörde ve gerçek cihazda test. Geri tuşu davranışı Adım 2'deki gibi olmalı.
- [ ] `android/app/build.gradle`: `applicationId` = `appId`, `versionCode` `1`, `versionName` `1.0.0`. `targetSdkVersion`'ın Play'in güncel zorunlu seviyesinde olduğunu Play Console'da doğrula.
- [ ] Yönü yalnızca dikey yap: `AndroidManifest.xml` → `android:screenOrientation="portrait"`.
- [ ] İmzalama: upload keystore oluştur (`keytool`). **Keystore'u ve şifresini depoya koyma**, güvenli bir yerde yedekle; kaybedilirse güncelleme yayınlanamaz. Play App Signing'i aç.
- [ ] Release AAB: Android Studio → Build → Generate Signed Bundle → Android App Bundle.
- [ ] Play Console:
  - Uygulama kaydı, Data safety formu (şimdilik veri toplanmıyor)
  - İçerik derecelendirme anketi, hedef kitle
  - "Reklam içerir": şimdilik Hayır
  - Mağaza girişi TR/EN ve ekran görüntüleri
- [ ] Yeni kişisel geliştirici hesaplarında üretim öncesi kapalı test zorunluluğu var (belirli sayıda testçi, belirli süre). Güncel şartı Play Console'da doğrula ve takvimi buna göre planla.

---

## Son kontrol listesi (her iki mağaza)

- [ ] İnternet kapalıyken açılıyor ve oynanıyor
- [ ] Dikey kilitli; notch, Home çubuğu ve Android sistem çubukları doğru
- [ ] Beyaz flaş yok; esneme, yakınlaşma ve metin seçimi yok
- [ ] Titreşim native ve ayarlardan kapatılabiliyor; ses ilk dokunuşta açılıyor, arka planda kesiliyor
- [ ] Kayıt, uygulama kapatılıp açılınca korunuyor
- [ ] TR/EN tam; cihaz diline göre açılıyor
- [ ] Analitik olayları ve sahte ödüllü reklam akışı doğru; gerçek SDK yok (ya da varsa izin/onay ekranları ve gizlilik yanıtları güncel)
- [ ] Uygulama adı mağazada, ana ekranda ve oyun içinde aynı
- [ ] İkon ve açılış ekranı her iki platformda doğru
- [ ] `PrivacyInfo.xcprivacy`, `ITSAppUsesNonExemptEncryption`, Data safety tamam
- [ ] `src/levels.baked.js` değişmedi (`git diff --stat src/levels.baked.js` boş)
