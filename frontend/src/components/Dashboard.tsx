import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Heart, 
  Activity, 
  ChevronRight, 
  Clock, 
  PlusCircle, 
  AlertTriangle, 
  BookOpen,
  Thermometer, 
  Wind, 
  Cookie, 
  Droplets, 
  Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatSession {
  _id: string;
  title: string;
  createdAt: string;
  symptoms: string[];
  summary?: {
    conditions: string[];
    recommendation: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    firstAid?: string;
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Vitals State
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(72);
  const [temperature, setTemperature] = useState<number>(98.6);
  const [spo2, setSpo2] = useState<number>(98);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);

  // Load vitals history
  useEffect(() => {
    const saved = localStorage.getItem('vitals_history');
    if (saved) {
      try {
        setVitalsHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog = {
      systolic,
      diastolic,
      heartRate,
      temperature,
      spo2,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedHistory = [newLog, ...vitalsHistory].slice(0, 3); // keep last 3 logs
    setVitalsHistory(updatedHistory);
    localStorage.setItem('vitals_history', JSON.stringify(updatedHistory));
  };

  const getBpStatus = (sys: number, dia: number) => {
    if (!sys || !dia) return { label: '--', styles: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    if (sys < 90 || dia < 60) return { label: 'Low BP', styles: 'text-sky-600 bg-sky-500/10 border-sky-500/20' };
    if (sys <= 120 && dia <= 80) return { label: 'Optimal', styles: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    if (sys <= 139 || dia <= 89) return { label: 'Pre-HTN', styles: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Hypertension', styles: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  };

  const getHrStatus = (bpm: number) => {
    if (!bpm) return { label: '--', styles: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    if (bpm < 60) return { label: 'Bradycardia', styles: 'text-sky-600 bg-sky-500/10 border-sky-500/20' };
    if (bpm <= 100) return { label: 'Normal', styles: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    return { label: 'Tachycardia', styles: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  };

  const getTempStatus = (temp: number) => {
    if (!temp) return { label: '--', styles: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    if (temp < 97.0) return { label: 'Hypothermia', styles: 'text-sky-600 bg-sky-500/10 border-sky-500/20' };
    if (temp <= 99.0) return { label: 'Normal', styles: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    if (temp <= 100.4) return { label: 'Low Fever', styles: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    return { label: 'High Fever', styles: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  };

  const getSpStatus = (sat: number) => {
    if (!sat) return { label: '--', styles: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    if (sat >= 95) return { label: 'Normal', styles: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    if (sat >= 90) return { label: 'Mild Hypoxia', styles: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Severe Hypoxia', styles: 'text-rose-600 bg-rose-500/10 border-rose-500/20' };
  };

  // Core health tips data
  const healthTips = [
    {
      title: 'Optimal Hydration',
      desc: 'Drink at least 8-10 glasses of water daily. Staying hydrated supports kidney function, skin vitality, and energy levels.',
      category: 'Hydration',
      color: 'from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400'
    },
    {
      title: 'Prioritize Sound Sleep',
      desc: 'Aim for 7-9 hours of restful sleep nightly. Sleep is the primary cycle during which your body performs muscular and cellular repairs.',
      category: 'Rest',
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Stretching Breaks',
      desc: 'If sitting for extended intervals, stand and stretch for 5 minutes every hour to improve muscular blood flow and spinal alignment.',
      category: 'Activity',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400'
    }
  ];

  // Quick categories
  const categories = [
    { name: 'Fever', icon: Thermometer, query: 'I have a fever', desc: 'High body temperature', color: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' },
    { name: 'Headache', icon: Brain, query: 'I have a headache', desc: 'Head or temple pain', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
    { name: 'Cough', icon: Wind, query: 'I have a dry/wet cough', desc: 'Throat irritation', color: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400' },
    { name: 'Stomach Pain', icon: Cookie, query: 'I have stomach pain', desc: 'Abdominal distress', color: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
    { name: 'Cold & Flu', icon: Droplets, query: 'I have cold and flu symptoms', desc: 'Chills & congestion', color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' },
  ];

  useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        const res = await api.get('/chat/sessions');
        setSessions(res.data.slice(0, 3)); // Keep the 3 most recent
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  const handleCategoryClick = async (queryText: string) => {
    try {
      // Create a new session automatically with the category query as initialMessage
      const res = await api.post('/chat/sessions', { initialMessage: queryText });
      navigate(`/chat?session=${res.data._id}`);
    } catch (err) {
      console.error('Error starting category consultation:', err);
      // Fallback: navigate to chat screen directly
      navigate('/chat');
    }
  };

  const getUrgencyBadgeColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400';
      case 'high': return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400';
      case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400';
      case 'low':
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Welcome Card Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glow-teal">
        <div className="space-y-2 z-10">
          <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-semibold">
            <Heart className="w-5 h-5 fill-current animate-pulse" />
            <span>Consultation System Online</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
            Hello, {user?.name || 'User'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
            Analyze symptoms, review logs, and receive safety suggestions. Select a quick category to consult with the AI.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/chat')}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 hover:scale-[1.02] flex items-center space-x-2 z-10 text-sm cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Symptom Check</span>
        </button>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Symptom Category Quick Start Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Quick Symptom Check</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.query)}
                className={`glass-card p-5 rounded-2xl text-left border flex flex-col justify-between h-36 ${cat.color} hover:scale-[1.03] transition-all cursor-pointer`}
              >
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/80 w-fit shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{cat.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. History & Tips Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Symptom Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Recent Evaluations</span>
            </h3>
            {sessions.length > 0 && (
              <button
                onClick={() => navigate('/chat')}
                className="text-xs font-semibold text-teal-600 hover:underline flex items-center"
              >
                <span>View all</span>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center space-y-3 h-52">
              <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading consultation logs...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center h-52 flex flex-col items-center justify-center space-y-4 border border-dashed border-slate-200 dark:border-slate-800">
              <div className="p-3.5 bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-400">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">No consultations yet</p>
                <p className="text-xs text-slate-400 mt-1">Start a check to save your medical history logs here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => navigate(`/chat?session=${session._id}`)}
                  className="glass-card p-4.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 hover:border-teal-500/20 cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[200px] sm:max-w-xs block">
                        {session.title}
                      </span>
                      {session.summary?.urgency && (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getUrgencyBadgeColor(session.summary.urgency)}`}>
                          {session.summary.urgency}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-3">
                      <span>{formatDate(session.createdAt)}</span>
                      {session.symptoms?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px] sm:max-w-xs">{session.symptoms.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-500/10 transition-all flex-shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Disclaimer widget */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700/85 dark:text-amber-400/80 leading-relaxed">
              <strong>Clinical Notice:</strong> SymptomCare AI provides general informational assessments. It does not replace professional clinical diagnostic evaluation or emergency triage. Call emergency services in any critical event.
            </p>
          </div>
        </div>

        {/* Right Column: Vitals Tracker + Health Tips */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Vitals Tracker */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-900">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span>Patient Vitals Logger</span>
            </h3>

            <form onSubmit={handleLogVitals} className="space-y-3.5">
              {/* BP Inputs */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blood Pressure (mmHg)</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBpStatus(systolic, diastolic).styles}`}>
                    {getBpStatus(systolic, diastolic).label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    placeholder="Sys"
                    min="60"
                    max="220"
                    className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    placeholder="Dia"
                    min="40"
                    max="140"
                    className="w-1/2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Heart Rate & SpO2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Heart Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Heart Rate (bpm)</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getHrStatus(heartRate).styles}`}>
                      {getHrStatus(heartRate).label}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    placeholder="72"
                    min="30"
                    max="200"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Oxygen Saturation SpO2 */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Oxygen (SpO2 %)</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getSpStatus(spo2).styles}`}>
                      {getSpStatus(spo2).label}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    placeholder="98"
                    min="50"
                    max="100"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Body Temperature (°F)</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getTempStatus(temperature).styles}`}>
                    {getTempStatus(temperature).label}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  placeholder="98.6"
                  min="90"
                  max="110"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Today's Vitals</span>
              </button>
            </form>

            {/* History Logs list */}
            {vitalsHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-900/80 space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recent Vital Logs</span>
                <div className="space-y-1.5">
                  {vitalsHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[10px] border border-slate-100 dark:border-slate-850">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-350">BP: {h.systolic}/{h.diastolic}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">HR: {h.heartRate} bpm</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">Temp: {h.temperature}°F</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">SpO2: {h.spo2}%</span>
                      </div>
                      <span className="text-slate-400 flex-shrink-0 font-medium">{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Health Guidance */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Health Guidance</span>
            </h3>

            <div className="space-y-4">
              {healthTips.slice(0, 2).map((tip, idx) => (
                <div
                  key={idx}
                  className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-md">
                        {tip.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1.5">{tip.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
