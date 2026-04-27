import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase'; // Ensure your firebase path is correct
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Music, Smile, Type, Volume2, VolumeX, Download, ChevronRight, Plus, Scissors, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Swal from 'sweetalert2';

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Cloudinary Config from your Upload Page
  const CLOUDINARY_CLOUD_NAME = "di0zt85jy";
  const CLOUDINARY_UPLOAD_PRESET = "bossnet_uploads";

  const [mediaList, setMediaList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [step, setStep] = useState('edit'); 
  const [isMuted, setIsMuted] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef(null);

  useEffect(() => {
    const incomingUrls = location.state?.videoUrls || [];
    const singleUrl = location.state?.videoUrl;

    if (mediaList.length === 0) {
      if (incomingUrls.length > 0) {
        const formatted = incomingUrls.map(url => ({
          url: url,
          type: url.includes('video') || !url.includes('image') ? 'video' : 'image',
          file: null,
          overlays: []
        }));
        setMediaList(formatted);
      } else if (singleUrl) {
        setMediaList([{ url: singleUrl, type: 'video', file: null, overlays: [] }]);
      }
    }
  }, [location.state, mediaList.length]);

  const handleAddMedia = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image',
      file: file // Storing the actual file for upload later
    }));
    setMediaList([...mediaList, ...newMedia]);
  };

  const removeMedia = (index) => {
    const updated = mediaList.filter((_, i) => i !== index);
    setMediaList(updated);
    if (activeIndex >= updated.length) setActiveIndex(Math.max(0, updated.length - 1));
  };

  // --- UPLOAD LOGIC FROM YOUR UPLOAD PAGE ---
  const handleFinalUpload = async () => {
    if (mediaList.length === 0) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const uploadPromises = mediaList.map(async (item) => {
        // If we don't have the file object (initial redirect), we fetch the blob
        let fileToUpload = item.file;
        if (!fileToUpload) {
          const response = await fetch(item.url);
          fileToUpload = await response.blob();
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const resourceType = item.type;
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Upload failed");
        return { url: data.secure_url, type: resourceType };
      });

      const uploadedAssets = await Promise.all(uploadPromises);
      const firstVideo = uploadedAssets.find(asset => asset.type === 'video');
      const firstImage = uploadedAssets.find(asset => asset.type === 'image');

      await addDoc(collection(db, "videos"), {
        userId: user.uid,
        username: userData?.username || "Raywise",
        userProfilePic: userData?.profilePic || "",
        caption: caption,
        likes: 0,
        createdAt: serverTimestamp(),
        videoUrl: firstVideo ? firstVideo.url : "", 
        thumbnail: firstImage ? firstImage.url : (firstVideo ? firstVideo.url.replace('.mp4', '.jpg') : ""),
        media: uploadedAssets, 
      });

      Swal.fire({ title: 'POSTED!', icon: 'success', background: '#111', color: '#fff', timer: 1500 });
      navigate('/reels');
    } catch (err) {
      Swal.fire({ title: 'UPLOAD ERROR', text: err.message, icon: 'error', background: '#222', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  const addEmoji = (emoji) => {
    const updated = [...mediaList];
    const newOverlay = { id: Date.now(), type: 'emoji', content: emoji.native, x: 20, y: 20 };
    updated[activeIndex].overlays = [...(updated[activeIndex].overlays || []), newOverlay];
    setMediaList(updated);
    setShowPicker(false);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && currentText.trim() !== '') {
      const updated = [...mediaList];
      const newOverlay = { id: Date.now(), type: 'text', content: currentText, x: 50, y: 50 };
      updated[activeIndex].overlays = [...(updated[activeIndex].overlays || []), newOverlay];
      setMediaList(updated);
      setCurrentText('');
      setIsTyping(false);
    }
  };

  if (step === 'share') return (
    <ShareScreen 
      onBack={() => setStep('edit')} 
      mediaList={mediaList} 
      caption={caption} 
      setCaption={setCaption} 
      onUpload={handleFinalUpload} 
      loading={loading}
    />
  );

  return (
    <div style={containerStyle}>
      <div style={glassHeader}>
        <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
        <span style={{ fontWeight: '800', fontSize: '12px', letterSpacing: '1px' }}>BOSSNET STUDIO</span>
        <div style={{ width: 24 }} />
      </div>

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
        
        {mediaList[activeIndex]?.overlays?.map(item => (
          <motion.div 
            drag 
            key={item.id} 
            style={{ 
              position: 'absolute', 
              zIndex: 10, 
              fontSize: item.type === 'emoji' ? '50px' : '24px', 
              fontWeight: 'bold', 
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {item.content}
          </motion.div>
        ))}

        {isTyping && (
          <div style={textInputOverlay}>
            <input autoFocus value={currentText} onChange={(e) => setCurrentText(e.target.value)} onKeyDown={handleTextSubmit} style={textInputField} placeholder="Add text..." />
          </div>
        )}
      </div>

      <div style={timelineContainer}>
        <div style={mediaScroll}>
          <label style={addCard}>
            <Plus size={24} color="#0095f6" />
            <input type="file" multiple hidden onChange={handleAddMedia} accept="video/*,image/*" />
          </label>
          {mediaList.map((item, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div onClick={() => setActiveIndex(i)} style={{ ...thumbCard, border: activeIndex === i ? '2px solid #0095f6' : '1px solid #333' }}>
                {item.type === 'video' ? <video src={item.url} style={thumbImg} /> : <img src={item.url} style={thumbImg} />}
              </div>
              <button onClick={() => removeMedia(i)} style={deleteBtn}><X size={10} /></button>
            </div>
          ))}
        </div>
      </div>

      <div style={controlGrid}>
        <ToolBtn icon={<Scissors />} label="Trim" onClick={() => alert("Trim tool ready")} />
        <ToolBtn icon={<Smile />} label="Stickers" onClick={() => setShowPicker(!showPicker)} />
        <ToolBtn icon={<Type />} label="Text" onClick={() => setIsTyping(true)} />
        <ToolBtn icon={isMuted ? <VolumeX /> : <Volume2 />} label="Sound" onClick={() => setIsMuted(!isMuted)} />
        <ToolBtn icon={<Music />} label="Music" onClick={() => {}} />
      </div>

      <div style={footer}>
        <button style={nextBtn} onClick={() => setStep('share')}>
          Next <ChevronRight size={18} />
        </button>
      </div>

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

// --- SHARE SCREEN COMPONENT ---
const ShareScreen = ({ onBack, mediaList, caption, setCaption, onUpload, loading }) => (
  <div style={containerStyle}>
    <div style={glassHeader}><ArrowLeft onClick={onBack} /><b>Share</b><div/></div>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ width: 80, height: 120, background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
            {mediaList[0]?.type === 'video' ? <video src={mediaList[0].url} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <img src={mediaList[0]?.url} style={{width:'100%', height:'100%', objectFit:'cover'}}/>}
        </div>
        <textarea 
          placeholder="Write a caption..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ background: 'none', border: 'none', color: '#fff', flex: 1, outline: 'none', resize: 'none' }} 
        />
      </div>
      <button 
        style={{...shareBtn, opacity: loading ? 0.7 : 1}} 
        onClick={onUpload}
        disabled={loading}
      >
        {loading ? <Loader className="animate-spin mx-auto" /> : "Share to Reels"}
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
