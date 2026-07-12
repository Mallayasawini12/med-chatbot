import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Send, 
  Mic, 
  MicOff, 
  Trash2, 
  PlusCircle, 
  MessageSquare, 
  Stethoscope, 
  FileText, 
  Info,
  X,
  AlertTriangle,
  Printer,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SymptomSummary {
  conditions: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  firstAid?: string;
  recommendedSpecialist?: string;
  medications?: string[];
}

interface ChatSession {
  _id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  symptoms: string[];
  summary?: SymptomSummary;
}

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('session');

  // Chat sessions list
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  
  // Message input & status
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // Voice Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionDetails(activeSessionId);
    } else {
      setActiveSession(null);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, responding]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      setActiveSession(res.data);
    } catch (err) {
      console.error('Failed to get session details:', err);
      setSearchParams({});
    }
  };

  const handleStartNewSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Consultation' });
      setSessions([res.data, ...sessions]);
      setSearchParams({ session: res.data._id });
    } catch (err) {
      console.error('Error starting new consultation:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || responding) return;

    const textToSend = input;
    setInput('');
    setResponding(true);

    let currentSessionId = activeSessionId;

    try {
      // 1. If no active session, create one first
      if (!currentSessionId) {
        const res = await api.post('/chat/sessions', { title: 'New Consultation' });
        currentSessionId = res.data._id;
        setSessions([res.data, ...sessions]);
        setSearchParams({ session: res.data._id });
      }

      // Optimistically append user message to local activeSession state
      const mockUserMsg: Message = {
        role: 'user',
        content: textToSend,
        timestamp: new Date().toISOString()
      };

      if (activeSession) {
        setActiveSession({
          ...activeSession,
          messages: [...activeSession.messages, mockUserMsg]
        });
      } else {
        setActiveSession({
          _id: currentSessionId!,
          title: 'New Consultation',
          createdAt: new Date().toISOString(),
          messages: [mockUserMsg],
          symptoms: []
        });
      }

      // Send message to api
      const response = await api.post(`/chat/sessions/${currentSessionId}/message`, { content: textToSend });
      
      // Update details
      setActiveSession(response.data);
      // Reload sessions list to refresh title / urgency levels
      loadSessions();
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setResponding(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this consultation log?')) return;

    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions(sessions.filter(s => s._id !== id));
      if (activeSessionId === id) {
        setSearchParams({});
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Voice Input Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-text is not supported on this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const getUrgencyBadgeDetails = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': 
        return { label: 'CRITICAL / EMERGENCY', styles: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400' };
      case 'high': 
        return { label: 'High Urgency', styles: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' };
      case 'medium': 
        return { label: 'Moderate Urgency', styles: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' };
      case 'low':
      default:
        return { label: 'Low Urgency', styles: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' };
    }
  };

  const renderMessageContent = (content: string) => {
    // Formats paragraphs and lists basic markdown
    return content.split('\n').map((line, idx) => {
      // Bold markdown **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      
      const elements = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} className="font-extrabold text-slate-800 dark:text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      const isListItem = line.startsWith('-') || line.startsWith('*');
      const isNumberedItem = /^\d+\./.test(line.trim());
      
      if (isListItem) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed my-1">
            {elements.length > 0 ? elements : line.substring(1).trim()}
          </li>
        );
      } else if (isNumberedItem) {
        const dotIndex = line.indexOf('.');
        return (
          <li key={idx} className="ml-5 list-decimal pl-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed my-1">
            {elements.length > 0 ? elements : line.substring(dotIndex + 1).trim()}
          </li>
        );
      }

      return (
        <p key={idx} className={`${line.trim() === '' ? 'h-3' : 'my-1.5'} text-slate-600 dark:text-slate-300 text-sm leading-relaxed break-words`}>
          {elements.length > 0 ? elements : line}
        </p>
      );
    });
  };

  return (
    <div className="flex h-[calc(100vh-76px)] rounded-3xl overflow-hidden glass-panel border border-slate-200/60 dark:border-slate-800/80 animate-in fade-in duration-300 relative">
      
      {/* 1. CHAT HISTORY SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <button
            onClick={handleStartNewSession}
            className="w-full py-2.5 bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 dark:text-teal-400 font-bold rounded-xl text-xs transition-all border border-teal-500/20 flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0 mb-4"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>New Consultation</span>
          </button>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingSessions ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-400">Loading history...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-[11px]">
                No historical logs saved.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSearchParams({ session: s._id })}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    activeSessionId === s._id
                      ? 'bg-teal-600/10 border-teal-500/20 text-teal-700 dark:text-teal-400 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-1">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs truncate">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s._id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONVERSATION PANEL */}
      <section className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Top Header details */}
        <header className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 flex-shrink-0 bg-white/40 dark:bg-slate-950/20">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 dark:text-white text-sm truncate">
              {activeSession ? activeSession.title : 'New Consultation'}
            </h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">MediBot Clinical Guard Active</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeSession?.summary && (
              <button
                onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showAnalysisPanel
                    ? 'bg-teal-600/10 border-teal-500/20 text-teal-700 dark:text-teal-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report Summary</span>
              </button>
            )}

            <button
              onClick={() => {
                setSearchParams({});
                setActiveSession(null);
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Clear Session
            </button>
          </div>
        </header>

        {/* Messaging Box Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Welcome Medical Disclaimer Bubble */}
          <div className="p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-start space-x-3 max-w-2xl mx-auto">
            <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-teal-700 dark:text-teal-300 leading-relaxed">
              <span className="font-bold">Medical Safety Disclaimer:</span> Welcome to SymptomCare AI. I can guide you through checking your clinical symptoms. This tool is not a medical diagnostician. Do not substitute this information for a physician's advice. If you suspect an emergency, call your local hospital immediately.
            </div>
          </div>

          {activeSession?.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-3xl ${
                msg.role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'
              }`}
            >
              {/* Avatar representation */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-white border border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-teal-600 dark:text-teal-400'
              }`}>
                {msg.role === 'user' ? (user?.name?.charAt(0).toUpperCase() || 'P') : <Stethoscope className="w-4.5 h-4.5" />}
              </div>

              {/* Message Bubble text content */}
              <div className={`p-4 rounded-2xl text-slate-800 dark:text-slate-100 max-w-[85%] border shadow-sm ${
                msg.role === 'user'
                  ? 'bg-teal-600/10 border-teal-500/20 rounded-tr-none'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/60 rounded-tl-none'
              }`}>
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}

          {/* Typing bounce loader */}
          {responding && (
            <div className="flex items-start gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 dark:border-slate-850 dark:bg-slate-900 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4.5 h-4.5" />
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-tl-none flex items-center space-x-1 text-slate-400">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Control Box */}
        <footer className="p-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/30 dark:bg-slate-950/10 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="relative flex items-center max-w-3xl mx-auto">
            {/* Input Element */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening to voice...' : 'Type your symptoms here (e.g., "I have a sharp headache")'}
              disabled={responding}
              className={`w-full pl-4 pr-24 py-3.5 rounded-2xl border bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all ${
                isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            />

            {/* Input Action Controls */}
            <div className="absolute right-2 flex items-center space-x-1">
              {/* Microphone Speec-to-text control */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={responding}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Symptom Voice Dictation"
              >
                {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
              </button>

              {/* Submit message */}
              <button
                type="submit"
                disabled={responding || !input.trim()}
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-300 dark:disabled:text-slate-700"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>
          <div className="text-center text-[10px] text-slate-400 mt-2.5">
            Press enter to submit symptoms. AI response takes ~3-5 seconds.
          </div>
        </footer>
      </section>

      {/* 3. REPORT SUMMARY DRAWER PANEL (Right-side overlay/column) */}
      {activeSession?.summary && showAnalysisPanel && (
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/30 p-6 flex flex-col justify-between z-10 flex-shrink-0 animate-in slide-in-from-right-4 duration-300">
          <div className="space-y-6 overflow-y-auto pr-1">
            
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Clinical Summary</span>
              </h3>
              <button
                onClick={() => setShowAnalysisPanel(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Urgency Badge */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Care Urgency Level</h4>
              <div className={`p-3 border rounded-xl font-bold text-xs text-center ${getUrgencyBadgeDetails(activeSession.summary.urgency).styles}`}>
                {getUrgencyBadgeDetails(activeSession.summary.urgency).label}
              </div>
            </div>

            {/* Identified conditions */}
            {activeSession.summary.conditions && activeSession.summary.conditions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Possible Conditions</h4>
                <div className="space-y-1.5">
                  {activeSession.summary.conditions.map((c, i) => (
                    <div key={i} className="flex items-center space-x-2 p-2 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/65 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Clinician Recommendation */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommendation</h4>
              <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                {activeSession.summary.recommendation}
              </p>
            </div>

            {/* Recommended Specialist */}
            {activeSession.summary.recommendedSpecialist && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended Specialist</h4>
                <div className="flex items-center space-x-2.5 p-3.5 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/25 rounded-2xl text-xs font-bold text-teal-700 dark:text-teal-400">
                  <UserCheck className="w-5 h-5 flex-shrink-0" />
                  <span>{activeSession.summary.recommendedSpecialist}</span>
                </div>
              </div>
            )}

            {/* Self Care / First Aid tips */}
            {activeSession.summary.firstAid && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">First-Aid Suggestions</h4>
                <p className="text-xs text-slate-600 dark:text-slate-455 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {activeSession.summary.firstAid}
                </p>
              </div>
            )}

            {/* Suggested Medications */}
            {activeSession.summary.medications && activeSession.summary.medications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggested Medications (OTC/Supportive)</h4>
                <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {activeSession.summary.medications.map((med, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-teal-500 font-bold">•</span>
                      <span>{med}</span>
                    </div>
                  ))}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-start space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-tight">
                      <strong>Warning:</strong> Listed items are OTC/supportive. Prescription drugs require formal clinician sign-off.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate referral slip button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full mt-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md hover:shadow-teal-500/15 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <FileText className="w-4.5 h-4.5" />
              <span>Generate Referral Slip</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-start space-x-1.5 leading-normal">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>This clinical analysis updates dynamically as you declare additional symptoms during the chat.</span>
          </div>
        </aside>
      )}

      {/* 4. CLINICIAN REFERRAL BRIEF MODAL */}
      {showReportModal && activeSession?.summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-450">
                <Stethoscope className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight">Clinician Consultation Slip</span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </header>

            {/* Modal Body (Scrollable & Printable Area) */}
            <div id="clinical-report-print" className="p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 font-sans print:p-0">
              {/* Slip Document Header */}
              <div className="text-center space-y-2 pb-6 border-b border-slate-200/60 dark:border-slate-800/80">
                <h3 className="text-xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">SYMPTOMCARE CLINICAL AI</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Triage Summary & Specialist Referral Note</p>
                <div className="text-xs text-slate-500 flex justify-center space-x-4 pt-1">
                  <span><strong>Date:</strong> {new Date(activeSession.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  <span>•</span>
                  <span><strong>Ref:</strong> {activeSession._id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              {/* Patient and Referral Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient Identity</h4>
                  <p className="font-bold text-slate-800 dark:text-white text-sm mt-1">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
                </div>
                <div className="p-4 bg-teal-50/40 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/40 rounded-2xl">
                  <h4 className="text-[9px] font-bold text-teal-600 dark:text-teal-450 uppercase tracking-wider">Recommended Specialty Referral</h4>
                  <p className="font-bold text-teal-800 dark:text-teal-355 text-sm mt-1">{activeSession.summary.recommendedSpecialist || 'General Practitioner'}</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-450 mt-0.5">Primary clinic care focus area</p>
                </div>
              </div>

              {/* Clinical Presentation (Symptoms & Conditions) */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Clinical Parameters</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Declared Symptoms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSession.symptoms.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/20">
                          {s}
                        </span>
                      ))}
                      {activeSession.symptoms.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No specific symptoms logged.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Identified Considerations</span>
                    <div className="space-y-1">
                      {activeSession.summary.conditions.map((c, i) => (
                        <div key={i} className="text-xs font-semibold flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assessed Urgency Category</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border inline-block mt-0.5 ${getUrgencyBadgeDetails(activeSession.summary.urgency).styles}`}>
                      {getUrgencyBadgeDetails(activeSession.summary.urgency).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan of Action & First Aid */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Recommendations & Care Plan</h4>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <strong className="text-slate-500 dark:text-slate-450 block mb-1">Referral Action Plan:</strong>
                    <p className="leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60">{activeSession.summary.recommendation}</p>
                  </div>

                  {activeSession.summary.firstAid && (
                    <div>
                      <strong className="text-slate-500 dark:text-slate-450 block mb-1">Suggested Self-Care Measures:</strong>
                      <p className="leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60">{activeSession.summary.firstAid}</p>
                    </div>
                  )}

                  {activeSession.summary.medications && activeSession.summary.medications.length > 0 && (
                    <div>
                      <strong className="text-slate-500 dark:text-slate-450 block mb-1">Suggested Medications (OTC/Supportive):</strong>
                      <div className="leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60">
                        <ul className="list-disc pl-4 space-y-1">
                          {activeSession.summary.medications.map((med, i) => (
                            <li key={i}>{med}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimers & Electronic sign-off */}
              <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/80 space-y-4">
                <p className="text-[9px] text-slate-400 leading-normal italic">
                  <strong>Notice to Clinician:</strong> This slip is compiled from self-reported data analyzed by SymptomCare AI. It serves as an educational brief to facilitate consultation and has not been vetted by a physician. Please perform formal medical triage and diagnosis.
                </p>
                <div className="flex justify-between items-end pt-2 text-[10px] text-slate-450">
                  <span>SymptomCare AI Triage Unit v1.0</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400 border-b border-dashed border-teal-500 pb-0.5">Approved Electronic Sign-off</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <footer className="px-6 py-4.5 border-t border-slate-150 dark:border-slate-850 flex items-center justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => {
                  const printContents = document.getElementById('clinical-report-print')?.innerHTML;
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Clinician Referral Slip - SymptomCare AI</title>
                          <style>
                            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                            h3 { color: #0d9488; margin-top: 0; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                            .p-4 { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; }
                            .bg-slate-50 { bg-color: #f8fafc; }
                            .bg-teal-50 { bg-color: #f0fdfa; }
                            .border { border: 1px solid #e2e8f0; }
                            .border-b { border-bottom: 1px solid #e2e8f0; }
                            .pb-2 { padding-bottom: 10px; }
                            .pb-6 { padding-bottom: 24px; }
                            .mb-1 { margin-bottom: 4px; }
                            .mt-1 { margin-top: 4px; }
                            .text-xs { font-size: 12px; }
                            .text-[10px] { font-size: 10px; color: #64748b; }
                            .text-[9px] { font-size: 9px; color: #94a3b8; }
                            .font-bold { font-weight: bold; }
                            .font-extrabold { font-weight: 800; }
                            .uppercase { text-transform: uppercase; }
                            .text-teal-600 { color: #0d9488; }
                            .text-center { text-align: center; }
                            .flex { display: flex; gap: 8px; }
                            .flex-wrap { flex-wrap: wrap; }
                            .px-2.5 { padding: 4px 10px; }
                            .py-1 { padding-top: 4px; padding-bottom: 4px; }
                            .bg-slate-100 { background-color: #f1f5f9; }
                            .rounded-lg { border-radius: 8px; }
                            .rounded-xl { border-radius: 12px; }
                            .rounded-2xl { border-radius: 16px; }
                            .leading-relaxed { line-height: 1.625; }
                            .space-y-4 > * + * { margin-top: 16px; }
                            .space-y-3 > * + * { margin-top: 12px; }
                            .space-y-2 > * + * { margin-top: 8px; }
                            .italic { font-style: italic; }
                            .pt-6 { padding-top: 24px; }
                            .pt-2 { padding-top: 8px; }
                            .border-t { border-top: 1px solid #e2e8f0; }
                            .justify-between { justify-content: space-between; }
                          </style>
                        </head>
                        <body>
                          ${printContents}
                          <script>
                            window.onload = function() { window.print(); window.close(); }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
};
