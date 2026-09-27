const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LIVE_BASE_URL = "https://api.pujapathsanskar.com";

// Pattern to match any local IP or localhost URLs
const LOCAL_URL_REGEX = /^http:\/\/(192\.168\.\d+\.\d+|localhost|127\.0\.0\.1):5000/g;

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.match(LOCAL_URL_REGEX)) {
    return url.replace(LOCAL_URL_REGEX, LIVE_BASE_URL);
  }
  return url;
}

async function runUpdate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully to MongoDB.\n");

    const Pandit = require('./models/Pandit');
    const Astrologer = require('./models/Astrologer');
    const Puja = require('./models/Puja');
    const User = require('./models/User');
    const Admin = require('./models/Admin');

    // 1. Update Pandits
    const pandits = await Pandit.find({});
    console.log(`Checking ${pandits.length} Pandits...`);
    let panditCount = 0;
    for (const p of pandits) {
      let changed = false;
      
      const newProfilePhoto = cleanUrl(p.profilePhoto);
      if (newProfilePhoto !== p.profilePhoto) {
        console.log(`  Updating profilePhoto for Pandit [${p.fullName}]: ${p.profilePhoto} -> ${newProfilePhoto}`);
        p.profilePhoto = newProfilePhoto;
        changed = true;
      }

      const newIdProof = cleanUrl(p.idProof);
      if (newIdProof !== p.idProof) {
        p.idProof = newIdProof;
        changed = true;
      }

      const newIntroVideo = cleanUrl(p.introVideo);
      if (newIntroVideo !== p.introVideo) {
        p.introVideo = newIntroVideo;
        changed = true;
      }

      if (Array.isArray(p.pujaPhotos) && p.pujaPhotos.length > 0) {
        const cleanedPhotos = p.pujaPhotos.map(cleanUrl);
        if (JSON.stringify(cleanedPhotos) !== JSON.stringify(p.pujaPhotos)) {
          p.pujaPhotos = cleanedPhotos;
          changed = true;
        }
      }

      if (Array.isArray(p.pujaVideoClips) && p.pujaVideoClips.length > 0) {
        const cleanedVideos = p.pujaVideoClips.map(cleanUrl);
        if (JSON.stringify(cleanedVideos) !== JSON.stringify(p.pujaVideoClips)) {
          p.pujaVideoClips = cleanedVideos;
          changed = true;
        }
      }

      if (changed) {
        await p.save();
        panditCount++;
      }
    }
    console.log(`✅ Updated ${panditCount} Pandits.\n`);

    // 2. Update Astrologers
    const astrologers = await Astrologer.find({});
    console.log(`Checking ${astrologers.length} Astrologers...`);
    let astrologerCount = 0;
    for (const a of astrologers) {
      let changed = false;
      const newImg = cleanUrl(a.image);
      if (newImg !== a.image) {
        console.log(`  Updating image for Astrologer [${a.name}]: ${a.image} -> ${newImg}`);
        a.image = newImg;
        changed = true;
      }
      if (changed) {
        await a.save();
        astrologerCount++;
      }
    }
    console.log(`✅ Updated ${astrologerCount} Astrologers.\n`);

    // 3. Update Pujas
    const pujas = await Puja.find({});
    console.log(`Checking ${pujas.length} Pujas...`);
    let pujaCount = 0;
    for (const pj of pujas) {
      let changed = false;
      const newImg = cleanUrl(pj.image);
      if (newImg !== pj.image) {
        console.log(`  Updating image for Puja [${pj.pujaName}]: ${pj.image} -> ${newImg}`);
        pj.image = newImg;
        changed = true;
      }
      if (changed) {
        await pj.save();
        pujaCount++;
      }
    }
    console.log(`✅ Updated ${pujaCount} Pujas.\n`);

    // 4. Update Users
    const users = await User.find({});
    console.log(`Checking ${users.length} Users...`);
    let userCount = 0;
    for (const u of users) {
      let changed = false;
      const newImg = cleanUrl(u.profileImage);
      if (newImg !== u.profileImage) {
        console.log(`  Updating profileImage for User [${u.name || u.mobile}]: ${u.profileImage} -> ${newImg}`);
        u.profileImage = newImg;
        changed = true;
      }
      if (changed) {
        await u.save();
        userCount++;
      }
    }
    console.log(`✅ Updated ${userCount} Users.\n`);

    // 5. Update Admins
    const admins = await Admin.find({});
    console.log(`Checking ${admins.length} Admins...`);
    let adminCount = 0;
    for (const ad of admins) {
      let changed = false;
      const newImg = cleanUrl(ad.image);
      if (newImg !== ad.image) {
        ad.image = newImg;
        changed = true;
      }
      if (changed) {
        await ad.save();
        adminCount++;
      }
    }
    console.log(`✅ Updated ${adminCount} Admins.\n`);

    console.log("=========================================");
    console.log("ALL DATABASE URLS UPDATED TO LIVE SERVER!");
    console.log("=========================================");

  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runUpdate();
