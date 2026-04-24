import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, where } from 'firebase/firestore';
import { 
  ChevronLeft, Bell, Heart, MessageSquare, UserPlus, 
  Clock, CheckCircle, Repeat, Bookmark, Mail 
} from 'lucide-react';
import VerifiedBadge from './VerifiedBadge'; 

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef, 
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // onSnapshot automatically triggers when a doc is added, updated, OR DELETED
      const notifData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifData);
      setLoading(false);
    }, (error) => {
      console.error("Listener failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleNotifClick = async (notif) => {
    try {
      const ref = doc(db, "notifications", notif.id);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Error marking read:", err);
    }

    // Comprehensive Navigation Logic
    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'reshare':
      case 'save':
        if (notif.postId) navigate(`/post/${notif.postId}`);
        break;
      
      case 'reel_like':
      case 'reel_comment':
      case 'reel_save':
        // Navigates to reels page. If you have a specific reel ID, use navigate(`/reels/${notif.reelId}`)
        navigate(`/reels`); 
        break;

      case 'follow':
      case 'verified':
      case 'system_alert':
        if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
        else if (notif.link) navigate(notif.link); // For custom system links
        break;

      case 'new_message':
        navigate(`/chatbox`);
        break;

      case 'announcement':
        // If it's a general system announcement, you could open a modal or a specific page
        if (notif.link) navigate(notif.link);
        break;

      default:
        // Fallback: If there's a post ID, go to post, otherwise go to profile
        if (notif.postId) navigate(`/post/${notif.postId}`);
        else if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
    }
  };

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read) {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      }
    });
    await batch.commit();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': 
      case 'reel_like': return <Heart size={10} className="text-white fill-red-500" />;
      case 'comment': 
      case 'reel_comment': return <MessageSquare size={10} className="text-white fill-blue-500" />;
      case 'follow': return <UserPlus size={10} className="text-white fill-green-500" />;
      case 'reshare': return <Repeat size={10} className="text-white text-emerald-400" />;
      case 'save': 
      case 'reel_save': return <Bookmark size={10} className="text-white fill-yellow-500" />;
      case 'verified': return <CheckCircle size={10} className="text-white fill-blue-400" />;
      case 'new_message': return <Mail size={10} className="text-white fill-indigo-500" />;
      default: return <Bell size={10} className="text-white" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllRead}
            className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full"
          >
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-2 space-y-1">
        {loading ? (
          <div className="flex justify-center mt-20 animate-pulse text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer ${
                notif.read ? 'opacity-60' : 'bg-zinc-900/40 border border-white/5 shadow-lg'
              }`}
            >
              <div className="relative">
                <img 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notif.fromUserId) navigate(`/profile/${notif.fromUserId}`);
                  }}
                  src={notif.fromUserImg || '/bossnet-logo.png'} // Use your app logo for system notifs
                  className="w-12 h-12 rounded-full object-cover border border-white/10" 
                  alt="" 
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black border border-white/10">
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1 leading-snug">
                  <span className="font-bold text-white">{notif.fromUsername || 'BossNet System'}</span>
                  {notif.isVerified && <VerifiedBadge isVerified={true} />} 
                  
                  <span className="text-zinc-400"> 
                    {notif.type === 'like' && ' liked your post'}
                    {notif.type === 'comment' && ` replied: "${notif.text}"`}
                    {notif.type === 'follow' && ' started following you'}
                    {notif.type === 'reshare' && ' reshared your post to their feed'}
                    {notif.type === 'save' && ' added your post to their favorites'}
                    {notif.type === 'verified' && ' Your account has been officially verified!'}
                    {notif.type === 'new_message' && ' sent you a new message'}
                    {notif.type === 'reel_like' && ' liked your reel'}
                    {notif.type === 'reel_comment' && ' commented on your reel'}
                    {notif.type === 'reel_save' && ' saved your reel'}
                    {/* Catch-all for System or unknown notifications */}
                    {!['like', 'comment', 'follow', 'reshare', 'save', 'verified', 'new_message', 'reel_like', 'reel_comment', 'reel_save'].includes(notif.type) && ` ${notif.text || 'Notification received'}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mt-1 text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">
                   <Clock size={10} />
                   {formatTime(notif.createdAt)}
                </div>
              </div>

              {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />}
            </div>
          ))
        ) : (
          <div className="text-center mt-20">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Bell size={24} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

