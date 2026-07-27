const mongoose = require('mongoose');

/**
 * Horoscope Model
 * Used to cache daily horoscopes from Prokerala API for 24 hours.
 */
const horoscopeSchema = new mongoose.Schema({
  sign: {
    type: String,
    required: true,
    enum: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
  },
  date: {
    type: String, // Storing as YYYY-MM-DD
    required: true
  },
  prediction: {
    type: Object, // Stores the complete daily prediction object
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours (86400 seconds)
  }
});

// Ensure unique cache per sign per day
horoscopeSchema.index({ sign: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Horoscope', horoscopeSchema);
