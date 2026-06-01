const mongoose = require('mongoose');
const Pandit = require('./models/Pandit');

const MONGO_URI = "mongodb+srv://digicodersdevelopment_db_user:kzqPem3p4lHWJaVc@pujapathsanskar.xrbfzjv.mongodb.net/pupapathsanskar?appName=pujapathsanskar";

mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connected to MongoDB.");
  
  const pandit = await Pandit.findOne({ "selectedPujas": { $exists: true, $not: {$size: 0} } });
  if (pandit) {
    console.log("Found Pandit:", pandit.fullName);
    console.log("selectedPujas:", JSON.stringify(pandit.selectedPujas, null, 2));
  } else {
    console.log("No pandit with selectedPujas found.");
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
