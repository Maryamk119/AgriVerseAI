import { SoilData, AnalysisResult } from './types';

export function analyzeSoil(data: SoilData): AnalysisResult {
  // Calculate Soil Health Score (0-100)
  const nScore = Math.min(100, (data.n / 250) * 100);
  const pScore = Math.min(100, (data.p / 60) * 100);
  const kScore = Math.min(100, (data.k / 250) * 100);
  const phScore = data.ph >= 6.0 && data.ph <= 7.5 ? 100 : 100 - Math.abs(6.75 - data.ph) * 20;
  
  const soilHealthScore = Math.round((nScore + pScore + kScore + phScore) / 4);
  
  // Soil Health Status Classification
  let soilHealthStatus: AnalysisResult['soilHealthStatus'] = { en: 'Healthy', ta: 'ஆரோக்கியமானது' };
  if (soilHealthScore < 40) {
    soilHealthStatus = { en: 'Deficient', ta: 'குறைபாடுள்ளது' };
  } else if (soilHealthScore < 70) {
    soilHealthStatus = { en: 'Moderate', ta: 'மிதமானது' };
  }

  // Carbon Sustainability Score
  const carbonSustainabilityScore = Math.round(Math.min(100, data.organicCarbon * 80));
  
  // Deficiencies
  const deficiencies = {
    n: data.n < 150,
    p: data.p < 30,
    k: data.k < 150,
    organicCarbon: data.organicCarbon < 0.5,
    moisture: data.moisture < 20
  };

  // Formatted Deficiencies / Excess
  const defEn: string[] = [];
  const defTa: string[] = [];

  if (deficiencies.n) { defEn.push('Nitrogen (Low)'); defTa.push('நைட்ரஜன் (குறைவு)'); }
  if (data.n > 300) { defEn.push('Nitrogen (Excess)'); defTa.push('நைட்ரஜன் (அதிகம்)'); }
  if (deficiencies.p) { defEn.push('Phosphorus (Low)'); defTa.push('பாஸ்பரஸ் (குறைவு)'); }
  if (data.p > 80) { defEn.push('Phosphorus (Excess)'); defTa.push('பாஸ்பரஸ் (அதிகம்)'); }
  if (deficiencies.k) { defEn.push('Potassium (Low)'); defTa.push('பொட்டாசியம் (குறைவு)'); }
  if (data.k > 300) { defEn.push('Potassium (Excess)'); defTa.push('பொட்டாசியம் (அதிகம்)'); }
  if (deficiencies.organicCarbon) { defEn.push('Organic Carbon (Low)'); defTa.push('கரிம கார்பன் (குறைவு)'); }
  if (deficiencies.moisture) { defEn.push('Moisture (Low)'); defTa.push('ஈரப்பதம் (குறைவு)'); }

  const formattedDeficiencies = {
    en: defEn.length > 0 ? defEn.join(', ') : 'None',
    ta: defTa.length > 0 ? defTa.join(', ') : 'இல்லை'
  };
  
  // Recommendations based on crop and deficiencies
  let recommendedFertilizer = { en: 'Organic Compost', ta: 'இயற்கை உரம்' };
  let npkRatio = '1:1:1';
  let fertilizerType: AnalysisResult['fertilizerType'] = { en: 'Organic', ta: 'இயற்கை உரம்' };
  let fertilizerQuantity = 50;
  let applicationMethod: AnalysisResult['applicationMethod'] = { en: 'Basal', ta: 'அடி உரம்' };
  let timing = { en: 'Before sowing', ta: 'விதைப்பதற்கு முன்' };
  let expectedYieldIncrease = 15;
  let estimatedCost = 500;

  // Rule-based logic for recommendations
  if (data.cropType === 'Paddy') {
    if (deficiencies.n) {
      recommendedFertilizer = { en: 'Urea (46% N)', ta: 'யூரியா (46% N)' };
      npkRatio = '46:0:0';
      fertilizerType = { en: 'Chemical', ta: 'ரசாயன உரம்' };
      fertilizerQuantity = 80;
      applicationMethod = { en: 'Top dressing', ta: 'மேல் உரம்' };
      timing = { en: '20 days after transplanting', ta: 'நாற்று நட்ட 20 நாட்களுக்குப் பிறகு' };
      estimatedCost = 600;
    } else if (deficiencies.p || deficiencies.k) {
      recommendedFertilizer = { en: 'DAP + MOP', ta: 'DAP + MOP' };
      npkRatio = '18:46:60';
      fertilizerType = { en: 'Chemical', ta: 'ரசாயன உரம்' };
      fertilizerQuantity = 120;
      applicationMethod = { en: 'Basal', ta: 'அடி உரம்' };
      timing = { en: 'During land preparation', ta: 'நிலம் தயாரிக்கும் போது' };
      estimatedCost = 1500;
    }
  } else if (data.cropType === 'Sugarcane') {
    recommendedFertilizer = { en: 'Ammonium Sulphate', ta: 'அம்மோனியம் சல்பேட்' };
    npkRatio = '21:0:0';
    fertilizerType = { en: 'Chemical', ta: 'ரசாயன உரம்' };
    fertilizerQuantity = 200;
    applicationMethod = { en: 'Top dressing', ta: 'மேல் உரம்' };
    timing = { en: '60 days after planting', ta: 'நட்ட 60 நாட்களுக்குப் பிறகு' };
    estimatedCost = 2500;
    expectedYieldIncrease = 30;
  } else if (deficiencies.n || deficiencies.p || deficiencies.k) {
    recommendedFertilizer = { en: 'NPK Complex (20:20:20)', ta: 'NPK கலவை உரம் (20:20:20)' };
    npkRatio = '20:20:20';
    fertilizerType = { en: 'Chemical', ta: 'ரசாயன உரம்' };
    fertilizerQuantity = 100;
    applicationMethod = { en: 'Basal', ta: 'அடி உரம்' };
    timing = { en: 'During sowing', ta: 'விதைக்கும் போது' };
    estimatedCost = 1200;
    expectedYieldIncrease = 25;
  }

  // Sustainable Suggestions
  const sustainableSuggestions = {
    en: ['Use Vermicompost', 'Apply Green Manure', 'Practice Crop Rotation with Legumes'],
    ta: ['மண்புழு உரம் பயன்படுத்தவும்', 'பசுந்தாள் உரம் இடவும்', 'பயறு வகை பயிர்களுடன் பயிர் சுழற்சி செய்யவும்']
  };

  // Risk Warning
  const overuseRisk = data.n > 350 || data.p > 100 || data.k > 350;
  const riskWarning = {
    en: overuseRisk ? 'High risk of soil acidity and groundwater pollution. Reduce chemical usage.' : 'Maintain current balanced fertilization.',
    ta: overuseRisk ? 'மண் அமிலத்தன்மை மற்றும் நிலத்தடி நீர் மாசுபடும் அபாயம் அதிகம். ரசாயன பயன்பாட்டைக் குறைக்கவும்.' : 'தற்போதைய சீரான உரமிடுதலைத் தொடரவும்.'
  };

  // Simple Explanation
  const simpleExplanation = {
    en: `Your soil is ${soilHealthStatus.en.toLowerCase()}. By following the recommendations, you can improve yield by ${expectedYieldIncrease}%.`,
    ta: `உங்கள் மண் ${soilHealthStatus.ta.toLowerCase()}. பரிந்துரைகளைப் பின்பற்றுவதன் மூலம், நீங்கள் விளைச்சலை ${expectedYieldIncrease}% அதிகரிக்கலாம்.`
  };
  
  // Profit and Savings Estimates
  const profitEstimate = Math.round(data.previousYield * (expectedYieldIncrease / 100) * 20);
  const savings = Math.round(estimatedCost * 0.15);

  return {
    soilHealthStatus,
    soilHealthScore,
    carbonSustainabilityScore,
    deficiencies,
    recommendedFertilizer,
    npkRatio,
    fertilizerType,
    fertilizerQuantity,
    applicationMethod,
    timing,
    formattedDeficiencies,
    sustainableSuggestions,
    riskWarning,
    expectedYieldIncrease,
    simpleExplanation,
    profitEstimate,
    savings,
    overuseRisk,
    timestamp: Date.now()
  };
}
