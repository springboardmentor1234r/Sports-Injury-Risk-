import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Server running WITHOUT database. Check your MongoDB Atlas cluster status (may be paused on free tier).');
    // Do NOT exit — keep the server alive for non-DB routes like /api/health
  }
};

export default connectDB;
