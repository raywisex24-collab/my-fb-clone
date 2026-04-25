import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Listen for Network Changes
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // 2. Start the 7-second timer
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 7000);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // 3. Smart Navigation Logic
    if (isReady && isOnline) {
      const userSession = localStorage.getItem('userToken'); 

      if (userSession) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isReady, isOnline, navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] overflow-hidden relative">
      {/* 1. Background Lightning Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-pulse" />

      <div className="flex flex-col items-center z-10">
{/* 2. The Animated Thunder Circle - Responsive Container */}
<div className="relative w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] flex items-center justify-center">
  
  {/* Rotating Gradient Border */}
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 animate-spin-slow opacity-30 blur-md"></div>
  
  {/* Inner "Lightning" Orb - Fluid Size */}
  <div className="absolute w-[85%] h-[85%] rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.05)]">
    
    {/* Lightning Effect */}
    <div className="absolute inset-0 rounded-full animate-thunder opacity-80 bg-[radial-gradient(circle,_#fff_0%,_transparent_70%)]"></div>
    
    {/* 5 STAGGERED PULSING GRADIENT RINGS */}
    {/* These create the constant "expanding" effect from the center */}
    <div className="absolute w-full h-full rounded-full border-[4px] border-transparent bg-gradient-to-r from-blue-500 via-orange-500 to-pink-500 animate-ping opacity-20 [animation-delay:0s]"></div>
    <div className="absolute w-full h-full rounded-full border-[4px] border-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-orange-500 animate-ping opacity-20 [animation-delay:0.4s]"></div>
    <div className="absolute w-full h-full rounded-full border-[4px] border-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 animate-ping opacity-20 [animation-delay:0.8s]"></div>
    <div className="absolute w-full h-full rounded-full border-[4px] border-transparent bg-gradient-to-r from-blue-500 via-orange-500 to-pink-500 animate-ping opacity-20 [animation-delay:1.2s]"></div>
    <div className="absolute w-full h-full rounded-full border-[4px] border-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-orange-500 animate-ping opacity-20 [animation-delay:1.6s]"></div>

    {/* THICKER SPINNING TECH RINGS */}
    {/* Outer slow dash ring - Thicker border (4px) */}
    <div className="absolute w-[118%] h-[118%] rounded-full border-[4px] border-dashed border-white/40 animate-[spin_12s_linear_infinite] z-10"></div>
    
    {/* Inner faster reverse solid ring - Thicker border (2px) */}
    <div className="absolute w-[108%] h-[108%] rounded-full border-2 border-purple-500/50 animate-[spin_6s_linear_reverse_infinite] z-10"></div>
    
    {/* The Logo */}
    <img 
      src="https://i.postimg.cc/rynvWCgF/file-00000000f6e471fd85be551554c14ba5.png" 
      alt="Logo" 
      className="w-full h-full object-contain z-20 drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] scale-130 translate-y-[15px]" 
    />
  </div>
</div>
        
        <div className="mt-12 text-center">
          {/* 3. Gradient "BOSSNET" Text */}
          <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-[#FF8C00] via-[#A855F7] to-[#3B82F6] bg-clip-text text-transparent drop-shadow-2xl">
            BOSSNET
          </h1>
          
          {/* Status Label */}
          <p className="mt-6 text-white/70 font-medium text-lg tracking-widest uppercase">
            {isOnline ? "Connecting..." : "Waiting for Network..."}
          </p>
        </div>
      </div>

      {/* CSS Animation for the Thunder/Lightning flickers */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes thunder-flicker {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-thunder { animation: thunder-flicker 0.2s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default Splash;
