const API = 'http://localhost:5000/api';

async function testInterest() {
  try {
    console.log("1. Authenticating User to get Token...");
    const otpRes = await fetch(`${API}/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9999999999', otp: '123456', name: 'Ramesh (Interest Test)' })
    });
    const userData = await otpRes.json();
    if (!userData.success) throw new Error("User authentication failed");
    const userToken = userData.token;
    console.log("   User authenticated successfully!");

    console.log("\n2. Fetching Pujas to get an ID...");
    const pujaRes = await fetch(`${API}/pujas`);
    const pujaData = await pujaRes.json();
    if (!pujaData.length) throw new Error("No pujas found in DB. Please create a Puja first.");
    const pujaId = pujaData[0]._id;
    console.log(`   Found Puja: ${pujaData[0].pujaName} (${pujaId})`);

    console.log("\n3. --- TESTING POST /api/interests/ (Submit Interest as User) ---");
    const interestRes = await fetch(`${API}/interests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        pujaId,
        message: 'Pandit ji se baat karni hai muhurat ke liye' // Only sending pujaId and message!
      })
    });
    const interestData = await interestRes.json();
    console.log("   API Response:", interestData);

    if (interestData.success) {
        console.log(`\n✅ Interest Created Successfully! Notice that Name (${interestData.interest.name}) and Mobile (${interestData.interest.mobile}) were automatically picked from the Database!`);
    } else {
        throw new Error("Failed to create interest");
    }

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
  }
}

testInterest();
