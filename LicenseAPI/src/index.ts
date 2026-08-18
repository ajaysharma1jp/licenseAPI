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

// const pool = new Pool({
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT) || 5432,
//     database: process.env.DB_NAME,
//     ssl:{
//         rejectUnauthorized: false
//     }
// });

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

// 2. Endpoint: Generate a new License Key
app.post('/api/licenses/generate', async (req: Request, res: Response) => {
  try {
    // Generates a formatted key like: XXXX-XXXX-XXXX-XXXX
    const rawKey = crypto.randomBytes(8).toString('hex').toUpperCase();
    const licenseKey = `${rawKey.slice(0,4)}-${rawKey.slice(4,8)}-${rawKey.slice(8,12)}-${rawKey.slice(12,16)}`;

    const query = `
      INSERT INTO licenses (license_key, is_active)
      VALUES ($1, true)
      RETURNING *;
    `;
    const result = await pool.query(query, [licenseKey]);

    res.status(201).json({
      message: 'License key created successfully',
      license: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate license key' });
  }
});

// 3. Endpoint: Validate a License Key
app.get('/api/licenses/validate/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const query = `SELECT * FROM licenses WHERE license_key = $1;`;
    const result = await pool.query(query, [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'License key not found' });
    }

    const license = result.rows[0];

    if (!license.is_active) {
      return res.json({ valid: false, message: 'License key is inactive' });
    }

    res.json({ valid: true, message: 'License key is active', license });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Validation failed' });
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

// // license verification endpoint
// app.post('/api/verify-license', async(req: Request, res: Response) => {
//     try{
//         const {licenseKey, hardwareID} = req.body;
//         if(!licenseKey){
//             return res.status(400).json({valid: false, error: "License Key Required!"});

//             // standard postgreSql paramaterized query to prevent SQL injection
//             const query = `SELECT * FROM licenses WHERE key = $1 AND is_active = true`;

//             const result = await pool.query(query,[licenseKey]);

//             if(result.rows.length>0){
//                 res.status(200).json({valid: true, message: "License Verified Successfully"});
//             }else{
//                 res.status(403).json({valid: false, error: "Invalid Or Expired License"});
//             }
//         }
//     }catch(error){
//         console.error(error);
//         res.status(500).json({ error: 'Failed to Verify-License'});
//     }
// });

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
