import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { 
  X, ChevronLeft, Music, Type, Sticker, Filter, 
  Hash, AtSign, Users, Settings, CheckCircle, Plus, Palette, Image as ImageIcon
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function UploadPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Choose Type, 2: Media Select/Text Edit, 3: Finalize
  const [postType, setPostType] = useState('media'); // 'media' or 'text'
  const [isMultiple, setIsMultiple] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]); 
  const [imageFiles, setImageFiles] = useState([]); 
  const [previewImage, setPreviewImage] = useState(null); 
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);

  // Background colors for text posts
  const [bgColor, setBgColor] = useState('transparent');
  const bgOptions = [
    'transparent',
    'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    '#ff4b2b',
    '#1877F2',
    '#000000'
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
      }
    };
    fetchUser();
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setPostType('media');
    setImageFiles(prev => isMultiple ? [...prev, ...files] : [files[0]]);
    const newUrls = files.map(f => URL.createObjectURL(f));
    
    if (isMultiple) {
      setSelectedImages(prev => [...prev, ...newUrls]);
      setPreviewImage(newUrls[newUrls.length - 1]);
    } else {
      setSelectedImages([newUrls[0]]);
      setPreviewImage(newUrls[0]);
    }
  };

  const uploadToImgBB = async (file) => {
    const apiKey = "fa575203bc672f5b48b5eccc5d59185b";
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.data.url;
  };

  const handlePost = async () => {
    if (postType === 'media' && !imageFiles.length) return;
    if (postType === 'text' && !caption.trim()) return;

    setUploading(true);
    Swal.fire({ 
        title: 'Sharing to Bossnet...', 
        background: '#121212',
        color: '#fff',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading() 
    });

    try {
      const user = auth.currentUser;
      let uploadedUrls = [];

      // 1. Upload all images if it's a media post
      if (postType === 'media') {
        const uploadPromises = imageFiles.map(file => uploadToImgBB(file));
        uploadedUrls = await Promise.all(uploadPromises);
      }

      // 2. Save to Firestore
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: userData?.username || user.displayName || "Bossnet User",
        userImg: userData?.profilePic || user.photoURL || "",
        text: caption,
        image: uploadedUrls.length > 0 ? uploadedUrls[0] : null, // for backward compatibility
        images: uploadedUrls, // Multi-image array
        postType: postType,
        textBg: postType === 'text' ? bgColor : null,
        likes: [],
        repostCount: 0,
        commentCount: 0,
        privacy: privacy,
        createdAt: serverTimestamp(),
        isVerified: userData?.isVerified || false
      });

      Swal.fire({ icon: 'success', title: 'Post shared!', background: '#121212', color: '#fff', timer: 1500, showConfirmButton: false });
      navigate('/feed');
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Check your connection.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans overflow-hidden">
      <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-900 bg-boss-bg sticky top-0 z-50">
        {step === 1 ? (
          <X onClick={() => navigate('/feed')} className="cursor-pointer" />
        ) : (
          <ChevronLeft onClick={() => setStep(1)} className="cursor-pointer" />
        )}
        
        <div className="flex gap-4 font-black uppercase text-sm tracking-widest text-zinc-500">
          <span className="text-boss-text border-b-2 border-white pb-1">POST</span>
          <span onClick={() => navigate('/upload-reel')} className="cursor-pointer">REEL</span>
        </div>

        <button 
          onClick={step === 3 ? handlePost : () => setStep(3)} 
          disabled={uploading || (postType === 'media' && selectedImages.length === 0) || (postType === 'text' && !caption.trim())} 
          className="text-[#1877F2] font-bold text-lg disabled:opacity-30"
        >
          {step === 3 ? 'Share' : 'Next'}
        </button>
      </header>

      {/* STEP 1 & 2: SELECTION AND EDITING */}
      {step < 3 && (
        <div className="flex flex-col h-[calc(100vh-56px)]">
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden border-b border-zinc-900 transition-all duration-500"
            style={{ background: postType === 'text' ? bgColor : '#000' }}
          >
            {postType === 'text' ? (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind, boss?"
                className="w-full bg-transparent border-none text-center font-bold text-2xl px-6 outline-none placeholder:text-white/50"
              />
            ) : previewImage ? (
              <img src={previewImage} className="max-h-full w-full object-contain" alt="Preview" />
            ) : (
              <div className="text-zinc-800 font-black text-4xl italic tracking-tighter uppercase">select photo</div>
            )}
          </div>

          <div 
            className="flex-1 flex items-center justify-center overflow-hidden border-b border-zinc-900 transition-all duration-500"
            style={{ background: postType === 'text' ? bgColor : '#000' }}
          >
            {postType === 'text' ? (
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind, boss?"
                className="w-full bg-transparent border-none text-center font-bold text-2xl px-6 outline-none placeholder:text-white/50"
              />
            ) : selectedImages.length > 0 ? (
              /* Swipe through selected images before posting */
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="min-w-full h-full snap-center flex items-center justify-center">
                    <img src={img} className="max-h-full w-full object-contain" alt={`Preview ${idx}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-600 font-black text-4xl italic tracking-tighter uppercase">preview photos</div>
            )}
          </div>
          
          {/* CONTROLS */}
          <div className="p-4 bg-zinc-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <button onClick={() => setPostType('media')} className={`p-2 rounded-full ${postType === 'media' ? 'bg-[#1877F2]' : 'bg-zinc-800'}`}>
                  <ImageIcon size={20}/>
                </button>
                <button onClick={() => setPostType('text')} className={`p-2 rounded-full ${postType === 'text' ? 'bg-[#1877F2]' : 'bg-zinc-800'}`}>
                  <Type size={20}/>
                </button>
              </div>
              
              {postType === 'media' && (
                <button 
                  onClick={() => { setIsMultiple(!isMultiple); setSelectedImages([]); setImageFiles([]); }}
                  className={`px-4 py-2 rounded-full text-[10px] font-black ${isMultiple ? 'bg-[#1877F2]' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  SELECT MULTIPLE
                </button>
              )}
            </div>

            {/* LOWER SELECTOR (COLORS OR GALLERY) */}
            {postType === 'text' ? (
              <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
                {bgOptions.map((bg, i) => (
                  <div 
                    key={i} 
                    onClick={() => setBgColor(bg)}
                    className="w-10 h-10 rounded-lg shrink-0 border-2 border-white/20 cursor-pointer"
                    style={{ background: bg }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1 h-48 overflow-y-auto">
                <label className="aspect-square bg-zinc-800 flex items-center justify-center cursor-pointer rounded-lg">
                   <Plus className="text-zinc-500" size={24} />
                   <input type="file" hidden multiple={isMultiple} accept="image/*" onChange={handleFileSelect} />
                </label>
                {selectedImages.map((img, i) => (
                  <div key={i} onClick={() => setPreviewImage(img)} className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent active:border-[#1877F2]">
                    <img src={img} className="w-full h-full object-cover" alt="Selected" />
                    {isMultiple && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#1877F2] rounded-full flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: FINALIZE */}
      {step === 3 && (
        <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
          <div className="flex gap-4 items-start bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
            {postType === 'media' ? (
              <div className="w-20 h-20 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800 shadow-lg">
                 <img src={selectedImages[0]} className="w-full h-full object-cover" alt="Final" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-[8px] font-bold p-1 text-center overflow-hidden" style={{ background: bgColor }}>
                {caption.substring(0, 50)}...
              </div>
            )}
            <textarea 
              placeholder="Add final touches to your caption..." 
              className="bg-transparent w-full h-20 outline-none resize-none pt-2 text-sm text-boss-text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-[#1877F2]"/>
                  <span className="font-bold text-sm">Privacy: <span className="text-blue-500 uppercase ml-2">{privacy}</span></span>
                </div>
                <div className="flex gap-2">
                  {['public', 'private'].map(p => (
                    <button key={p} onClick={() => setPrivacy(p)} className={`px-3 py-1 rounded-full text-[10px] font-black border ${privacy === p ? 'bg-blue-600 border-blue-600' : 'border-zinc-700'}`}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
