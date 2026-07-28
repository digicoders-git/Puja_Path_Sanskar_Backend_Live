const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const CLIENT_ID = process.env.PROKERALA_CLIENT_ID;
const CLIENT_SECRET = process.env.PROKERALA_CLIENT_SECRET;
const TOKEN_URL = 'https://api.prokerala.com/token';
const BASE_URL = 'https://api.prokerala.com/v2';

let cachedToken = null;
let tokenExpiryTime = null;

const getAccessToken = async () => {
  try {
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
      tokenExpiryTime = Date.now() + (response.data.expires_in * 1000);
      console.log('Prokerala Access Token Generated successfully.');
      return cachedToken;
    } else {
      throw new Error('Failed to retrieve access token from Prokerala');
    }
  } catch (error) {
    console.error('Prokerala Token Generation Error:', error.response?.data || error.message);
    throw new Error('Could not generate Prokerala token');
  }
};

const makeRequest = async (endpoint, params, retry = 1) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': 'hi'
      }
    });
    return response.data;
  } catch (error) {
    if (retry > 0) {
      console.log(`Retrying Prokerala API call: ${endpoint}`);
      // Force token refresh by invalidating cache
      cachedToken = null;
      tokenExpiryTime = null;
      return makeRequest(endpoint, params, retry - 1);
    }
    console.error(`Prokerala API Error (${endpoint}):`, error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || `Failed to fetch from Prokerala API: ${endpoint}`);
  }
};

const getDailyHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/daily', { sign, datetime });
};

const getWeeklyHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/weekly', { sign, datetime });
};

const getMonthlyHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/monthly', { sign, datetime });
};

const getLoveHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/love/daily', { sign, datetime });
};

const getCareerHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/career/daily', { sign, datetime });
};

const getHealthHoroscope = async (sign) => {
  const datetime = new Date().toISOString().split('.')[0] + 'Z';
  return makeRequest('/horoscope/health/daily', { sign, datetime });
};

const getCompatibility = async (sign1, sign2) => {
  return makeRequest('/astrology/zodiac-compatibility', { sign_1: sign1, sign_2: sign2 });
};

module.exports = {
  getAccessToken,
  getDailyHoroscope,
  getWeeklyHoroscope,
  getMonthlyHoroscope,
  getLoveHoroscope,
  getCareerHoroscope,
  getHealthHoroscope,
  getCompatibility
};
