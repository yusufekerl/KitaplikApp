## 🛠️ Kullanılan Teknolojiler ve Mimari

Bu proje, son kullanıcının bilgisayarına hiçbir ek bağımlılık (Python, Node.js, harici SQL sunucusu vb.) kurmasına gerek kalmadan, tek tıkla çalışabilmesi hedefiyle tamamen **yerel (local-first)** mimaride tasarlanmıştır.

### 🏗️ Masaüstü ve Derleme Altyapısı
* **Electron 31:** Web teknolojileri (React) ile yerel işletim sistemi (Windows) arasında köprü kurarak uygulamanın bağımsız bir masaüstü penceresi olarak çalışmasını sağlar.
* **electron-vite (v5):** Ana süreç (Main Process) ve arayüz süreci (Renderer) arasındaki TypeScript derleme ve paketleme süreçlerini ultra hızlı yöneten modern build aracı.
* **electron-builder:** Uygulamayı son kullanıcılar için taşınabilir (portable) ve sıkıştırılmış `.exe` formatına dönüştüren dağıtım aracı.

### 🎨 Kullanıcı Arayüzü (Frontend)
* **React 18 & TypeScript:** Güvenli, modüler ve bileşen tabanlı modern arayüz mimarisi.
* **Tailwind CSS:** Aydınlık, ferah ve minimalist bir arayüz için kullanılan modern CSS framework'ü.
* **Zustand:** Redux gibi hantal alternatifler yerine tercih edilen, uygulamanın kitap ve kategori verilerini ön yüzde ultra hafif ve performanslı yöneten state yönetim kütüphanesi.
* **@dnd-kit:** Okuma sırası panelindeki kitapların sürükle-bırak (Drag and Drop) yöntemiyle akıcı bir şekilde yeniden sıralanmasını sağlayan animasyonlu kütüphane.

### 💾 Veritabanı Katmanı
* **sql.js (WebAssembly):** Projenin en kritik devrimi. Standart `better-sqlite3` gibi C++ derleme araçları gerektiren yerel kütüphaneler yerine, SQLite motorunu **WebAssembly (WASM)** hızında saf yazılımla çalıştırır. Bu sayede uygulama her bilgisayarda sıfır kurulumla çalışır.
* **SQLite:** Normalize edilmiş ilişkisel veritabanı. Kitaplar, yazarlar, yayınevleri, çevirmenler, türler ve kategoriler tamamen SQL standartlarında birbirine bağlı tablolarda saklanır.

---

### 📊 Özet Teknoloji Matrisi

| Katman | Teknoloji | Görevi | Güçlü Yönü |
| :--- | :--- | :--- | :--- |
| **Çalışma Ortamı** | Electron 31 | Masaüstü Penceresi & OS Erişimi | Native hissi, Harici tarayıcı istemez |
| **Ön Yüz** | React 18 + TS | Arayüz & Form Yönetimi | Tip güvenliği, Hızlı render |
| **Veritabanı** | SQLite + sql.js | Veri Saklama & İlişkisel Model | **WASM tabanlı, C++ derleyicisi istemez** |
| **State Yönetimi** | Zustand | Global Uygulama Hafızası | Çok hafif, Sıfır boilerplate |
| **Tasarım** | Tailwind CSS | Minimalist & Aydınlık Tema | Hızlı arayüz geliştirme |
| **Etkileşim** | @dnd-kit | Sürükle-Bırak Okuma Sırası | Akıcı ve mobil uyumlu animasyonlar |
