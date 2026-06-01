const mongoose = require('mongoose');
const Pandit = require('./models/Pandit');
const User = require('./models/User');

const MONGO_URI = "mongodb+srv://digicodersdevelopment_db_user:kzqPem3p4lHWJaVc@pujapathsanskar.xrbfzjv.mongodb.net/pupapathsanskar?appName=pujapathsanskar";

mongoose.connect(MONGO_URI).then(async () => {
  console.log("Connected to MongoDB.");

  const pandits = await Pandit.find();
  if (pandits.length > 0) {
    const pandit = pandits[0];
    let user = await User.findOne();
    
    if (!user) {
      user = await User.create({ name: "Demo User", mobile: "9999999999" });
    }

    const reviews = [
      {
        user: user._id,
        rating: 5,
        comment: "Excellent pandit ji, very knowledgeable and arrived on time.",
      },
      {
        user: user._id,
        rating: 4,
        comment: "Good experience, all rituals were performed nicely.",
      }
    ];

    if (!pandit.reviews) pandit.reviews = [];
    pandit.reviews.push(...reviews);

    const totalReviews = pandit.reviews.length;
    const avg = pandit.reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews;
    pandit.averageRating = parseFloat(avg.toFixed(1));
    pandit.totalReviews = totalReviews;

    await pandit.save();
    console.log(`Added ${reviews.length} reviews to Pandit: ${pandit.fullName}`);
  } else {
    console.log("No pandit found to seed reviews.");
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
