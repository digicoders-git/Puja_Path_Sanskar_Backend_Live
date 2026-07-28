const express = require('express');
const router = express.Router();
const horoscopeController = require('../controllers/horoscope.controller');

router.get('/daily/:sign', horoscopeController.getDaily);
router.get('/weekly/:sign', horoscopeController.getWeekly);
router.get('/monthly/:sign', horoscopeController.getMonthly);
router.get('/love/:sign', horoscopeController.getLove);
router.get('/career/:sign', horoscopeController.getCareer);
router.get('/health/:sign', horoscopeController.getHealth);
router.get('/compatibility', horoscopeController.getCompatibility);

module.exports = router;
