import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, Bookmark, Archive, Activity, Bell, Lock, 
  Star, UserX, EyeOff, MessageCircle, AtSign, Hash, 
  Share2, ShieldAlert, Users, Heart, DownloadCloud, 
  Palette, Languages, Zap, Smartphone, HardDrive, 
  UserPlus, RefreshCw, LogOut, HelpCircle, Info, ShieldCheck,
  AlertTriangle, Trash2, UsersRound
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add this line

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'LOG OUT OF YOUR ACCOUNT?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ed4956',
      cancelButtonColor: '#262626',
      confirmButtonText: 'LOG OUT',
      cancelButtonText: 'CANCEL',
      background: '#121212',
      color: '#ffffff',
      customClass: {
        popup: 'rounded-[30px] border-2 border-white/10 shadow-2xl',
        title: 'text-xl font-black tracking-tight',
      }
    });

    if (result.isConfirmed) {
      try {
        await signOut(auth);
        navigate('/login', { replace: true }); 
      } catch (error) {
        Swal.fire({
          title: 'ERROR',
          text: 'AN ERROR OCCURRED DURING SIGN OUT.',
          icon: 'error',
          background: '#121212',
          color: '#ffffff'
        });
      }
    }
  };

  const sections = [
    {
      title: "YOUR APP AND MEDIA",
      items: [
        { icon: <Bookmark size={22} strokeWidth={2.5}/>, label: t('saved') },
        { icon: <Archive size={22} strokeWidth={2.5}/>, label: t('archive') },
        { icon: <Activity size={22} strokeWidth={2.5}/>, label: t('time on app') },
        { icon: <Bell size={22} strokeWidth={2.5}/>, label: "Notifications" },
      ]
    },
    {
      title: "WHO CAN SEE YOUR CONTENT",
      items: [
        { icon: <Lock size={22} strokeWidth={2.5}/>, label: "Account privacy", rightText: "Public" },
        { icon: <Star size={22} strokeWidth={2.5}/>, label: "Close friends" },
        { icon: <UserX size={22} strokeWidth={2.5}/>, label: "Blocked" },
        { icon: <EyeOff size={22} strokeWidth={2.5}/>, label: "Hide story" },
        { icon: <EyeOff size={22} strokeWidth={2.5}/>, label: "Visibility on Network" },
      ]
    },
    {
      title: "HOW OTHERS CAN INTERACT WITH YOU",
      items: [
        { icon: <MessageCircle size={22} strokeWidth={2.5}/>, label: "Messages and story replies" },
        { icon: <AtSign size={22} strokeWidth={2.5}/>, label: "Tags and mentions" },
        { icon: <Hash size={22} strokeWidth={2.5}/>, label: "Comments" },
        { icon: <Share2 size={22} strokeWidth={2.5}/>, label: "Sharing and reuse" },
        { icon: <ShieldAlert size={22} strokeWidth={2.5}/>, label: "Restricted" },
        { icon: <Users size={22} strokeWidth={2.5}/>, label: "Contacts syncing" },
        { icon: <UserPlus size={22} strokeWidth={2.5}/>, label: "Follow and invite friends" },
      ]
    },
    {
      title: "WHAT YOU SEE",
      items: [
        { icon: <Star size={22} strokeWidth={2.5}/>, label: "Favorites" },
        { icon: <Bell size={22} strokeWidth={2.5}/>, label: "Muted accounts" },
        { icon: <Smartphone size={22} strokeWidth={2.5}/>, label: "Content preferences" },
        { icon: <Heart size={22} strokeWidth={2.5}/>, label: "Like and share counts" },
      ]
    },
    {
      title: "YOUR APP AND MEDIA (SYSTEM)",
      items: [
        { icon: <DownloadCloud size={22} strokeWidth={2.5}/>, label: "Archiving and downloading" },
        { 
          icon: <Palette size={22} strokeWidth={2.5}/>, 
          label: "Theme",
          onClick: () => navigate('/settings/theme') 
        },
{ 
  icon: <Languages size={22} strokeWidth={2.5}/>, 
  label: "t('language')",
  onClick: () => navigate('/settings/language')
},
        { icon: <Zap size={22} strokeWidth={2.5}/>, label: "Data saver" },
        { icon: <Smartphone size={22} strokeWidth={2.5}/>, label: "Apps and websites" },
        { icon: <HardDrive size={22} strokeWidth={2.5}/>, label: "Download data" },
      ]
    },
    {
      title: "FAMILY CENTER",
      items: [
        { icon: <UsersRound size={22} strokeWidth={2.5}/>, label: "Supervision" },
      ]
    },
    {
        title: "YOUR INSIGHTS AND TOOLS",
        items: [
          { icon: <ShieldCheck size={22} strokeWidth={2.5} className="text-[#1877f2]"/>, label: "Verified Status" },
        ]
    },
    {
      title: "MORE INFO AND SUPPORT",
      items: [
        { icon: <HelpCircle size={22} strokeWidth={2.5}/>, label: "Help" },
        { icon: <AlertTriangle size={22} strokeWidth={2.5}/>, label: "Report a problem" },
        { icon: <Info size={22} strokeWidth={2.5}/>, label: "About" },
      ]
    },
    {
      title: "LOGIN",
      items: [
        { icon: <UserPlus size={22} strokeWidth={2.5} className="text-[#0095f6]"/>, label: "Add account", color: "text-[#0095f6]" },
        { icon: <RefreshCw size={22} strokeWidth={2.5} className="text-[#0095f6]"/>, label: "Switch account", color: "text-[#0095f6]" },
        { 
          icon: <LogOut size={22} strokeWidth={2.5} className="text-[#ed4956]"/>, 
          label: "Log out", 
          color: "text-[#ed4956]",
          onClick: handleLogout 
        },
        { 
          icon: <Trash2 size={22} strokeWidth={2.5} className="text-[#ed4956]"/>, 
          label: "Delete profile", 
          color: "text-[#ed4956]",
          onClick: () => navigate('/delete-account')
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text pb-16 select-none font-sans">
      <div className="sticky top-0 bg-boss-bg/90 backdrop-blur-md z-10 flex items-center p-5 border-b-2 border-white/5">
        <button onClick={() => navigate(-1)} className="mr-6 active:scale-90 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h1 className="text-2xl font-black tracking-tighter">privacy</h1>
      </div>

      <div className="mt-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="px-6 py-2 text-[13px] font-black text-zinc-500 tracking-[2px] uppercase">
              {section.title}
            </h2>
            {section.items.map((item, itemIdx) => (
              <div 
                key={itemIdx} 
                onClick={item.onClick ? item.onClick : null}
                className="flex items-center justify-between px-6 py-4 active:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <span className={item.color || "text-boss-text group-active:scale-110 transition-transform"}>
                    {item.icon}
                  </span>
                  <span className={`text-[17px] font-extrabold tracking-tight ${item.color || "text-zinc-100"}`}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {item.rightText && <span className="text-zinc-400 font-bold text-sm uppercase tracking-wider">{item.rightText}</span>}
                  <span className="text-zinc-700 text-2xl font-light">›</span>
                </div>
              </div>
            ))}
            <div className="h-[2px] bg-zinc-900/50 w-full mt-2"></div>
          </div>
        ))}
        
        <div className="p-10 text-center">
            <p className="text-zinc-600 text-[14px] font-black tracking-[4px] uppercase opacity-50">Network Portal</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
