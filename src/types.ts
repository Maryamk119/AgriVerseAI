export type Language = 'en' | 'ta';

export interface SoilNutrients {
  n: number;
  p: number;
  k: number;
}

export interface SoilConditions {
  ph: number;
  moisture: number;
  organicCarbon: number;
}

export interface FarmInfo {
  cropType: string;
  growthStage: string;
  previousYield: number; // kg per acre
  district: string;
  season: string;
}

export interface SoilData extends SoilNutrients, SoilConditions, FarmInfo {}

export interface DeficiencyStatus {
  n: boolean;
  p: boolean;
  k: boolean;
  organicCarbon: boolean;
  moisture: boolean;
}

export interface AnalysisResult {
  soilHealthStatus: {
    en: 'Healthy' | 'Moderate' | 'Deficient';
    ta: 'ஆரோக்கியமானது' | 'மிதமானது' | 'குறைபாடுள்ளது';
  };
  soilHealthScore: number;
  carbonSustainabilityScore: number;
  deficiencies: DeficiencyStatus;
  recommendedFertilizer: {
    en: string;
    ta: string;
  };
  npkRatio: string;
  fertilizerType: {
    en: 'Organic' | 'Chemical' | 'Biofertilizer';
    ta: 'இயற்கை உரம்' | 'ரசாயன உரம்' | 'உயிர் உரம்';
  };
  fertilizerQuantity: number; // kg per acre
  applicationMethod: {
    en: 'Basal' | 'Top dressing';
    ta: 'அடி உரம்' | 'மேல் உரம்';
  };
  timing: {
    en: string;
    ta: string;
  };
  formattedDeficiencies: {
    en: string;
    ta: string;
  };
  sustainableSuggestions: {
    en: string[];
    ta: string[];
  };
  riskWarning: {
    en: string;
    ta: string;
  };
  expectedYieldIncrease: number; // percentage
  simpleExplanation: {
    en: string;
    ta: string;
  };
  profitEstimate: number;
  savings: number;
  overuseRisk: boolean;
  timestamp: number;
}

export const CROPS = [
  'Paddy', 'Banana', 'Sugarcane', 'Cotton', 'Maize', 'Groundnut', 'Turmeric'
];

export const GROWTH_STAGES = [
  'Seedling', 'Vegetative', 'Flowering', 'Maturity'
];

export interface Alert {
  id: string;
  type: 'low_nutrient' | 'excess_fertilizer' | 'degradation';
  title: {
    en: string;
    ta: string;
  };
  message: {
    en: string;
    ta: string;
  };
  severity: 'warning' | 'error' | 'info';
}

export interface FarmerProfile {
  name: string;
  location: string;
  farmSize: number;
}

export interface SoilRecord {
  id: string;
  data: SoilData;
  result: AnalysisResult;
  timestamp: number;
  synced: boolean;
}
