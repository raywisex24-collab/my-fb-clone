import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Music, Smile, Type, Volume2, VolumeX, Download, ChevronRight, Plus, Scissors, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for multiple media items (videos or photos)
  const [mediaList, setMediaList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const [step, setStep] = useState('edit'); 
  const [isMuted, setIsMuted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [overlays, setOverlays] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  
  const videoRef = useRef(null);

  // Load initial video from navigation
  useEffect(() => {
    if (location.state?.videoUrl && mediaList.length === 0) {
      setMediaList([{ url: location.state.videoUrl, type: 'video' }]);
    }
  }, [location.state]);

  // Handle adding more videos or photos
  const handleAddMedia = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setMediaList([...mediaList, ...newMedia]);
  };

  const removeMedia = (index) => {
    const updated = mediaList.filter((_, i) => i !== index);
    setMediaList(updated);
    if (activeIndex >= updated.length) setActiveIndex(Math.max(0, updated.length - 1));
  };

  const addEmoji = (emoji) => {
    setOverlays([...overlays, { id: Date.now(), type: 'emoji', content: emoji.native, x: 20, y: 20 }]);
    setShowPicker(false);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && currentText.trim() !== '') {
      setOverlays([...overlays, { id: Date.now(), type: 'text', content: currentText, x: 50, y: 50 }]);
      setCurrentText('');
      setIsTyping(false);
    }
  };

  if (step === 'share') return <ShareScreen onBack={() => setStep('edit')} mediaList={mediaList} navigate={navigate} />;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={glassHeader}>
        <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '800', fontSize: '12px', letterSpacing: '1px' }}>BOSSNET STUDIO</span>
        <div style={{ width: 24 }} />
      </div>

      {/* Preview Area - Adjusted height so it's not full screen */}
      <div style={previewArea}>
        {mediaList.length > 0 ? (
          mediaList[activeIndex].type === 'video' ? (
            <video 
              key={mediaList[activeIndex].url}
              ref={videoRef} 
              src={mediaList[activeIndex].url} 
              loop autoPlay playsInline muted={isMuted} 
              style={videoStyle} 
            />
          ) : (
            <img src={mediaList[activeIndex].url} style={videoStyle} alt="preview" />
          )
        ) : (
          <div style={{ color: '#444' }}>No media added</div>
        )}
        
        {/* Overlays */}
        {overlays.map(item => (
          <motion.div drag key={item.id} style={{ position: 'absolute', zIndex: 10, fontSize: item.type === 'emoji' ? '50px' : '24px', fontWeight: 'bold', color: 'white' }}>
            {item.content}
          </motion.div>
        ))}

        {isTyping && (
          <div style={textInputOverlay}>
            <input autoFocus value={currentText} onChange={(e) => setCurrentText(e.target.value)} onKeyDown={handleTextSubmit} style={textInputField} placeholder="Add text..." />
          </div>
        )}
      </div>

      {/* NEW: Multi-Media Timeline Strip */}
      <div style={timelineContainer}>
        <div style={mediaScroll}>
          {/* Add Button */}
          <label style={addCard}>
            <Plus size={24} color="#0095f6" />
            <input type="file" multiple hidden onChange={handleAddMedia} accept="video/*,image/*" />
          </label>

          {mediaList.map((item, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div 
                onClick={() => setActiveIndex(i)}
                style={{ ...thumbCard, border: activeIndex === i ? '2px solid #0095f6' : '1px solid #333' }}
              >
                {item.type === 'video' ? <video src={item.url} style={thumbImg} /> : <img src={item.url} style={thumbImg} />}
              </div>
              <button onClick={() => removeMedia(i)} style={deleteBtn}><X size={10} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={controlGrid}>
        <ToolBtn icon={<Scissors />} label="Trim" onClick={() => alert("Trim tool active: Select start/end points")} />
        <ToolBtn icon={<Smile />} label="Stickers" onClick={() => setShowPicker(!showPicker)} />
        <ToolBtn icon={<Type />} label="Text" onClick={() => setIsTyping(true)} />
        <ToolBtn icon={isMuted ? <VolumeX /> : <Volume2 />} label="Sound" onClick={() => setIsMuted(!isMuted)} />
        <ToolBtn icon={<Music />} label="Music" onClick={() => {}} />
      </div>

      {/* Footer */}
      <div style={footer}>
        <button style={nextBtn} onClick={() => setStep('share')}>
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Emoji Drawer */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} style={drawerStyle}>
            <Picker data={data} onEmojiSelect={addEmoji} theme="dark" width="100%" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShareScreen = ({ onBack, mediaList, navigate }) => (
  <div style={containerStyle}>
    <div style={glassHeader}><ArrowLeft onClick={onBack} /><b>Share</b><div/></div>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ width: 80, height: 120, background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
            {mediaList[0]?.type === 'video' ? <video src={mediaList[0].url} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <img src={mediaList[0]?.url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>}
        </div>
        <textarea placeholder="Write a caption..." style={{ background: 'none', border: 'none', color: '#fff', flex: 1, outline: 'none' }} />
      </div>
      <button 
        style={shareBtn} 
        onClick={() => navigate('/reels')} // Now correctly navigates to /reels
      >
        Share to Reels
      </button>
    </div>
  </div>
);

// --- Styles ---
const containerStyle = { backgroundColor: '#000', height: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const glassHeader = { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)' };
const previewArea = { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', margin: '10px', borderRadius: '20px', overflow: 'hidden' };
const videoStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
const timelineContainer = { padding: '10px 15px', background: '#000' };
const mediaScroll = { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' };
const addCard = { minWidth: '60px', height: '80px', borderRadius: '12px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #444' };
const thumbCard = { minWidth: '60px', height: '80px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#222' };
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover' };
const deleteBtn = { position: 'absolute', top: '-5px', right: '-5px', background: '#ff0050', borderRadius: '50%', padding: '2px', color: 'white', border: 'none' };
const controlGrid = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '15px' };
const footer = { padding: '10px 20px 20px', display: 'flex', justifyContent: 'flex-end' };
const nextBtn = { backgroundColor: '#0095f6', color: 'white', padding: '12px 35px', borderRadius: '30px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const shareBtn = { width: '100%', backgroundColor: '#0095f6', color: 'white', padding: '16px', borderRadius: '15px', border: 'none', fontWeight: 'bold' };
const drawerStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 };
const textInputOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const textInputField = { background: 'none', border: 'none', color: 'white', fontSize: '24px', textAlign: 'center', outline: 'none' };

const ToolBtn = ({ icon, label, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
    <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '12px' }}>{icon}</div>
    <span style={{ fontSize: '10px', color: '#888' }}>{label}</span>
  </div>
);

export default EditorPage;
