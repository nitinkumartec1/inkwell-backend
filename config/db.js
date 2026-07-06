import mongoose from 'mongoose';

let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('Using cached database instance');
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // In serverless, throwing the error is better than process.exit
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;
