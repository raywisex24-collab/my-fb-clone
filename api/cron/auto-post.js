import admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// 1. INITIALIZE FIREBASE (The "Safe" Way)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The replace fix ensures the private key works on Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

// 3. GHOST USER DATA (The "Real People" for the app)
const ghostUsers = [
  { name: 'Emeka Nwosu', avatar: 'https://i.pravatar.cc/150?u=emeka' },
  { name: 'Adesua Etomi', avatar: 'https://i.pravatar.cc/150?u=adesua' },
  { name: 'Tunde Ednut', avatar: 'https://i.pravatar.cc/150?u=tunde' },
  { name: 'Chioma Ade', avatar: 'https://i.pravatar.cc/150?u=chioma' }
];

export default async function handler(req, res) {
  try {
    // A. Trigger Apify to get a trending video
    const apifyResponse = await fetch(`https://api.apify.com/v2/actor-tasks/raywise~instagram-scraper-task/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`);
    const data = await apifyResponse.json();

    if (!data || data.length === 0) {
      throw new Error("No videos found from Apify.");
    }

    const videoUrl = data[0].videoUrl || data[0].displayUrl;
    const caption = data[0].caption || "Check out this new reel! #Bossnet";

    // B. Upload the video to Cloudinary so it's hosted permanently
    const uploadResponse = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'bossnet_reels',
    });

    // C. Pick a random Ghost User
    const randomUser = ghostUsers[Math.floor(Math.random() * ghostUsers.length)];

    // D. Save to Firebase (Make sure your collection name matches your app)
    const newPost = {
      authorName: randomUser.name,
      authorAvatar: randomUser.avatar,
      videoUrl: uploadResponse.secure_url,
      caption: caption,
      likes: Math.floor(Math.random() * 500),
      createdAt: new Date().toISOString(),
    };

    // NOTE: If your app uses "reels" instead of "posts", change the name below!
    await db.collection('posts').add(newPost);

    return res.status(200).json({ 
      success: true, 
      message: "Post created successfully!", 
      postedBy: randomUser.name 
    });

  } catch (error) {
    console.error("Auto-Post Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
