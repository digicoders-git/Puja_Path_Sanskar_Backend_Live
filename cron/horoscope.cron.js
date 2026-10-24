const cron = require('node-cron');
const tathaastuService = require('../services/tathaastu.service');

const validSigns = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const runDailyHoroscopeCron = async () => {
  console.log('Cron Job Started: Fetching TathaAstu Horoscopes for all signs...');
  for (const sign of validSigns) {
    try {
      await tathaastuService.getDailyHoroscope(sign);
      console.log(`Cron: Successfully prepared daily horoscope for ${sign}`);
    } catch (err) {
      console.error(`Cron Error: Failed for ${sign}:`, err.message);
    }
  }
  console.log('Cron Job Completed: All TathaAstu Horoscopes fetched.');
};

// Runs every day at 12:05 AM
cron.schedule('5 0 * * *', () => {
  runDailyHoroscopeCron();
});

module.exports = runDailyHoroscopeCron;
