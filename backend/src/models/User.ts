import mongoose, { Schema } from 'mongoose';
import { isUsingLocalDb, FileDB } from '../config/db';
import crypto from 'crypto';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  googleId?: string;
  createdAt: Date;
}

// Mongoose schema definition
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const MongoUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Fallback user repository for local dev JSON DB
const LocalUserRepository = {
  async findOne(query: any): Promise<IUser | null> {
    const users = FileDB.getCollection('users');
    const user = users.find(u => {
      for (const key in query) {
        if (query[key] instanceof RegExp) {
          if (!query[key].test(u[key])) return false;
        } else if (query[key] !== u[key]) {
          return false;
        }
      }
      return true;
    });
    return user || null;
  },

  async findById(id: string): Promise<IUser | null> {
    const users = FileDB.getCollection('users');
    return users.find(u => u._id === id) || null;
  },

  async create(userData: Partial<IUser>): Promise<IUser> {
    const users = FileDB.getCollection('users');
    const newUser: IUser = {
      _id: crypto.randomUUID(),
      name: userData.name || '',
      email: userData.email || '',
      password: userData.password,
      isVerified: userData.isVerified || false,
      verificationToken: userData.verificationToken,
      googleId: userData.googleId,
      createdAt: new Date(),
    };
    users.push(newUser);
    FileDB.saveCollection('users', users);
    return newUser;
  },

  async findByIdAndUpdate(id: string, update: any): Promise<IUser | null> {
    const users = FileDB.getCollection('users');
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    const current = users[index];
    const fieldsToUpdate = update.$set || update;
    
    // Process resetPasswordExpires date conversions
    if (fieldsToUpdate.resetPasswordExpires && typeof fieldsToUpdate.resetPasswordExpires === 'string') {
      fieldsToUpdate.resetPasswordExpires = new Date(fieldsToUpdate.resetPasswordExpires);
    }

    users[index] = { ...current, ...fieldsToUpdate };
    FileDB.saveCollection('users', users);
    return users[index];
  }
};

export const User = {
  findOne: async (query: any): Promise<IUser | null> => {
    if (isUsingLocalDb) return LocalUserRepository.findOne(query);
    return MongoUserModel.findOne(query).lean() as Promise<IUser | null>;
  },
  findById: async (id: string): Promise<IUser | null> => {
    if (isUsingLocalDb) return LocalUserRepository.findById(id);
    return MongoUserModel.findById(id).lean() as Promise<IUser | null>;
  },
  create: async (userData: Partial<IUser>): Promise<IUser> => {
    if (isUsingLocalDb) return LocalUserRepository.create(userData);
    const created = await MongoUserModel.create(userData);
    return created.toObject() as IUser;
  },
  findByIdAndUpdate: async (id: string, update: any): Promise<IUser | null> => {
    if (isUsingLocalDb) return LocalUserRepository.findByIdAndUpdate(id, update);
    return MongoUserModel.findByIdAndUpdate(id, update, { new: true }).lean() as Promise<IUser | null>;
  },
  updateOne: async (id: string, updates: Partial<IUser>): Promise<IUser | null> => {
    if (isUsingLocalDb) return LocalUserRepository.findByIdAndUpdate(id, { $set: updates });
    return MongoUserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean() as Promise<IUser | null>;
  }
};
