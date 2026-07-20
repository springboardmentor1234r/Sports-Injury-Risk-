import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
