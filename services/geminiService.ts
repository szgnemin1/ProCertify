import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    // In a real app, handle missing key gracefully
    const key = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey: key });
};

export const generateCertificateText = async (
  recipientName: string,
  courseTitle: string,
  date: string,
  tone: 'formal' | 'enthusiastic'
): Promise<string> => {
  // Offline Check Optimization: Don't wait for timeout if offline
  if (!navigator.onLine) {
      return `Bu belge, ${recipientName} isimli kişinin ${courseTitle} eğitimini ${date} tarihinde başarıyla tamamladığını belgelemektedir.`;
  }

  try {
    const ai = getClient();
    
    // Turkish prompt for local context
    const prompt = `
      Aşağıdaki bilgilere göre bir sertifika başarı metni (açıklaması) yaz.
      Kişi: ${recipientName}
      Konu/Kurs: ${courseTitle}
      Tarih: ${date}
      Ton: ${tone === 'formal' ? 'Resmi ve Profesyonel' : 'Coşkulu ve İlham Verici'}
      
      Sadece sertifikanın orta kısmında yer alacak 2-3 cümlelik metni döndür. Başlık veya imza kısmı ekleme.
      Örnek çıktı: "Bu belge, [Kişi]'nin [Konu] eğitimini üstün başarıyla tamamladığını kanıtlar."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Metin oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if API fails or key missing
    return `Bu belge, ${recipientName} isimli kişinin ${courseTitle} eğitimini ${date} tarihinde başarıyla tamamladığını belgelemektedir.`;
  }
};