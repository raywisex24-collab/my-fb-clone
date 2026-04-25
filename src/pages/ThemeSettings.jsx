import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const ThemeSettings = () => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('bossnet-theme') || 'dark';
    setCurrentTheme(savedTheme);
  }, []);

  const themes = [
    { id: 'dark', label: 'Dark Mode', desc: 'Classic Bossnet look' },
    { id: 'light', label: 'Light Mode', desc: 'Clean and bright' },
    { id: 'royal', label: 'Royal Gold', desc: 'Premium luxury feel' },
  ];

  const handleThemeChange = (id) => {
    setCurrentTheme(id);
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('bossnet-theme', id);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans transition-colors duration-300">
      <div className="sticky top-0 bg-[var(--bg-color)]/90 backdrop-blur-md z-10 flex items-center p-5 border-b-2 border-white/5">
        <button onClick={() => navigate(-1)} className="mr-6 active:scale-90 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black tracking-tighter">Theme</h1>
      </div>

      <div className="mt-6 px-4">
        {themes.map((theme) => (
          <div 
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-center justify-between p-5 mb-3 rounded-[24px] bg-white/5 active:bg-white/10 border border-white/5 cursor-pointer"
          >
            <div>
              <p className="text-lg font-black tracking-tight">{theme.label}</p>
              <p className="text-sm text-zinc-500 font-bold">{theme.desc}</p>
            </div>
            {currentTheme === theme.id && (
              <div className="bg-[#0095f6] p-1 rounded-full">
                <Check size={20} color="white" strokeWidth={4} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSettings;
