import mongoose, { Schema } from 'mongoose';
import { isUsingLocalDb, FileDB } from '../config/db';
import crypto from 'crypto';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ISymptomSummary {
  conditions: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  firstAid?: string;
  recommendedSpecialist?: string;
  medications?: string[];
}

export interface IChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: IMessage[];
  symptoms: string[];
  summary?: ISymptomSummary;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SymptomSummarySchema = new Schema<ISymptomSummary>({
  conditions: [{ type: String }],
  recommendation: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], required: true },
  firstAid: { type: String },
  recommendedSpecialist: { type: String },
  medications: [{ type: String }]
});

const ChatSessionSchema = new Schema<IChatSession>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  messages: [MessageSchema],
  symptoms: [{ type: String }],
  summary: SymptomSummarySchema,
  createdAt: { type: Date, default: Date.now }
});

const MongoChatSessionModel = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

const LocalChatSessionRepository = {
  async find(query: any): Promise<IChatSession[]> {
    const sessions = FileDB.getCollection('chatSessions');
    return sessions.filter(s => {
      for (const key in query) {
        if (query[key] !== s[key]) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findById(id: string): Promise<IChatSession | null> {
    const sessions = FileDB.getCollection('chatSessions');
    return sessions.find(s => s._id === id) || null;
  },

  async create(sessionData: Partial<IChatSession>): Promise<IChatSession> {
    const sessions = FileDB.getCollection('chatSessions');
    const newSession: IChatSession = {
      _id: crypto.randomUUID(),
      userId: sessionData.userId || '',
      title: sessionData.title || 'New Consultation',
      messages: sessionData.messages || [],
      symptoms: sessionData.symptoms || [],
      summary: sessionData.summary,
      createdAt: new Date()
    };
    sessions.push(newSession);
    FileDB.saveCollection('chatSessions', sessions);
    return newSession;
  },

  async findByIdAndUpdate(id: string, update: any): Promise<IChatSession | null> {
    const sessions = FileDB.getCollection('chatSessions');
    const index = sessions.findIndex(s => s._id === id);
    if (index === -1) return null;

    const current = sessions[index];
    const fieldsToUpdate = update.$set || update;

    // Deep merge messages if appending
    let newMessages = current.messages;
    if (fieldsToUpdate.messages) {
      newMessages = fieldsToUpdate.messages;
    } else if (update.$push && update.$push.messages) {
      const msg = update.$push.messages;
      newMessages = [...current.messages, { ...msg, timestamp: msg.timestamp || new Date() }];
    }

    sessions[index] = {
      ...current,
      ...fieldsToUpdate,
      messages: newMessages,
      summary: fieldsToUpdate.summary || current.summary
    };
    FileDB.saveCollection('chatSessions', sessions);
    return sessions[index];
  },

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    const sessions = FileDB.getCollection('chatSessions');
    const initialLength = sessions.length;
    const remaining = sessions.filter(s => {
      for (const key in query) {
        if (query[key] !== s[key]) return true;
      }
      return false;
    });
    FileDB.saveCollection('chatSessions', remaining);
    return { deletedCount: initialLength - remaining.length };
  }
};

export const ChatSession = {
  find: async (query: any): Promise<IChatSession[]> => {
    if (isUsingLocalDb) return LocalChatSessionRepository.find(query);
    return MongoChatSessionModel.find(query).sort({ createdAt: -1 }).lean() as any as Promise<IChatSession[]>;
  },
  findById: async (id: string): Promise<IChatSession | null> => {
    if (isUsingLocalDb) return LocalChatSessionRepository.findById(id);
    return MongoChatSessionModel.findById(id).lean() as any as Promise<IChatSession | null>;
  },
  create: async (sessionData: Partial<IChatSession>): Promise<IChatSession> => {
    if (isUsingLocalDb) return LocalChatSessionRepository.create(sessionData);
    const created = await MongoChatSessionModel.create(sessionData);
    return created.toObject() as IChatSession;
  },
  findByIdAndUpdate: async (id: string, update: any): Promise<IChatSession | null> => {
    if (isUsingLocalDb) return LocalChatSessionRepository.findByIdAndUpdate(id, update);
    return MongoChatSessionModel.findByIdAndUpdate(id, update, { new: true }).lean() as any as Promise<IChatSession | null>;
  },
  deleteOne: async (query: any): Promise<{ deletedCount: number }> => {
    if (isUsingLocalDb) return LocalChatSessionRepository.deleteOne(query);
    const res = await MongoChatSessionModel.deleteOne(query);
    return { deletedCount: res.deletedCount || 0 };
  }
};
