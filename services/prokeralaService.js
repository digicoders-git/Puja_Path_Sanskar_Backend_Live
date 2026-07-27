const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Prokerala API Service
 * Handles OAuth2 Token Generation, Caching, and API requests.
 */

const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;
const TOKEN_URL = 'https://api.prokerala.com/token';
const BASE_URL = 'https://api.prokerala.com/v2';

// In-memory token cache
let cachedToken = null;
let tokenExpiryTime = null;

/**
 * Automatically fetch or refresh the Prokerala Access Token
 * @returns {String} Access Token
 */
const getAccessToken = async () => {
  try {
    // Return cached token if valid (with 60-second buffer)
    if (cachedToken && tokenExpiryTime && Date.now() < (tokenExpiryTime - 60000)) {
      return cachedToken;
    }

    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    const response = await axios.post(TOKEN_URL, data.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      // expires_in is in seconds
      const expiresIn = response.data.expires_in * 1000;
      tokenExpiryTime = Date.now() + expiresIn;
      console.log('Successfully generated new Prokerala Access Token');
      return cachedToken;
    } else {
      throw new Error('Failed to retrieve access token from Prokerala');
    }
  } catch (error) {
    console.error('Prokerala Token Generation Error:', error.response?.data || error.message);
    throw new Error('Could not generate Prokerala token');
  }
};

/**
 * Fetch Daily Horoscope
 * @param {String} sign Zodiac sign
 * @param {String} datetime ISO datetime or date
 * @returns {Object} Horoscope data
 */
const fetchDailyHoroscope = async (sign, datetime = new Date().toISOString().split('.')[0] + 'Z') => {
  const token = await getAccessToken();
  try {
    const response = await axios.get(`${BASE_URL}/horoscope/daily`, {
      params: { sign, datetime },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Prokerala API Error (Horoscope):', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to fetch horoscope from Prokerala');
  }
};

/**
 * Fetch Daily Tarot
 * @param {String} sign Zodiac sign
 * @returns {Object} Tarot data
 */
const fetchDailyTarot = async (sign) => {
  const token = await getAccessToken();
  try {
    const response = await axios.get(`${BASE_URL}/tarot/daily`, {
      params: { sign },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Prokerala API Error (Tarot):', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to fetch tarot from Prokerala');
  }
};

/**
 * Fetch Panchang
 * @param {String} datetime ISO datetime
 * @param {Number} coordinates Coordinates "lat,lon"
 * @param {String} ayanamsa Ayanamsa (default: 1)
 * @returns {Object} Panchang data
 */
const fetchPanchang = async (datetime, coordinates, ayanamsa = 1) => {
  const token = await getAccessToken();
  try {
    const response = await axios.get(`${BASE_URL}/astrology/panchang/advanced`, {
      params: { datetime, coordinates, ayanamsa },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Prokerala API Error (Panchang):', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to fetch panchang from Prokerala');
  }
};

/**
 * Fetch Kundli
 * @param {String} datetime ISO datetime
 * @param {String} coordinates Coordinates "lat,lon"
 * @param {String} ayanamsa Ayanamsa (default: 1)
 * @returns {Object} Kundli data
 */
const fetchKundli = async (datetime, coordinates, ayanamsa = 1) => {
  const token = await getAccessToken();
  try {
    const response = await axios.get(`${BASE_URL}/astrology/kundli/advanced`, {
      params: { datetime, coordinates, ayanamsa },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Prokerala API Error (Kundli):', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to fetch kundli from Prokerala');
  }
};

module.exports = {
  getAccessToken,
  fetchDailyHoroscope,
  fetchDailyTarot,
  fetchPanchang,
  fetchKundli
};
