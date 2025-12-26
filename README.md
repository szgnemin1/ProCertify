# ProCertify Studio 🎓

**ProCertify Studio**, kurumlar, eğitimciler ve organizatörler için geliştirilmiş; profesyonel, açık kaynak kodlu bir sertifika tasarım ve toplu üretim aracıdır.

Modern web teknolojileri ile geliştirilen bu uygulama, sürükle-bırak (drag & drop) mantığıyla çalışan gelişmiş bir editöre, imza yönetimine ve toplu PDF oluşturma yeteneklerine sahiptir. Masaüstü uygulaması (Electron vb. ile paketlendiğinde) hissi verecek şekilde optimize edilmiştir.

![ProCertify Studio Screenshot](https://via.placeholder.com/1200x600?text=ProCertify+Studio+Preview)
*(Ekran görüntüleri eklenebilir)*

## 🌟 Temel Özellikler

### 🎨 Gelişmiş Tasarım Editörü
*   **Sürükle & Bırak:** Metin, görsel, QR kod ve imza alanlarını tuval üzerinde özgürce taşıyın ve boyutlandırın.
*   **Çift Yüzlü Tasarım:** Sertifikalarınızın hem ön hem de arka yüzünü tasarlayabilirsiniz.
*   **Zengin Yazı Tipi Kütüphanesi:** Google Fonts entegrasyonu ile (Inter, Playfair Display, Great Vibes vb.) tipografi kontrolü.
*   **Özelleştirilebilir Arkaplan:** Kendi şablon görsellerinizi yükleyebilir veya hazır şablonları kullanabilirsiniz.

### ⚡ Akıllı ve Toplu Üretim
*   **Dinamik Doldurma (Fill Mode):** Birden fazla projeyi seçerek, ortak alanları (örneğin "Ad Soyad", "Tarih") tek seferde doldurun.
*   **Otomatik QR Kod:** Verilen bağlantı veya metne göre anlık yüksek çözünürlüklü QR kod üretimi.
*   **Özelleştirilebilir Dosya İsimleri:** Çıktı alınacak PDF dosyaları için dinamik şablonlar oluşturun (Örn: `Sertifika-{Ad Soyad}-{Tarih}.pdf`).

### ✒️ Varlık ve İmza Yönetimi
*   **İmza Deposu:** Yetkili imzaları sisteme bir kez yükleyin ve dilediğiniz projede kullanın.
*   **İmza İzinleri:** Hangi imza alanına hangi yetkililerin imzasının eklenebileceğini kısıtlayın.
*   **Logo ve Görsel Desteği:** Kurum logolarını veya sponsor görsellerini kolayca ekleyin.

### 💾 Veri Güvenliği ve Yedekleme
*   **Yerel Çalışma:** Tüm veriler tarayıcınızın yerel depolama alanında (LocalStorage) tutulur. Sunucuya veri gönderilmez.
*   **Tam Yedekleme (Backup & Restore):** Projelerinizi, ayarlarınızı ve görsellerinizi tek bir `.json` dosyası olarak dışa aktarın ve başka bir cihaza taşıyın.

## 🛠️ Kullanılan Teknolojiler

Bu proje aşağıdaki modern teknolojiler kullanılarak geliştirilmiştir:

*   **React 19:** Kullanıcı arayüzü ve bileşen yönetimi.
*   **TypeScript:** Tip güvenliği ve ölçeklenebilir kod yapısı.
*   **Tailwind CSS:** Modern ve hızlı stil işlemleri.
*   **jsPDF:** Yüksek kaliteli, vektörel PDF çıktıları oluşturmak için.
*   **Lucide React:** Tutarlı ve şık ikon seti.
*   **QRCode:** İstemci tarafında QR kod üretimi.

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/kullaniciadiniz/procertify-studio.git
    cd procertify-studio
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    yarn install
    ```

3.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev
    ```
    Tarayıcınızda `http://localhost:5173` (veya benzeri bir port) adresine gidin.

## 📦 Masaüstü Uygulaması (EXE) Olarak Paketleme

Bu proje, masaüstü hissi (native feel) verecek şekilde tasarlanmıştır (yazı seçiminin engellenmesi, özel scrollbarlar vb.). **Electron.js** veya **Tauri** kullanarak projeyi `.exe` veya `.dmg` formatına dönüştürebilirsiniz.

*Electron ile basit paketleme örneği:*

1.  `electron` ve `electron-builder` paketlerini projeye ekleyin.
2.  `main.js` dosyası oluşturarak React uygulamasını bir pencerede açın.
3.  `package.json` dosyasındaki build komutlarını yapılandırın.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir "Issue" açarak veya "Pull Request" göndererek projeye destek olun.

1.  Bu depoyu Fork'layın.
2.  Yeni bir özellik dalı (branch) oluşturun (`git checkout -b feature/YeniOzellik`).
3.  Değişikliklerinizi Commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4.  Dalınızı Push'layın (`git push origin feature/YeniOzellik`).
5.  Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

---
*Geliştirici: [Adınız/Github Profiliniz]*
