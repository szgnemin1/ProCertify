<div align="center">

  <h1>🎓 ProCertify Studio</h1>
  
  <p>
    <strong>Profesyonel Sertifika Tasarım ve Toplu Üretim Fabrikası</strong>
  </p>

  <p>
    <a href="#-son-kullanıcılar-için">📚 Kullanıcı Kılavuzu</a> •
    <a href="#-geliştiriciler-için">💻 Geliştirici Dokümantasyonu</a> •
    <a href="#-kurulum">📦 İndir</a>
  </p>

  ![Version](https://img.shields.io/badge/Versiyon-v1.3.3-blue?style=for-the-badge)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

  <br />
  <!-- Ekran görüntüsü buraya eklenebilir -->
  <!-- <img src="screenshot.png" alt="ProCertify Studio Ekran Görüntüsü" width="100%"> -->
</div>

---

## 🚀 Proje Hakkında

**ProCertify Studio**, etkinlikler, eğitimler ve kurumlar için geliştirilmiş; internet bağlantısına ihtiyaç duymayan, tamamen güvenli ve yerel çalışan bir sertifika üretim motorudur.

Modern sürükle-bırak arayüzü ile dakikalar içinde şablonunuzu hazırlayabilir, Excel/Liste mantığıyla yüzlerce kişiye özel PDF sertifikayı saniyeler içinde üretebilirsiniz.

---

# 👥 Son Kullanıcılar İçin

### ✨ Neden ProCertify Studio?

*   **🔒 %100 Güvenli ve Çevrimdışı:** Verileriniz asla bir sunucuya gitmez. Bilgisayarınızda (EXE) çalışır. KVKK/GDPR uyumludur.
*   **🧠 Akıllı Veri Birleştirme (YENİ):** Şablonda `{AD SOYAD}` ve `{Ad Soyad}` gibi farklı yazımlar olsa bile, sistem bunları **tek bir kutuda** birleştirir.
*   **✅ Seçim Kutuları (Checkbox):** Sertifika üzerinde "Evet/Hayır" veya onay kutucukları oluşturabilirsiniz.
*   **🔗 QR ve Metin Senkronizasyonu:** Bir metin alanına ve QR koda aynı etiketi (Örn: `{Firma}`) verirseniz, doldurma ekranında tek seçim yaparak ikisini de aynı anda güncelleyebilirsiniz.
*   **⚡ Toplu Üretim Gücü:** Tek bir şablon yapın, 1000 farklı isim için tek tuşla PDF alın.
*   **🚀 Performans Modu:** Binlerce imza veya görsel yükleseniz bile uygulama donmaz (Debounce & Cache teknolojisi).

### 🔥 Temel Özellikler

| Özellik | Açıklama |
| :--- | :--- |
| **Sürükle & Bırak Editör** | Metinleri, logoları, imzaları ve QR kodları mouse ile kolayca yerleştirin. |
| **Dinamik Yer Tutucular** | `{Ad Soyad}`, `{Tarih}` gibi etiketler koyun, "Doldur" ekranında bu alanları otomatik değiştirin. |
| **İmza Yönetimi** | İmzalarınızı sisteme yükleyin veya doğrudan uygulama içinde çizin. |
| **Firma & Kısaltma** | Uzun firma isimlerini sertifikaya, kısa kodlarını (Örn: `ACME A.Ş.` -> `ACME`) dosya ismine otomatik yazdırın. |
| **Yedekleme Sistemi** | Tüm projelerinizi tek bir `.json` dosyası olarak yedekleyin/taşıyın. |

---

# 💻 Geliştiriciler İçin

### 🛠️ Teknoloji Yığını

*   **Core:** React 18, TypeScript, Vite
*   **Desktop Wrapper:** Electron.js (IPC, Native File System)
*   **Styling:** Tailwind CSS
*   **PDF Engine:** jsPDF

### ⚙️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda geliştirmek için:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/szgnemin1/ProCertify.git
    cd ProCertify
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Geliştirme Modunda Çalıştırın:**
    ```bash
    npm run electron:start
    ```

### 📦 EXE Olarak Paketleme (Build)

Uygulamayı dağıtılabilir bir `.exe` (Windows) dosyasına dönüştürmek için:

```bash
npm run dist
```

Bu işlem tamamlandığında `release/` klasörü altında kurulum dosyasını (`ProCertify Studio Setup 1.3.3.exe`) bulabilirsiniz.

## 📄 Lisans

Bu proje MIT Lisansı altında sunulmuştur.
