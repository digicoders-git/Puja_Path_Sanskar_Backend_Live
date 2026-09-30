const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixUrls() {
  await mongoose.connect(process.env.MONGO_URI);
  const Puja = require('../models/Puja');
  const pujas = await Puja.find({});
  let count = 0;
  for (const p of pujas) {
    if (p.image && (p.image.includes('\\') || p.image.startsWith('http://') || p.image.startsWith('https://'))) {
      let relativePath = p.image;
      if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        const urlObj = new URL(relativePath);
        relativePath = urlObj.pathname.replace(/^\/+/, '');
      }
      relativePath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
      if (p.image !== relativePath) {
        console.log(`Updating ${p.pujaName}: "${p.image}" -> "${relativePath}"`);
        p.image = relativePath;
        await p.save();
        count++;
      }
    }
  }
  console.log(`Updated ${count} pujas to clean relative paths.`);
  process.exit(0);
}

fixUrls();
