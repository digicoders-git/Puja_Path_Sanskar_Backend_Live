const mongoose = require('mongoose');

const HoroscopeCache2Schema = new mongoose.Schema({
  sign: {
    type: String,
    required: true,
    enum: [
      'aries', 'taurus', 'gemini', 'cancer',
      'leo', 'virgo', 'libra', 'scorpio',
      'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ]
  },
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'love', 'career', 'health', 'compatibility']
  },
  date: {
    type: String,
    required: true // e.g. "2023-10-25" or "2023-W43"
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // automatically remove documents after 30 days
  }
});

// Compound index to quickly find a cached horoscope
HoroscopeCache2Schema.index({ sign: 1, type: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HoroscopeCache2', HoroscopeCache2Schema);
