const mongoose = require('mongoose');
require('dotenv').config();
const Pandit = require('./models/Pandit');
const Puja = require('./models/Puja');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const pandits = await Pandit.find({}, 'fullName specializations selectedPujas basicPujaCharges');
    const pujas = await Puja.find({}, 'pujaName basePrice');
    
    console.log('Total Pandits in DB:', pandits.length);
    console.log('Total Pujas in DB:', pujas.length);

    let withSelectedPujas = 0;
    pandits.forEach(p => {
      if (p.selectedPujas && p.selectedPujas.length > 0) withSelectedPujas++;
    });
    console.log('Pandits with selectedPujas:', withSelectedPujas);
    console.log('Pandits without selectedPujas:', pandits.length - withSelectedPujas);

    console.log('\n--- First 5 Pandits & their Specializations / Pujas ---');
    pandits.slice(0, 5).forEach(p => {
      console.log(`\nPandit: ${p.fullName} (ID: ${p._id})`);
      console.log(`Specializations:`, p.specializations);
      console.log(`Selected Pujas Count:`, p.selectedPujas ? p.selectedPujas.length : 0);
    });

    console.log('\n--- All Available Pujas in System ---');
    pujas.forEach(pj => {
      console.log(`Puja: "${pj.pujaName}" | BasePrice: ${pj.basePrice} | ID: ${pj._id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
