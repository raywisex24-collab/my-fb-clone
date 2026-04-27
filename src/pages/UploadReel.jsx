import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { X, Send, Loader, Video, Image as ImageIcon, ShieldCheck, Wand2, Volume2, VolumeX } from 'lucide-react';
import Swal from 'sweetalert2';

export default function UploadReel() {
  const navigate = useNavigate();
  const [galleryFiles, setGalleryFiles] = useState([]); 
  const [selectedMedia, setSelectedMedia] = useState([]); 
  const [isMuted, setIsMuted] = useState(false);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const CLOUDINARY_CLOUD_NAME = "di0zt85jy";
  const CLOUDINARY_UPLOAD_PRESET = "bossnet_uploads";
  const MAX_SELECTION = 200;

  const syncDeviceGallery = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const sorted = validFiles.sort((a, b) => b.lastModified - a.lastModified);
    setGalleryFiles(sorted);
    const allToSelect = sorted.slice(0, MAX_SELECTION);
    setSelectedMedia(allToSelect);

    if (sorted.length > MAX_SELECTION) {
      Swal.fire({
        title: 'LIMIT REACHED',
        text: `Max ${MAX_SELECTION} items selected.`,
        icon: 'info',
        background: '#111',
        color: '#fff',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000
      });
    }
  };

  const toggleSelection = (file) => {
    if (selectedMedia.includes(file)) {
      setSelectedMedia(selectedMedia.filter((item) => item !== file));
    } else {
      if (selectedMedia.length >= MAX_SELECTION) return;
      setSelectedMedia([...selectedMedia, file]);
    }
  };

  const goToEditor = () => {
    // 1. Filter only the videos from your selection
    const videoFiles = selectedMedia.filter(file => file.type.startsWith('video'));
    
    if (videoFiles.length > 0) {
      // 2. Map all videos to their temporary URLs
      const videoUrls = videoFiles.map(file => URL.createObjectURL(file));
      
      // 3. Pass the WHOLE array to the editor
      navigate('/editor', { state: { videoUrls } });
    }
  };

  const handleUpload = async () => {
    if (selectedMedia.length === 0) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const uploadPromises = selectedMedia.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const resourceType = file.type.startsWith('video') ? 'video' : 'image';
        
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

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text flex flex-col font-sans">
      <div className="px-4 py-3 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-2xl z-[100]">
        <div className="flex items-center gap-4">
          <X onClick={() => navigate(-1)} className="cursor-pointer text-zinc-400 hover:text-white transition-colors" />
          <h2 className="font-black italic text-xl tracking-tighter uppercase text-white">Create Reel</h2>
        </div>
        
        <div className="flex items-center gap-5">
          {selectedMedia.length > 0 && selectedMedia[selectedMedia.length - 1].type.startsWith('video') && (
            <button 
              onClick={goToEditor}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <Wand2 size={16} className="text-[#1877F2]" />
              <span className="text-[11px] font-black uppercase tracking-widest">Edit</span>
            </button>
          )}
          <button 
            onClick={handleUpload}
            disabled={loading || selectedMedia.length === 0}
            className={`text-sm font-black tracking-widest px-4 py-1.5 rounded-full transition-all ${
              selectedMedia.length > 0 
                ? 'bg-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.4)]' 
                : 'text-zinc-700 bg-zinc-900/50'
            }`}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : "SHARE"}
          </button>
        </div>
      </div>

      <div className="w-full aspect-[4/5] bg-zinc-950 overflow-hidden relative border-b border-white/5 shadow-inner">
        {selectedMedia.length > 0 ? (
          <div className="w-full h-full relative">
            {selectedMedia[selectedMedia.length - 1].type.startsWith('video') ? (
              <>
                <video 
                  key={selectedMedia[selectedMedia.length - 1].name}
                  src={URL.createObjectURL(selectedMedia[selectedMedia.length - 1])} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted={isMuted} 
                  loop 
                  playsInline
                />
                {/* Mute Toggle */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/10 text-white active:scale-90 transition-all"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </>
            ) : (
              <img 
                src={URL.createObjectURL(selectedMedia[selectedMedia.length - 1])} 
                className="w-full h-full object-cover" 
                alt="preview"
              />
            )}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-white/5">
              <ImageIcon size={32} className="text-zinc-700" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 animate-pulse">Waiting for Selection</p>
          </div>
        )}
      </div>

      <div className="p-4 flex justify-between items-center bg-zinc-900/20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Device Gallery</span>
        <label className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95">
          <ShieldCheck size={16} />
          <span className="text-[11px] font-bold uppercase">SELECT MEDIA</span>
          <input type="file" hidden multiple accept="video/*,image/*" onChange={syncDeviceGallery} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-0.5 pb-32">
        {galleryFiles.map((file, i) => {
          const isSelected = selectedMedia.includes(file);
          const selectionIndex = selectedMedia.indexOf(file) + 1;
          return (
            <div key={i} onClick={() => toggleSelection(file)} className="aspect-square bg-zinc-900 relative cursor-pointer group">
              {file.type.startsWith('video') ? (
                <div className="w-full h-full relative">
                   <video src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80" />
                   <Video size={12} className="absolute bottom-1 right-1 text-boss-text" />
                </div>
              ) : (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="thumb" />
              )}
              <div className={`absolute inset-0 border-2 transition-all ${isSelected ? 'border-[#1877F2] bg-white/10' : 'border-transparent'}`} />
              <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border border-white/50 flex items-center justify-center text-[10px] font-bold ${
                isSelected ? 'bg-[#1877F2] border-[#1877F2]' : 'bg-boss-bg/40 backdrop-blur-md'
              }`}>
                {isSelected ? selectionIndex : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-boss-bg/95 backdrop-blur-2xl border-t border-white/5 flex items-center gap-3 z-[60]">
        <textarea 
          placeholder="Add a caption..."
          className="flex-1 bg-transparent text-sm outline-none resize-none h-10 py-2"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        {/* Secondary Edit Option in Footer if Video is Selected */}
        {selectedMedia.length > 0 && selectedMedia[selectedMedia.length - 1].type.startsWith('video') && (
           <button 
             onClick={goToEditor}
             className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter"
           >
             Edit
           </button>
        )}
      </div>
    </div>
  );
}
