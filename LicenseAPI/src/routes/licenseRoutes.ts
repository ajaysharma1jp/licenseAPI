import { Router } from 'express';
import { validateKey, generateLicense, verifyLicense } from '../controllers/licenseController.js';

const router = Router();

router.post('/verify-license',verifyLicense);
router.post('/generate-license',generateLicense);
router.get('/validate-key/:key',validateKey);

export default router;