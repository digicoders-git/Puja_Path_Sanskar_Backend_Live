const fs = require('fs');

async function test() {
  try {
    const formData = new FormData();
    formData.append("fullName", "Ram Sharma");
    formData.append("mobileNumber", "9876543210");
    formData.append("emailId", "ram123@example.com");
    formData.append("dob", "1980-01-01");
    formData.append("gender", "Male");
    formData.append("currentAddress", "Delhi");
    formData.append("permanentAddress", "Delhi");
    formData.append("city", "Delhi");
    formData.append("pincode", "110001");
    formData.append("aadharNumber", "123456789012");
    formData.append("totalExperience", 10);
    formData.append("trainingGurukul", "Varanasi Gurukul");
    formData.append("specialization", "Vivah Expert");
    formData.append("vedaSpecialization", "Rigveda");
    formData.append("languagesKnown", "Hindi, Sanskrit");
    formData.append("basicPujaCharges", 1100);
    formData.append("akhandPaathCharges", 5100);
    formData.append("perDayCharges", 2100);
    formData.append("travelCharges", "Included in Puja");
    formData.append("availableCities", "Delhi NCR");
    formData.append("maxDistance", 50);
    formData.append("upiId", "ram@upi");
    formData.append("bankDetails", "SBI 12345");
    formData.append("referenceName", "Shyam");
    formData.append("referenceContact", "9998887776");
    formData.append("declaration", "true");

    const response = await fetch("http://localhost:5000/api/pandits/", {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
