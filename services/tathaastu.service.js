const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const HoroscopeCache = require('../models/HoroscopeCache2');

const TATHAASTU_API_KEY = process.env.TATHAASTU_API_KEY;
const TATHAASTU_BASE_URL = process.env.TATHAASTU_BASE_URL || 'https://api.tathaastuapi.com/v1';

// In-memory cache for today's live panchang & timings
let cachedPanchangDate = null;
let cachedPanchangData = null;

const rashiMeta = {
  aries: { hindi: 'मेष', lord: 'मंगल', element: 'अग्नि', color: 'लाल (Red)', luckyNums: [9, 1, 3] },
  taurus: { hindi: 'वृषभ', lord: 'शुक्र', element: 'पृथ्वी', color: 'सफेद व हरा', luckyNums: [6, 2, 7] },
  gemini: { hindi: 'मिथुन', lord: 'बुध', element: 'वायु', color: 'हरा व पीला', luckyNums: [5, 3, 8] },
  cancer: { hindi: 'कर्क', lord: 'चंद्र', element: 'जल', color: 'सफेद व क्रीम', luckyNums: [2, 4, 7] },
  leo: { hindi: 'सिंह', lord: 'सूर्य', element: 'अग्नि', color: 'सुनहरा व नारंगी', luckyNums: [1, 9, 5] },
  virgo: { hindi: 'कन्या', lord: 'बुध', element: 'पृथ्वी', color: 'हरा व नीला', luckyNums: [5, 6, 2] },
  libra: { hindi: 'तुला', lord: 'शुक्र', element: 'वायु', color: 'गुलाबी व श्वेत', luckyNums: [6, 7, 2] },
  scorpio: { hindi: 'वृश्चिक', lord: 'मंगल', element: 'जल', color: 'मैरून व लाल', luckyNums: [9, 1, 4] },
  sagittarius: { hindi: 'धनु', lord: 'बृहस्पति', element: 'अग्नि', color: 'पीला व केसरिया', luckyNums: [3, 9, 7] },
  capricorn: { hindi: 'मकर', lord: 'शनि', element: 'पृथ्वी', color: 'नीला व काला', luckyNums: [8, 5, 6] },
  aquarius: { hindi: 'कुंभ', lord: 'शनि', element: 'वायु', color: 'आसमानी व नीला', luckyNums: [8, 4, 7] },
  pisces: { hindi: 'मीन', lord: 'बृहस्पति', element: 'जल', color: 'पीला व समुद्री हरा', luckyNums: [3, 7, 9] }
};

const hindiToEnglishRashi = {
  'मेष': 'aries', 'mesh': 'aries', 'aries': 'aries',
  'वृषभ': 'taurus', 'vrishabh': 'taurus', 'taurus': 'taurus',
  'मिथुन': 'gemini', 'mithun': 'gemini', 'gemini': 'gemini',
  'कर्क': 'cancer', 'kark': 'cancer', 'cancer': 'cancer',
  'सिंह': 'leo', 'singh': 'leo', 'leo': 'leo',
  'कन्या': 'virgo', 'kanya': 'virgo', 'virgo': 'virgo',
  'तुला': 'libra', 'tula': 'libra', 'libra': 'libra',
  'वृश्चिक': 'scorpio', 'vrishchik': 'scorpio', 'scorpio': 'scorpio',
  'धनु': 'sagittarius', 'dhanu': 'sagittarius', 'sagittarius': 'sagittarius',
  'मकर': 'capricorn', 'makar': 'capricorn', 'capricorn': 'capricorn',
  'कुंभ': 'aquarius', 'kumbh': 'aquarius', 'aquarius': 'aquarius',
  'मीन': 'pisces', 'meen': 'pisces', 'pisces': 'pisces'
};

/**
 * Fetch Today's live Panchang from TathaAstu API
 */
async function getLivePanchangToday() {
  const today = new Date().toISOString().split('T')[0];
  if (cachedPanchangData && cachedPanchangDate === today) {
    return cachedPanchangData;
  }

  try {
    const headers = { 'X-API-Key': TATHAASTU_API_KEY };
    const panchangRes = await axios.get(`${TATHAASTU_BASE_URL}/today?lang=hi`, { headers, timeout: 8000 });
    let timingsRes = null;
    try {
      timingsRes = await axios.get(`${TATHAASTU_BASE_URL}/timings?date=${today}&lat=28.6139&lon=77.2090`, { headers, timeout: 8000 });
    } catch (_) {}

    const data = {
      date: today,
      panchang: panchangRes.data,
      timings: timingsRes?.data || null
    };

    cachedPanchangDate = today;
    cachedPanchangData = data;
    return data;
  } catch (err) {
    console.error('TathaAstu getLivePanchangToday Error:', err.response?.data || err.message);
    // If API is down or throttled, return fallback structure
    return {
      date: today,
      panchang: {
        vara: { name_local: 'आज' },
        tithi: { full_name_local: 'शुभ तिथि' },
        nakshatra: { name_local: 'शुभ नक्षत्र' },
        yoga: { name_local: 'शुभ योग' }
      },
      timings: null
    };
  }
}

/**
 * Generate Vedic Prediction based on today's live Panchang
 */
function deriveVedicHoroscopeForSign(signKey, panchangData) {
  const meta = rashiMeta[signKey] || rashiMeta.aries;
  const p = panchangData.panchang || {};
  const t = panchangData.timings || {};

  const tithiName = p.tithi?.full_name_local || p.tithi?.name_local || 'शुभ तिथि';
  const nakshatraName = p.nakshatra?.name_local || 'शुभ नक्षत्र';
  const varaName = p.vara?.name_local || 'वार';
  const yogaName = p.yoga?.name_local || 'शुभ योग';
  const sauraMasa = p.hindu_calendar?.saura_maasa_local || 'मास';

  // Auspicious time from TathaAstu Abhijit or Brahma Muhurat
  let luckyTime = '11:45 AM - 12:35 PM (अभिजीत मुहूर्त)';
  if (t.auspicious?.abhijit_muhurat?.start && t.auspicious?.abhijit_muhurat?.end) {
    luckyTime = `${t.auspicious.abhijit_muhurat.start} - ${t.auspicious.abhijit_muhurat.end} (अभिजीत मुहूर्त)`;
  }

  // Remedies based on day of week (Vara)
  const remediesByVara = {
    'रविवार': 'सूर्य देव को तांबे के लोटे से जल अर्पित करें व आदित्य हृदय स्तोत्र का पाठ करें।',
    'सोमवार': 'भगवान शिव का जलाभिषेक करें और "ॐ नमः शिवाय" मंत्र का 108 बार जप करें।',
    'मंगलवार': 'श्री हनुमान चालीसा का पाठ करें और सिंदूर का तिलक लगाएं।',
    'बुधवार': 'भगवान गणेश को दूर्वा अर्पित करें और गाय को हरी घास खिलाएं।',
    'गुरुवार': 'भगवान विष्णु की पूजा करें, चने की दाल या केला का दान करें।',
    'शुक्रवार': 'माता लक्ष्मी को खीर का भोग लगाएं और श्री सूक्त का पाठ करें।',
    'शनिवार': 'शनिदेव के समक्ष सरसों के तेल का दीपक जलाएं और जरूरतमंद को भोजन कराएं।'
  };
  const remedy = remediesByVara[varaName] || `आज ${meta.lord} ग्रह के अनुकूलता के लिए ॐ नमो भगवते वासुदेवाय का जप करें।`;

  const tithiNum = p.tithi?.number || (new Date().getDate());
  const varaNum = p.vara?.num || (new Date().getDay() + 1);
  const nakshatraNum = p.nakshatra?.number || 1;
  const cycleIndex = (tithiNum + varaNum + nakshatraNum) % 4;

  // Thematic cyclical variations per sign (0: Karma/Career, 1: Artha/Finance, 2: Kama/Relationships, 3: Dharma/Wisdom)
  const signThemes = {
    aries: [
      {
        overall: `आज ${varaName} को ${tithiName} व ${nakshatraName} नक्षत्र के प्रभाव से मेष राशि में विशेष पराक्रम और आत्मबल रहेगा। कार्यक्षेत्र में नए अवसर आपका स्वागत करेंगे।`,
        career: `वरिष्ठ अधिकारियों और सहयोगियों का पूरा समर्थन मिलेगा। महत्वपूर्ण योजनाएं गति पकड़ेंगी।`,
        love: `जीवनसाथी के साथ सामंजस्य बढ़ेगा, घर में आनंदमय वातावरण रहेगा।`,
        health: `ऊर्जावान महसूस करेंगे, खानपान में संतुलन बनाए रखें।`,
        finance: `आर्थिक पक्ष सुदृढ़ रहेगा। पूर्व के प्रयासों से लाभ प्राप्ति के योग हैं।`
      },
      {
        overall: `आज ${tithiName} पर मेष राशि के लिए आर्थिक लाभ और नए अनुबंधों के शुभ संकेत हैं। सोचे हुए कार्यों में रुकावटें दूर होंगी।`,
        career: `व्यापार में विस्तार की योजनाएं सफल रहेंगी। नई डील्स फाइनल हो सकती हैं।`,
        love: `प्रियजनों के साथ किसी मांगलिक उत्सव में शामिल होने का अवसर मिलेगा।`,
        health: `मानसिक तनाव से मुक्ति मिलेगी, योग और प्राणायाम लाभदायक रहेगा।`,
        finance: `अचानक धन प्राप्ति अथवा रुका हुआ धन वापस मिलने के प्रबल योग हैं।`
      },
      {
        overall: `आज का दिन मेष राशि के लिए पारिवारिक सुख और सामाजिक प्रतिष्ठा में वृद्धि लेकर आया है। आपकी वाणी का प्रभाव बढ़ेगा।`,
        career: `टीमवर्क में काम करने से बड़ा लाभ होगा। प्रतिद्वंद्वी शांत रहेंगे।`,
        love: `प्रेम संबंधों में प्रगाढ़ता आएगी, आपसी समझ और विश्वास बढ़ेगा।`,
        health: `स्वास्थ्य सामान्य रहेगा, पर्याप्त नींद लें और हल्का आहार लें।`,
        finance: `सुख-सुविधाओं की वस्तुओं पर शुभ व्यय हो सकता है।`
      },
      {
        overall: `आज ${nakshatraName} के संयोग से आध्यात्मिक शांति और ज्ञानार्जन के लिए दिन अत्यंत उत्तम है। बड़ों का आशीर्वाद फलित होगा।`,
        career: `रचनात्मक कार्यों में उल्लेखनीय सफलता मिलेगी, नए विचार लाभदायक रहेंगे।`,
        love: `रिश्तों में पारदर्शिता और मिठास बनाए रखें, सकारात्मक बातचीत होगी।`,
        health: `स्फूर्ति बनी रहेगी, मौसमी बीमारियों से सतर्क रहें।`,
        finance: `दीर्घकालिक निवेश के लिए आज का दिन अनुकूल परिणाम देगा।`
      }
    ],
    taurus: [
      {
        overall: `आज ${varaName} को ${tithiName} के प्रभाव से वृषभ राशि के जातकों को सुख-सुविधाओं में वृद्धि और मानसिक संतोष प्राप्त होगा।`,
        career: `कला, मीडिया, फैशन अथवा वाणिज्य से जुड़े लोगों को मनवांछित सफलता मिलेगी।`,
        love: `दांपत्य जीवन में मधुरता रहेगी, साथी का पूर्ण सहयोग प्राप्त होगा।`,
        health: `स्वास्थ्य उत्तम रहेगा, चेहरे पर तेज और प्रसन्नता बनी रहेगी।`,
        finance: `धन संचय के प्रयासों में सफलता मिलेगी, फिजूलखर्ची पर नियंत्रण रखें।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र के शुभ योग से व्यापार में नए ग्राहक और लाभदायक अनुबंध मिलने के योग हैं।`,
        career: `कार्यस्थल पर आपके सुझावों का सम्मान होगा। पदोन्नति की चर्चा संभव है।`,
        love: `रोमांटिक जीवन में सुखद अनुभव होंगे, प्रियजन से उपहार मिल सकता है।`,
        health: `गले और पेट का ध्यान रखें, शीतल पदार्थों से परहेज करें।`,
        finance: `व्यवसाय में अच्छा मुनाफा होगा, नए निवेश के अवसर सामने आएंगे।`
      },
      {
        overall: `वृषभ राशि वालों के लिए आज धैर्य और सूझबूझ से काम लेने का दिन है। पारिवारिक जिम्मेदारियां सहजता से पूर्ण होंगी।`,
        career: `नौकरीपेशा लोगों के लिए दिन सामान्य रहेगा, कार्यों को समय पर पूरा करें।`,
        love: `रिश्तों में भावनात्मक जुड़ाव बढ़ेगा, पुराने मतभेद सुलझेंगे।`,
        health: `नियमित दिनचर्या बनाए रखें, सुबह की सैर स्वास्थ्यवर्धक रहेगी।`,
        finance: `आर्थिक स्थिति संतुलित रहेगी, अनावश्यक जोखिम से बचें।`
      },
      {
        overall: `आज आध्यात्मिक और धार्मिक कार्यों में रुचि बढ़ेगी। दान-पुण्य से आत्मिक संतोष और यश में वृद्धि होगी।`,
        career: `साझेदारी के कार्यों में पारदर्शिता रखें, बड़ा निर्णय लेने से पहले सोचें।`,
        love: `परिवार के साथ सुखद समय बीतेगा, मित्रों का सहयोग मिलेगा।`,
        health: `ऊर्जा और स्फूर्ति का अनुभव होगा, मन शांत रहेगा।`,
        finance: `भूमि, वाहन अथवा आभूषण से संबंधित योजनाएं गति पकड़ेंगी।`
      }
    ],
    gemini: [
      {
        overall: `मिथुन राशि वालों के लिए आज ${varaName} को ${tithiName} संवाद कौशल और तीक्ष्ण बुद्धि से सफलता दिलाने वाला दिन है।`,
        career: `आईटी, कंसल्टेंसी व मार्केटिंग से जुड़े लोगों को बड़ा प्रोजेक्ट मिल सकता है।`,
        love: `मित्रों व जीवनसाथी के साथ तालमेल अच्छा रहेगा, गलतफहमियां दूर होंगी।`,
        health: `मानसिक ताजगी बनी रहेगी, ध्यान और योग से एकाग्रता बढ़ेगी।`,
        finance: `व्यावसायिक यात्रा लाभदायक रहेगी, आकस्मिक लाभ के योग हैं।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र का प्रभाव आपके आत्मविश्वास को नई ऊंचाइयों पर ले जाएगा। नए संपर्क लाभदायक साबित होंगे।`,
        career: `सहकर्मियों का साथ मिलेगा, महत्वपूर्ण प्रेजेंटेशन में सराहना होगी।`,
        love: `प्रेम संबंधों में उत्साह रहेगा, किसी खास से दिल की बात साझा हो सकती है।`,
        health: `स्वास्थ्य अच्छा रहेगा, व्यायाम को नियमित रखें।`,
        finance: `आय के नए स्रोत बनेंगे, वित्तीय योजनाएं सफल होंगी।`
      },
      {
        overall: `आज का दिन कार्ययोजनाओं को धरातल पर उतारने का है। आपकी मेहनत का पूरा फल प्राप्त होगा।`,
        career: `अधिकारियों से मार्गदर्शन मिलेगा, कार्यभार में संतुलन बनाए रखें।`,
        love: `पारिवारिक सदस्यों के साथ सुखद बातचीत होगी, घर में हंसी-खुशी रहेगी।`,
        health: `आंखों और सिरदर्द का ध्यान रखें, स्क्रीन टाइम कम करें।`,
        finance: `खर्चों में संतुलन रहेगा, बचत में वृद्धि के योग हैं।`
      },
      {
        overall: `आज ज्ञान, विद्या और रचनात्मक कार्यों के लिए दिन विशेष अनुकूल है। कोई शुभ समाचार मिल सकता है।`,
        career: `विद्यार्थियों व शोधकर्ताओं को उत्तम परिणाम मिलेंगे। नए अवसर खुलेंगे।`,
        love: `रिश्तों में गहराई आएगी, अपनों का स्नेह मिलेगा।`,
        health: `तनावमुक्त महसूस करेंगे, पर्याप्त जल पिएं।`,
        finance: `शेयर अथवा म्यूचुअल फंड में समझदारी से किया गया निवेश शुभ रहेगा।`
      }
    ],
    cancer: [
      {
        overall: `आज कर्क राशि वालों के लिए ${tithiName} गृह-परिवार में सुखद वातावरण और मानसिक शांति लेकर आया है।`,
        career: `नौकरी में आपकी निष्ठा की सराहना होगी, कार्यस्थल पर सम्मान बढ़ेगा।`,
        love: `दांपत्य जीवन में आपसी विश्वास प्रगाढ़ होगा, सुखद पल बीतेंगे।`,
        health: `भावनात्मक संतुलन बनाए रखें, स्वास्थ्य सामान्य रहेगा।`,
        finance: `भूमि, भवन अथवा घरेलू सुख-साधनों में निवेश लाभकारी रहेगा।`
      },
      {
        overall: `आज ${nakshatraName} के प्रभाव से आपके अटके हुए कार्य गति पकड़ेंगे। मातृपक्ष से सहयोग और स्नेह मिलेगा।`,
        career: `व्यापार में स्थिरता आएगी, नए सहयोगियों से संपर्क होगा।`,
        love: `परिजनों की सलाह उपयोगी सिद्ध होगी, प्रेम संबंधों में मिठास रहेगी।`,
        health: `जल तत्वों का सेवन बढ़ाएं, पेट का ध्यान रखें।`,
        finance: `आर्थिक स्थिति मजबूत होगी, पुराना कर्ज चुकाने में सफलता मिलेगी।`
      },
      {
        overall: `कर्क राशि के जातकों में आज परोपकार और सेवा की भावना प्रबल रहेगी। समाज में सम्मान बढ़ेगा।`,
        career: `सरकारी कार्यों में प्रगति होगी, अधिकारियों का सहयोग मिलेगा।`,
        love: `साथी के साथ भावनात्मक सामंजस्य बना रहेगा, यात्रा संभव है।`,
        health: `मन शांत और प्रसन्न रहेगा, सकारात्मक ऊर्जा का संचार होगा।`,
        finance: `शुभ कार्यों पर व्यय होगा, धन का आवागमन सुचारू रहेगा।`
      },
      {
        overall: `आज कला, संगीत और रचनात्मक कार्यों में मन लगेगा। कोई महत्वपूर्ण निर्णय लेने के लिए शुभ समय है।`,
        career: `रचनात्मक क्षेत्रों में काम करने वालों को विशेष पहचान मिलेगी।`,
        love: `रिश्तों में नई ताजगी का अनुभव होगा, खुशियां बढ़ेंगी।`,
        health: `स्वास्थ्य उत्तम रहेगा, ताजगी का अनुभव करेंगे।`,
        finance: `वित्तीय मामलों में संतुलन बना रहेगा, लाभ के योग हैं।`
      }
    ],
    leo: [
      {
        overall: `सिंह राशि के जातकों के लिए आज ${varaName} को ${tithiName} पराक्रम और मान-प्रतिष्ठा बढ़ाने वाला दिन है। नेतृत्व क्षमता निखरेगी।`,
        career: `प्रशासनिक व उच्च पदों पर कार्यरत लोगों के लिए पदोन्नति के योग हैं।`,
        love: `अहंकार को दूर रखें, जीवनसाथी के साथ मधुरता बनाए रखें।`,
        health: `स्फूर्ति और ऊर्जा का अनुभव होगा, स्वास्थ्य उत्तम रहेगा।`,
        finance: `आय के साधनों में वृद्धि होगी, व्यापार में बड़ा मुनाफा संभव है।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र के प्रभाव से समाज में आपका प्रभाव बढ़ेगा। विरोधी आपके प्रभाव से नतमस्तक होंगे।`,
        career: `कार्यक्षेत्र में नई जिम्मेदारियां मिलेंगी, आपका प्रभाव बढ़ेगा।`,
        love: `परिवार में खुशहाली रहेगी, संतान की ओर से शुभ समाचार मिलेगा।`,
        health: `रक्तचाप व धूप से बचाव रखें, भरपूर जल पिएं।`,
        finance: `रुका हुआ धन वापस मिल सकता है, आर्थिक पक्ष मजबूत होगा।`
      },
      {
        overall: `आज का दिन आत्मविश्वास और दृढ़ संकल्प के साथ आगे बढ़ने का है। सभी योजनाएं सही दिशा में आगे बढ़ेंगी।`,
        career: `व्यावसायिक मीटिंग्स सफल रहेंगी, नए अनुबंध प्राप्त होंगे।`,
        love: `प्रियजनों के साथ समय बिताने से मन प्रसन्न होगा।`,
        health: `ऊर्जावान महसूस करेंगे, व्यायाम को दिनचर्या में रखें।`,
        finance: `निवेश से अच्छा रिटर्न मिलने की संभावना है।`
      },
      {
        overall: `आज धार्मिक और सामाजिक आयोजनों में आपकी सक्रिय भागीदारी रहेगी। बड़ों का मार्गदर्शन लाभ देगा।`,
        career: `परामर्श और मैनेजमेंट से जुड़े लोगों को यश की प्राप्ति होगी।`,
        love: `दांपत्य जीवन में प्रेम और सम्मान बढ़ेगा।`,
        health: `मानसिक शांति रहेगी, स्वास्थ्य अच्छा रहेगा।`,
        finance: `दीर्घकालिक योजनाओं में धन लगाना शुभ रहेगा।`
      }
    ],
    virgo: [
      {
        overall: `कन्या राशि वालों के लिए आज सूक्ष्म विश्लेषण और योजनाबद्ध कार्यशैली विशेष लाभ देने वाली है।`,
        career: `बैंकिंग, लेखा व तकनीक से जुड़े लोगों को मनवांछित परिणाम मिलेंगे।`,
        love: `सकारात्मक संवाद से रिश्तों में नई ऊर्जा आएगी, परिवार का साथ मिलेगा।`,
        health: `पाचन तंत्र का ध्यान रखें, हल्का व सुपाच्य भोजन ग्रहण करें।`,
        finance: `बचत योजनाओं में निवेश के लिए आज का दिन अत्यंत शुभ है।`
      },
      {
        overall: `आज ${nakshatraName} के प्रभाव से आपके बौद्धिक कौशल की प्रशंसा होगी। पुराने रुके कार्य पूरे होंगे।`,
        career: `कार्यक्षेत्र में सहयोगियों से तालमेल अच्छा रहेगा, सफलता मिलेगी।`,
        love: `जीवनसाथी का पूरा सहयोग मिलेगा, गलतफहमियां दूर होंगी।`,
        health: `मानसिक तनाव से बचें, समय पर विश्राम करें।`,
        finance: `आर्थिक स्थिति सुधरेगी, आकस्मिक धन लाभ संभव है।`
      },
      {
        overall: `आज व्यावहारिक दृष्टिकोण अपनाएं, कार्यक्षेत्र और घर में संतुलन बना रहेगा।`,
        career: `व्यापार में नई शुरुआत के लिए समय उपयुक्त है, योजनाएं फलीभूत होंगी।`,
        love: `मित्रों के साथ सुखद भेंट होगी, पारिवारिक वातावरण शांतिपूर्ण रहेगा।`,
        health: `स्वास्थ्य में सुधार होगा, ऊर्जा बनी रहेगी।`,
        finance: `अनावश्यक खर्चों पर रोक लगेगी, धन संचय होगा।`
      },
      {
        overall: `आज का दिन अध्ययन, शोध और नई विधाओं को सीखने के लिए सर्वोत्तम है। मन एकाग्र रहेगा।`,
        career: `प्रतियोगी परीक्षाओं और इंटरव्यू में सफलता के प्रबल योग हैं।`,
        love: `रिश्तों में गहराई और परिपक्वता आएगी।`,
        health: `स्वास्थ्य अच्छा रहेगा, ध्यान लगाना फलदायी होगा।`,
        finance: `व्यावसायिक लेन-देन में सतर्कता बरतें, लाभ होगा।`
      }
    ],
    libra: [
      {
        overall: `तुला राशि वालों के लिए आज का दिन संतुलन, सामंजस्य और नए अवसरों से परिपूर्ण है।`,
        career: `साझेदारी के व्यवसाय में उत्तम लाभ के संकेत हैं, नए प्रोजेक्ट मिलेंगे।`,
        love: `दांपत्य जीवन में खुशहाली रहेगी, प्रेम संबंधों में मधुरता बढ़ेगी।`,
        health: `दिनभर ताजगी महसूस होगी, योग को दिनचर्या में शामिल करें।`,
        finance: `वित्तीय स्थिति संतुलित रहेगी, सुख-सुविधाओं पर शुभ व्यय होगा।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र का योग आपके व्यक्तित्व को आकर्षक बनाएगा। लोगों का सहयोग मिलेगा।`,
        career: `कला, कानूनी व कूटनीतिक क्षेत्रों में विशेष यश मिलेगा।`,
        love: `जीवनसाथी के साथ रोमांटिक शाम बीतेगी, मन प्रसन्न रहेगा।`,
        health: `स्वास्थ्य अनुकूल रहेगा, स्फूर्ति बनी रहेगी।`,
        finance: `व्यापार में नए लाभदायक सौदे होंगे, धन आगमन होगा।`
      },
      {
        overall: `आज न्यायप्रिय और सत्यनिष्ठ रहकर काम करने से भाग्य का पूरा साथ मिलेगा।`,
        career: `ऑफिस में वरिष्ठों की सराहना मिलेगी, मान-सम्मान बढ़ेगा।`,
        love: `पारिवारिक समस्याओं का समाधान होगा, शांति रहेगी।`,
        health: `पर्याप्त आराम करें, पीठ या कमर का ध्यान रखें।`,
        finance: `आर्थिक योजनाएं सफल होंगी, ऋण मुक्ति के रास्ते बनेंगे।`
      },
      {
        overall: `आज सामाजिक संपर्क और मित्रों का दायरा बढ़ेगा। किसी मांगलिक आयोजन की रूपरेखा बनेगी।`,
        career: `टीमवर्क से बड़े लक्ष्य हासिल होंगे, नई डील्स होंगी।`,
        love: `रिश्तों में परस्पर विश्वास और आदर बढ़ेगा।`,
        health: `मानसिक शांति मिलेगी, ध्यान लगाना हितकर रहेगा।`,
        finance: `सोच-समझकर किया गया निवेश भविष्य में लाभ देगा।`
      }
    ],
    scorpio: [
      {
        overall: `वृश्चिक राशि के जातकों के लिए आज कठिन से कठिन कार्य भी सूझबूझ और दृढ़ इच्छाशक्ति से संपन्न होंगे।`,
        career: `कार्यक्षेत्र में रणनीतियां सफल होंगी, प्रतिद्वंद्वी शांत रहेंगे।`,
        love: `रिश्तों में गहराई और निष्ठा बढ़ेगी, अपनों का स्नेह मिलेगा।`,
        health: `तनावमुक्त रहें, नियमित प्राणायाम करने से विशेष लाभ होगा।`,
        finance: `रुका हुआ धन वापस आ सकता है, वित्तीय मजबूती आएगी।`
      },
      {
        overall: `आज ${tithiName} के शुभ प्रभाव से आपकी गुप्त शक्तियों और अंतर्ज्ञान में वृद्धि होगी।`,
        career: `रिसर्च, सुरक्षा, चिकित्सा व तकनीकी क्षेत्रों में सफलता मिलेगी।`,
        love: `दांपत्य जीवन में विश्वास बढ़ेगा, मतभेद समाप्त होंगे।`,
        health: `ऊर्जा और स्फूर्ति बनी रहेगी, स्वास्थ्य उत्तम रहेगा।`,
        finance: `आकस्मिक लाभ के योग हैं, संपत्ति से जुड़े मामले सुलझेंगे।`
      },
      {
        overall: `आज का दिन आत्मविश्वास और साहस के साथ आगे बढ़ने का है। नए कार्यों की शुरुआत शुभ रहेगी।`,
        career: `व्यापार में नई गति आएगी, दूरस्थ स्थानों से लाभ मिलेगा।`,
        love: `परिवार के साथ सामंजस्य रहेगा, बड़ों का मार्गदर्शन मिलेगा।`,
        health: `खानपान पर ध्यान दें, मौसमी संक्रमण से बचें।`,
        finance: `बचत में वृद्धि होगी, विवेकपूर्ण निवेश फल देगा।`
      },
      {
        overall: `आज आध्यात्मिक जिज्ञासा शांत होगी। किसी सिद्ध स्थल की यात्रा या गुरु दर्शन के योग हैं।`,
        career: `प्रशासनिक कार्यों में सफलता मिलेगी, प्रभाव बढ़ेगा।`,
        love: `प्रेम जीवन में मधुरता रहेगी, परस्पर सम्मान बढ़ेगा।`,
        health: `मानसिक शांति का अनुभव होगा, मन एकाग्र रहेगा।`,
        finance: `आर्थिक पक्ष मजबूत रहेगा, शुभ व्यय होगा।`
      }
    ],
    sagittarius: [
      {
        overall: `धनु राशि वालों के लिए आज ${tithiName} भाग्य के नए द्वार खोलने वाला दिन है। गुरु कृपा बनी रहेगी।`,
        career: `उच्च शिक्षा, अध्यापन व कानूनी कार्यों में विशेष सफलता मिलेगी।`,
        love: `परिवार में मांगलिक कार्यों की रूपरेखा बनेगी, संबंध मधुर रहेंगे।`,
        health: `स्वास्थ्य अनुकूल रहेगा, सकारात्मक विचारों से मन प्रफुल्लित रहेगा।`,
        finance: `आर्थिक स्थिति सुदृढ़ होगी, धार्मिक कार्यों पर शुभ व्यय होगा।`
      },
      {
        overall: `आज ${nakshatraName} के प्रभाव से दूरगामी योजनाओं को अमलीजामा पहनाने का उत्तम समय है।`,
        career: `कार्यक्षेत्र में नई परियोजनाएं आरंभ करने के लिए समय अनुकूल है।`,
        love: `जीवनसाथी का पूर्ण सहयोग मिलेगा, सुखद यात्रा के योग हैं।`,
        health: `स्फूर्ति बनी रहेगी, खानपान सात्विक रखें।`,
        finance: `व्यापार में धन लाभ होगा, नए अवसर प्राप्त होंगे।`
      },
      {
        overall: `आज का दिन मान-सम्मान और सामाजिक प्रतिष्ठा में वृद्धि कराने वाला रहेगा।`,
        career: `वरिष्ठ अधिकारियों का स्नेह प्राप्त होगा, पदोन्नति की संभावना है।`,
        love: `मित्रों और शुभचिंतकों से सहयोग मिलेगा, घर में आनंद रहेगा।`,
        health: `ऊर्जावान महसूस करेंगे, दिनचर्या व्यवस्थित रखें।`,
        finance: `धन संचय के प्रयास सफल रहेंगे, आमदनी बढ़ेगी।`
      },
      {
        overall: `आज आध्यात्मिक और परोपकारी कार्यों में आपका समय बीतेगा। ज्ञान में वृद्धि होगी।`,
        career: `प्रतियोगी परीक्षाओं में सफलता के संकेत हैं, एकाग्रता रखें।`,
        love: `रिश्तों में परस्पर समझदारी बढ़ेगी, खुशहाली रहेगी।`,
        health: `स्वास्थ्य अच्छा रहेगा, मानसिक शांति का अनुभव होगा।`,
        finance: `भूमि अथवा वाहन क्रय की योजनाएं आगे बढ़ेंगी।`
      }
    ],
    capricorn: [
      {
        overall: `मकर राशि के जातकों के लिए आज कठिन परिश्रम का उचित प्रतिफल मिलने का योग है। स्थिरता और प्रतिष्ठा बढ़ेगी।`,
        career: `अधिकारियों से प्रशंसा मिलेगी, व्यावसायिक विस्तार की योजनाएं फलीभूत होंगी।`,
        love: `संयमित वाणी से परिजनों का दिल जीतेंगे, जीवनसाथी का भरपूर सहयोग मिलेगा।`,
        health: `घुटनों व जोड़ों के दर्द से सावधान रहें, पर्याप्त आराम करें।`,
        finance: `दीर्घकालिक निवेश भविष्य में बड़ा लाभ देगा, धन का सदुपयोग होगा।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र के प्रभाव से कार्यक्षेत्र में आपके दायित्वों का विस्तार होगा। सफलता तय है।`,
        career: `निर्माण, उद्योग व प्रबंधन से जुड़े लोगों को बड़ा मुनाफा होगा।`,
        love: `घर-परिवार में बड़ों का आशीर्वाद मिलेगा, संबंध मजबूत होंगे।`,
        health: `स्वास्थ्य सामान्य रहेगा, योग और व्यायाम नियमित रखें।`,
        finance: `आर्थिक स्थिति में सुधार होगा, पैतृक संपत्ति से लाभ संभव है।`
      },
      {
        overall: `आज धैर्य और निष्ठा से कार्य करने पर असंभव कार्य भी संभव हो जाएंगे। शनिदेव की कृपा रहेगी।`,
        career: `नौकरी में आपकी स्थिति मजबूत होगी, नई जिम्मेदारियां मिलेंगी।`,
        love: `दांपत्य जीवन में सामंजस्य रहेगा, शांति का अनुभव करेंगे।`,
        health: `पर्याप्त जल पिएं और समय पर भोजन करें।`,
        finance: `धन आगमन के नए मार्ग खुलेंगे, व्यापार में गति आएगी।`
      },
      {
        overall: `आज सामाजिक दायित्वों को पूरा करने से यश मिलेगा। किसी महत्वपूर्ण व्यक्ति से मुलाकात होगी।`,
        career: `व्यावसायिक सौदे लाभदायी सिद्ध होंगे, आत्मविश्वास बढ़ेगा।`,
        love: `रिश्तों में परिपक्वता आएगी, अपनों का साथ संबल देगा।`,
        health: `मानसिक ताजगी बनी रहेगी, तनाव से दूर रहें।`,
        finance: `बचत में वृद्धि होगी, अवांछित खर्चों पर रोक लगेगी।`
      }
    ],
    aquarius: [
      {
        overall: `कुंभ राशि वालों के लिए आज नवीन विचारों और लोककल्याणकारी कार्यों का दिन है। समाज में आपका प्रभाव बढ़ेगा।`,
        career: `तकनीकी क्षेत्र व नए स्टार्टअप से जुड़े लोगों को अच्छी सफलता मिलेगी।`,
        love: `मित्रवत संबंध प्रेम में परिवर्तित हो सकते हैं, आपसी समझ बढ़ेगी।`,
        health: `मानसिक शांति का अनुभव होगा, नित्य सैर करना हितकर रहेगा।`,
        finance: `आकस्मिक धन लाभ के योग हैं, नए वित्तीय स्रोत विकसित होंगे।`
      },
      {
        overall: `आज ${tithiName} के प्रभाव से रचनात्मकता और नवाचार में आपकी रुचि बढ़ेगी। सहयोगियों का साथ मिलेगा।`,
        career: `टीम का नेतृत्व करने का अवसर मिल सकता है, प्रशंसा मिलेगी।`,
        love: `पारिवारिक वातावरण खुशनुमा रहेगा, सुखद समाचार मिलेंगे।`,
        health: `स्वास्थ्य उत्तम रहेगा, स्फूर्ति और ऊर्जा बनी रहेगी।`,
        finance: `व्यापार में वृद्धि होगी, पुराने निवेश से लाभ प्राप्त होगा।`
      },
      {
        overall: `आज का दिन दूरगामी लक्ष्यों को तय करने और उन पर काम शुरू करने का है। भाग्य साथ देगा।`,
        career: `नौकरीपेशा लोगों के लिए दिन अनुकूल रहेगा, पद-प्रतिष्ठा बढ़ेगी।`,
        love: `दांपत्य जीवन में सुख और शांति रहेगी, एक-दूसरे की भावना समझें।`,
        health: `पैरों और आंखों का ध्यान रखें, नियमित व्यायाम करें।`,
        finance: `आर्थिक स्थिति सुदृढ़ होगी, धन संचय में सफलता मिलेगी।`
      },
      {
        overall: `आज सामाजिक संस्थाओं और परोपकारी कार्यों में आपका योगदान सराहा जाएगा। नए मित्र बनेंगे।`,
        career: `रिसर्च, आईटी और शिक्षा के क्षेत्र में विशेष उपलब्धि हासिल होगी।`,
        love: `रिश्तों में नया उत्साह आएगा, प्रियजनों का स्नेह मिलेगा।`,
        health: `मन प्रसन्न रहेगा, सकारात्मक ऊर्जा का संचार होगा।`,
        finance: `वित्तीय मामलों में संतुलन बना रहेगा, शुभ कार्यों में व्यय होगा।`
      }
    ],
    pisces: [
      {
        overall: `मीन राशि के जातकों के लिए आज ${tithiName} आध्यात्मिक शांति, अंतर्ज्ञान और मनोकामना पूर्ति का दिन है।`,
        career: `शिक्षा, परामर्श व समाज सेवा से जुड़े कार्यों में विशेष यश मिलेगा।`,
        love: `भावनात्मक संतुलन बनाए रखें, साथी की बातें ध्यान से सुनें।`,
        health: `जल तत्वों का सेवन बढ़ाएं, ध्यान व योग से मन एकाग्र रहेगा।`,
        finance: `आर्थिक स्थिति संतोषजनक रहेगी, दान-पुण्य से भाग्य में वृद्धि होगी।`
      },
      {
        overall: `आज ${nakshatraName} नक्षत्र के प्रभाव से आपकी कल्पनाशक्ति और रचनात्मकता को नई उड़ान मिलेगी।`,
        career: `कला, साहित्य, संगीत व डिजाइनिंग से जुड़े लोगों को मान-सम्मान मिलेगा।`,
        love: `प्रेम संबंधों में मधुरता और विश्वास बढ़ेगा, खुशी का माहौल रहेगा।`,
        health: `स्वास्थ्य अनुकूल रहेगा, सकारात्मक विचारों से ऊर्जा मिलेगी।`,
        finance: `व्यापार में लाभ के अवसर बनेंगे, धन आगमन सुगम होगा।`
      },
      {
        overall: `आज बड़ों और गुरुजनों का आशीर्वाद मिलेगा। किसी धार्मिक आयोजन में भाग लेने का अवसर मिलेगा।`,
        career: `कार्यक्षेत्र में नई जिम्मेदारी मिल सकती है, निष्ठापूर्वक निभाएं।`,
        love: `परिवार के सदस्यों के साथ सुखद समय बीतेगा, शांति रहेगी।`,
        health: `नींद पूरी लें और तनावमुक्त रहें, स्वास्थ्य ठीक रहेगा।`,
        finance: `सोच-समझकर निवेश करें, अनावश्यक खर्चों से बचें।`
      },
      {
        overall: `आज आत्मनिरीक्षण और मानसिक शांति का दिन है। अंतरआत्मा की आवाज सुनकर लिए गए निर्णय सही होंगे।`,
        career: `सहकर्मियों का सहयोग मिलेगा, अटके हुए प्रोजेक्ट्स पूरे होंगे।`,
        love: `दांपत्य जीवन में प्रेम और सामंजस्य बढ़ेगा।`,
        health: `प्राणायाम और ध्यान से मन प्रसन्न रहेगा, ऊर्जा बनी रहेगी।`,
        finance: `आर्थिक पक्ष संतुलित रहेगा, भविष्य के लिए बचत योजनाएं बनेंगी।`
      }
    ]
  };

  const signList = signThemes[signKey] || signThemes.aries;
  const pred = signList[cycleIndex % signList.length];
  const luckyNumIndex = (tithiNum + varaNum) % meta.luckyNums.length;
  const luckyNum = meta.luckyNums[luckyNumIndex];

  return {
    overall: pred.overall,
    career: pred.career,
    love: pred.love,
    health: pred.health,
    finance: pred.finance,
    lucky_number: luckyNum.toString(),
    lucky_color: meta.color,
    lucky_time: luckyTime,
    remedy: remedy,
    mood: 'उत्साही एवं सकारात्मक (Positive)',
    compatibility: 'कर्क, वृश्चिक, मीन',
    panchang_summary: {
      date: panchangData.date,
      vara: varaName,
      tithi: tithiName,
      nakshatra: nakshatraName,
      yoga: yogaName
    }
  };
}

const memoryHoroscopeCache = new Map();

/**
 * Main function: Get Daily Horoscope for a zodiac sign
 */
async function getDailyHoroscope(sign) {
  const cleanSign = (sign || 'aries').toLowerCase().trim();
  const signKey = hindiToEnglishRashi[cleanSign] || cleanSign;
  const today = new Date().toISOString().split('T')[0];
  const memKey = `${signKey}_${today}`;

  if (memoryHoroscopeCache.has(memKey)) {
    return { success: true, source: 'memory-cache', data: memoryHoroscopeCache.get(memKey) };
  }

  // 1. Check DB Cache if connected
  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const cached = await HoroscopeCache.findOne({ sign: signKey, type: 'daily', date: today });
      if (cached && cached.data) {
        memoryHoroscopeCache.set(memKey, cached.data);
        return { success: true, source: 'cache', data: cached.data };
      }
    } catch (err) {
      console.error('HoroscopeCache find error:', err.message);
    }
  }

  // 2. Fetch Live TathaAstu Panchang
  const panchangData = await getLivePanchangToday();

  // 3. Try TathaAstu Vedic Rashifal endpoint (if account has Pro plan)
  try {
    const res = await axios.get(`${TATHAASTU_BASE_URL}/rashifal/vedic?rashi=${signKey}&lang=hi`, {
      headers: { 'X-API-Key': TATHAASTU_API_KEY },
      timeout: 5000
    });
    if (res.data && !res.data.error) {
      const data = {
        overall: res.data.prediction_local || res.data.prediction || '',
        career: res.data.career_local || res.data.career || 'कार्यक्षेत्र में सफलता मिलेगी।',
        love: res.data.love_local || res.data.love || 'प्रेम जीवन सुखमय रहेगा।',
        health: res.data.health_local || res.data.health || 'स्वास्थ्य उत्तम रहेगा।',
        finance: res.data.finance_local || 'आर्थिक स्थिति मजबूत रहेगी।',
        lucky_number: res.data.lucky_number || '7',
        lucky_color: res.data.lucky_color || 'पीला',
        lucky_time: '11:45 AM - 12:35 PM',
        remedy: res.data.remedy_local || 'गाय को रोटी खिलाएं।',
        mood: 'प्रसन्न',
        compatibility: 'कर्क, मीन'
      };

      memoryHoroscopeCache.set(memKey, data);

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          await HoroscopeCache.findOneAndUpdate(
            { sign: signKey, type: 'daily', date: today },
            { sign: signKey, type: 'daily', date: today, data },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (_) {}
      }

      return { success: true, source: 'tathaastu-api', data };
    }
  } catch (_) {
    // If Pro plan is required or endpoint unavailable, gracefully fall through
  }

  // 4. Derive live prediction using TathaAstu's live Panchang for today
  const derivedData = deriveVedicHoroscopeForSign(signKey, panchangData);
  memoryHoroscopeCache.set(memKey, derivedData);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await HoroscopeCache.findOneAndUpdate(
        { sign: signKey, type: 'daily', date: today },
        { sign: signKey, type: 'daily', date: today, data: derivedData },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (err) {
      console.error('Error saving derived horoscope cache:', err.message);
    }
  }

  return { success: true, source: 'tathaastu-live-panchang', data: derivedData };
}

/**
 * Get Daily Rashi Notification Message for a User (Used by 8:00 AM Cron)
 */
async function getDailyRashiNotificationMessage(name, rashi) {
  let cleanSign = (rashi || '').toString().toLowerCase().trim();
  const signKey = hindiToEnglishRashi[cleanSign] || (cleanSign.length > 0 ? cleanSign : null);
  const userName = (name && name.trim().length > 0) ? name.trim() : 'भक्त';

  const panchangData = await getLivePanchangToday();
  const p = panchangData.panchang || {};
  const tithi = p.tithi?.name_local || 'शुभ तिथि';
  const vara = p.vara?.name_local || 'आज';
  const nakshatra = p.nakshatra?.name_local || 'नक्षत्र';

  if (!signKey || !rashiMeta[signKey]) {
    return {
      title: `आज का दैनिक पंचांग व राशिफल (${vara}) ॐ`,
      body: `नमस्ते ${userName} जी! आज ${vara}, ${tithi} व ${nakshatra} नक्षत्र है। अपनी राशि का आज का संपूर्ण भविष्यफल व अचूक उपाय जानने के लिए ऐप खोलें।`
    };
  }

  const horoscope = await getDailyHoroscope(signKey);
  const data = horoscope.data || {};
  const meta = rashiMeta[signKey];

  const tithiNum = p.tithi?.number || (new Date().getDate());
  const varaNum = p.vara?.num || (new Date().getDay() + 1);
  const cycle = (tithiNum + varaNum) % 4;

  let highlight = data.career || 'कार्यक्षेत्र में उत्तम सफलता के योग हैं।';
  if (cycle === 1 && data.finance) {
    highlight = data.finance;
  } else if (cycle === 2 && data.love) {
    highlight = data.love;
  } else if (cycle === 3 && data.overall) {
    highlight = data.overall;
  }

  return {
    title: `आज का राशिफल (${meta.hindi} राशि) 🔮`,
    body: `नमस्ते ${userName} जी! आज ${vara}, ${tithi} में ${highlight} शुभ रंग: ${data.lucky_color}, शुभ अंक: ${data.lucky_number}। पूरा राशिफल देखें।`
  };
}

module.exports = {
  getLivePanchangToday,
  getDailyHoroscope,
  getDailyRashiNotificationMessage,
  hindiToEnglishRashi,
  rashiMeta
};
