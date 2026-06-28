import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (with automatic fallback to JSON DB)
connectDB().then(() => {
  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  // Base checking route
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      time: new Date(),
      databaseFallback: require('./config/db').isUsingLocalDb ? 'Active (File DB)' : 'Inactive (MongoDB)'
    });
  });

  // Register Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ message: 'An internal server error occurred.' });
  });

  // Start Listener
  app.listen(PORT, () => {
    console.log(`🚀 SymptomCare AI Backend running on port ${PORT}`);
    console.log(`🔗 API Healthcheck available at http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Critical Server Initialization Error:', err);
  process.exit(1);
});
