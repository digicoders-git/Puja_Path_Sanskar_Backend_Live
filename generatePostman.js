const fs = require('fs');

const collection = {
  info: {
    name: 'PujaPath Sanskar - Complete API Collection',
    description: 'Folder-wise & Role-wise collection with real bodies.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: [
    {
      name: '1. Admin Panel',
      item: [
        {
          name: 'Admin Login',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "email": "admin@gmail.com",\n  "password": "password123"\n}' },
            url: { raw: 'http://localhost:5000/api/admin/login', host: ['localhost'], port: '5000', path: ['api', 'admin', 'login'] }
          }
        },
        {
          name: 'Get Dashboard Stats',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{admin_token}}' }],
            url: { raw: 'http://localhost:5000/api/dashboard', host: ['localhost'], port: '5000', path: ['api', 'dashboard'] }
          }
        }
      ]
    },
    {
      name: '2. User App',
      item: [
        {
          name: 'Send OTP',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "mobileNumber": "9876543210"\n}' },
            url: { raw: 'http://localhost:5000/api/users/send-otp', host: ['localhost'], port: '5000', path: ['api', 'users', 'send-otp'] }
          }
        },
        {
          name: 'Verify OTP',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "mobileNumber": "9876543210",\n  "otp": "1234"\n}' },
            url: { raw: 'http://localhost:5000/api/users/verify-otp', host: ['localhost'], port: '5000', path: ['api', 'users', 'verify-otp'] }
          }
        },
        {
          name: 'Get User Profile',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{user_token}}' }],
            url: { raw: 'http://localhost:5000/api/users/profile', host: ['localhost'], port: '5000', path: ['api', 'users', 'profile'] }
          }
        },
        {
          name: 'Update User Profile',
          request: {
            method: 'PUT',
            header: [{ key: 'Authorization', value: 'Bearer {{user_token}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "name": "Ravi Kumar",\n  "email": "ravi@gmail.com",\n  "dob": "1995-05-15",\n  "gender": "Male"\n}' },
            url: { raw: 'http://localhost:5000/api/users/profile', host: ['localhost'], port: '5000', path: ['api', 'users', 'profile'] }
          }
        },
        {
          name: 'Add Address',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{user_token}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "name": "Ravi",\n  "mobileNumber": "9876543210",\n  "pincode": "226001",\n  "addressLine1": "Gomti Nagar",\n  "city": "Lucknow",\n  "state": "UP",\n  "addressType": "Home"\n}' },
            url: { raw: 'http://localhost:5000/api/addresses', host: ['localhost'], port: '5000', path: ['api', 'addresses'] }
          }
        }
      ]
    },
    {
      name: '3. Pandits',
      item: [
        {
          name: 'Get Active Pandits',
          request: {
            method: 'GET',
            header: [],
            url: { raw: 'http://localhost:5000/api/pandits/active', host: ['localhost'], port: '5000', path: ['api', 'pandits', 'active'] }
          }
        },
        {
          name: 'Pandit Login (Send OTP)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "mobileNumber": "6393638221"\n}' },
            url: { raw: 'http://localhost:5000/api/pandits/send-otp', host: ['localhost'], port: '5000', path: ['api', 'pandits', 'send-otp'] }
          }
        },
        {
          name: 'Pandit Login (Verify OTP)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "mobileNumber": "6393638221",\n  "otp": "1234"\n}' },
            url: { raw: 'http://localhost:5000/api/pandits/verify-otp', host: ['localhost'], port: '5000', path: ['api', 'pandits', 'verify-otp'] }
          }
        },
        {
          name: 'Update Pandit Profile',
          request: {
            method: 'PUT',
            header: [{ key: 'Authorization', value: 'Bearer {{pandit_token}}' }],
            body: { mode: 'raw', raw: '{\n  "experience": "8+ Years",\n  "city": "Lucknow",\n  "languages": ["Hindi", "Sanskrit"]\n}' },
            url: { raw: 'http://localhost:5000/api/pandits/profile', host: ['localhost'], port: '5000', path: ['api', 'pandits', 'profile'] }
          }
        }
      ]
    },
    {
      name: '4. Astrologers',
      item: [
        {
          name: 'Get Active Astrologers',
          request: {
            method: 'GET',
            header: [],
            url: { raw: 'http://localhost:5000/api/astrologers/active', host: ['localhost'], port: '5000', path: ['api', 'astrologers', 'active'] }
          }
        },
        {
          name: 'Astrologer Login (Send OTP)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "mobileNumber": "8888888888"\n}' },
            url: { raw: 'http://localhost:5000/api/astrologers/send-otp', host: ['localhost'], port: '5000', path: ['api', 'astrologers', 'send-otp'] }
          }
        }
      ]
    },
    {
      name: '5. Astrology / Prokerala',
      item: [
        {
          name: 'Daily Horoscope',
          request: {
            method: 'GET',
            header: [],
            url: { raw: 'http://localhost:5000/api/astrology/daily/aries', host: ['localhost'], port: '5000', path: ['api', 'astrology', 'daily', 'aries'] }
          }
        },
        {
          name: 'Get Panchang',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: 'http://localhost:5000/api/astrology/panchang?date=2026-07-28&latitude=26.8467&longitude=80.9462',
              host: ['localhost'], port: '5000', path: ['api', 'astrology', 'panchang'],
              query: [{key: 'date', value: '2026-07-28'}, {key: 'latitude', value: '26.8467'}, {key: 'longitude', value: '80.9462'}]
            }
          }
        },
        {
          name: 'Find Rashi',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "name": "Ravi"\n}' },
            url: { raw: 'http://localhost:5000/api/astrology/find-rashi', host: ['localhost'], port: '5000', path: ['api', 'astrology', 'find-rashi'] }
          }
        }
      ]
    },
    {
      name: '6. Bookings',
      item: [
        {
          name: 'Create Puja Booking',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{user_token}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "pujaId": "60d5ec49c1b...",\n  "date": "2026-08-01",\n  "time": "10:00 AM",\n  "addressId": "60d5ec49c1b...",\n  "totalAmount": 1501,\n  "bookingType": "With Samagri"\n}' },
            url: { raw: 'http://localhost:5000/api/bookings', host: ['localhost'], port: '5000', path: ['api', 'bookings'] }
          }
        },
        {
          name: 'Create Astrologer Consultation',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{user_token}}' }, { key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "astrologerId": "60d5ec49c1b...",\n  "date": "2026-08-01",\n  "timeSlot": "14:00 - 14:15",\n  "planId": "basic",\n  "amount": 151,\n  "consultationType": "Audio Call"\n}' },
            url: { raw: 'http://localhost:5000/api/consultations/book', host: ['localhost'], port: '5000', path: ['api', 'consultations', 'book'] }
          }
        }
      ]
    },
    {
      name: '7. Master Data (Pujas, Offers)',
      item: [
        {
          name: 'Get All Pujas',
          request: {
            method: 'GET',
            header: [],
            url: { raw: 'http://localhost:5000/api/pujas', host: ['localhost'], port: '5000', path: ['api', 'pujas'] }
          }
        },
        {
          name: 'Create Puja (Admin)',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{admin_token}}' }],
            body: { mode: 'formdata', formdata: [
              { key: 'title', value: 'Navgrah Shanti Puja', type: 'text' },
              { key: 'shortDescription', value: 'Peace for 9 planets.', type: 'text' },
              { key: 'duration', value: '2 Hours', type: 'text' },
              { key: 'priceWithSamagri', value: '3100', type: 'text' }
            ]},
            url: { raw: 'http://localhost:5000/api/pujas', host: ['localhost'], port: '5000', path: ['api', 'pujas'] }
          }
        },
        {
          name: 'Get Active Offers',
          request: {
            method: 'GET',
            header: [],
            url: { raw: 'http://localhost:5000/api/offers/active', host: ['localhost'], port: '5000', path: ['api', 'offers', 'active'] }
          }
        }
      ]
    }
  ]
};

fs.writeFileSync('../PujaPath_Organized_Collection.json', JSON.stringify(collection, null, 2));
