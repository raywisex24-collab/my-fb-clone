import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment, limit, deleteDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { Heart, MessageSquare, MoreHorizontal, Globe, Lock, Send, X, Repeat2, Share2, Bookmark, Trash2, Flag, UserX, BellOff, EyeOff, Link, Edit, MessageCircleOff, Eye, UserPlus } from 'lucide-react';
import StoryAvatar from '../components/StoryAvatar';
import VerifiedBadge from './VerifiedBadge'; 

export default function Feed() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [followingStories, setFollowingStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // New States for Menu and Reporting
  const [activeMenu, setActiveMenu] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportMessage, setReportMessage] = useState("");
  const hasScrolledRef = useRef(false);

  // Comment States
  const [activePostForComments, setActivePostForComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [currentComments, setCurrentComments] = useState([]);

  // 1. Fetch User and Posts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate('/login'); return; }

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) setUserData(doc.data());
    });

    // Changed to 'asc' as requested for "going down" logic
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "asc"));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUser(); unsubPosts(); };
  }, [navigate]);

  // Handle "Start in the Middle" scroll
  useEffect(() => {
    if (posts.length > 0 && !hasScrolledRef.current) {
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight / 2,
          behavior: 'smooth'
        });
        hasScrolledRef.current = true;
      }, 500);
    }
  }, [posts]);

  // 1.5. Listen for "Refresh" tap from Navbar
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (posts.length > 0) {
        const randomIndex = Math.floor(Math.random() * posts.length);
        const postElements = document.querySelectorAll('.post-container');
        
        if (postElements[randomIndex]) {
          postElements[randomIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    };

    window.addEventListener('refreshFeed', handleGlobalRefresh);
    return () => window.removeEventListener('refreshFeed', handleGlobalRefresh);
  }, [posts]);

  // Fetch Stories Tray Logic
  useEffect(() => {
    if (!userData?.following) return;

    const fetchStories = async () => {
      const now = Date.now();
      // Combine your UID with following list to see your story + theirs
      const userIdsToCheck = [auth.currentUser.uid, ...userData.following];
      
      const q = query(
        collection(db, "stories"),
        where("userId", "in", userIdsToCheck.slice(0, 30)), // Firestore limit is 30
        where("expiresAt", ">", now)
      );

      const snap = await getDocs(q);
      const storyMap = {};

      snap.docs.forEach(doc => {
        const data = doc.data();
        // Only show one circle per user
        if (!storyMap[data.userId]) {
          storyMap[data.userId] = {
            userId: data.userId,
            username: data.userId === auth.currentUser.uid ? "Your Story" : data.username,
            profilePic: data.profilePic
          };
        }
      });
      setFollowingStories(Object.values(storyMap));
    };

    fetchStories();
  }, [userData?.following]);

  // 2. Real-time Comments Listener
  useEffect(() => {
    if (!activePostForComments) return;
    const q = query(collection(db, "posts", activePostForComments, "comments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCurrentComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [activePostForComments]);

  // 3. Like Logic (Modified to sync with original if repost)
  const handleLike = async (post, likes = []) => {
    const userId = auth.currentUser.uid;
    const targetId = post.isRepost ? post.originalPostId : post.id;
    const postRef = doc(db, "posts", targetId);
    
    try {
      if (likes.includes(userId)) {
        await updateDoc(postRef, { likes: arrayRemove(userId) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(userId) });
        if (post.userId !== userId) {
          await addDoc(collection(db, "notifications"), {
            toUserId: post.userId,
            fromUserId: userId,
            fromUsername: userData?.username || "Someone",
            fromUserImg: userData?.profilePic || "",
            isVerified: userData?.isVerified || false,
            type: "like",
            postId: targetId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) { console.error("Error updating likes:", err); }
  };

  // 4. Repost Logic (Modified for Toggle/Unrepost)
  const handleRepost = async (post) => {
    const userId = auth.currentUser.uid;
    const originalPostId = post.isRepost ? post.originalPostId : post.id;
    
    try {
      const q = query(
        collection(db, "posts"), 
        where("userId", "==", userId), 
        where("originalPostId", "==", originalPostId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Unrepost
        const repostId = querySnapshot.docs[0].id;
        await deleteDoc(doc(db, "posts", repostId));
        await updateDoc(doc(db, "posts", originalPostId), { repostCount: increment(-1) });
      } else {
        // Repost
        await addDoc(collection(db, "posts"), {
          userId: userId,
          username: userData.username,
          userImg: userData.profilePic,
          isVerified: userData.isVerified,
          text: post.text,
          image: post.image || null,
          isRepost: true,
          originalOwnerId: post.userId,
          originalOwnerName: post.username,
          originalPostId: originalPostId,
          createdAt: serverTimestamp(),
          likes: post.likes || [], // Gain original engagement
          commentCount: post.commentCount || 0,
          repostCount: 0,
          hidden: false,
          commentsDisabled: post.commentsDisabled || false
        });

        await updateDoc(doc(db, "posts", originalPostId), { repostCount: increment(1) });

        if (post.userId !== userId) {
          await addDoc(collection(db, "notifications"), {
            toUserId: post.userId,
            fromUserId: userId,
            fromUsername: userData.username,
            type: "repost",
            postId: originalPostId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) { console.error("Repost error:", err); }
  };

  // New Menu Helper Functions
  const handleReport = (post) => {
    setReportingPost(post);
    setActiveMenu(null);
  };

  const submitReport = () => {
    const reportData = `Reporter: ${userData.username}\nReported User: ${reportingPost.username}\nPost ID: ${reportingPost.id}\nReason: ${reportMessage}`;
    window.location.href = `mailto:securedauthenticator@gmail.com?subject=POST REPORT&body=${encodeURIComponent(reportData)}`;
    setReportingPost(null);
    setReportMessage("");
  };

  const handleToggleComments = async (postId, currentState) => {
    await updateDoc(doc(db, "posts", postId), { commentsDisabled: !currentState });
    setActiveMenu(null);
  };

  const handleHidePost = async (postId, currentState) => {
    await updateDoc(doc(db, "posts", postId), { hidden: !currentState });
    setActiveMenu(null);
  };

  const copyPostLink = (post) => {
    const link = post.image || `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(link);
    alert("Link copied!");
    setActiveMenu(null);
  };

  // 5. Share Logic
  const handleShare = async (post) => {
    const recipientId = window.prompt("Enter User ID to share with:");
    if (!recipientId) return;
    try {
      await addDoc(collection(db, "chats"), {
        senderId: auth.currentUser.uid,
        receiverId: recipientId,
        message: `Check out this post by ${post.username}: /post/${post.id}`,
        type: "post_share",
        postId: post.id,
        read: false,
        createdAt: serverTimestamp()
      });
      alert("Shared successfully!");
    } catch (err) { console.error("Share error:", err); }
  };

  // 6. Favorite/Save Logic
  const handleSave = async (post) => {
    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, { savedPosts: arrayUnion(post.id) });
      alert("Saved to favorites!");
    } catch (err) { console.error("Save error:", err); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const postData = posts.find(p => p.id === activePostForComments);
    if (postData?.commentsDisabled) { alert("Comments are disabled for this post"); return; }

    try {
      await addDoc(collection(db, "posts", activePostForComments, "comments"), {
        text: commentText,
        username: userData.username,
        userImg: userData.profilePic,
        isVerified: userData.isVerified || false,
        userId: auth.currentUser.uid,
        likes: [],
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "posts", activePostForComments), { commentCount: increment(1) });
      setCommentText("");
    } catch (err) { console.error("Comment Error:", err); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), { commentCount: increment(-1) });
    } catch (err) { console.error(err); }
  };

  const handleLikeComment = async (postId, commentId, likes = []) => {
    const userId = auth.currentUser.uid;
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    try {
      if (likes.includes(userId)) {
        await updateDoc(commentRef, { likes: arrayRemove(userId) });
      } else {
        await updateDoc(commentRef, { likes: arrayUnion(userId) });
      }
    } catch (err) { console.error(err); }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const sec = Math.floor((new Date() - ts.toDate()) / 1000);
    if (sec < 60) return "Just now";
    if (sec < 3600) return Math.floor(sec / 60) + "m";
    if (sec < 84600) return Math.floor(sec / 3600) + "h";
    return ts.toDate().toLocaleDateString();
  };

  return (
    <div className="w-full bg-boss-bg text-[#e4e6eb] min-h-screen">
      <main className="w-full max-w-lg mx-auto pb-10">
        
        {/* Stories Tray - Only shows if there are stories */}
        {followingStories.length > 0 && (
          <div className="flex items-center gap-4 p-4 overflow-x-auto no-scrollbar border-b border-white/5 bg-boss-bg/50 backdrop-blur-md sticky top-0 z-[40]">
            {followingStories.map((story) => (
              <div key={story.userId} className="flex flex-col items-center gap-1 min-w-[70px]">
                <StoryAvatar 
                  userId={story.userId} 
                  profilePic={story.profilePic} 
                  size="65px" 
                />
                <span className="text-[10px] text-zinc-400 font-bold truncate w-16 text-center">
                  {story.username}
                </span>
              </div>
            ))}
          </div>
        )}

        {posts.map((post) => {
          const isLiked = post.likes ? post.likes.includes(auth.currentUser?.uid) : false;
          const isSaved = userData?.savedPosts?.includes(post.id);
          const isOwner = post.userId === auth.currentUser?.uid;
          const isRepostedByUser = posts.some(p => p.isRepost && p.originalPostId === post.id && p.userId === auth.currentUser.uid);

          // Hide logic
          if (post.hidden && !isOwner) return null;
          
          return (
<div key={post.id} className="post-container w-full mb-6 bg-transparent border-y border-white/5 md:border md:rounded-3xl overflow-hidden shadow-2xl relative">
              
              {post.isRepost && (
                <div className="px-4 pt-2 flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                   <Repeat2 size={12} className="text-blue-500" />
                   <span>Reposted from {post.originalOwnerName}</span>
                </div>
              )}

              {/* Header */}
              <div className="p-4 flex items-center justify-between relative">
<div className="flex items-center gap-3">
  <StoryAvatar 
    userId={post.userId} 
    profilePic={post.userId === auth.currentUser.uid ? userData?.profilePic : post.userImg} 
    size="40px" 
  />
  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-sm text-boss-text">{post.username}</h4>
                      <VerifiedBadge isVerified={post.isVerified} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      <span>{formatTime(post.createdAt)}</span> · {post.privacy === 'private' ? <Lock size={10}/> : <Globe size={10}/>}
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}>
                   <MoreHorizontal className="text-zinc-600" />
                </button>

                {/* DYNAMIC DROP DOWN MENU */}
                {activeMenu === post.id && (
                  <div className="absolute right-4 top-12 z-[200] w-64 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                    {isOwner ? (
                      <>
                        <button onClick={() => { if(window.confirm("Delete post?")) deleteDoc(doc(db, "posts", post.id)) }} className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-white/5 text-xs font-bold transition-colors">
                          <Trash2 size={16} /> Delete Post
                        </button>
                        <button onClick={() => handleHidePost(post.id, post.hidden)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          {post.hidden ? <Eye size={16} /> : <EyeOff size={16} />} {post.hidden ? "Show Post" : "Hide Post"}
                        </button>
                        <button onClick={() => copyPostLink(post)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <Link size={16} /> Copy link of post
                        </button>
                        <button onClick={() => navigate(`/edit-post/${post.id}`)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <Edit size={16} /> Edit post
                        </button>
                        <button onClick={() => handleToggleComments(post.id, post.commentsDisabled)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold transition-colors">
                          <MessageCircleOff size={16} /> Turn off comments
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleReport(post)} className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-white/5 text-xs font-bold">
                          <Flag size={16} /> Report post
                        </button>
                        <button onClick={() => { /* Logic for actual gallery save usually requires a library or server-side proxy */ alert("Saving to gallery...") }} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <Bookmark size={16} /> Save to gallery
                        </button>
                        <button className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <BellOff size={16} /> Turn off notifications
                        </button>
                        <button className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          {userData?.following?.includes(post.userId) ? <UserX size={16}/> : <UserPlus size={16}/>} {userData?.following?.includes(post.userId) ? "Unfollow" : "Follow"} user
                        </button>
                        <button onClick={() => handleHidePost(post.id, false)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <EyeOff size={16} /> Hide the post
                        </button>
                        <button onClick={() => copyPostLink(post)} className="w-full px-4 py-3 flex items-center gap-3 text-boss-text hover:bg-white/5 text-xs font-bold">
                          <Link size={16} /> Copy the link
                        </button>
                        <button onClick={() => handleRepost(post)} className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 text-xs font-bold ${isRepostedByUser ? 'text-blue-500' : 'text-boss-text'}`}>
                          <Repeat2 size={16} /> {isRepostedByUser ? "Unrepost" : "Repost"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3 cursor-pointer" onClick={() => navigate(`/post/${post.isRepost ? post.originalPostId : post.id}`)}>
                <p className="text-[15px] leading-relaxed text-zinc-200">{post.text}</p>
              </div>

              {/* Multi-Image Swipe Logic */}
              {post.image && (
                <div className="relative group">
                  {/* ... all the old image code ... */}
                </div>
              )}

              {/* Post Content & Media */}
              <div 
                className={`transition-all duration-500 ${post.postType === 'text' ? 'aspect-square flex items-center justify-center p-8 text-center' : 'px-4 pb-3'}`}
                style={{ background: post.postType === 'text' ? post.textBg : 'transparent' }}
                onClick={() => navigate(`/post/${post.isRepost ? post.originalPostId : post.id}`)}
              >
                <p className={`${post.postType === 'text' ? 'text-2xl font-bold leading-tight' : 'text-[15px] leading-relaxed text-zinc-200'}`}>
                  {post.text}
                </p>
              </div>

              {/* Multi-Image Swipe Carousel */}
              {post.postType !== 'text' && (
                <>
                  {post.images && post.images.length > 0 ? (
                    <div className="relative group w-full bg-zinc-900/40">
                      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
                        {post.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            className="min-w-full snap-center flex justify-center cursor-zoom-in"
                            onClick={() => setZoomedImage({ images: post.images, index: idx })}
                          >
                            <img src={img} className="max-h-[500px] w-full object-cover" alt="" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Image Indicator Dots */}
                      {post.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-md">
                          {post.images.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === 0 ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : post.image && (
                    <div className="w-full bg-zinc-900/40 flex justify-center cursor-zoom-in" onClick={() => setZoomedImage({ images: [post.image], index: 0 })}>
                      <img src={post.image} className="max-h-[500px] w-full object-cover" alt="" />
                    </div>
                  )}
                </>
              )}

              {/* Interaction Bar */}
              <div className="p-3 flex items-center justify-between border-t border-white/5 px-6">
                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleLike(post, post.likes || [])} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-zinc-400'}`}>
                      <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      <span className="text-[11px] font-bold">Like</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.likes?.length || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => setActivePostForComments(post.id)} className="flex items-center gap-2 text-zinc-400">
                      <MessageSquare size={18} />
                      <span className="text-[11px] font-bold">Comment</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.commentCount || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleRepost(post)} className={`flex items-center gap-2 transition-colors ${isRepostedByUser ? 'text-blue-500' : 'text-zinc-400'}`}>
                      <Repeat2 size={18} />
                      <span className="text-[11px] font-bold">Repost</span>
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold">{post.repostCount || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleShare(post)} className="flex items-center gap-2 text-zinc-400 hover:text-blue-500">
                      <Share2 size={18} />
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold opacity-0">0</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <button onClick={() => handleSave(post)} className={`flex items-center gap-2 transition-colors ${isSaved ? 'text-yellow-500' : 'text-zinc-400'}`}>
                      <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                   </button>
                   <span className="text-[10px] text-zinc-500 font-bold opacity-0">0</span>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* REPORT MODAL */}
      {reportingPost && (
        <div className="fixed inset-0 z-[500] bg-boss-bg/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[30px] p-6 border border-white/10 shadow-2xl">
            <h3 className="text-boss-text font-bold text-lg mb-2">Report Content</h3>
            <p className="text-zinc-400 text-xs mb-4">Explain why you are reporting @{reportingPost.username}'s post.</p>
            <textarea 
              value={reportMessage} 
              onChange={(e) => setReportMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-boss-text text-sm h-32 focus:outline-none focus:border-blue-500 mb-4" 
              placeholder="Your message..."
            />
            <div className="flex gap-3">
              <button onClick={() => setReportingPost(null)} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={submitReport} className="flex-1 py-3 bg-red-600 rounded-xl font-bold text-sm">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENT PANEL */}
      {activePostForComments && (
        <div className="fixed inset-0 z-[300] bg-boss-bg/90 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-[#1c1c1e] w-full max-h-[85vh] rounded-t-[30px] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-bold text-lg text-boss-text">Conversation</h3>
              <button onClick={() => setActivePostForComments(null)} className="p-2 bg-white/5 rounded-full text-zinc-400"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              {currentComments.map(c => {
                const commentLiked = c.likes?.includes(auth.currentUser.uid);
                return (
                  <div key={c.id} className="flex gap-3 group">
                    <img src={c.userImg} className="w-8 h-8 rounded-full object-cover" alt="" />
                    <div className="flex-1">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1">
                            <p className="text-[11px] font-bold text-blue-500">@{c.username}</p>
                            <VerifiedBadge isVerified={c.isVerified} />
                          </div>
                          {c.userId === auth.currentUser.uid && (
                            <button onClick={() => handleDeleteComment(activePostForComments, c.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-zinc-100">{c.text}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-2">
                        <button onClick={() => handleLikeComment(activePostForComments, c.id, c.likes || [])} className={`flex items-center gap-1 text-[10px] font-bold ${commentLiked ? 'text-red-500' : 'text-zinc-500'}`}>
                          <Heart size={12} fill={commentLiked ? "currentColor" : "none"} />
                          {c.likes?.length || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddComment} className="p-4 bg-[#2c2c2e] flex items-center gap-3 pb-10">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a reply..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-boss-text focus:outline-none focus:border-blue-500/50"
              />
              <button type="submit" className="p-3 bg-blue-600 rounded-full text-boss-text active:scale-90 transition-transform shadow-lg shadow-blue-600/20"><Send size={18} /></button>
            </form>
          </div>
        </div>
      )}

{/* Full-Screen Swipable Viewer */}
{zoomedImage && (
  <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
    {/* Close Button */}
    <button 
      onClick={() => setZoomedImage(null)}
      className="absolute top-10 right-6 z-[1001] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
    >
      <X size={28} strokeWidth={2.5} />
    </button>

    <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
      {zoomedImage.images.map((img, i) => (
        <div key={i} className="min-w-full h-full snap-center flex items-center justify-center">
          <img 
            src={img} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            alt="Fullscreen" 
            onDoubleClick={() => setZoomedImage(null)}
          />
        </div>
      ))}
    </div>

    {/* Counter for Multiple Images */}
    {zoomedImage.images.length > 1 && (
      <div className="absolute bottom-10 px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-white backdrop-blur-md">
        Swipe to view {zoomedImage.images.length} items
      </div>
    )}
  </div>
)}
    </div>
  );
}
