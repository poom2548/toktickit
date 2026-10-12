import { Router } from 'express';
import {
  wrapRequireAuth,
  customRequireRole,
} from '../actions-taken/actions-taken.middleware.js';
import {
  getRequesterDashboard,
  getStaffDashboard,
} from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

dashboardRouter
  .route('/requester')
  .get(wrapRequireAuth, customRequireRole('REQUESTER'), getRequesterDashboard)
  .all((_req, res) =>
    res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    })
  );

dashboardRouter
  .route('/staff')
  .get(
    wrapRequireAuth,
    customRequireRole('IT_STAFF', 'ADMINISTRATOR'),
    getStaffDashboard
  )
  .all((_req, res) =>
    res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    })
  );
