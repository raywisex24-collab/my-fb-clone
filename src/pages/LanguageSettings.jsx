import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSettings = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const languageMap = {
    // English Variants
    'en': { native: 'English (US)', sub: 'ENGLISH' },
    'en-GB': { native: 'English (UK)', sub: 'ENGLISH (UK)' },
    
    // West African Languages
    'pcm': { native: 'Pidgin (Naija)', sub: 'PIDGIN' },
    'yo': { native: 'Èdè Yorùbá', sub: 'YORUBA' },
    'ig': { native: 'Asụsụ Igbo', sub: 'IGBO' },
    'ha': { native: 'Harshen Hausa', sub: 'HAUSA' },
    
    // European Languages
    'fr': { native: 'Français', sub: 'FRENCH' },
    'es': { native: 'Español', sub: 'SPANISH' },
    'de': { native: 'Deutsch', sub: 'GERMAN' },
    'it': { native: 'Italiano', sub: 'ITALIAN' },
    'pt': { native: 'Português', sub: 'PORTUGUESE' },
    'ru': { native: 'Русский', sub: 'RUSSIAN' },
    'pl': { native: 'Polski', sub: 'POLISH' },
    'tr': { native: 'Türkçe', sub: 'TURKISH' },
    'nl': { native: 'Nederlands', sub: 'DUTCH' },
    'cs': { native: 'Čeština', sub: 'CZECH' },
    'da': { native: 'Dansk', sub: 'DANISH' },
    'et': { native: 'Eesti', sub: 'ESTONIAN' },
    'ca': { native: 'Català', sub: 'CATALAN' },
    
    // Middle Eastern & African
    'ar': { native: 'العربية', sub: 'ARABIC' },
    'az': { native: 'Azərbaycanca', sub: 'AZERBAIJANI' },
    'sw': { native: 'Kiswahili', sub: 'SWAHILI' },
    'zu': { native: 'isiZulu', sub: 'ZULU' },
    
    // Asian Languages
    'hi': { native: 'हिन्दी', sub: 'HINDI' },
    'zh': { native: '中文', sub: 'CHINESE' },
    'ja': { native: '日本語', sub: 'JAPANESE' },
    'ko': { native: '한국어', sub: 'KOREAN' },
    'id': { native: 'Bahasa Indonesia', sub: 'INDONESIAN' },
    'ms': { native: 'Bahasa Melayu', sub: 'MALAY' },
    'vi': { native: 'Tiếng Việt', sub: 'VIETNAMESE' },
    'th': { native: 'ไทย', sub: 'THAI' },
    'jv': { native: 'Basa Jawa', sub: 'JAVANESE' },
    'ceb': { native: 'Cebuano', sub: 'CEBUANO' }
  };

  const definedLanguages = Object.keys(i18n.store.data || {});

  const allLanguages = definedLanguages
    .map(code => ({
      code,
      label: languageMap[code]?.native || code.toUpperCase(),
      sub: languageMap[code]?.sub || ''
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const [selectedTempCode, setSelectedTempCode] = useState(i18n.language);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (code) => setSelectedTempCode(code);

  const handleConfirm = () => {
    i18n.changeLanguage(selectedTempCode);
    navigate(-1);
  };

  const filteredLanguages = allLanguages.filter(lang => 
    lang.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lang.sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isChanged = selectedTempCode !== i18n.language;

  return (
    <div className="fixed inset-0 bg-boss-bg text-boss-text z-[600] flex flex-col font-sans overflow-hidden">
      <div className="p-5 flex items-center justify-between border-b-2 border-white/5 bg-boss-bg/90 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm font-black uppercase tracking-tighter">
          Cancel
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">App Language</h1>
        <button 
          onClick={handleConfirm}
          className={`text-sm font-black uppercase tracking-tighter ${isChanged ? 'text-white' : 'text-zinc-700'}`}
          disabled={!isChanged}
        >
          Done
        </button>
      </div>

      <div className="p-4 bg-boss-bg border-b-2 border-white/5">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
          <Search size={18} className="text-zinc-500" />
          <input 
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-700 font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <AnimatePresence>
          {filteredLanguages.map((lang) => {
            const isSelected = selectedTempCode === lang.code;
            return (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleSelect(lang.code)}
                className="w-full p-4 flex items-center justify-between cursor-pointer border-b border-white/5 last:border-0"
              >
                <div className="flex flex-col">
                  <span className={`font-black text-lg italic tracking-tight ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                    {lang.label}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
                    {lang.sub}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-white bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-zinc-800'
                }`}>
                  {isSelected && <Check size={14} className="text-black" strokeWidth={4} />}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LanguageSettings;
