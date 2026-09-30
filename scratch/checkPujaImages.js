const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkPujas() {
  await mongoose.connect(process.env.MONGO_URI);
  const Puja = require('../models/Puja');
  const pujas = await Puja.find({});
  console.log(`Total pujas: ${pujas.length}`);
  pujas.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.pujaName}] (${p.pujaType}) -> image: "${p.image}"`);
  });
  process.exit(0);
}

checkPujas();
