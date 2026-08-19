import express, { raw, type Request, type Response} from 'express';
import { pool } from './config/db.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { error } from 'console';
import licenseRoutes from './routes/licenseRoutes.js';

// loads secret variables from the .env files
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// this allow your API to accept json data in request
app.use(express.json());

// mount routes -> full url : https://your-site.com/api/verify-license
app.use('/api',licenseRoutes);

// health check
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


// 4. Endpoint: Record Telemetry Ping
app.post('/api/telemetry', async (req: Request, res: Response) => {
  try {
    const { licenseKey, osVersion } = req.body;

    if (!licenseKey || !osVersion) {
      return res.status(400).json({ error: 'licenseKey and osVersion are required' });
    }

    // Lookup the internal license ID
    const licenseRes = await pool.query('SELECT id FROM licenses WHERE license_key = $1', [licenseKey]);
    
    if (licenseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    const licenseId = licenseRes.rows[0].id;

    // Insert telemetry entry linked to license ID
    const insertQuery = `
      INSERT INTO telemetry_logs (license_id, os_version)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [licenseId, osVersion]);

    res.status(201).json({
      message: 'Telemetry logged successfully',
      log: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record telemetry' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
