const prokeralaService = require('../services/prokerala.service');
const HoroscopeCache = require('../models/HoroscopeCache2');

const validSigns = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const generateMissingFields = (prediction, type) => {
  // Simple fallback logic to simulate AI generation when an API key isn't provided
  const colors = ["लाल (Red)", "नीला (Blue)", "हरा (Green)", "पीला (Yellow)", "सफेद (White)", "गुलाबी (Pink)", "काला (Black)"];
  const moods = ["खुश (Happy)", "शांत (Calm)", "ऊर्जावान (Energetic)", "विचारशील (Thoughtful)", "उत्साही (Enthusiastic)"];
  const remedies = ["सूर्य को जल चढ़ाएं।", "हनुमान चालीसा का पाठ करें।", "गाय को रोटी खिलाएं।", "शिवलिंग पर जल चढ़ाएं।", "माथे पर चंदन लगाएं।"];
  
  const seed = (prediction.length || 0); // Deterministic based on length
  
  return {
    lucky_number: ((seed % 9) + 1).toString(),
    lucky_color: colors[seed % colors.length],
    lucky_time: `${((seed % 10) + 1)}:00 PM - ${((seed % 10) + 2)}:00 PM`,
    remedy: remedies[seed % remedies.length],
    mood: moods[seed % moods.length],
    finance: "आर्थिक स्थिति सामान्य रहेगी, अनावश्यक खर्चों से बचें।",
    compatibility: "Cancer, Scorpio, Pisces"
  };
};

const handleHoroscopeRequest = async (req, res, type, serviceFn) => {
  const { sign } = req.params;

  if (!validSigns.includes(sign.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Invalid zodiac sign' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const cached = await HoroscopeCache.findOne({ sign: sign.toLowerCase(), type, date: today });
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Success',
        source: 'cache',
        data: cached.data
      });
    }

    const prokeralaData = await serviceFn(sign.toLowerCase());
    const rawPrediction = prokeralaData?.data?.daily_prediction?.prediction 
                          || prokeralaData?.data?.prediction 
                          || prokeralaData?.data?.horoscope?.prediction 
                          || 'Prediction unavailable.';

    const aiFields = generateMissingFields(rawPrediction, type);

    const formattedData = {
      overall: rawPrediction,
      love: prokeralaData?.data?.daily_prediction?.love_prediction || 'प्रेम जीवन सुखमय रहेगा।',
      career: prokeralaData?.data?.daily_prediction?.career_prediction || 'कार्यक्षेत्र में सफलता मिलेगी।',
      health: prokeralaData?.data?.daily_prediction?.health_prediction || 'स्वास्थ्य उत्तम रहेगा।',
      finance: aiFields.finance,
      lucky_number: aiFields.lucky_number,
      lucky_color: aiFields.lucky_color,
      lucky_time: aiFields.lucky_time,
      remedy: aiFields.remedy,
      mood: aiFields.mood,
      compatibility: aiFields.compatibility
    };

    await HoroscopeCache.create({
      sign: sign.toLowerCase(),
      type,
      date: today,
      data: formattedData
    });

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: formattedData
    });

  } catch (error) {
    console.error(`Horoscope Controller Error [${type}]:`, error.message);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

exports.getDaily = (req, res) => handleHoroscopeRequest(req, res, 'daily', prokeralaService.getDailyHoroscope);
exports.getWeekly = (req, res) => handleHoroscopeRequest(req, res, 'weekly', prokeralaService.getWeeklyHoroscope);
exports.getMonthly = (req, res) => handleHoroscopeRequest(req, res, 'monthly', prokeralaService.getMonthlyHoroscope);
exports.getLove = (req, res) => handleHoroscopeRequest(req, res, 'love', prokeralaService.getLoveHoroscope);
exports.getCareer = (req, res) => handleHoroscopeRequest(req, res, 'career', prokeralaService.getCareerHoroscope);
exports.getHealth = (req, res) => handleHoroscopeRequest(req, res, 'health', prokeralaService.getHealthHoroscope);

exports.getCompatibility = async (req, res) => {
  const { sign1, sign2 } = req.query;

  if (!sign1 || !sign2 || !validSigns.includes(sign1.toLowerCase()) || !validSigns.includes(sign2.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Invalid or missing zodiac signs in query' });
  }

  try {
    const prokeralaData = await prokeralaService.getCompatibility(sign1.toLowerCase(), sign2.toLowerCase());
    
    return res.status(200).json({
      success: true,
      message: 'Success',
      data: prokeralaData?.data || prokeralaData
    });

  } catch (error) {
    console.error(`Compatibility Controller Error:`, error.message);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

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
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
