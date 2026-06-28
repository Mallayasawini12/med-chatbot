import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export let isUsingLocalDb = false;

const LOCAL_DB_PATH = path.join(__dirname, '../../data/db.json');

// Ensure data folder exists
const ensureDataFolder = () => {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users: [], chatSessions: [] }, null, 2));
  }
};

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('⚠️ No MONGODB_URI found. Falling back to local file-based database...');
    isUsingLocalDb = true;
    ensureDataFolder();
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', (error as Error).message);
    console.log('⚠️ Falling back to local file-based database...');
    isUsingLocalDb = true;
    ensureDataFolder();
  }
};

// Lightweight file-based DB implementation that mimics Mongoose API for controller transparency
export class FileDB {
  private static readData() {
    ensureDataFolder();
    const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(content);
  }

  private static writeData(data: any) {
    ensureDataFolder();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  }

  static getCollection(collectionName: 'users' | 'chatSessions'): any[] {
    return this.readData()[collectionName] || [];
  }

  static saveCollection(collectionName: 'users' | 'chatSessions', items: any[]) {
    const data = this.readData();
    data[collectionName] = items;
    this.writeData(data);
  }
}
