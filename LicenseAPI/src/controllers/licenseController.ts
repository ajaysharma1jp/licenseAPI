import { type Request, type Response } from 'express';
import crypto from 'crypto';
import { CryptoService } from '../services/cryptoService.js';
import {pool} from '../config/db.js';

export const verifyLicense = async (req: Request, res: Response) => {
    try{
        const {licenseKey, hardwareID} = req.body;
        if(!licenseKey || !hardwareID){
            return res.status(400).json({error: "Bad Request License Key and Hardware ID needed"});
        }

        const query = `SELECT * FROM licenses WHERE license_key = $1`;
        const result = await pool.query(query,[licenseKey]);
        if(result.rows.length===0){
            return res.status(404).json({error: "License key does not exist."});
        }
        const dbLicense = result.rows[0];

        const isValid = dbLicense.is_active;
        
        const expDate = dbLicense.expires_at ? dbLicense.expires_at.toISOString() : "2099-01-01T00:00:00Z";

        // handover to cryptoService for sign of raw data
        const signedResponse = CryptoService.signPayload(
            licenseKey,
            hardwareID,
            isValid,
            expDate
        );

        // return encypt. response to user
        return res.status(200).json({signedResponse});

    }catch(error){
        console.error("Verification Error: ",error);
        res.status(500).json({error: "Internal Server Error"});
    }
};

export const generateLicense = async (req: Request, res: Response) => {
    try{
        const rawKey = crypto.randomBytes(8).toString('hex').toUpperCase();
        const licenseKey = `${rawKey.slice(0-4)}-${rawKey.slice(4,8)}-${rawKey.slice(8,12)}-${rawKey.slice(12,16)}`;

        const query = `
          INSERT INTO licenses (license_key, is_active)
          VALUES ($1, true)
          RETURNING *;
        `;
        const result = await pool.query(query,[licenseKey]);
        res.status(201).json({
            message: 'License Key Created Successfully',
            license: result.rows[0]
        });
    }catch(error){
        console.error("License Generation Error: ",error);
        res.status(500).json({ error: 'Failed to generate license key' });
    }
};

export const validateKey = async(req: Request, res: Response) =>{
    try{
        const {key} = req.params;
        const query = `SELECT * FROM licenses WHERE license_key = $1;`;
        const result = await pool.query(query,[key]);
        if(result.rows.length===0){
            return res.status(404).json({valid: false, message:'License Key not found'});
        }
        const license = result.rows[0];
        if(!license.is_active){
            return res.json({valid: false, message: 'License Key inactive'});
        }
        res.json({valid: true, message: 'License Key is active', license});
    }catch(error){
        console.error("Validation Error: ",error);
        res.status(500).json({error: 'Validation failed'});
    }
};