import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Image, Palette, Trash2, Check, Loader2, ChevronRight, Sliders, Monitor, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatSettings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Navigation State
  const [view, setView] = useState('main'); // 'main' or 'theme_page'
  const [activeTab, setActiveTab] = useState('me'); 
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local State for Theme (to allow "Saving")
  const [tempSettings, setTempSettings] = useState({
    myColor: '#2563eb',
    theirColor: '#202329',
    myOpacity: 1,
    theirOpacity: 1,
    wallpaper: '',
    backgroundColor: '#0b0e11',
    bgOpacity: 1
  });

  const IMGBB_API_KEY = 'fa575203bc672f5b48b5eccc5d59185b';
  const currentUser = auth.currentUser;
  const chatId = currentUser ? [currentUser.uid, userId].sort().join('_') : null;

  const colors = [
    '#2563eb', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', 
    '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#f43f5e', '#ec4899', 
    '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#444444', '#16191d', '#000000'
  ];

  // Fetch existing settings on load
  useEffect(() => {
    if (!chatId) return;
    const loadSettings = async () => {
      const snap = await getDoc(doc(db, "chatSettings", chatId));
      if (snap.exists()) setTempSettings(prev => ({ ...prev, ...snap.data() }));
    };
    loadSettings();
  }, [chatId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "chatSettings", chatId), tempSettings, { merge: true });
      setView('main'); // Go back to main menu after saving
    } catch (err) {
      console.error("Save failed:", err);
    }
    setIsSaving(false);
  };

  const handleWallpaper = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setTempSettings(prev => ({ ...prev, wallpaper: data.data.url }));
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  // Back button logic: returns to specific chat
  const handleGoBack = () => {
    if (view === 'theme_page') {
      setView('main');
    } else {
      // Pass userId back so the app knows which chat to open
      navigate(`/chatbox?id=${userId}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b0e11] text-white z-[500] flex flex-col font-sans overflow-hidden">
      {/* Dynamic Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#16191d]">
        <div className="flex items-center gap-4">
          <ChevronLeft onClick={handleGoBack} className="cursor-pointer text-gray-400" />
          <h1 className="text-lg font-black italic uppercase tracking-tighter">
            {view === 'main' ? 'Chat Settings' : 'Theme & Visuals'}
          </h1>
        </div>
        
        {view === 'theme_page' && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 space-y-4">
              
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-2">Personalization</p>
              
              {/* Navigate to Theme Page */}
              <button 
                onClick={() => setView('theme_page')}
                className="w-full bg-[#16191d] p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500"><Palette size={24}/></div>
                  <div className="text-left">
                    <h3 className="font-bold text-base">Chat Themes</h3>
                    <p className="text-xs text-gray-500">Colors, Wallpapers & Opacity</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-600" />
              </button>

              {/* Placeholder for future settings */}
              <div className="opacity-40 grayscale pointer-events-none">
                <div className="w-full bg-[#16191d] p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-600/20 rounded-2xl text-gray-500"><Monitor size={24}/></div>
                    <div className="text-left">
                      <h3 className="font-bold text-base text-gray-400">Media & Files</h3>
                      <p className="text-xs text-gray-600 italic">Coming soon, boss...</p>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div key="themes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-8 pb-20">
              
              {/* Bubble Section */}
              <section className="space-y-6">
                <div className="flex bg-[#16191d] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                  <button onClick={() => setActiveTab('me')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest transition-all ${activeTab === 'me' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>MY BUBBLES</button>
                  <button onClick={() => setActiveTab('them')} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-widest transition-all ${activeTab === 'them' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>THEIR BUBBLES</button>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {colors.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setTempSettings(prev => ({ ...prev, [activeTab === 'me' ? 'myColor' : 'theirColor']: c }))}
                      style={{ backgroundColor: c }}
                      className="h-10 rounded-xl flex items-center justify-center border border-white/10 active:scale-75 transition-transform"
                    >
                      {(activeTab === 'me' ? tempSettings.myColor : tempSettings.theirColor) === c && <Check size={16}/>}
                    </button>
                  ))}
                </div>

                <div className="bg-[#16191d] p-5 rounded-[2rem] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Bubble Glass Effect</span>
                    <span className="text-blue-500">{Math.round((activeTab === 'me' ? tempSettings.myOpacity : tempSettings.theirOpacity) * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="1" step="0.01" 
                    value={activeTab === 'me' ? tempSettings.myOpacity : tempSettings.theirOpacity}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, [activeTab === 'me' ? 'myOpacity' : 'theirOpacity']: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-blue-600"
                  />
                </div>
              </section>

              {/* Background Section */}
              <section className="space-y-6">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Main Background</p>
                <div className="grid grid-cols-6 gap-2 bg-[#16191d] p-4 rounded-3xl border border-white/5">
                  {colors.slice(0, 12).map(c => (
                    <button 
                      key={c} 
                      onClick={() => setTempSettings(prev => ({ ...prev, backgroundColor: c, wallpaper: '' }))}
                      style={{ backgroundColor: c }}
                      className="h-8 rounded-lg border border-white/5 flex items-center justify-center"
                    >
                      {tempSettings.backgroundColor === c && !tempSettings.wallpaper && <Check size={14}/>}
                    </button>
                  ))}
                </div>

                {/* Background Opacity (New) */}
                <div className="bg-[#16191d] p-5 rounded-[2rem] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Background Dimming</span>
                    <span className="text-blue-500">{Math.round(tempSettings.bgOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="1" step="0.01" 
                    value={tempSettings.bgOpacity}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, bgOpacity: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none accent-blue-600"
                  />
                </div>

                {/* Wallpaper Gallery */}
                <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#16191d]">
                  {tempSettings.wallpaper ? (
                    <img src={tempSettings.wallpaper} className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <div style={{ backgroundColor: tempSettings.backgroundColor }} className="w-full h-full flex items-center justify-center italic text-gray-700 text-xs uppercase font-black">Solid Active</div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <label className="bg-white text-black px-6 py-2 rounded-2xl font-black text-[10px] uppercase cursor-pointer active:scale-95 shadow-xl">
                      UPLOAD WALLPAPER
                      <input type="file" className="hidden" onChange={handleWallpaper} />
                    </label>
                    {tempSettings.wallpaper && (
                      <button onClick={() => setTempSettings(prev => ({ ...prev, wallpaper: '' }))} className="text-red-500 text-[10px] font-black uppercase">Remove Photo</button>
                    )}
                  </div>
                </div>
              </section>

              {/* Preview */}
              <div style={{ backgroundColor: tempSettings.backgroundColor, opacity: tempSettings.bgOpacity }} className="p-6 rounded-[2.5rem] border border-white/10 space-y-3 relative overflow-hidden">
                 {tempSettings.wallpaper && <img src={tempSettings.wallpaper} className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />}
                 <div className="flex flex-col gap-2 relative z-10">
                    <div style={{ backgroundColor: tempSettings.theirColor, opacity: tempSettings.theirOpacity }} className="self-start px-4 py-2 rounded-2xl rounded-tl-none text-xs">Previewing theme...</div>
                    <div style={{ backgroundColor: tempSettings.myColor, opacity: tempSettings.myOpacity }} className="self-end px-4 py-2 rounded-2xl rounded-tr-none text-xs text-white">Looks good, boss!</div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
