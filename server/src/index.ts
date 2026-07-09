import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.routes';
import { setupSwagger } from './config/swagger';
import { connectDB } from './config/db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support large resumes

// Setup Swagger Documentation UI
setupSwagger(app);

// Health check
import { isMockMode, aiModel } from './config/openai';
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    isMockMode,
    aiModel,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasApiKey: !!process.env.OPENAI_API_KEY
  });
});

// Routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
