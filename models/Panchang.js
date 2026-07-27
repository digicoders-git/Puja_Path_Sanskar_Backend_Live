const mongoose = require('mongoose');

/**
 * Panchang Model
 * Caches daily Panchang by date and location (latitude/longitude combined hash or just stringified).
 */
const panchangSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  location: {
    type: String, // e.g. "lat,lon" to distinct locations if needed
    required: true
  },
  data: {
    type: Object, // The panchang details
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL index: 24 hours
  }
});

panchangSchema.index({ date: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('Panchang', panchangSchema);
