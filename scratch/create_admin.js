const axios = require('axios');
const FormData = require('form-data');

async function createAdmin() {
    const form = new FormData();
    form.append('name', 'Admin');
    form.append('email', 'admin@pujapath.com');
    form.append('password', 'admin123');

    try {
        const response = await axios.post('http://localhost:5000/api/admin/register', form, {
            headers: form.getHeaders()
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

createAdmin();
