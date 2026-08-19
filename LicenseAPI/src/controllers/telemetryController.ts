import { type Request, type Response } from "express";
import {pool} from '../config/db.js';

export const recordTelemetry = async(req: Request, res: Response)=>{
    try{
        const {licenseKey, osVersion} = req.body;
        if (!licenseKey || !osVersion) {
            return res.status(400).json({ error: 'licenseKey and osVersion are required' });
        }
        const licenseRes = await pool.query('SELECT id FROM licenses WHERE license_key = $1', [licenseKey]);
        if (licenseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid license key' });
        }
        const licenseId = licenseRes.rows[0].id;
        const insertQuery = `
           INSERT INTO telemetry_logs (license_id, os_version)
           VALUES ($1,$2)
           RETURNING *;
        `;
        const result = await pool.query(insertQuery,[licenseId,osVersion]);
        res.status(201).json({
            message: 'Telmetry Logged Successfully',
            log: result.rows[0]
        });
    }catch(error){
        console.log("Record Telemetry Error: "+error);
        res.status(500).json({error: 'Failed to record telemetry'});
    }
};