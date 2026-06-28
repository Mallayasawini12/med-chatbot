import React from 'react';
import { Phone, ShieldAlert, Heart, Activity } from 'lucide-react';

export const EmergencySection: React.FC = () => {
  
  const emergencyNumbers = [
    { region: 'United States & Canada', number: '911', note: 'All medical, fire, & police emergencies' },
    { region: 'European Union & Generic', number: '112', note: 'Standard European emergency line' },
    { region: 'United Kingdom', number: '999', note: 'UK emergency services dispatcher' },
    { region: 'US Suicide & Crisis Lifeline', number: '988', note: 'Mental health and crisis support' },
    { region: 'US Poison Control Center', number: '1-800-222-1222', note: '24/7 toxic substance helpline' },
  ];

  const strokeFast = [
    { letter: 'F', title: 'Face Drooping', desc: 'Ask the person to smile. Does one side of the face droop?' },
    { letter: 'A', title: 'Arm Weakness', desc: 'Ask the person to raise both arms. Does one arm drift downward?' },
    { letter: 'S', title: 'Speech Difficulty', desc: 'Ask the person to repeat a simple phrase. Is their speech slurred?' },
    { letter: 'T', title: 'Time to Call', desc: 'If you observe any of these signs, call emergency services immediately.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Red Critical Warning Banner */}
      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4">
        <div className="p-3 bg-red-500 rounded-2xl text-white flex-shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="text-lg font-extrabold text-red-800 dark:text-red-400">Emergency Warning Notice</h2>
          <p className="text-xs text-red-750/90 dark:text-red-300/80 leading-relaxed">
            If you or someone nearby is experiencing chest discomfort, sudden breathing difficulties, heavy bleeding, sudden paralysis/numbness, or confusion, do not wait! Call emergency services immediately. Time saved is life saved.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Phone Contacts */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <Phone className="w-5 h-5 text-red-500" />
            <span>Emergency Hotlines</span>
          </h3>

          <div className="space-y-3">
            {emergencyNumbers.map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850/80 hover:border-red-500/30 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{item.region}</h4>
                  <p className="font-extrabold text-slate-800 dark:text-white text-base mt-0.5">{item.number}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">{item.note}</p>
                </div>
                <a
                  href={`tel:${item.number.replace(/-/g, '')}`}
                  className="p-3 bg-red-500 hover:bg-red-650 text-white rounded-xl shadow-md shadow-red-500/10 hover:shadow-red-500/25 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
                >
                  <Phone className="w-4 h-4 fill-current" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: First Aid Guides */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Stroke FAST guide */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border-l-4 border-l-amber-500">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Stroke Recognition: FAST Method</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strokeFast.map((item) => (
                <div key={item.letter} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black flex-shrink-0 text-sm border border-amber-500/20">
                    {item.letter}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heart Attack Warnings checklist */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border-l-4 border-l-rose-500">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center space-x-2">
              <Heart className="w-5 h-5 text-rose-500 fill-current" />
              <span>Heart Attack Warning Signs</span>
            </h3>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-650 dark:text-slate-350 list-disc pl-4 leading-relaxed">
              <li>Chest tightness, pressure, squeeze, or aching.</li>
              <li>Pain spreading to jaw, neck, back, or arms.</li>
              <li>Sudden shortness of breath or dizziness.</li>
              <li>Cold sweat, nausea, or sudden lightheadedness.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
