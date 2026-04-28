import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { 
  collection, query, where, getDocs, orderBy, doc, 
  deleteDoc, addDoc, serverTimestamp, updateDoc, arrayUnion 
} from 'firebase/firestore';
import { 
  X, Loader, Bell, BellOff, MoreVertical, 
  User, Repeat, Send, Heart, Share2, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [isMuted, setIsMuted] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [touchStart, setTouchStart] = useState(null);

  const progressTimer = useRef(null);
  const STORY_DURATION = 15000;

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const now = Date.now();
        const q = query(
          collection(db, "stories"),
          where("userId", "==", userId),
          where("expiresAt", ">", now),
          orderBy("expiresAt", "asc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (data.length === 0) {
          navigate('/feed');
          return;
        }
        setStories(data);
        setLoading(false);
      } catch (err) {
        console.error("Story Fetch Error:", err);
        navigate('/feed');
      }
    };
    fetchStories();
  }, [userId, navigate]);

  useEffect(() => {
    if (loading || isPaused || stories.length === 0 || showReplyInput || showSubMenu) return;

    const interval = 100;
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        const currentMedia = stories[currentIndex];
        const duration = currentMedia?.mediaType === 'video' ? 30000 : STORY_DURATION;
        return prev + (interval / duration) * 100;
      });
    }, interval);

    return () => clearInterval(progressTimer.current);
  }, [currentIndex, isPaused, loading, stories, showReplyInput, showSubMenu]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      navigate(-1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const onTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    if (touchStart && touchStart - touchEnd < -70) {
       setIsPaused(!isPaused);
    }
    setTouchStart(null);
  };

  const deleteStory = async (id) => {
    if (window.confirm("Delete this story?")) {
      try {
        await deleteDoc(doc(db, "stories", id));
        handleNext();
      } catch (err) { console.error(err); }
    }
  };

  const handleLike = async (storyId) => {
    try {
      const ref = doc(db, "stories", storyId);
      await updateDoc(ref, { likes: arrayUnion(auth.currentUser?.uid) });
    } catch (err) { console.error(err); }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await addDoc(collection(db, "stories", stories[currentIndex].id, "replies"), {
        text: replyText,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setReplyText("");
      setShowReplyInput(false);
      alert("Reply sent!");
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <Loader className="animate-spin" />
    </div>
  );

  const currentStory = stories[currentIndex];

  return (
    <div 
      style={containerStyle} 
      onTouchStart={onTouchStart} 
      onTouchEnd={onTouchEnd}
    >
      {/* Progress Bars */}
      <div style={progressContainer}>
        {stories.map((_, i) => (
          <div key={i} style={progressBarBg}>
            <motion.div 
              animate={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
              style={progressBarFill}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate(`/profile/${userId}`)}>
          <img src={currentStory.profilePic} style={avatarStyle} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentStory.username}</span>
            {currentStory.repostedFrom && <span style={{ fontSize: '9px', color: '#aaa' }}>Reposted from {currentStory.repostedFrom}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {isPaused && <div style={{ background: '#ff0050', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>PAUSED</div>}
          <div onClick={() => setIsMuted(!isMuted)} className="cursor-pointer">
             {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
          </div>
          <MoreVertical onClick={() => setShowSubMenu(true)} style={{ cursor: 'pointer' }} />
          <X onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Interaction Area */}
      <div style={interactionArea} onClick={(e) => {
        const x = e.clientX;
        const width = window.innerWidth;
        if (x < width * 0.3) handleBack();
        else handleNext();
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentStory.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%' }}>
            {currentStory.mediaType === 'video' ? (
              <video 
                src={currentStory.mediaUrl} 
                style={mediaStyle} 
                autoPlay 
                playsInline 
                muted={isMuted}
                onEnded={handleNext}
              />
            ) : (
              <img src={currentStory.mediaUrl} style={mediaStyle} alt="" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <div style={replyBar} onClick={() => setShowReplyInput(true)}>
          Send a reply...
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
           <Heart onClick={(e) => { e.stopPropagation(); handleLike(currentStory.id); }} size={28} />
           <Share2 onClick={(e) => { e.stopPropagation(); setShowSubMenu(true); }} size={28} />
        </div>
      </div>

      {/* Sub Menu */}
      {showSubMenu && (
        <div style={modalOverlay} onClick={() => setShowSubMenu(false)}>
          <div style={menuCard} onClick={e => e.stopPropagation()}>
            <button style={menuBtn} onClick={() => navigate(`/profile/${userId}`)}><User size={18}/> View Profile</button>
            <button style={menuBtn} onClick={() => setShowSubMenu(false)}><Repeat size={18}/> Repost Story</button>
            {userId === auth.currentUser?.uid && (
              <button style={{...menuBtn, color: '#ff4444'}} onClick={() => deleteStory(currentStory.id)}><Trash2 size={18}/> Delete Story</button>
            )}
            <button style={menuBtn} onClick={() => setShowSubMenu(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div style={modalOverlay} onClick={() => setShowReplyInput(false)}>
          <div style={{ width: '100%', padding: '20px', display: 'flex', gap: '10px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.username}...`}
              style={inputStyle}
            />
            <button onClick={submitReply} style={sendBtn}><Send size={20}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle = { height: '100vh', width: '100vw', backgroundColor: '#000', position: 'fixed', top: 0, left: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1000 };
const progressContainer = { position: 'absolute', top: '15px', left: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 110 };
const progressBarBg = { flex: 1, height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' };
const progressBarFill = { height: '100%', background: '#fff', borderRadius: '2px' };
const headerStyle = { position: 'absolute', top: '40px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 110, color: '#fff' };
const avatarStyle = { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' };
const interactionArea = { width: '100vw', height: '100vh', position: 'relative' };
const mediaStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const footerStyle = { position: 'absolute', bottom: '30px', left: 0, right: 0, padding: '0 20px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 110, color: '#fff' };
const replyBar = { flex: 1, height: '45px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '14px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' };
const menuCard = { background: '#1a1a1a', width: '80%', borderRadius: '20px', padding: '10px', display: 'flex', flexDirection: 'column' };
const menuBtn = { width: '100%', padding: '15px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '15px', fontWeight: 'bold' };
const inputStyle = { flex: 1, height: '50px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '25px', padding: '0 20px', color: '#fff', outline: 'none' };
const sendBtn = { background: '#00f2ea', color: '#000', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' };

export default StoryViewer;
