import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Activity, 
  FlaskConical, 
  ClipboardCheck, 
  Bell, 
  User, 
  Mic, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp,
  Wifi,
  WifiOff,
  Languages,
  History,
  CloudUpload,
  Droplets,
  ArrowRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Language, 
  SoilData, 
  AnalysisResult, 
  Alert, 
  CROPS, 
  GROWTH_STAGES,
  SoilRecord,
  FarmerProfile
} from './types';
import { analyzeSoil } from './soilEngine';
import { translations } from './translations';
import { storage } from './storage';

type Screen = 'welcome' | 'dashboard' | 'input' | 'results' | 'recommendations' | 'alerts' | 'voice' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [lang, setLang] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [soilData, setSoilData] = useState<SoilData>({
    n: 120,
    p: 25,
    k: 140,
    ph: 6.5,
    moisture: 45,
    organicCarbon: 0.8,
    cropType: 'Paddy',
    growthStage: 'Vegetative',
    previousYield: 2500,
    district: '',
    season: 'Kharif'
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');
  const [records, setRecords] = useState<SoilRecord[]>([]);
  const [profile, setProfile] = useState<FarmerProfile>({
    name: 'Farmer Maryam',
    location: 'Tamil Nadu, India',
    farmSize: 5
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load records
    setRecords(storage.getRecords());
    
    // Load profile
    const savedProfile = storage.getProfile();
    if (savedProfile) setProfile(savedProfile);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && records.length > 0) {
      syncData();
    }
  }, [isOnline]);

  const syncData = async () => {
    if (!isOnline) return;
    
    const unsynced = records.filter(r => !r.synced);
    if (unsynced.length === 0) return;

    setIsSyncing(true);
    
    // Mock sync for each record
    for (const record of unsynced) {
      await new Promise(r => setTimeout(r, 1000));
      const updatedRecord = { ...record, synced: true };
      storage.updateRecord(updatedRecord);
    }
    
    setRecords(storage.getRecords());
    setIsSyncing(false);
  };

  const [errors, setErrors] = useState<Partial<Record<keyof SoilData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SoilData, string>> = {};
    if (soilData.n < 0 || soilData.n > 500) newErrors.n = '0-500';
    if (soilData.p < 0 || soilData.p > 500) newErrors.p = '0-500';
    if (soilData.k < 0 || soilData.k > 500) newErrors.k = '0-500';
    if (soilData.ph < 0 || soilData.ph > 14) newErrors.ph = '0-14';
    if (soilData.moisture < 0 || soilData.moisture > 100) newErrors.moisture = '0-100';
    if (soilData.organicCarbon < 0 || soilData.organicCarbon > 10) newErrors.organicCarbon = '0-10';
    if (!soilData.district.trim()) newErrors.district = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalyze = () => {
    if (!validate()) return;
    const analysis = analyzeSoil(soilData);
    setResult(analysis);
    
    // Save locally
    const record: SoilRecord = {
      id: Date.now().toString(),
      data: soilData,
      result: analysis,
      timestamp: Date.now(),
      synced: false
    };
    storage.saveRecord(record);
    setRecords(storage.getRecords());

    // Trigger sync if online
    if (isOnline) {
      syncData();
    }

    // Generate Alerts
    const newAlerts: Alert[] = [];
    if (analysis.soilHealthScore < 50) {
      newAlerts.push({
        id: '1',
        type: 'low_nutrient',
        title: { en: 'Low Nutrient Alert', ta: 'குறைந்த ஊட்டச்சத்து எச்சரிக்கை' },
        message: { en: 'Your soil needs immediate fertilization.', ta: 'உங்கள் மண்ணுக்கு உடனடியாக உரம் தேவை.' },
        severity: 'error'
      });
    }
    if (analysis.overuseRisk) {
      newAlerts.push({
        id: '2',
        type: 'excess_fertilizer',
        title: { en: 'Excess Fertilizer Warning', ta: 'அதிக உரம் எச்சரிக்கை' },
        message: { en: 'High nutrient levels detected. Risk of soil toxicity.', ta: 'அதிக ஊட்டச்சத்து அளவு கண்டறியப்பட்டது. மண் நச்சுத்தன்மை அபாயம்.' },
        severity: 'warning'
      });
    }
    setAlerts(newAlerts);
    setCurrentScreen('report');
  };

  const startVoiceAssistant = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang === 'en' ? 'en-US' : 'ta-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceResult('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceResult(transcript);
      
      // Process command
      setTimeout(() => {
        const lowerTranscript = transcript.toLowerCase();
        if (
          lowerTranscript.includes('analyze') || 
          lowerTranscript.includes('soil') || 
          lowerTranscript.includes('மண்') || 
          lowerTranscript.includes('பரிசோதனை')
        ) {
          handleAnalyze();
        } else if (
          lowerTranscript.includes('dashboard') || 
          lowerTranscript.includes('முகப்பு')
        ) {
          setCurrentScreen('dashboard');
        } else if (
          lowerTranscript.includes('recommend') || 
          lowerTranscript.includes('fertilizer') || 
          lowerTranscript.includes('உரம்')
        ) {
          if (result) {
            setCurrentScreen('recommendations');
          } else {
            setCurrentScreen('input');
          }
        }
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const NavItem = ({ screen, icon: Icon, label }: { screen: Screen, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentScreen(screen)}
      className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${currentScreen === screen ? 'text-emerald-600' : 'text-stone-400'}`}
    >
      <Icon size={24} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans pb-20">
      {/* Status Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'}`}>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? t.onlineMode : t.offlineMode}
        </div>
        {isSyncing && (
          <div className="flex items-center gap-2">
            <CloudUpload size={12} className="animate-bounce" />
            {t.syncing}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentScreen === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center p-8 bg-[#4A3728] text-white text-center"
          >
            <div className="bg-white/10 p-6 rounded-full mb-8 backdrop-blur-sm">
              <Sprout size={80} className="text-emerald-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">AgriVerse AI</h1>
            <p className="text-stone-300 text-lg mb-12">{t.tagline}</p>
            
            <div className="flex gap-4 mb-12">
              <button 
                onClick={() => setLang('en')}
                className={`px-6 py-2 rounded-full font-bold transition-all ${lang === 'en' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-stone-300'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLang('ta')}
                className={`px-6 py-2 rounded-full font-bold transition-all ${lang === 'ta' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-stone-300'}`}
              >
                தமிழ்
              </button>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
              >
                {t.getStarted}
              </button>
              <button 
                onClick={() => setCurrentScreen('voice')}
                className="w-full bg-white/10 text-white py-4 rounded-2xl font-bold text-lg backdrop-blur-sm active:scale-95 transition-transform border border-white/20 flex items-center justify-center gap-3"
              >
                <Mic size={24} />
                {t.voiceAssistant}
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 pt-12 space-y-6"
          >
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#4A3728]">{lang === 'en' ? 'Hello, Farmer!' : 'வணக்கம், விவசாயி!'}</h2>
                <p className="text-stone-500 text-sm">{lang === 'en' ? 'Your farm status today' : 'இன்று உங்கள் பண்ணை நிலை'}</p>
              </div>
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-[#4A3728]">
                <User size={24} />
              </div>
            </header>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{t.soilHealth}</h3>
                <p className="text-3xl font-black text-emerald-600">{result?.soilHealthScore || 0}%</p>
                <p className="text-xs text-stone-300 mt-1">{t.saved}</p>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-50" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * (result?.soilHealthScore || 0)) / 100} className="text-emerald-500 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={20} className="text-[#4A3728]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[32px] shadow-sm border border-stone-100">
                <div className="bg-stone-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-3">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{t.yieldIncrease}</p>
                <p className="text-xl font-bold">+{result?.expectedYieldIncrease || 0}%</p>
              </div>
              <div className="bg-white p-5 rounded-[32px] shadow-sm border border-stone-100">
                <div className="bg-stone-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-3">
                  <FlaskConical size={20} className="text-emerald-600" />
                </div>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{t.carbonSustainability}</p>
                <p className="text-xl font-bold">{result?.carbonSustainabilityScore || 0}%</p>
              </div>
            </div>

            <div className="bg-[#4A3728] p-6 rounded-[32px] text-white shadow-lg shadow-stone-200/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-stone-300 text-xs font-bold uppercase tracking-wider mb-1">{t.recommendedFertilizer}</p>
                  <h4 className="text-xl font-bold">{result?.recommendedFertilizer[lang] || '---'}</h4>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign size={16} className="text-emerald-400" />
                {t.profitEstimate}: ${result?.profitEstimate || 0}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                <History size={16} />
                {lang === 'en' ? 'Recent Tests' : 'சமீபத்திய சோதனைகள்'}
              </h3>
              {records.slice(0, 3).map(rec => (
                <div key={rec.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{rec.data.cropType}</p>
                    <p className="text-[10px] text-stone-400">{new Date(rec.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-emerald-600 font-black flex items-center gap-2">
                    {rec.synced ? <CheckCircle2 size={12} className="text-emerald-500" /> : <CloudUpload size={12} className="text-stone-300" />}
                    {rec.result.soilHealthScore}%
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {currentScreen === 'input' && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 pt-12 space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-[#4A3728]">{t.soilTest}</h2>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold uppercase shadow-sm">{t.manualInput}</button>
                <button onClick={() => setCurrentScreen('voice')} className="px-3 py-1 text-[10px] font-bold uppercase text-stone-400">{t.voiceInput}</button>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{t.nutrients}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['n', 'p', 'k'].map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase ml-2">{t[key as keyof typeof t]}</label>
                      <input 
                        type="number" 
                        value={soilData[key as keyof SoilData] as number}
                        onChange={(e) => setSoilData({...soilData, [key]: Number(e.target.value)})}
                        className={`w-full bg-white border-2 rounded-2xl p-4 font-bold text-lg outline-none transition-colors ${errors[key as keyof SoilData] ? 'border-red-500' : 'border-stone-100 focus:border-emerald-500'}`}
                      />
                      {errors[key as keyof SoilData] && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{errors[key as keyof SoilData]}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{t.soilConditions}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase ml-2">{t.ph}</label>
                      <input 
                        type="number" step="0.1"
                        value={soilData.ph}
                        onChange={(e) => setSoilData({...soilData, ph: Number(e.target.value)})}
                        className={`w-full bg-white border-2 rounded-2xl p-4 font-bold outline-none ${errors.ph ? 'border-red-500' : 'border-stone-100 focus:border-emerald-500'}`}
                      />
                      {errors.ph && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{errors.ph}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase ml-2">{t.moisture} (%)</label>
                      <input 
                        type="number"
                        value={soilData.moisture}
                        onChange={(e) => setSoilData({...soilData, moisture: Number(e.target.value)})}
                        className={`w-full bg-white border-2 rounded-2xl p-4 font-bold outline-none ${errors.moisture ? 'border-red-500' : 'border-stone-100 focus:border-emerald-500'}`}
                      />
                      {errors.moisture && <p className="text-[8px] text-red-500 font-bold ml-2 uppercase">{errors.moisture}</p>}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{t.farmDetails}</h3>
                <div className="space-y-4">
                  <select 
                    value={soilData.cropType}
                    onChange={(e) => setSoilData({...soilData, cropType: e.target.value})}
                    className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none appearance-none"
                  >
                    {CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                  </select>
                  <input 
                    type="number"
                    placeholder={t.prevYield}
                    value={soilData.previousYield}
                    onChange={(e) => setSoilData({...soilData, previousYield: Number(e.target.value)})}
                    className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text"
                      placeholder={t.district}
                      value={soilData.district}
                      onChange={(e) => setSoilData({...soilData, district: e.target.value})}
                      className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                    />
                    <select 
                      value={soilData.season}
                      onChange={(e) => setSoilData({...soilData, season: e.target.value})}
                      className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                    >
                      <option value="Kharif">Kharif</option>
                      <option value="Rabi">Rabi</option>
                      <option value="Zaid">Zaid</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>

            <button 
              onClick={handleAnalyze}
              className="w-full bg-emerald-600 text-white py-5 rounded-[32px] font-black text-xl shadow-xl shadow-emerald-100 active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              <Activity size={24} />
              {t.analyzeSoil}
            </button>
          </motion.div>
        )}

        {currentScreen === 'report' && result && (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 pt-12 space-y-6 pb-32"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-[#4A3728]">{t.results}</h2>
              <button 
                onClick={() => window.print()} 
                className="p-3 bg-stone-100 rounded-2xl text-stone-600 active:scale-95 transition-transform"
              >
                <Download size={20} />
              </button>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 space-y-8">
              {/* English Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-stone-100 pb-2">English Report</h3>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Soil Health Status:</span>
                    <span className={`font-black ${result.soilHealthStatus.en === 'Healthy' ? 'text-emerald-600' : result.soilHealthStatus.en === 'Moderate' ? 'text-amber-600' : 'text-red-600'}`}>
                      {result.soilHealthStatus.en}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Nutrient Deficiency:</span>
                    <span className="font-bold text-stone-800">{result.formattedDeficiencies.en}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Recommended Fertilizer:</span>
                    <span className="font-bold text-stone-800">{result.recommendedFertilizer.en}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Required NPK Ratio:</span>
                    <span className="font-mono font-bold text-stone-800">{result.npkRatio}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Quantity per Acre:</span>
                    <span className="font-bold text-stone-800">{result.fertilizerQuantity} kg</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Application Method:</span>
                    <span className="font-bold text-stone-800">{result.applicationMethod.en}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Sustainable Suggestions:</span>
                    <span className="font-bold text-stone-800">{result.sustainableSuggestions.en.join(', ')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Risk Warning:</span>
                    <span className="font-bold text-amber-600">{result.riskWarning.en}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Expected Yield Improvement:</span>
                    <span className="font-black text-emerald-600">+{result.expectedYieldIncrease}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Simple Explanation:</span>
                    <span className="font-bold italic text-stone-600">"{result.simpleExplanation.en}"</span>
                  </div>
                </div>
              </div>

              {/* Tamil Section */}
              <div className="space-y-4 pt-8 border-t-2 border-dashed border-stone-100">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-stone-100 pb-2">தமிழ் அறிக்கை</h3>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">மண் ஆரோக்கிய நிலை:</span>
                    <span className={`font-black ${result.soilHealthStatus.en === 'Healthy' ? 'text-emerald-600' : result.soilHealthStatus.en === 'Moderate' ? 'text-amber-600' : 'text-red-600'}`}>
                      {result.soilHealthStatus.ta}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">குறைவான சத்து:</span>
                    <span className="font-bold text-stone-800">{result.formattedDeficiencies.ta}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">பரிந்துரைக்கப்படும் உரம்:</span>
                    <span className="font-bold text-stone-800">{result.recommendedFertilizer.ta}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">தேவையான NPK விகிதம்:</span>
                    <span className="font-mono font-bold text-stone-800">{result.npkRatio}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">ஒரு ஏக்கருக்கு தேவையான அளவு:</span>
                    <span className="font-bold text-stone-800">{result.fertilizerQuantity} கிலோ</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">பயன்படுத்தும் முறை:</span>
                    <span className="font-bold text-stone-800">{result.applicationMethod.ta}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">சுற்றுச்சூழல் நட்பு பரிந்துரைகள்:</span>
                    <span className="font-bold text-stone-800">{result.sustainableSuggestions.ta.join(', ')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">எச்சரிக்கை:</span>
                    <span className="font-bold text-amber-600">{result.riskWarning.ta}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">எதிர்பார்க்கப்படும் விளைச்சல் உயர்வு:</span>
                    <span className="font-black text-emerald-600">+{result.expectedYieldIncrease}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">எளிய விளக்கம்:</span>
                    <span className="font-bold italic text-stone-600">"{result.simpleExplanation.ta}"</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
              >
                {t.dashboard}
              </button>
              <button 
                onClick={() => setCurrentScreen('input')}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
              >
                New Test
              </button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'alerts' && (
          <motion.div 
            key="alerts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 pt-12 space-y-6"
          >
            <h2 className="text-3xl font-black text-[#4A3728]">{t.alerts}</h2>
            <div className="space-y-4">
              {alerts.length > 0 ? alerts.map(alert => (
                <div key={alert.id} className={`p-6 rounded-[32px] border-l-8 shadow-sm ${
                  alert.severity === 'error' ? 'bg-red-50 border-red-500' : 
                  alert.severity === 'warning' ? 'bg-orange-50 border-orange-500' : 
                  'bg-blue-50 border-blue-500'
                }`}>
                  <h4 className="font-black text-sm uppercase tracking-widest mb-1">{alert.title[lang]}</h4>
                  <p className="text-sm opacity-80">{alert.message[lang]}</p>
                </div>
              )) : (
                <div className="text-center py-20 text-stone-400">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">{lang === 'en' ? 'No new alerts' : 'புதிய அறிவிப்புகள் இல்லை'}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {currentScreen === 'voice' && (
          <motion.div 
            key="voice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-screen flex flex-col items-center justify-center p-8 bg-emerald-600 text-white text-center"
          >
            <div className="mb-12">
              <h2 className="text-3xl font-black mb-2">{t.voiceAssistant}</h2>
              <p className="text-emerald-100 opacity-80">{t.speakCommand}</p>
            </div>

            <div className="relative mb-12">
              <motion.div 
                animate={isListening ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-white/20 rounded-full"
              />
              <button 
                onClick={startVoiceAssistant}
                disabled={isListening}
                className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-2xl active:scale-95 transition-transform"
              >
                <Mic size={48} />
              </button>
            </div>

            {isListening && <p className="text-xl font-bold animate-pulse">{t.listening}</p>}
            {voiceResult && (
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm w-full">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">{lang === 'en' ? 'Recognized:' : 'அடையாளம் காணப்பட்டது:'}</p>
                <p className="text-2xl font-black italic">"{voiceResult}"</p>
              </div>
            )}

            <div className="mt-12 text-left w-full space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t.examples}</p>
              <div className="space-y-2">
                <p className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold">{t.ex1}</p>
                <p className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold">{t.ex2}</p>
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 pt-12 space-y-8"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center text-[#4A3728] border-4 border-white shadow-xl">
                <User size={64} />
              </div>
              {isEditingProfile ? (
                <div className="w-full space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">{t.farmerName}</label>
                    <input 
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">{t.location}</label>
                    <input 
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-400 uppercase ml-2">{t.farmSize}</label>
                    <input 
                      type="number"
                      value={profile.farmSize}
                      onChange={(e) => setProfile({...profile, farmSize: Number(e.target.value)})}
                      className="w-full bg-white border-2 border-stone-100 rounded-2xl p-4 font-bold focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      storage.saveProfile(profile);
                      setIsEditingProfile(false);
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg"
                  >
                    {t.saveProfile}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-black text-[#4A3728]">{profile.name}</h2>
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">{profile.location}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-stone-100 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-[#4A3728]"
                  >
                    {t.editProfile}
                  </button>
                </>
              )}
            </div>

            {!isEditingProfile && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Total Tests</p>
                    <p className="text-2xl font-black">{records.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Farm Size</p>
                    <p className="text-2xl font-black">{profile.farmSize} Acres</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-white p-5 rounded-2xl font-bold text-left flex items-center justify-between border border-stone-100">
                    <span>{lang === 'en' ? 'Language Settings' : 'மொழி அமைப்புகள்'}</span>
                    <Languages size={20} className="text-stone-400" />
                  </button>
                  <button 
                    onClick={syncData}
                    disabled={isSyncing || !isOnline}
                    className="w-full bg-white p-5 rounded-2xl font-bold text-left flex items-center justify-between border border-stone-100 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <CloudUpload size={20} className={isSyncing ? 'animate-bounce text-emerald-600' : 'text-stone-400'} />
                      <span>{lang === 'en' ? 'Sync Data' : 'தரவை ஒத்திசை'}</span>
                    </div>
                    {isSyncing ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <ChevronRight size={20} className="text-stone-300" />}
                  </button>
                  <button className="w-full bg-white p-5 rounded-2xl font-bold text-left flex items-center justify-between border border-stone-100">
                    <span>{lang === 'en' ? 'Sync History' : 'ஒத்திசைவு வரலாறு'}</span>
                    <History size={20} className="text-stone-400" />
                  </button>
                  <button 
                    onClick={() => {
                      storage.clearAll();
                      setRecords([]);
                      setProfile({ name: 'Farmer Maryam', location: 'Tamil Nadu, India', farmSize: 5 });
                      setCurrentScreen('welcome');
                    }}
                    className="w-full bg-red-50 p-5 rounded-2xl font-bold text-left text-red-600 flex items-center justify-between border border-red-100"
                  >
                    <span>{lang === 'en' ? 'Clear Data' : 'தரவை அழி'}</span>
                    <AlertTriangle size={20} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {currentScreen !== 'welcome' && currentScreen !== 'voice' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-2 pb-6 pt-2 flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <NavItem screen="dashboard" icon={Activity} label={t.dashboard} />
          <NavItem screen="input" icon={FlaskConical} label={t.soilTest} />
          <NavItem screen="recommendations" icon={ClipboardCheck} label={t.recommendations} />
          <NavItem screen="alerts" icon={Bell} label={t.alerts} />
          <NavItem screen="profile" icon={User} label={t.profile} />
        </nav>
      )}

      {/* Voice Assistant Floating Button */}
      {currentScreen !== 'welcome' && currentScreen !== 'voice' && (
        <button 
          onClick={() => setCurrentScreen('voice')}
          className="fixed bottom-24 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-transform"
        >
          <Mic size={32} />
        </button>
      )}
    </div>
  );
}
