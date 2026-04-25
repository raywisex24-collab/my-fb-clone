import { useEffect, useState } from 'react';
import { Sun, Moon, Crown } from 'lucide-react'; // Optional: Use icons for a pro look

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('dark');

  // Sync with localStorage so it remembers your choice
  useEffect(() => {
    const savedTheme = localStorage.getItem('bossnet-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bossnet-theme', newTheme);
  };

  return (
    <div className="flex items-center gap-4 p-2 bg-gray-800/50 rounded-full w-fit border border-gray-700">
      {/* Dark Button */}
      <button 
        onClick={() => toggleTheme('dark')}
        className={`p-2 rounded-full transition ${theme === 'dark' ? 'bg-cyan-500 text-black' : 'text-gray-400'}`}
      >
        <Moon size={20} />
      </button>

      {/* Light Button */}
      <button 
        onClick={() => toggleTheme('light')}
        className={`p-2 rounded-full transition ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
      >
        <Sun size={20} />
      </button>

      {/* Royal Button */}
      <button 
        onClick={() => toggleTheme('royal')}
        className={`p-2 rounded-full transition ${theme === 'royal' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
      >
        <Crown size={20} />
      </button>
    </div>
  );
}
