# Kitaplık Uygulaması — Geliştirme Günlüğü

Bu dosya projenin geliştirme sürecini kronolojik olarak belgeler.  
Her sohbette Claude tarafından okunur ve güncellenir.

---

## Proje Nedir?

Kişisel kitap koleksiyonunu takip etmek için yerel masaüstü uygulaması.

**Teknolojiler:**
- Electron 31 — masaüstü pencere, dosya sistemi erişimi
- React 18 + TypeScript — kullanıcı arayüzü
- sql.js — tarayıcı uyumlu SQLite (WASM tabanlı, native module sorunu yok)
- Tailwind CSS — stil
- Zustand — state yönetimi
- @dnd-kit — sürükle-bırak (okuma sırası)
- electron-vite — geliştirme ve build aracı
- electron-builder — Windows .exe installer üretimi

**Hedef:** Kullanıcı Python veya Node.js kurmadan, sadece .exe'yi indirip çalıştırabilmeli.

---

## Özellikler

| Ekran | Açıklama |
|---|---|
| Kütüphane | Kitap grid/liste görünümü, arama, filtre (kategori/tür/durum), sıralama |
| Kitap Detay | Slide-over panel — tüm bilgiler, düzenle/sil/sıraya ekle |
| Kitap Formu | Modal — yazar/yayınevi/tür için autocomplete (seçim veya yeni oluştur) |
| Okuma Sırası | Numaralı liste, sürükle-bırak ile yeniden sırala |
| Kategoriler | Renk seçicili kategori yönetimi |

---

## Proje Yapısı

```
kitaplikApp/
├── electron/
│   ├── db/
│   │   ├── connection.ts     # sql.js yükleyici, userData path, schema runner
│   │   └── schema.sql        # Tüm tablo tanımları (DDL), veri yok
│   └── ipc/                  # Electron IPC handler'ları (main process)
│       ├── books.ts
│       ├── categories.ts
│       ├── lookups.ts
│       └── readingQueue.ts
├── src/
│   ├── main/index.ts         # Electron main process girişi
│   ├── preload/index.ts      # contextBridge — renderer'a güvenli API
│   ├── components/           # React bileşenleri
│   │   ├── Book/             # BookCard, BookForm, BookDetail
│   │   ├── Category/         # CategoryBadge
│   │   └── ui/               # Button, Input, Modal, ColorPicker...
│   ├── pages/                # Library, ReadingQueue, Categories
│   ├── store/                # Zustand store'ları
│   ├── hooks/                # useBooks, useCategories, useReadingQueue
│   ├── types/                # TypeScript tip tanımları
│   ├── App.tsx               # Router kurulumu
│   └── main.tsx              # React giriş noktası
├── out/                      # Derleme çıktısı (git'e eklenmez)
│   ├── main/index.js
│   ├── preload/index.js
│   └── renderer/
├── electron.vite.config.ts   # Build konfigürasyonu
├── package.json
└── DEVLOG.md                 # Bu dosya
```

---

## Geliştirme Komutları

```bash
# Geliştirme modunda başlat
npm run dev

# Üretim için derle
npm run build

# Windows installer (.exe) üret
npm run dist:win
```

**Önemli:** `npm run dev` komutunu çalıştırmadan önce `ELECTRON_RUN_AS_NODE` env var'ının set olmadığından emin ol. `electron-builder install-app-deps` komutu bu var'ı set eder ve aynı terminalde `npm run dev` çalıştırılırsa uygulama crash olur. Yeni terminal aç veya `Remove-Item Env:ELECTRON_RUN_AS_NODE` çalıştır.

---

## Veritabanı

Kullanıcı verisi `%APPDATA%\Kitaplik\kitaplik.db` konumuna kaydedilir.  
`schema.sql` sadece tablo tanımları içerir, veri içermez — git'e güvenle commit edilir.  
`.db` dosyaları `.gitignore`'da, asla commit edilmez.

---

## Kayıt Geçmişi

### 2026-06-04 / 05 — Oturum 1: Projenin Kurulumu

**Kullanıcı İsteği:**  
Kişisel kitap takip masaüstü uygulaması. Kullanıcılar GitHub'dan indirip doğrudan çalıştırabilmeli.

**Yapılanlar:**
- Mimari karar: Electron + React + sql.js (native module sorunu olmaması için better-sqlite3 yerine)
- Normalize SQLite şeması tasarlandı ve oluşturuldu (books, authors, translators, publishers, genres, categories, reading_queue)
- IPC katmanı yazıldı (main process ↔ renderer iletişimi)
- Tüm React sayfaları ve bileşenleri oluşturuldu
- Electron main ve preload dosyaları yazıldı
- Vite + electron-vite konfigürasyonu yapıldı

---

### 2026-06-05 / 06 — Oturum 2: `npm run dev` Hatası Çözümü

**Kullanıcı İsteği:**  
"devam edelim" — `npm run dev` çalıştırıldığında uygulama crash oluyordu.

**Hata:**
```
TypeError: Cannot read properties of undefined (reading 'whenReady')
```

**Kök Neden:**  
`ELECTRON_RUN_AS_NODE=1` env var'ı önceki bir `electron-builder install-app-deps` komutundan PowerShell session'ında kalmıştı. Bu flag set edilince Electron, Node.js modunda çalışır ve `require('electron')` API yerine binary'nin path string'ini döndürür. Sonuç: `electron.app === undefined`.

**Yapılanlar:**
- `vite-plugin-electron` (v0.28) → `electron-vite` (v5.0.0) geçişi
- `electron/main.ts` → `src/main/index.ts` (electron-vite varsayılan yapısı)
- `electron/preload.ts` → `src/preload/index.ts`
- `vite.config.ts` → `electron.vite.config.ts`
- `package.json`: `"main": "out/main/index.js"`, script'ler güncellendi
- `postcss.config.js` → `postcss.config.mjs` (ESM uyarısı düzeltildi)
- `ELECTRON_RUN_AS_NODE` env var'ı temizlendi
- Sonuç: Uygulama başarıyla açılıyor

**Öğrenilenler:**
- electron-vite v5 custom `outDir` main process için çalışmıyor (bug) — sadece `out/main/` varsayılanı çalışıyor
- electron-vite v5'te `externalizeDepsPlugin()` deprecated, minimal `{}` config yeterli
- Dev modunda `ELECTRON_RENDERER_URL` kullanılır (`VITE_DEV_SERVER_URL` değil)

---

### 2026-06-07 — Oturum 3: Proje Günlüğü + GitHub Hazırlığı

**Kullanıcı İsteği:**  
1. Proje klasörünün içinde okunabilir bir markdown günlük dosyası oluştur  
2. Projenin durumu, nasıl çalıştırılacağı ve GitHub'a nasıl yükleneceği anlatıldı

**Yapılanlar:**
- Bu dosya (`DEVLOG.md`) oluşturuldu
- `.gitignore`'a `out/` eklendi (derleme çıktısı git'e gönderilmemeli)

**Mevcut Durum:**  
- Tüm kod yazıldı, `npm run dev` çalışıyor, Electron penceresi açılıyor
- GitHub'a yüklenmeye hazır
- Sıradaki adım: uçtan uca test, ardından `npm run dist:win` ile Windows installer üretimi

---
