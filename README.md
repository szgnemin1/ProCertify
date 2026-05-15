<div align="center">

  <h1>🎓 ProCertify Studio</h1>
  
  <p>
    <strong>Profesyonel Sertifika Tasarım ve Toplu Üretim Fabrikası (Web/VPS Edition)</strong>
  </p>

  <p>
    <a href="#-son-kullanıcılar-için">📚 Kullanıcı Kılavuzu</a> •
    <a href="#-geliştiriciler-için">💻 Geliştirici Dokümantasyonu</a> •
    <a href="#-kurulum">📦 İndir</a>
  </p>

  ![Version](https://img.shields.io/badge/Versiyon-v1.4.0--vps-blue?style=for-the-badge)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

  <br />
</div>

---

## 🚀 Proje Hakkında

**ProCertify Studio (VPS Edition)**, etkinlikler, eğitimler ve kurumlar için geliştirilmiş; sunucunuz üzerinde (Web tabanlı) çalışan bir sertifika üretim motorudur.

Modern sürükle-bırak arayüzü ile dakikalar içinde şablonunuzu hazırlayabilir, Excel/Liste mantığıyla yüzlerce kişiye özel PDF sertifikayı saniyeler içinde üretebilirsiniz. Verileriniz sunucudaki yerel `data.json` dosyasında güvenle saklanır.

---

# 👥 Son Kullanıcılar İçin

### ✨ Neden ProCertify Studio?

*   **🌐 Web Tabanlı ve Merkezi:** Verileriniz sunucu üzerinde `data.json` olarak saklanır. Yedeklemelerinizi içeri alıp dışarı çıkartabilirsiniz. Ekip olarak ortak çalışmaya uygundur.
*   **📂 Esnek Çıktı Modları (YENİ):** Sertifikalarınızı ister **tek bir PDF** dosyasında birleştirin, isterseniz de **ZIP dosyası içinde ayrı ayrı PDF'ler** olarak cihazınıza anında indirin!
*   **✍️ Gelişmiş İmza Yönetimi:** İmzalarınızı sisteme yükleyin veya doğrudan uygulama içinde **mouse/tablet ile çizin**.
*   **🧠 Akıllı Veri Birleştirme:** Şablonda `{AD SOYAD}` ve `{Ad Soyad}` gibi farklı yazımlar olsa bile, sistem bunları **tek bir kutuda** birleştirir.
*   **✅ Seçim Kutuları (Checkbox):** Sertifika üzerinde "Evet/Hayır" veya onay kutucukları oluşturabilirsiniz.
*   **🔗 QR ve Metin Senkronizasyonu:** Bir metin alanına ve QR koda aynı etiketi (Örn: `{Firma}`) verirseniz, doldurma ekranında tek seçim yaparak ikisini de aynı anda güncelleyebilirsiniz.
*   **⚡ Toplu Üretim Gücü:** Tek bir şablon yapın, 1000 farklı isim için tek tuşla üretim yapın.
*   **🚀 Performans Modu:** Binlerce imza veya büyük yedek dosyaları yükleseniz bile arka planda verimli bir şekilde çalışır.

### 🔥 Temel Özellikler

| Özellik | Açıklama |
| :--- | :--- |
| **Sürükle & Bırak Editör** | Metinleri, logoları, imzaları ve QR kodları mouse ile kolayca yerleştirin. |
| **Dinamik Yer Tutucular** | `{Ad Soyad}`, `{Tarih}` gibi etiketler koyun, "Doldur" ekranında bu alanları otomatik değiştirin. |
| **İmza Çizimi ve Yükleme** | Tablet veya mouse ile imza atın, veya şeffaf PNG imzalarınızı yükleyin. |
| **Firma & Kısaltma** | Uzun firma isimlerini sertifikaya, kısa kodlarını dosya ismine otomatik yazdırın. |
| **Gelişmiş Yedekleme Sistemi** | Tüm verileri JSON olarak tam kapasiteli yedekleyin ve tek tıkla sisteme entegre edin. |

---

# 💻 Geliştiriciler İçin

### 🛠️ Teknoloji Yığını

*   **Core:** React 18, TypeScript, Vite
*   **Backend:** Node.js, Express (API & File Storage)
*   **Styling:** Tailwind CSS
*   **PDF Engine & Archiving:** jsPDF & JSZip

### ⚙️ Kurulum ve Çalıştırma

Projeyi sunucunuzda veya yerel ortamınızda web olarak kurmak için:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/szgnemin1/ProCertify.git
    cd ProCertify
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Hızlı Geliştirme (API ile Beraber Vite Modu):**
    ```bash
    npm run dev
    ```

### 📦 VPS veya Production (Build) İçin Dağıtım

Uygulamayı optimize edip tam stack production versiyonunu çalıştırmak için:

1. Projeyi Build Edin:
```bash
npm run vps:build
```

2. Ortamı Başlatın (Production):
```bash
npm run vps:start
```
> Varsayılan olarak `5555` veya Ortam (ENV) portunda ayağa kalkar. Tüm yedeklemeler kök dizindeki `data.json` dosyasına yazılır.

## 📄 Lisans

Bu proje GNU General Public License v3.0 altında sunulmuştur.
