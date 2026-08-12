import express, { type Request, type Response} from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// loads secret variables from the .env files
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// this allow your API ti accept json data in request
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.database_url,
});

// a simple route to test if server is running
app.get('/',(req: Request, res: Response) => {
    res.send("License & Telemetry API is running!");
    res.send("FAAH!");
});

// a route to test the database connection
app.get('/test-db', async (req: Request, res: Response)=>{
    try{
        const result = await pool.query('SELECT NOW()');
        res.json({
            message: "Successfully connected to Azure PostgreSQL!",
            serverTime: result.rows[0].now
        });
    }catch(error){
        console.log(error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Start the Server
app.listen(port, ()=>{
    console.log('Server is running at https://localhost:${port}');
});