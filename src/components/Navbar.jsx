import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Search, Plus, Play, UserCircle, FileImage, Film, X } from 'lucide-react';

export default function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  return (
    <div className="fixed bottom-3 left-0 right-0 flex flex-col items-center z-[100] px-4 pointer-events-none">
      
      {/* Compact Sub-Menu - NOW STRETCHED */}
      {showMenu && (
        <div className="w-56 mb-1 bg-boss-bg/80 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[22px] flex flex-col gap-1 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button 
            onClick={() => handleNav('/upload-post')} 
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl text-boss-text transition-colors"
          >
            <FileImage size={20} className="text-blue-400" />
            <span className="text-xs font-semibold text-left flex-1">Post</span>
          </button>
          
          <button 
            onClick={() => handleNav('/upload-reel')} 
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl text-boss-text transition-colors"
          >
            <Film size={20} className="text-red-400" />
            <span className="text-xs font-semibold text-left flex-1">Reel</span>
          </button>
        </div>
      )}

      {/* Slimmed Main Pill */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-[30px] flex items-center gap-5 shadow-2xl pointer-events-auto">
<button 
  onClick={() => {
    if (isActive('/feed')) {
      // If already on feed, trigger the random scroll event
      window.dispatchEvent(new CustomEvent('refreshFeed'));
    } else {
      navigate('/feed');
    }
  }} 
  className="p-2 active:scale-90 transition-transform"
>          <LayoutGrid size={20} className={isActive('/feed') ? 'text-blue-500' : 'text-zinc-400'} />
        </button>

        <button onClick={() => navigate('/search')} className="p-2 active:scale-90 transition-transform">
          <Search size={20} className={isActive('/search') ? 'text-blue-500' : 'text-zinc-400'} />
        </button>

        <button 
          onClick={() => setShowMenu(!showMenu)} 
          className={`p-2 transition-all active:scale-90 rounded-full ${showMenu ? 'bg-white/20 rotate-45' : ''}`}
        >
          {showMenu ? <X size={24} className="text-red-500" /> : <Plus size={24} className="text-boss-text" />}
        </button>

        <button onClick={() => navigate('/reels')} className="p-2 active:scale-90 transition-transform">
          <Play size={25} className={isActive('/reels') ? 'text-blue-500' : 'text-zinc-400'} />
        </button>

        <button onClick={() => navigate('/me')} className="p-2 active:scale-90 transition-transform">
          <UserCircle size={30} className={isActive('/me') ? 'text-blue-500' : 'text-zinc-400'} />
        </button>
      </div>
    </div>
  );
}

