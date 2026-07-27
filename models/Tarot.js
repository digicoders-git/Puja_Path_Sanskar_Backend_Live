const mongoose = require('mongoose');

/**
 * Tarot Model
 * Used to cache daily tarot predictions from Prokerala API for 24 hours.
 */
const tarotSchema = new mongoose.Schema({
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
    type: Object, // Stores the tarot prediction data
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL index: 24 hours
  }
});

tarotSchema.index({ sign: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Tarot', tarotSchema);
