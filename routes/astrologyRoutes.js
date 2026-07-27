const express = require('express');
const router = express.Router();
const astrologyController = require('../controllers/astrologyController');
const { body, query } = require('express-validator');

// Validation middlewares
const findRashiValidation = [
  body('name').notEmpty().withMessage('Name is required')
];

const panchangValidation = [
  query('date').notEmpty().withMessage('Date is required (YYYY-MM-DD)'),
  query('latitude').isNumeric().withMessage('Latitude must be numeric'),
  query('longitude').isNumeric().withMessage('Longitude must be numeric')
];

const kundliValidation = [
  query('name').notEmpty().withMessage('Name is required'),
  query('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  query('dob').notEmpty().withMessage('Date of birth is required (YYYY-MM-DD)'),
  query('tob').notEmpty().withMessage('Time of birth is required (HH:MM:SS)'),
  query('latitude').isNumeric().withMessage('Latitude must be numeric'),
  query('longitude').isNumeric().withMessage('Longitude must be numeric')
];

// Routes
router.post('/find-rashi', findRashiValidation, astrologyController.findRashi);
router.get('/daily/:sign', astrologyController.getDailyHoroscope);
router.get('/tarot/:sign', astrologyController.getDailyTarot);
router.get('/panchang', panchangValidation, astrologyController.getPanchang);
router.get('/kundli', kundliValidation, astrologyController.getKundli);

module.exports = router;
