require('dotenv').config();
const mongoose = require('mongoose');
const Pandit = require('./models/Pandit');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const allPandits = await Pandit.find({});
    console.log('Total pandits:', allPandits.length);
    const activePandits = await Pandit.find({ isActive: true });
    console.log('Active pandits:', activePandits.length);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
