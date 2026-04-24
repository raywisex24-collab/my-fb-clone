import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// 1. INITIALIZE FIREBASE
if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const formattedKey = rawKey 
    ? rawKey.replace(/\\n/g, '\n').replace(/"/g, '').trim() 
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
}
const db = admin.firestore();

// 2. CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 3. GHOST USER DATA (7 Real Names)
const ghostUsers = [
  { name: 'Emeka Nwosu', avatar: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Adesua Etomi', avatar: 'https://i.pravatar.cc/150?u=adesua' },
  { name: 'Tunde Ednut', avatar: 'https://i.pravatar.cc/150?u=tunde' },
  { name: 'Chioma Adeyemi', avatar: 'https://i.pravatar.cc/150?u=chioma' },
  { name: 'Babatunde Olatunji', avatar: 'https://i.pravatar.cc/150?u=baba' },
  { name: 'Zainab Balogun', avatar: 'https://i.pravatar.cc/150?u=zainab' },
  { name: 'Olumide Oworu', avatar: 'https://i.pravatar.cc/150?u=olumide' }
];

export default async function handler(req, res) {
  try {
    // Calling the Clockworks TikTok Scraper directly
    const APIFY_URL = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`;
    
    const apifyResponse = await fetch(APIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "hashtags": ["trending"], 
        "resultsPerPage": 1,
        "excludeFakeAds": true
      })
    });

    const data = await apifyResponse.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: "No TikToks found. Check Apify Token.", 
        debug: data 
      });
    }

    const item = data[0];
    const videoUrl = item.videoMeta?.downloadAddr || item.webVideoUrl;

    if (!videoUrl) {
      return res.status(200).json({ success: false, message: "Video link missing." });
    }

    // 4. UPLOAD TO CLOUDINARY
    const uploadResponse = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'bossnet_tiktok',
    });

    // 5. PICK RANDOM GHOST USER
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    // 6. SAVE TO FIREBASE
    await db.collection('posts').add({
      authorName: randomUser.name,
      authorAvatar: randomUser.avatar,
      videoUrl: uploadResponse.secure_url,
      caption: item.text || "New trending TikTok! #Bossnet",
      likes: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true, 
      message: "Victory! The post is live.",
      postedBy: randomUser.name,
      video: uploadResponse.secure_url
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
