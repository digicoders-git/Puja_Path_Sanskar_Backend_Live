require("dotenv").config();
const omixoService = require("../services/omixoService");

async function runTest() {
  console.log("==========================================");
  console.log("       OMIXO.AI CALL MASKING TEST        ");
  console.log("==========================================\n");

  console.log("1. Checking Configuration...");
  const isConfigured = omixoService.isConfigured();
  console.log(`   - OMIXO_API_KEY Configured: ${isConfigured ? "✅ YES" : "❌ NO"}`);
  console.log(`   - OMIXO_BASE_URL: ${process.env.OMIXO_BASE_URL || "https://api.omixo.ai/api/v1"}`);
  console.log(`   - OMIXO_CALLER_ID: ${process.env.OMIXO_CALLER_ID || "Not set"}\n`);

  if (!isConfigured) {
    console.error("❌ OMIXO_API_KEY .env me missing hai!");
    process.exit(1);
  }

  // Numbers passed from command line args: node scripts/test_omixo_call.js 9876543210 9123456780
  const args = process.argv.slice(2);
  const userPhone = args[0];
  const panditPhone = args[1];

  if (!userPhone || !panditPhone) {
    console.log("ℹ️  Usage format:");
    console.log("   node scripts/test_omixo_call.js <USER_NUMBER> <PANDIT_NUMBER>\n");
    console.log("Example:");
    console.log("   node scripts/test_omixo_call.js 9844200377 9565990444\n");
    return;
  }

  console.log("2. Initiating Click-to-Call Bridge...");
  console.log(`   - User Phone (Rings First): ${userPhone} (Masked: ${omixoService.maskPhoneNumber(userPhone)})`);
  console.log(`   - Pandit Phone (Destination): ${panditPhone} (Masked: ${omixoService.maskPhoneNumber(panditPhone)})`);
  console.log(`   - Virtual Caller ID (What User/Pandit sees): ${process.env.OMIXO_CALLER_ID}\n`);

  try {
    const result = await omixoService.initiateClickToCall({
      userPhone,
      panditPhone,
    });

    console.log("✅ Call Successfully Initiated!");
    console.log("   - Call SID / Session ID:", result.callSid);
    console.log("   - Response from Omixo:", JSON.stringify(result.rawResponse, null, 2));
    console.log("\n📞 Ab User ke phone par call aayegi. Uthane par Pandit ji se connect ho jayegi!");
  } catch (error) {
    console.error("\n❌ Call Error:", error.message);
  }
}

runTest();

