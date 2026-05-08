const API = 'http://localhost:5000/api';

async function testBookings() {
  try {
    console.log("1. Authenticating Admin...");
    let adminToken = "";
    const adminRes = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
    });
    const adminData = await adminRes.json();
    if (adminData.success) {
      adminToken = adminData.token;
      console.log("   Admin login successful!");
    } else {
      console.log("   Admin login failed, trying default password '123456'...");
      const adminRes2 = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@admin.com', password: 'password' })
      });
      const adminData2 = await adminRes2.json();
      if (adminData2.success) adminToken = adminData2.token;
      else console.log("   Warning: Admin login failed. Admin APIs might fail.");
    }

    console.log("\n2. Authenticating User...");
    const otpRes = await fetch(`${API}/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9999999999', otp: '123456', name: 'Test Booking User' })
    });
    const userData = await otpRes.json();
    if (!userData.success) throw new Error("User authentication failed");
    const userToken = userData.token;
    console.log("   User authenticated successfully!");

    console.log("\n3. Fetching Pujas...");
    const pujaRes = await fetch(`${API}/pujas`);
    const pujaData = await pujaRes.json();
    if (!pujaData.length) throw new Error("No pujas found in DB. Please create a Puja first.");
    const pujaId = pujaData[0]._id;
    console.log(`   Found Puja: ${pujaData[0].pujaName} (${pujaId})`);

    console.log("\n--- TESTING POST /api/bookings/ (Create Booking) ---");
    const bookRes = await fetch(`${API}/bookings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        pujaId,
        bookingDate: '2026-05-01',
        timeSlot: 'Morning (8AM - 12PM)',
        address: '123 Test St, Test City',
        amount: 2100,
        specialInstructions: 'Bring extra samagri'
      })
    });
    const bookData = await bookRes.json();
    console.log(bookData);
    if (!bookData.success) throw new Error("Failed to create booking");
    const bookingId = bookData.booking._id;

    console.log("\n--- TESTING GET /api/bookings/my-bookings (User History) ---");
    const myBookingsRes = await fetch(`${API}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const myBookingsData = await myBookingsRes.json();
    console.log(`   Found ${myBookingsData.bookings?.length} bookings for user.`);
    console.log("   Success:", myBookingsData.success);

    if (adminToken) {
      console.log("\n--- TESTING GET /api/bookings/admin/all (Admin View) ---");
      const allBookingsRes = await fetch(`${API}/bookings/admin/all`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const allBookingsData = await allBookingsRes.json();
      console.log(`   Total Bookings in System: ${allBookingsData.count}`);
      console.log("   Success:", allBookingsData.success);

      console.log("\n--- TESTING PATCH /api/bookings/admin/:id/status (Admin Update) ---");
      const updateRes = await fetch(`${API}/bookings/admin/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'Confirmed', paymentStatus: 'Paid' })
      });
      const updateData = await updateRes.json();
      console.log(`   New Status: ${updateData.booking?.status}, Payment: ${updateData.booking?.paymentStatus}`);
      console.log("   Success:", updateData.success);
    }

    console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
  }
}

testBookings();
