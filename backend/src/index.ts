import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import sub-routers
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import csrRouter from './routes/csr';
import challengesRouter from './routes/challenges';
import environmentalRouter from './routes/environmental';
import governanceRouter from './routes/governance';
import analyticsRouter from './routes/analytics';
import settingsRouter from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Mount Sub-routers
app.use('/api/auth', authRouter);
app.use('/api', usersRouter);
app.use('/api', csrRouter);
app.use('/api', challengesRouter);
app.use('/api', environmentalRouter);
app.use('/api', governanceRouter);
app.use('/api', analyticsRouter);
app.use('/api', settingsRouter);

app.listen(PORT, () => {
  console.log(`🚀 EcoSphere API Server running on port ${PORT}`);
});
