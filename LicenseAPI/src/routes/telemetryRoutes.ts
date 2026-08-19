import { Router } from "express";
import { recordTelemetry } from '../controllers/telemetryController.js';

const router = Router();

router.post('/telemetry-logs',recordTelemetry);

export default router;