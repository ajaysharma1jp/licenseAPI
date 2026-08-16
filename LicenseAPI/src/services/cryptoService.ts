import crypto from 'crypto';


export class CryptoService{
    static signPayload(licenseKey: string, hardwareID: string, isValid: boolean, expDate: string){
        
        const payloadObject = {
            license: licenseKey,
            hardware: hardwareID,
            valid: isValid,
            expires: expDate
        };
        const payloadString = JSON.stringify(payloadObject);
        // private key from azure's env var.
        //the .replace is necessary because Azure sometimes escapes newline characters in keys)
        const privateKey = (process.env.PRIVATE_KEY || "").replace(/\\n/g,'\n');

        if(!privateKey){
            throw new Error("CRITICAL: Private Key is missing from environment variables!");
        }

        // create signing object using SHA256
        const sign = crypto.createSign('SHA256');

        // feed payload string into algo SHA256
        sign.update(payloadString);
        sign.end();

        // encrypt hash using private key and output it in base64
        const signature = sign.sign(privateKey,'base64');

        // return both raw data and mathematical proof
        return {
            data: payloadString,
            signature: signature
        };
    }
}