const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Astrologer = require('./models/Astrologer');
  const astrologers = await Astrologer.find({});
  
  for (let astrologer of astrologers) {
    if (astrologer.image && astrologer.image.startsWith('data:image')) {
      console.log('Fixing image for:', astrologer.name);
      try {
        const matches = astrologer.image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const type = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const data = Buffer.from(matches[2], 'base64');
          const filename = `${Date.now()}-astrologer.${type}`;
          const filepath = path.join(__dirname, 'uploads', filename);
          
          fs.writeFileSync(filepath, data);
          const newUrl = `https://api.pujapathsanskar.com/uploads/${filename}`;
          
          astrologer.image = newUrl;
          await astrologer.save();
          console.log('Fixed:', newUrl);
        }
      } catch (e) {
        console.error('Error fixing:', e);
      }
    }
  }
  console.log('Done');
  process.exit();
}).catch(console.error);
