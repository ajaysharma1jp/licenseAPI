import express, { type Request, type Response} from 'express';
import { pool } from './config/db.js';
import dotenv from 'dotenv';
import licenseRoutes from './routes/licenseRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';

// loads secret variables from the .env files
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// this allow your API to accept json data in request
app.use(express.json());

app.use('/api/licenses',licenseRoutes);

app.use('/api/telemetry',telemetryRoutes);

// health checks
app.get('/', (req: Request, res: Response) => {
  res.send('License & Telemetry API is running!');
});
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Successfully connected to Azure PostgreSQL!', 
      serverTime: result.rows[0].now 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
