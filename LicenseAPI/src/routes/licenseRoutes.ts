import { Router } from 'express';
import { verifyLicense } from '../controllers/licenseController.js';

const router = Router();

router.post('/verify-license',verifyLicense);

export default router;