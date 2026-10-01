const mongoose = require('mongoose');
require('dotenv').config();
const Pandit = require('./models/Pandit');
const Puja = require('./models/Puja');

function parsePrice(basePriceStr) {
  if (!basePriceStr) return 1500;
  // match first number sequence
  const match = basePriceStr.toString().replace(/,/g, '').match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) || num <= 0 ? 1500 : num;
  }
  return 1500;
}

// Normalized matching helper
function normalize(str) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

async function syncPanditsWithPujas() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const allPujas = await Puja.find({});
    const allPandits = await Pandit.find({});

    console.log(`Found ${allPandits.length} pandits and ${allPujas.length} pujas.`);

    let updatedCount = 0;

    for (const pandit of allPandits) {
      const existingPujaIds = new Set(
        (pandit.selectedPujas || [])
          .filter(sp => sp && sp.puja)
          .map(sp => sp.puja.toString())
      );

      const specs = Array.isArray(pandit.specializations) ? pandit.specializations : [];
      if (pandit.primarySpecialization) specs.push(pandit.primarySpecialization);
      if (pandit.specialization) specs.push(pandit.specialization);

      const matchedPujas = [];

      for (const spec of specs) {
        if (!spec) continue;
        const normSpec = normalize(spec);
        if (!normSpec) continue;

        // Find best match in allPujas
        for (const puja of allPujas) {
          const normPujaName = normalize(puja.pujaName);
          const normPujaType = normalize(puja.pujaType);

          // Check if spec is in pujaName or vice versa, or keyword matches
          const isMatch =
            normPujaName.includes(normSpec) ||
            normSpec.includes(normPujaName) ||
            (normSpec.includes('grihpravesh') && (normPujaName.includes('griha') || normPujaName.includes('grihpravesh'))) ||
            (normSpec.includes('vivah') && normPujaName.includes('vivah')) ||
            (normSpec.includes('rudrabhishek') && normPujaName.includes('rudrabhishek')) ||
            (normSpec.includes('sunderkand') && (normPujaName.includes('hanuman') || normPujaName.includes('sunderkand'))) ||
            (normSpec.includes('satyanarayan') && normPujaName.includes('satyanarayan')) ||
            (normSpec.includes('bhagwat') && (normPujaName.includes('bhagwat') || normPujaName.includes('katha'))) ||
            (normSpec.includes('sanskar') && (normPujaName.includes('sanskar') || normPujaType.includes('sanskar'))) ||
            (normSpec.includes('anushthan') && (normPujaName.includes('anushthan') || normPujaType.includes('anushthan')));

          if (isMatch) {
            const pIdStr = puja._id.toString();
            if (!existingPujaIds.has(pIdStr) && !matchedPujas.some(m => m.puja.toString() === pIdStr)) {
              matchedPujas.push({
                puja: puja._id,
                price: parsePrice(puja.basePrice)
              });
            }
          }
        }
      }

      // If pandit has no specializations or no matches, provide default standard pujas
      if (matchedPujas.length === 0 && (!pandit.selectedPujas || pandit.selectedPujas.length === 0)) {
        // match top 4 common pujas (Satyanarayan, Havan, Griha Pravesh, Rudrabhishek)
        const commonPujas = allPujas.filter(p => {
          const n = normalize(p.pujaName);
          return n.includes('satyanarayan') || n.includes('havan') || n.includes('griha') || n.includes('rudrabhishek');
        });
        commonPujas.forEach(cp => {
          matchedPujas.push({
            puja: cp._id,
            price: parsePrice(cp.basePrice)
          });
        });
      }

      if (matchedPujas.length > 0) {
        pandit.selectedPujas = [
          ...(pandit.selectedPujas || []),
          ...matchedPujas
        ];
        await pandit.save();
        updatedCount++;
        console.log(`Updated Pandit: "${pandit.fullName}" with ${matchedPujas.length} new pujas.`);
      }
    }

    console.log(`\nSUCCESS: Finished mapping! ${updatedCount} pandits were updated with linked pujas and prices.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during sync:', err);
    process.exit(1);
  }
}

syncPanditsWithPujas();
