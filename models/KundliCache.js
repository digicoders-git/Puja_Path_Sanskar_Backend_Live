const mongoose = require('mongoose');

/**
 * KundliCache Model
 * Caches generated kundli based on user details to prevent duplicate heavy API calls.
 */
const kundliCacheSchema = new mongoose.Schema({
  cacheKey: {
    type: String, // A hash or concatenated string of dob+tob+lat+lon
    required: true,
    unique: true
  },
  data: {
    type: Object, // The generated Kundli report
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Cache Kundli for 30 days (it doesn't change often)
  }
});

module.exports = mongoose.model('KundliCache', kundliCacheSchema);
