import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('MongoDB successfully connected.');
  } catch (error) {
    console.error('Failed to connect to MongoDB on startup:', error);
    // Do not call process.exit(1) so that the Express server stays running and can serve health checks/errors
  }
}
