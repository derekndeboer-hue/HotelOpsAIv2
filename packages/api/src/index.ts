import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { config } from './config/env';
import { globalErrorHandler } from './middleware/error';
import { resolveTenant } from './middleware/tenant-resolver';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import workOrdersRoutes from './modules/work-orders/work-orders.routes';
import locationsRoutes from './modules/locations/locations.routes';
import housekeepingRoutes from './modules/housekeeping/housekeeping.routes';
import guestsRoutes from './modules/guests/guests.routes';
import reservationsRoutes from './modules/reservations/reservations.routes';
import frontDeskRoutes from './modules/front-desk/front-desk.routes';
import reportsRoutes from './modules/reports/reports.routes';
import staffRoutes from './modules/staff/staff.routes';
import equipmentRoutes from './modules/equipment/equipment.routes';
import scheduleRoutes from './modules/schedule/schedule.routes';
import complianceRoutes from './modules/compliance/compliance.routes';
import conciergeRoutes from './modules/concierge/concierge.routes';
import guestRequestsRoutes from './modules/guest-requests/guest-requests.routes';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve locally-uploaded files in dev mode
if (config.NODE_ENV === 'development') {
  app.use('/local-uploads', express.static(path.join(process.cwd(), '.local-uploads')));
}

// Health check (does not require tenant resolution)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Resolve tenant from subdomain/host before any auth runs.
// Attaches req.resolvedTenant for login + session scoping.
app.use('/api', resolveTenant);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/front-desk', frontDeskRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/concierge', conciergeRoutes);
app.use('/api/guest-requests', guestRequestsRoutes);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`[hotel-ops-api] Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

export default app;
