require('dotenv').config();
const mongoose = require('mongoose');
const Pandit = require('./models/Pandit');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const pandits = await Pandit.find({}).select('fullName profilePhoto idProof');
    pandits.forEach(p => {
      console.log(`[${p.fullName}]: profilePhoto -> "${p.profilePhoto}" | idProof -> "${p.idProof}"`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
