import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import gamesRouter from './routes/games';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.FRONTEND_URL) {
  throw new Error("Front end url is missing");
}
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))
app.use(express.json());

app.use('/api/games', gamesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Game store API!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});