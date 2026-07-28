const cron = require('node-cron');
const prokeralaService = require('../services/prokerala.service');
const HoroscopeCache = require('../models/HoroscopeCache2');

const validSigns = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const generateMissingFields = (prediction, type) => {
  const colors = ["लाल (Red)", "नीला (Blue)", "हरा (Green)", "पीला (Yellow)", "सफेद (White)", "गुलाबी (Pink)", "काला (Black)"];
  const moods = ["खुश (Happy)", "शांत (Calm)", "ऊर्जावान (Energetic)", "विचारशील (Thoughtful)", "उत्साही (Enthusiastic)"];
  const remedies = ["सूर्य को जल चढ़ाएं।", "हनुमान चालीसा का पाठ करें।", "गाय को रोटी खिलाएं।", "शिवलिंग पर जल चढ़ाएं।", "माथे पर चंदन लगाएं।"];
  
  const seed = (prediction?.length || 0);
  
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

const fetchAndSave = async (sign, type, serviceFn) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already fetched
    const exists = await HoroscopeCache.findOne({ sign, type, date: today });
    if (exists) return;

    const prokeralaData = await serviceFn(sign);
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
      sign,
      type,
      date: today,
      data: formattedData
    });
    console.log(`Cron: Successfully saved ${type} for ${sign}`);
  } catch (error) {
    console.error(`Cron Error: Failed to save ${type} for ${sign}:`, error.message);
  }
};

const runDailyHoroscopeCron = async () => {
  console.log('Cron Job Started: Fetching Horoscopes for all signs...');
  for (const sign of validSigns) {
    await fetchAndSave(sign, 'daily', prokeralaService.getDailyHoroscope);
    await fetchAndSave(sign, 'love', prokeralaService.getLoveHoroscope);
    await fetchAndSave(sign, 'career', prokeralaService.getCareerHoroscope);
    await fetchAndSave(sign, 'health', prokeralaService.getHealthHoroscope);
  }
  console.log('Cron Job Completed: All Horoscopes fetched.');
};

// Runs every day at 12:05 AM
cron.schedule('5 0 * * *', () => {
  runDailyHoroscopeCron();
});

module.exports = runDailyHoroscopeCron;
