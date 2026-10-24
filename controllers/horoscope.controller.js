const tathaastuService = require('../services/tathaastu.service');
const HoroscopeCache = require('../models/HoroscopeCache2');

const validSigns = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

/**
 * Daily Horoscope (100% TathaAstu Panchang & Vedic rules)
 * GET /api/horoscope/daily/:sign
 */
exports.getDaily = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();

  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }

  try {
    const result = await tathaastuService.getDailyHoroscope(cleanSign);
    return res.status(200).json({
      success: true,
      message: 'Success',
      source: result.source || 'tathaastu-vedic',
      data: result.data
    });
  } catch (error) {
    console.error(`Horoscope getDaily Error:`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch daily horoscope' });
  }
};

/**
 * Weekly Horoscope (TathaAstu Vedic)
 * GET /api/horoscope/weekly/:sign
 */
exports.getWeekly = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();

  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }

  try {
    const result = await tathaastuService.getWeeklyHoroscope(cleanSign);
    return res.status(200).json({
      success: true,
      message: 'Success',
      source: result.source,
      data: result.data
    });
  } catch (error) {
    console.error(`Horoscope getWeekly Error:`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch weekly horoscope' });
  }
};

/**
 * Monthly Horoscope (TathaAstu Vedic)
 * GET /api/horoscope/monthly/:sign
 */
exports.getMonthly = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();

  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }

  try {
    const result = await tathaastuService.getMonthlyHoroscope(cleanSign);
    return res.status(200).json({
      success: true,
      message: 'Success',
      source: result.source,
      data: result.data
    });
  } catch (error) {
    console.error(`Horoscope getMonthly Error:`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly horoscope' });
  }
};

/**
 * Love Horoscope
 * GET /api/horoscope/love/:sign
 */
exports.getLove = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();
  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }
  try {
    const result = await tathaastuService.getCategoryHoroscope(cleanSign, 'love');
    return res.status(200).json({ success: true, message: 'Success', data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Career Horoscope
 * GET /api/horoscope/career/:sign
 */
exports.getCareer = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();
  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }
  try {
    const result = await tathaastuService.getCategoryHoroscope(cleanSign, 'career');
    return res.status(200).json({ success: true, message: 'Success', data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Health Horoscope
 * GET /api/horoscope/health/:sign
 */
exports.getHealth = async (req, res) => {
  const { sign } = req.params;
  const cleanSign = (sign || '').toLowerCase().trim();
  if (!validSigns.includes(cleanSign)) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }
  try {
    const result = await tathaastuService.getCategoryHoroscope(cleanSign, 'health');
    return res.status(200).json({ success: true, message: 'Success', data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Vedic Compatibility (Guna Milan)
 * GET /api/horoscope/compatibility?sign1=...&sign2=...
 */
exports.getCompatibility = async (req, res) => {
  const { sign1, sign2 } = req.query;

  if (!sign1 || !sign2 || !validSigns.includes(sign1.toLowerCase()) || !validSigns.includes(sign2.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Invalid or missing zodiac signs in query' });
  }

  try {
    const result = await tathaastuService.getCompatibility(sign1.toLowerCase(), sign2.toLowerCase());
    return res.status(200).json({
      success: true,
      message: 'Success',
      data: result.data
    });
  } catch (error) {
    console.error(`Compatibility Controller Error:`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to calculate compatibility' });
  }
};

/**
 * Get Today's Horoscope for All Signs
 * GET /api/horoscope/today-all
 */
exports.getTodayAll = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await HoroscopeCache.find({ type: 'daily', date: today });
    return res.status(200).json({
      success: true,
      message: 'Success',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch horoscopes' });
  }
};
