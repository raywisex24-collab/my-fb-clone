import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PreSplash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/splash');
    }, 2500); 
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-24 bg-black">
      {/* Logo Container - Shrunken for Mobile */}
      <div className="flex-1 flex items-center justify-center p-6">
        <img 
          src="https://i.postimg.cc/rynvWCgF/file-00000000f6e471fd85be551554c14ba5.png" 
          alt="Logo" 
          className="w-full h-full object-contain max-w-[200px]" 
        />
      </div>

      {/* Text Container */}
      <div className="w-full max-w-[500px] text-center px-6">
        <h1 className="text-4xl font-black mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-[#f39c12] via-[#e67e22] to-[#9b59b6] bg-clip-text text-transparent">
            Bossnet
          </span>
        </h1>
        <p className="text-xl font-bold text-white tracking-widest uppercase opacity-90">
          Connect, Innovate, and Lead.
        </p>
      </div>
    </div>
  );
}
