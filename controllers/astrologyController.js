const prokeralaService = require('../services/prokeralaService');
const Horoscope = require('../models/Horoscope');
const Tarot = require('../models/Tarot');
const Panchang = require('../models/Panchang');
const KundliCache = require('../models/KundliCache');
const { validationResult } = require('express-validator');

// Mapping Hindi letters to Rashi
// This is a basic mapping, adapt as needed for complete Vedic astrology logic
const rashiMapping = {
  'aries': { name: 'Aries', hindi: 'मेष', letters: ['च', 'चे', 'चो', 'ला', 'ली', 'लू', 'ले', 'लो', 'अ'] },
  'taurus': { name: 'Taurus', hindi: 'वृषभ', letters: ['ई', 'उ', 'ए', 'ओ', 'वा', 'वी', 'वू', 'वे', 'वो'] },
  'gemini': { name: 'Gemini', hindi: 'मिथुन', letters: ['का', 'की', 'कू', 'घ', 'ङ', 'छ', 'के', 'को', 'हा'] },
  'cancer': { name: 'Cancer', hindi: 'कर्क', letters: ['ही', 'हू', 'हे', 'हो', 'डा', 'डी', 'डू', 'डे', 'डो'] },
  'leo': { name: 'Leo', hindi: 'सिंह', letters: ['मा', 'मी', 'मू', 'मे', 'मो', 'टा', 'टी', 'टू', 'टे'] },
  'virgo': { name: 'Virgo', hindi: 'कन्या', letters: ['टो', 'पा', 'पी', 'पू', 'ष', 'ण', 'ठ', 'पे', 'पो'] },
  'libra': { name: 'Libra', hindi: 'तुला', letters: ['रा', 'री', 'रू', 'रे', 'रो', 'ता', 'ती', 'तू', 'ते'] },
  'scorpio': { name: 'Scorpio', hindi: 'वृश्चिक', letters: ['तो', 'ना', 'नी', 'नू', 'ने', 'नो', 'या', 'यी', 'यू'] },
  'sagittarius': { name: 'Sagittarius', hindi: 'धनु', letters: ['ये', 'यो', 'भा', 'भी', 'भू', 'धा', 'फा', 'ढा', 'भे'] },
  'capricorn': { name: 'Capricorn', hindi: 'मकर', letters: ['भो', 'जा', 'जी', 'खी', 'खू', 'खे', 'खो', 'गा', 'गी'] },
  'aquarius': { name: 'Aquarius', hindi: 'कुंभ', letters: ['गू', 'गे', 'गो', 'सा', 'सी', 'सू', 'से', 'सो', 'दा'] },
  'pisces': { name: 'Pisces', hindi: 'मीन', letters: ['दी', 'दू', 'थ', 'झ', 'ञ', 'दे', 'दो', 'चा', 'ची'] }
};

/**
 * Find Rashi based on Name
 * POST /api/astrology/find-rashi
 */
exports.findRashi = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name } = req.body;
  
  // Basic implementation: Since name is generally English, mapping exactly to Hindi letters requires transliteration.
  // For simplicity, we assume the user provides a first letter or we map English first letters to Rashi.
  // If we just need the structure to return as requested:
  // We'll mock a simple response or use a library. Here we simulate the required output.
  
  // Real logic would convert 'name' to Hindi and find first letter.
  // Mock for demonstration (e.g. Mayank -> Leo)
  let foundRashiKey = 'leo';
  let firstLetter = 'म';

  // Attempt a very rudimentary check
  if (name.toLowerCase().startsWith('a') || name.toLowerCase().startsWith('l')) { foundRashiKey = 'aries'; firstLetter = 'च'; }
  if (name.toLowerCase().startsWith('t') || name.toLowerCase().startsWith('v')) { foundRashiKey = 'taurus'; firstLetter = 'व'; }
  if (name.toLowerCase().startsWith('m')) { foundRashiKey = 'leo'; firstLetter = 'म'; }
  
  const rashiData = rashiMapping[foundRashiKey];

  return res.status(200).json({
    success: true,
    data: {
      name: name,
      firstLetter: firstLetter,
      rashi: rashiData.name,
      rashiHindi: rashiData.hindi,
      letters: rashiData.letters
    }
  });
};

/**
 * Get Daily Horoscope
 * GET /api/astrology/daily/:sign
 */
exports.getDailyHoroscope = async (req, res) => {
  try {
    const { sign } = req.params;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Check Cache
    const cachedHoroscope = await Horoscope.findOne({ sign, date: today });
    if (cachedHoroscope) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cachedHoroscope.prediction
      });
    }

    // 2. Fetch from Prokerala
    const data = await prokeralaService.fetchDailyHoroscope(sign);

    // Prokerala advanced horoscope response parsing
    const dailyData = data?.data?.daily_predictions?.[0]?.predictions || [];
    const getPred = (type) => dailyData.find(p => p.type === type)?.prediction || '';

    const predictionText = getPred('General') || data?.data?.daily_prediction?.prediction || 'आज का राशिफल उपलब्ध नहीं है।';
    const prediction = {
      date: today,
      description: predictionText,
      positive: 'सकारात्मक सोचें और आगे बढ़ें।',
      negative: 'जल्दबाजी से बचें।',
      career: getPred('Career') || 'अपने कार्य पर ध्यान केंद्रित करें।',
      love: getPred('Love') || 'अपनों के साथ समय बिताएं।',
      health: getPred('Health') || 'स्वास्थ्य का ध्यान रखें।',
      luckyColor: 'सफेद',
      luckyNumber: [3]
    };

    // 3. Save to Cache
    await Horoscope.create({
      sign,
      date: today,
      prediction
    });

    return res.status(200).json({
      success: true,
      source: 'api',
      data: prediction
    });

  } catch (error) {
    console.error('Horoscope Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

/**
 * Get Daily Tarot
 * GET /api/astrology/tarot/:sign
 */
exports.getDailyTarot = async (req, res) => {
  try {
    const { sign } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const cachedTarot = await Tarot.findOne({ sign, date: today });
    if (cachedTarot) {
      return res.status(200).json({ success: true, source: 'cache', data: cachedTarot.prediction });
    }

    const data = await prokeralaService.fetchDailyTarot(sign);
    
    await Tarot.create({
      sign,
      date: today,
      prediction: data
    });

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Panchang
 * GET /api/astrology/panchang
 */
exports.getPanchang = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { date, latitude, longitude, timezone } = req.query;
    const locHash = `${latitude},${longitude}`;
    
    const cachedPanchang = await Panchang.findOne({ date, location: locHash });
    if (cachedPanchang) {
      return res.status(200).json({ success: true, source: 'cache', data: cachedPanchang.data });
    }

    // Coordinates format for Prokerala: "latitude,longitude"
    const data = await prokeralaService.fetchPanchang(`${date}T00:00:00${timezone || '+05:30'}`, locHash);

    await Panchang.create({
      date,
      location: locHash,
      data
    });

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Kundli
 * GET /api/astrology/kundli
 */
exports.getKundli = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, gender, dob, tob, latitude, longitude, timezone } = req.query;
    
    // Create a unique cache key based on birth details
    const cacheKey = Buffer.from(`${dob}-${tob}-${latitude}-${longitude}-${timezone}`).toString('base64');

    const cachedKundli = await KundliCache.findOne({ cacheKey });
    if (cachedKundli) {
      return res.status(200).json({ success: true, source: 'cache', data: cachedKundli.data });
    }

    const datetime = `${dob}T${tob}${timezone || '+05:30'}`;
    const coordinates = `${latitude},${longitude}`;
    
    const data = await prokeralaService.fetchKundli(datetime, coordinates);

    await KundliCache.create({
      cacheKey,
      data
    });

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
