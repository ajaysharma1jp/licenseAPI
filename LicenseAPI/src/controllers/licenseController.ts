import { type Request, type Response } from 'express';
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