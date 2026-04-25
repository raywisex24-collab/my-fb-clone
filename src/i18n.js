import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, 
    },
    resources: {
      en: {
        translation: {
          messages: "MESSAGES",
          settings: "Chat Settings",
          theme: "Theme & Visuals",
          type_here: "Type a message...",
          online: "Online",
          save: "Save Changes"
        }
      },
      fr: {
        translation: {
          messages: "MESSAGES",
          settings: "Paramètres",
          theme: "Thème et Visuels",
          type_here: "Tapez un message...",
          online: "En ligne",
          save: "Enregistrer"
        }
      },
      pcm: {
        translation: {
          messages: "CHATS",
          settings: "Settings",
          theme: "Change Style",
          type_here: "Write something...",
          online: "Dey online",
          save: "Keep am like dis"
        }
      },
      // African & Regional Languages
      yo: { translation: { messages: "IKANNI" } }, // Yoruba
      ig: { translation: { messages: "OZI" } },    // Igbo
      ha: { translation: { messages: "SAKONNI" } }, // Hausa
      zu: { translation: { messages: "IMILAYEZO" } }, // Zulu
      sw: { translation: { messages: "UJUMBE" } }, // Swahili

      // European Languages
      es: { translation: { messages: "MENSAJES" } }, // Spanish
      de: { translation: { messages: "NACHRICHTEN" } }, // German
      it: { translation: { messages: "MESSAGGI" } }, // Italian
      pt: { translation: { messages: "MENSAGENS" } }, // Portuguese
      ru: { translation: { messages: "СООБЩЕНИЯ" } }, // Russian
      nl: { translation: { messages: "BERICHTEN" } }, // Dutch
      tr: { translation: { messages: "MESAJLAR" } }, // Turkish
      pl: { translation: { messages: "WIADOMOŚCI" } }, // Polish

      // Asian & Middle Eastern Languages
      ar: { translation: { messages: "رسائل" } }, // Arabic
      hi: { translation: { messages: "संदेश" } }, // Hindi
      zh: { translation: { messages: "信息" } }, // Chinese (Simplified)
      ja: { translation: { messages: "メッセージ" } }, // Japanese
      ko: { translation: { messages: "메시지" } }, // Korean
      id: { translation: { messages: "PESAN" } }, // Indonesian
      ms: { translation: { messages: "MESEJ" } }, // Malay
      vi: { translation: { messages: "TIN NHẮN" } }, // Vietnamese
      th: { translation: { messages: "ข้อความ" } }, // Thai

      // Additional Global Languages from your reference
      az: { translation: { messages: "MESAJLAR" } }, // Azerbaijani
      jv: { translation: { messages: "PESAN" } }, // Javanese
      ca: { translation: { messages: "MISSATGES" } }, // Catalan
      ceb: { translation: { messages: "MGA MENSAHE" } }, // Cebuano
      cs: { translation: { messages: "ZPRÁVY" } }, // Czech
      da: { translation: { messages: "BESKEDER" } }, // Danish
      et: { translation: { messages: "SÕNUMID" } }  // Estonian
    }
  });

export default i18n;
