import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  doc, collection, query, onSnapshot, where, deleteDoc 
} from 'firebase/firestore'; 
import { 
  ArrowLeft, Grid, Play, Plus, Menu, Settings as SettingsIcon,
  Heart, MessageCircle, Share2, Layers, Trash2, LogOut, X, PlusCircle
} from 'lucide-react';
// Import the badge component you just created
import VerifiedBadge from './VerifiedBadge';

export default function PersonalProfile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]); 
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [showSheet, setShowSheet] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null); 
  const [selectedReelIndex, setSelectedReelIndex] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [deletingReelId, setDeletingReelId] = useState(null);
  const pressTimer = useRef(null);

  const defaultPic = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238a8d91"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

  const [hasActiveStory, setHasActiveStory] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/login'); return; }
    const uid = user.uid;

    const unsubUser = onSnapshot(doc(db, "users", uid), (snapshot) => {
      if (snapshot.exists()) setProfileData(snapshot.data());
    });

    // Story Check Logic
    const unsubStories = onSnapshot(
      query(collection(db, "stories"), where("userId", "==", uid), where("expiresAt", ">", Date.now())),
      (snap) => {
        setHasActiveStory(!snap.empty);
      }
    );

    const unsubReels = onSnapshot(
      query(collection(db, "videos"), where("userId", "==", uid)), 
      (snap) => {
        const reels = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            videoUrl: data.videoUrl || data.url || data.video 
          };
        });
        setUserReels(reels.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      }
    );

    const unsubPosts = onSnapshot(
      query(collection(db, "posts"), where("userId", "==", uid)), 
      (snap) => {
        const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserPosts(posts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      }
    );

    const unsubFollowers = onSnapshot(query(collection(db, "follows"), where("followingId", "==", uid)), (snap) => setFollowerCount(snap.docs.length));
    const unsubFollowing = onSnapshot(query(collection(db, "follows"), where("followerId", "==", uid)), (snap) => setFollowingCount(snap.docs.length));

    return () => { 
      unsubUser(); unsubReels(); unsubPosts(); unsubFollowers(); unsubFollowing(); unsubStories(); 
    };
  }, [navigate]);

  const deleteReel = async (reelId) => {
    if (window.confirm("Delete this reel permanently from Firestore?")) {
      try {
        await deleteDoc(doc(db, "videos", reelId));
        setDeletingReelId(null);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("Delete this post permanently from Firestore?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        setDeletingPostId(null);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const startPress = (id, type) => {
    pressTimer.current = setTimeout(() => {
      if (type === 'reel') setDeletingReelId(id);
      if (type === 'post') setDeletingPostId(id);
    }, type === 'post' ? 1200 : 1300); 
  };

  const cancelPress = (type, index) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      // Only open if we aren't currently in "delete mode"
      if (type === 'reel' && !deletingReelId) {
        setSelectedReelIndex(index);
      } else if (type === 'post' && !deletingPostId) {
        setSelectedPostIndex(index);
        // This timeout ensures the DOM is ready before we scroll to the right post
        setTimeout(() => {
          const element = document.getElementById(`full-post-${index}`);
          if (element) element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }, 10);
      }
    }
  };

  return (
    <div className="min-h-screen bg-boss-bg text-boss-text font-sans pb-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-boss-bg z-50 border-b border-white/5">
        <div className="flex items-center gap-6">
          <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer" />
          {/* UPDATED: Added the VerifiedBadge logic here */}
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold lowercase tracking-tight">
              {profileData?.username || "..."}
            </h1>
            <VerifiedBadge isVerified={profileData?.isVerified} />
          </div>
        </div>
        <div className="flex gap-5">
          <Plus size={24} />
          <Menu onClick={() => setShowSheet(true)} size={24} className="cursor-pointer" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="relative group">
            {/* Story Glow Ring */}
            <div 
              onClick={() => hasActiveStory && navigate(`/story-viewer/${auth.currentUser?.uid}`)}
              className="w-[86px] h-[86px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              style={{
                padding: '3px',
                background: hasActiveStory 
                  ? 'linear-gradient(to right, #f39c12, #e67e22, #9b59b6)' 
                  : 'rgba(255,255,255,0.1)'
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-800">
                <img src={profileData?.profilePic || defaultPic} className="w-full h-full object-cover" alt="me" />
              </div>
            </div>

            {/* Green Plus Button */}
            <div 
              onClick={() => navigate('/upload-story')}
              className="absolute bottom-0 right-0 bg-[#00f300] border-2 border-black rounded-full p-1 cursor-pointer hover:scale-110 active:scale-90 transition-all z-10"
            >
              <Plus size={14} className="text-black stroke-[4px]" />
            </div>
          </div>
          <div className="flex gap-8 pr-4 text-center">
            <div><p className="text-lg font-bold">{userPosts.length + userReels.length}</p><p className="text-sm text-gray-400">posts</p></div>
            
            <div 
              onClick={() => navigate(`/list/${auth.currentUser?.uid}/followers`)} 
              className="cursor-pointer active:opacity-50"
            >
              <p className="text-lg font-bold">{followerCount}</p>
              <p className="text-sm text-gray-400">followers</p>
            </div>

            <div 
              onClick={() => navigate(`/list/${auth.currentUser?.uid}/following`)} 
              className="cursor-pointer active:opacity-50"
            >
              <p className="text-lg font-bold">{followingCount}</p>
              <p className="text-sm text-gray-400">following</p>
            </div>
          </div>
        </div>
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold">{profileData?.fullName || "Raywise"}</h2>
          <p className="text-sm text-gray-400 font-medium">{profileData?.profession || ""}</p>
          <p className="text-sm leading-tight">{profileData?.bio}</p>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            onClick={() => navigate('/edit-profile')} 
            className="flex-1 bg-[#1a1a1a] py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform"
          >
            Edit profile
          </button>
          <button 
            className="flex-1 bg-[#1a1a1a] py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-transform"
          >
            Share profile
          </button>
          <button className="bg-[#1a1a1a] px-2.5 rounded-lg active:scale-95 transition-transform">
             <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex border-t border-gray-800">
          <button onClick={() => setActiveTab('posts')} className={`flex-1 flex justify-center py-3 border-t-2 ${activeTab === 'posts' ? 'border-white' : 'border-transparent text-gray-500'}`}><Grid size={22} /></button>
          <button onClick={() => setActiveTab('reels')} className={`flex-1 flex justify-center py-3 border-t-2 ${activeTab === 'reels' ? 'border-white' : 'border-transparent text-gray-500'}`}><Play size={22} /></button>
        </div>

        {activeTab === 'reels' ? (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {userReels.map((reel, index) => (
              <div 
                key={reel.id} 
                onMouseDown={() => startPress(reel.id, 'reel')}
                onMouseUp={() => cancelPress('reel', index)}
                onTouchStart={() => startPress(reel.id, 'reel')}
                onTouchEnd={() => cancelPress('reel', index)}
                className="relative aspect-[9/16] bg-[#1a1a1a] overflow-hidden rounded-md border border-white/5"
              >
                {reel.videoUrl ? (
                  <video src={reel.videoUrl + "#t=0.1"} className="w-full h-full object-cover opacity-80" muted playsInline />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Play size={24} className="text-zinc-700 opacity-20" /></div>
                )}
                
                {deletingReelId === reel.id && (
                  <div className="absolute inset-0 bg-red-600/90 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                    <Trash2 onClick={(e) => { e.stopPropagation(); deleteReel(reel.id); }} size={32} className="text-boss-text mb-2" />
                    <button onClick={(e) => { e.stopPropagation(); setDeletingReelId(null); }} className="text-[10px] font-bold uppercase text-boss-text border border-white/30 px-2 py-1 rounded">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {userPosts.map((post, index) => (
              <div 
                key={post.id} 
                onMouseDown={() => startPress(post.id, 'post')}
                onMouseUp={() => cancelPress('post', index)}
                onTouchStart={() => startPress(post.id, 'post')}
                onTouchEnd={() => cancelPress('post', index)}
                className="relative aspect-square bg-[#1a1a1a] overflow-hidden"
              >
                {post.image ? <img src={post.image} className="w-full h-full object-cover" /> : <div className="p-2 text-[10px] text-zinc-500 line-clamp-4">{post.text}</div>}
                
                {deletingPostId === post.id && (
                  <div className="absolute inset-0 bg-red-600/90 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                    <Trash2 onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} size={28} className="text-boss-text mb-2" />
                    <button onClick={(e) => { e.stopPropagation(); setDeletingPostId(null); }} className="text-[8px] font-bold uppercase text-boss-text border border-white/30 px-2 py-0.5 rounded">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSheet && (
        <div 
          className="fixed inset-0 z-[600] flex flex-col justify-end bg-boss-bg/60 backdrop-blur-sm" 
          onClick={() => setShowSheet(false)}
        >
          <div 
            className="bg-[#1a1a20] rounded-t-[25px] p-6 border-t border-white/10 animate-in slide-in-from-bottom duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
            <div 
              onClick={() => { navigate('/settings'); setShowSheet(false); }}
              className="flex items-center gap-4 p-4 active:bg-white/5 rounded-xl cursor-pointer"
            >
              <SettingsIcon size={22} />
              <span className="font-bold text-lg">Settings and privacy</span>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN POST VIEWER (SWIPEABLE) */}
      {selectedPostIndex !== null && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPostIndex(null)} 
            className="absolute top-10 right-6 z-[1100] text-boss-text p-3 bg-white/10 rounded-full backdrop-blur-md active:scale-90 transition-all"
          >
            <X size={28} />
          </button>
          
          <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {userPosts.map((post, idx) => (
              <div id={`full-post-${idx}`} key={post.id} className="min-w-full h-full snap-center flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg">
                  {post.image ? (
                    <img src={post.image} className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" alt="post" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-zinc-900 rounded-3xl p-10 text-xl font-medium text-center">
                      {post.text}
                    </div>
                  )}
                  <div className="mt-6 px-2">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={profileData?.profilePic || defaultPic} className="w-6 h-6 rounded-full object-cover" />
                      <p className="text-boss-text font-bold text-sm">@{profileData?.username}</p>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{post.caption || post.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-10 w-full text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Swipe to explore posts
          </div>
        </div>
      )}

      {/* FULL SCREEN REEL VIEWER */}
      {selectedReelIndex !== null && userReels[selectedReelIndex] && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedReelIndex(null)} 
            className="absolute top-10 right-6 z-[1100] text-boss-text p-3 bg-white/10 rounded-full backdrop-blur-md active:scale-90 transition-all"
          >
            <X size={28} />
          </button>

          <div 
            className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            onScroll={(e) => {
              const index = Math.round(e.currentTarget.scrollTop / window.innerHeight);
              if (index !== selectedReelIndex) setSelectedReelIndex(index);
            }}
          >
            {userReels.map((reel, index) => (
              <div key={reel.id} className="h-full w-full snap-start relative flex items-center justify-center bg-black">
                {/* Only render/play the video if it is the active one to prevent audio overlap */}
                {index === selectedReelIndex ? (
                  <video 
                    src={reel.videoUrl} 
                    className="w-full h-full object-contain" 
                    autoPlay 
                    loop 
                    playsInline 
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                     <img src={reel.videoUrl + "#t=0.1"} className="w-full h-full object-cover opacity-30 blur-sm" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                
                <div className="absolute right-4 bottom-32 flex flex-col gap-8 items-center z-[1050]">
                  <div className="flex flex-col items-center gap-1">
                    <Heart size={30} className="text-boss-text" />
                    <span className="text-[10px] font-bold">Like</span>
                  </div>
                  <MessageCircle size={30} className="text-boss-text" />
                  <Share2 size={30} className="text-boss-text" />
                </div>

                <div className="absolute bottom-12 left-5 right-20 z-[1050]">
                  <p className="font-bold text-lg text-boss-text mb-1">@{profileData?.username}</p>
                  <p className="text-sm text-zinc-200 line-clamp-2">{reel.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
