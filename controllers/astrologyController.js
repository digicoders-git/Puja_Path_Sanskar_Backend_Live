const tathaastuService = require('../services/tathaastu.service');
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
  let foundRashiKey = 'leo';
  let firstLetter = 'म';

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
    const result = await tathaastuService.getDailyHoroscope(sign);
    const d = result.data || {};
    return res.status(200).json({
      success: true,
      source: result.source || 'tathaastu-vedic',
      data: {
        date: new Date().toISOString().split('T')[0],
        description: d.overall || 'आज का दिन शुभ रहेगा।',
        positive: 'सकारात्मक सोचें और बड़ों का आशीर्वाद लें।',
        negative: 'अनावश्यक वाद-विवाद से बचें।',
        career: d.career || 'कार्यक्षेत्र में उन्नति होगी।',
        love: d.love || 'परिवार व साथी का सहयोग मिलेगा।',
        health: d.health || 'स्वास्थ्य उत्तम रहेगा।',
        luckyColor: d.lucky_color || 'पीला',
        luckyNumber: [parseInt(d.lucky_number) || 7]
      }
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
    const daily = await tathaastuService.getDailyHoroscope(sign);
    const d = daily.data || {};
    return res.status(200).json({
      success: true,
      source: 'tathaastu-vedic',
      data: {
        sign,
        date: today,
        card: 'The Wheel of Fortune (भाग्य चक्र)',
        reading: d.overall,
        guidance: d.remedy,
        luckyNumber: d.lucky_number
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Panchang
 * GET /api/astrology/panchang
 */
exports.getPanchang = async (req, res) => {
  try {
    const panchangData = await tathaastuService.getLivePanchangToday();
    return res.status(200).json({
      success: true,
      source: 'tathaastu-api',
      data: panchangData
    });
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

    const result = await tathaastuService.getKundli({
      name,
      gender,
      dob,
      tob,
      latitude,
      longitude,
      timezone
    });

    const data = result.data;

    await KundliCache.create({
      cacheKey,
      data
    });

    return res.status(200).json({ success: true, source: result.source, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
