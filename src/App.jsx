import { Analytics } from '@vercel/analytics/react';
import React, { useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import Swal from 'sweetalert2'; 

// ✅ Global Notification Provider
import { NotificationProvider } from './components/NotificationContext'; 

// Components
import Navbar from './components/Navbar'; 
import TopHeader from './components/TopHeader';

// Pages
import PreSplash from './pages/PreSplash';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Feed from './pages/Feed';
import SignUp from './pages/SignUp';
import Verify from './pages/Verify';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import Chatbox from './pages/chatbox';
import Profile from './pages/Profile'; 
import PersonalProfile from './pages/PersonalProfile';
import Settings from './pages/Settings'; 
import ThemeSettings from './pages/ThemeSettings'; // ✅ Import Theme Page
import DeleteAccount from './pages/DeleteAccount'; 
import FollowList from './pages/FollowList';
import Reels from './pages/reels';
import UploadReel from './pages/UploadReel'; 
import UploadPost from './pages/UploadPost'; 
import EditPost from './pages/EditPost'; 
import EditProfile from './pages/EditProfile'; 
import EmailUpdate from './pages/EmailUpdate'; 
import SearchPage from './pages/SearchPage';
import Notifications from './pages/Notifications'; 
import ProtectedRoute from "./ProtectedRoute";

// ✅ Import Editors Page
import EditorPage from './pages/EditorPage'; 

// Call Pages
import VideoCall from './pages/VideoCall';
import VoiceCall from './pages/VoiceCall';
import IncomingCall from './pages/IncomingCall';

// The Layout Wrapper manages UI visibility
const LayoutWrapper = ({ children }) => {
  const location = useLocation();

  const hideAllUIOn = [
    '/', '/pre-splash', '/splash', '/login', '/signup', '/verify', 
    '/forgot-password', '/onboarding', '/chatbox', '/upload-post',  
    '/upload-reel', '/settings', '/settings/theme', '/delete-account', '/incoming-call',
    '/reels', '/editor' 
  ];

  const hideHeaderOnlyOn = [
    '/me', '/reels', '/search', '/notifications' 
  ];

  const isOtherUserProfile = location.pathname.startsWith('/profile/');
  const isListPage = location.pathname.startsWith('/list/');
  const isEditPostPage = location.pathname.startsWith('/edit-post/');
  const isVideoCall = location.pathname.startsWith('/video-call/');
  const isVoiceCall = location.pathname.startsWith('/voice-call/');

  const showNavbar = !hideAllUIOn.includes(location.pathname) && !isListPage && !isEditPostPage && !isVideoCall && !isVoiceCall;
  const showTopHeader = showNavbar && !hideHeaderOnlyOn.includes(location.pathname) && !isOtherUserProfile && !isEditPostPage && !isVideoCall && !isVoiceCall;

  return (
    <div className={`min-h-screen bg-boss-bg text-boss-text transition-all ${showNavbar ? 'pb-24' : 'pb-0'} ${showTopHeader ? 'pt-14' : 'pt-0'}`}>
      {showTopHeader && <TopHeader />} 
      <main>{children}</main>
      {showNavbar && <Navbar />}
    </div>
  );
};

function App() {
  // ✅ PERSIST THEME ON LOAD
  useEffect(() => {
    const savedTheme = localStorage.getItem('bossnet-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    let deferredPrompt;
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      Swal.fire({
        title: 'Install BossNet',
        text: 'Experience BossNet in full-screen mode!',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Install Now',
        background: '#000000',
        color: '#fff',
        confirmButtonColor: '#1877f2',
        customClass: { popup: 'rounded-[25px] border border-white/10' }
      }).then((result) => {
        if (result.isConfirmed && deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
        }
      });
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<PreSplash />} />
            <Route path="/pre-splash" element={<PreSplash />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/home" element={<Navigate to="/feed" replace />} />

            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> 
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/settings/email" element={<ProtectedRoute><EmailUpdate /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            <Route path="/upload-reel" element={<ProtectedRoute><UploadReel /></ProtectedRoute>} />
            
            <Route path="/editor" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />

            <Route path="/upload-post" element={<ProtectedRoute><UploadPost /></ProtectedRoute>} />
            <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
            <Route path="/list/:userId/:type" element={<ProtectedRoute><FollowList /></ProtectedRoute>} />
            <Route path="/me" element={<ProtectedRoute><PersonalProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* ✅ ADDED THEME SETTINGS ROUTE */}
            <Route path="/settings/theme" element={<ProtectedRoute><ThemeSettings /></ProtectedRoute>} />
            
            <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chatbox" element={<ProtectedRoute><Chatbox /></ProtectedRoute>} />
            
            {/* Call Routes */}
            <Route path="/incoming-call" element={<ProtectedRoute><IncomingCall /></ProtectedRoute>} />
            <Route path="/video-call/:roomId" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
            <Route path="/voice-call/:roomId" element={<ProtectedRoute><VoiceCall /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </LayoutWrapper>
      </NotificationProvider>
      <Analytics />
    </Router>
  );
}

export default App;
