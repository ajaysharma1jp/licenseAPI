import { type Request, type Response } from 'express';
import { CryptoService } from '../services/cryptoService.js';

export const verifyLicense = async (req: Request, res: Response) => {
    try{
        const {licenseKey, hardwareID} = req.body;
        if(!licenseKey || !hardwareID){
            return res.status(400).json({error: "Bad Request License Key and Hardware ID needed"});
        }

        // database check -- sample placeholder to be replaced in next commit
        // assume true situation if isValid = true
        const isValid = true;
        const expDate = "2027-01-01T00:00:00Z";

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