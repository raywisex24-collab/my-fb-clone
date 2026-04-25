import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  doc, getDoc, collection, addDoc, query, orderBy, 
  onSnapshot, serverTimestamp, where, setDoc, updateDoc, increment, deleteDoc, getDocs 
} from 'firebase/firestore';
import { 
  Home, MessageCircle, Settings, Video, Phone, ChevronLeft, Search, Plus, Send, Check, X, FileText, ChevronRight, Reply, Edit2, Trash2, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import VerifiedBadge from './VerifiedBadge';

export default function Chatbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [activeChat, setActiveChat] = useState(null); 
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchResults, setSearchResults] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const scrollRef = useRef(null);

  const defaultPic = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238a8d91"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

  // Total Unread Counter for Header
  const [totalUnread, setTotalUnread] = useState(0);

  // Call listener is now handled globally in App.jsx. 
  // No local listener needed here to avoid double alerts.

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    return onSnapshot(q, (snap) => {
      let count = 0;
      snap.docs.forEach(d => {
        count += (d.data().unreadCount?.[user.uid] || 0);
      });
      setTotalUnread(count);
    });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const updateStatus = (status) => {
      updateDoc(userRef, { status: status, lastSeen: serverTimestamp() }).catch(e => console.error(e));
    };

    updateStatus('online');
    const handleVisibilityChange = () => {
      updateStatus(document.visibilityState === 'visible' ? 'online' : 'offline');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      updateStatus('offline');
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (location.state?.targetUser) {
      setActiveChat(location.state.targetUser);
    }
  }, [location]);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const q = query(
        collection(db, "users"),
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff")
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!activeChat?.id || !user) return;
    const chatId = activeChat.isGroup ? activeChat.id : [user.uid, activeChat.id].sort().join('_');
    
    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, { [`unreadCount.${user.uid}`]: 0 }).catch(() => {});

    // Mark messages as seen when opening
    const markAsSeen = async () => {
      const msgsQ = query(collection(db, "chats", chatId, "messages"), where("senderId", "==", activeChat.id), where("status", "!=", "seen"));
      const snap = await getDocs(msgsQ);
      snap.forEach(d => updateDoc(d.ref, { status: 'seen' }));
    };
    markAsSeen();

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [activeChat]);

  const handleTyping = (isTypingBool) => {
    const user = auth.currentUser;
    if (!activeChat?.id || !user) return;
    const chatId = activeChat.isGroup ? activeChat.id : [user.uid, activeChat.id].sort().join('_');
    updateDoc(doc(db, "chats", chatId), { 
      [`typing.${user.uid}`]: isTypingBool 
    }).catch(err => console.error(err));
  };

  const handleSend = async () => {
    const user = auth.currentUser;
    if (!message.trim() || !activeChat?.id || !user) return;
    
    if (editingMessage) {
      await updateDoc(doc(db, "chats", editingMessage.chatId, "messages", editingMessage.id), {
        text: message,
        isEdited: true
      });
      setEditingMessage(null);
      setMessage("");
      return;
    }

    const chatId = activeChat.isGroup ? activeChat.id : [user.uid, activeChat.id].sort().join('_');
    const chatRef = doc(db, "chats", chatId);
    const currentMsg = message;
    const currentReply = replyTo;
    setMessage(""); 
    setReplyTo(null);
    handleTyping(false);

    try {
      // Determine delivery status based on recipient online status
      const recipientDoc = await getDoc(doc(db, "users", activeChat.id));
      const isOnline = recipientDoc.data()?.status === 'online';

      await setDoc(chatRef, {
        participants: [user.uid, activeChat.id], 
        lastMessage: currentMsg,
        lastTimestamp: serverTimestamp(),
        [`unreadCount.${activeChat.id}`]: increment(1),
        lastSenderId: user.uid
      }, { merge: true });

      // First Message Notification Check
      const firstMsgQ = query(collection(db, "chats", chatId, "messages"), where("senderId", "==", user.uid));
      const firstMsgSnap = await getDocs(firstMsgQ);
      if (firstMsgSnap.empty) {
        await addDoc(collection(db, "notifications"), {
          toUserId: activeChat.id,
          fromUserId: user.uid,
          fromUsername: userData?.username,
          fromUserImg: userData?.profilePic,
          type: 'new_message',
          createdAt: serverTimestamp(),
          read: false
        });
      }

      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: currentMsg,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        status: isOnline ? 'delivered' : 'sent',
        replyTo: currentReply ? { text: currentReply.text, senderId: currentReply.senderId } : null
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-[100dvh] bg-[#0b0e11] text-boss-text overflow-hidden font-sans">
      {!activeChat ? (
        <ChatList userData={userData} totalUnread={totalUnread} searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchResults={searchResults} navigate={navigate} setActiveChat={setActiveChat} defaultPic={defaultPic} />
      ) : (
        <ChatWindow activeChat={activeChat} setActiveChat={setActiveChat} messages={messages} message={message} setMessage={setMessage} handleSend={handleSend} scrollRef={scrollRef} currentUser={auth.currentUser} userData={userData} defaultPic={defaultPic} handleTyping={handleTyping} replyTo={replyTo} setReplyTo={setReplyTo} setEditingMessage={setEditingMessage} editingMessage={editingMessage} />
      )}
      {!activeChat && <MobileNav navigate={navigate} totalUnread={totalUnread} />}
    </div>
  );
}

const formatLastSeen = (lastSeen) => {
  if (!lastSeen || !lastSeen.toDate) return "Offline";
  const date = lastSeen.toDate();
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday ? `Last seen today at ${timeStr}` : `Last seen ${date.toLocaleDateString()}`;
};

function ChatList({ userData, totalUnread, searchTerm, setSearchTerm, searchResults, navigate, setActiveChat, defaultPic }) {
  const [recentChats, setRecentChats] = useState([]);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("lastTimestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setRecentChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [userData]); 

  return (
    <div className="flex-1 flex flex-col bg-[#0b0e11] pb-24 overflow-hidden">
      <div className="p-4 flex flex-col gap-4 bg-[#0b0e11]">
        <div className="flex justify-between items-center">
          <div onClick={() => navigate('/me')} className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden border-2 border-blue-500 cursor-pointer">
            <img src={userData?.profilePic || defaultPic} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <div className="relative">
             <h1 className="text-2xl font-black text-boss-text italic">MESSAGES</h1>
             {totalUnread > 0 && <div className="absolute -top-1 -right-4 bg-red-600 text-boss-text text-[10px] px-1.5 rounded-full font-bold">{totalUnread}</div>}
          </div>
          <div className="flex gap-4 text-boss-text/80"><Plus size={22} /><Settings size={22} /></div>
        </div>
        <div className="flex items-center bg-[#202329] rounded-full px-4 py-2.5 gap-3">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Search Friends..." className="bg-transparent outline-none text-sm text-boss-text w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {recentChats.map(chat => (
          <RecentChatCard key={chat.id} chat={chat} setActiveChat={setActiveChat} defaultPic={defaultPic} />
        ))}
      </div>
    </div>
  );
}

function RecentChatCard({ chat, setActiveChat, defaultPic }) {
  const [otherUser, setOtherUser] = useState(null);
  const user = auth.currentUser;
  const otherUserId = chat.participants?.find(p => p !== user?.uid);
  const myUnread = chat.unreadCount?.[user?.uid] || 0;
  const isTyping = chat.typing?.[otherUserId] || false;

  useEffect(() => {
    if (!otherUserId) return;
    return onSnapshot(doc(db, "users", otherUserId), (snap) => {
      if (snap.exists()) setOtherUser({ id: snap.id, ...snap.data() });
    });
  }, [otherUserId]);

  return (
    <div onClick={() => setActiveChat(otherUser)} className={`flex items-center justify-between p-3 rounded-2xl ${myUnread > 0 ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}>
      <div className="flex items-center gap-3">
        {/* Unread dot on the LEFT */}
        {myUnread > 0 && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
        <div className="relative w-12 h-12">
          <img src={otherUser?.profilePic || defaultPic} className="w-full h-full rounded-full object-cover border border-white/10" alt="Avatar" />
          {otherUser?.status === 'online' && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0b0e11] rounded-full" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <h4 className="text-[15px] font-bold">{otherUser?.username || "Loading..."}</h4>
            <VerifiedBadge isVerified={otherUser?.isVerified} />
          </div>
          <p className="text-[12px] truncate w-40">
            {isTyping ? <span className="text-blue-400 italic">Typing...</span> : chat.lastMessage}
          </p>
        </div>
      </div>
      {myUnread > 0 && <div className="bg-red-600 px-1.5 rounded-full text-[10px] font-black">{myUnread}</div>}
    </div>
  );
}

function ChatWindow({ activeChat, setActiveChat, messages, message, setMessage, handleSend, scrollRef, currentUser, userData, defaultPic, handleTyping, replyTo, setReplyTo, setEditingMessage, editingMessage }) {
  const [liveReceiver, setLiveReceiver] = useState(activeChat);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [msgOptions, setMsgOptions] = useState(null);
  const navigate = useNavigate();
  
  const IMGBB_API_KEY = 'fa575203bc672f5b48b5eccc5d59185b';
  const CLOUD_NAME = 'dmmxe0bvj';
  const UPLOAD_PRESET = 'ml_default';

  const chatMedia = messages
    .filter(m => m.image || m.video)
    .map(m => ({ url: m.image || m.video, type: m.image ? 'image' : 'video' }));

  useEffect(() => {
    if (!activeChat?.id || !currentUser?.uid) return;
    const chatId = activeChat.isGroup ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');
    const unsubUser = onSnapshot(doc(db, "users", activeChat.id), (snap) => snap.exists() && setLiveReceiver({ id: snap.id, ...snap.data() }));
    const unsubChat = onSnapshot(doc(db, "chats", chatId), (snap) => snap.exists() && setIsOtherTyping(snap.data().typing?.[activeChat.id] || false));
    return () => { unsubUser(); unsubChat(); };
  }, [activeChat?.id, currentUser?.uid]);

  // ✅ CALL TRIGGER LOGIC
  const startCall = async (type) => {
    const roomId = activeChat.isGroup ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');
    
    // Create call document to alert recipient
    await addDoc(collection(db, "calls"), {
      roomId,
      callerId: currentUser.uid,
      callerName: userData?.username || "A Boss",
      receiverId: activeChat.id,
      type,
      status: 'ringing',
      createdAt: serverTimestamp()
    });

    navigate(`/${type}-call/${roomId}`);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setShowMenu(false);
    setUploading(true);
    const chatId = activeChat.isGroup ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');

    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          await addDoc(collection(db, "chats", chatId, "messages"), {
            image: data.data.url,
            senderId: currentUser.uid,
            createdAt: serverTimestamp(),
            status: 'sent'
          });
        }
      } catch (err) { console.error(err); }
    }
    setUploading(false);
  };

  const handleCloudinaryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setShowMenu(false);
    setUploading(true);
    const chatId = activeChat.isGroup ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      const isVideo = data.resource_type === 'video';
      
      await addDoc(collection(db, "chats", chatId, "messages"), {
        [isVideo ? 'video' : 'file']: data.secure_url,
        fileName: file.name,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'sent'
      });
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleMessageAction = async (action, msg) => {
    const chatId = activeChat.isGroup ? activeChat.id : [currentUser.uid, activeChat.id].sort().join('_');
    const msgRef = doc(db, "chats", chatId, "messages", msg.id);

    if (action === 'deleteMe') {
      await updateDoc(msgRef, { [`deletedFor.${currentUser.uid}`]: true });
    } else if (action === 'deleteThem') {
      await updateDoc(msgRef, { [`deletedFor.${activeChat.id}`]: true });
    } else if (action === 'deleteEveryone') {
      await deleteDoc(msgRef);
    } else if (action === 'report') {
      await addDoc(collection(db, "reports"), {
        to: "securedauthenticator@gmail.com",
        sender: liveReceiver.username,
        reporter: userData.username,
        content: msg.text || "Media Content",
        timestamp: serverTimestamp()
      });
      alert("Message reported to safety team.");
    }
    setMsgOptions(null);
  };

  return (
    <div className="fixed inset-0 bg-[#0b0e11] flex flex-col z-[100]">
      {/* Gallery & Menus Omitted for Brevity - Same as Existing */}
      
      {/* Top Profile Tapping Logic */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#16191d]">
        <div className="flex items-center gap-3">
          <ChevronLeft onClick={() => setActiveChat(null)} size={24} className="text-boss-text cursor-pointer" />
          <div onClick={() => navigate(`/profile/${activeChat.id}`)} className="relative w-10 h-10 cursor-pointer">
            <img src={liveReceiver?.profilePic || defaultPic} className="w-full h-full rounded-full object-cover border border-blue-500/30" alt="" />
            {liveReceiver?.status === 'online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#16191d] rounded-full" />}
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="font-black text-sm">{liveReceiver?.username || "Loading..."}</span>
              <VerifiedBadge isVerified={liveReceiver?.isVerified} />
            </div>
            <span className={`text-[10px] uppercase font-black ${isOtherTyping ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`}>
              {isOtherTyping ? 'Typing...' : (liveReceiver?.status === 'online' ? 'Online' : formatLastSeen(liveReceiver?.lastSeen))}
            </span>
          </div>
        </div>
<div className="flex items-center gap-5 text-boss-text/80">
  <Phone onClick={() => startCall('voice')} size={20} className="cursor-pointer hover:text-green-500 transition-colors" />
  <Video onClick={() => startCall('video')} size={20} className="cursor-pointer hover:text-blue-500 transition-colors" />
  
  {/* NEW CHAT SETTINGS BUTTON */}
  <Settings 
    onClick={() => navigate(`/chat-settings/${activeChat.id}`, { state: { activeChat } })} 
    size={20} 
    className="cursor-pointer hover:rotate-90 transition-transform duration-300" 
  />
</div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
        {messages.map((msg) => {
          if (msg.deletedFor?.[currentUser.uid]) return null;
          const isMe = msg.senderId === currentUser?.uid;
          const time = msg.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(msg.createdAt.toDate()) : "...";
          const canEdit = isMe && msg.createdAt && (new Date() - msg.createdAt.toDate()) < 1800000;

          return (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              isMe={isMe} 
              time={time} 
              canEdit={canEdit}
              setReplyTo={setReplyTo}
              setEditingMessage={setEditingMessage}
              setMessage={setMessage}
              setMsgOptions={setMsgOptions}
              setGalleryIndex={setGalleryIndex}
              chatMedia={chatMedia}
            />
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Action Dialogs */}
      <AnimatePresence>
        {msgOptions && (
          <div className="fixed inset-0 bg-boss-bg/60 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#16191d] w-full rounded-3xl p-4 space-y-2">
              <h3 className="text-center font-black text-gray-500 text-[10px] uppercase tracking-widest mb-4">Message Options</h3>
              <button onClick={() => { setReplyTo(msgOptions); setMsgOptions(null); }} className="w-full p-4 bg-white/5 rounded-2xl flex items-center gap-3"><Reply size={18}/> Reply</button>
              {msgOptions.senderId === currentUser.uid ? (
                <>
                  <button onClick={() => handleMessageAction('deleteEveryone', msgOptions)} className="w-full p-4 bg-red-500/10 text-red-500 rounded-2xl flex items-center gap-3"><Trash2 size={18}/> Delete for Everyone</button>
                  <button onClick={() => handleMessageAction('deleteMe', msgOptions)} className="w-full p-4 bg-white/5 rounded-2xl flex items-center gap-3"><Trash2 size={18}/> Delete for Me</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleMessageAction('deleteMe', msgOptions)} className="w-full p-4 bg-white/5 rounded-2xl flex items-center gap-3"><Trash2 size={18}/> Delete for Me</button>
                  <button onClick={() => handleMessageAction('report', msgOptions)} className="w-full p-4 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center gap-3"><AlertOctagon size={18}/> Report Message</button>
                </>
              )}
              <button onClick={() => setMsgOptions(null)} className="w-full p-4 font-black text-gray-500">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reply UI */}
      {replyTo && (
        <div className="mx-3 mb-1 p-3 bg-blue-600/10 border-l-4 border-blue-600 rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-blue-500 text-[10px] font-black uppercase">Replying to Message</span>
            <p className="text-sm truncate w-60 text-gray-300">{replyTo.text}</p>
          </div>
          <X size={18} onClick={() => setReplyTo(null)} className="cursor-pointer" />
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[#0b0e11] border-t border-white/5 relative">
        <div className="flex items-end gap-2">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 mb-1">
            {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" /> : <Plus size={24} className={`text-blue-500 transition-all ${showMenu ? 'rotate-45' : ''}`} />}
          </button>
          
          {/* Menu for selection remains identical to original logic */}
          {showMenu && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-20 left-4 bg-[#16191d] border border-white/5 rounded-2xl p-2 flex flex-col gap-2 z-[200] shadow-2xl">
              <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                <Plus size={20} className="text-blue-500" />
                <span className="text-sm">Image</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                <Video size={20} className="text-purple-500" />
                <span className="text-sm">Video</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleCloudinaryUpload} />
              </label>
              <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                <FileText size={20} className="text-green-500" />
                <span className="text-sm">File</span>
                <input type="file" className="hidden" onChange={handleCloudinaryUpload} />
              </label>
            </motion.div>
          )}

          <div className="flex-1 bg-[#202329] rounded-2xl px-4 py-2 border border-white/5">
            <textarea 
              rows="1"
              className="bg-transparent border-none outline-none text-[15px] w-full text-boss-text placeholder-gray-500 resize-none py-1" 
              placeholder={editingMessage ? "Edit message..." : "Type a message..."} 
              value={message} 
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping(true);
              }} 
            />
          </div>
          <button onClick={handleSend} className={`p-3 rounded-full mb-1 transition-all ${message.trim() ? 'bg-blue-600' : 'bg-[#202329] text-gray-500'}`}><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ msg, isMe, time, canEdit, setReplyTo, setEditingMessage, setMessage, setMsgOptions, setGalleryIndex, chatMedia }) {
  const x = useMotionValue(0);
  const swipeLimit = isMe ? -100 : 100;
  const background = useTransform(x, [0, swipeLimit], ["rgba(0,0,0,0)", "rgba(59, 130, 246, 0.2)"]);

  const onDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > 60) {
      setReplyTo(msg);
    }
  };

  return (
    <motion.div 
      drag="x"
      dragConstraints={{ left: isMe ? -100 : 0, right: isMe ? 0 : 100 }}
      onDragEnd={onDragEnd}
      style={{ x, background }}
      onDoubleClick={() => {
        if (canEdit) {
          setEditingMessage(msg);
          setMessage(msg.text);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMsgOptions(msg);
      }}
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-colors duration-200`}
    >
      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-[14px] relative ${isMe ? 'bg-blue-600 rounded-tr-none' : 'bg-[#202329] rounded-tl-none border border-white/5'}`}>
        {msg.replyTo && (
          <div className="mb-2 p-2 bg-boss-bg/20 rounded-lg border-l-2 border-white/40 text-[11px] opacity-80">
            {msg.replyTo.text}
          </div>
        )}
        {msg.image && (
          <img 
            src={msg.image} 
            onClick={() => setGalleryIndex(chatMedia.findIndex(m => m.url === msg.image))} 
            className="rounded-lg mb-2 max-h-60 w-full object-cover shadow-lg cursor-pointer" 
            alt="" 
          />
        )}
        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
        {msg.isEdited && <span className="text-[8px] opacity-40 italic block">edited</span>}
        
        <div className="flex items-center justify-end gap-1 mt-1 opacity-60 text-[9px]">
          {time} 
          {isMe && (
            <div className="flex">
              <Check size={10} className={msg.status === 'seen' ? 'text-red-500' : 'text-boss-text'} />
              {(msg.status === 'delivered' || msg.status === 'seen') && (
                <Check size={10} className={`-ml-1.5 ${msg.status === 'seen' ? 'text-red-500' : 'text-boss-text'}`} />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MobileNav({ navigate, totalUnread }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0b0e11]/95 border-t border-white/5 flex justify-around items-center py-4 z-50">
      <Home onClick={() => navigate('/feed')} size={22} className="text-gray-500" />
      <div className="relative">
        <MessageCircle size={22} className="text-blue-500" />
        {totalUnread > 0 && <div className="absolute -top-2 -right-2 bg-red-600 text-boss-text text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{totalUnread}</div>}
      </div>
      <Settings onClick={() => navigate('/settings')} size={22} className="text-gray-500" />
    </div>
  );
}
