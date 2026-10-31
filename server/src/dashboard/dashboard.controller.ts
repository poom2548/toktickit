import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service.js';
import {
  serializeRequesterDashboard,
  serializeStaffDashboard,
} from './dashboard.serializers.js';
import { sendApiError } from '../actions-taken/actions-taken.middleware.js';

export async function getRequesterDashboard(req: Request, res: Response): Promise<any> {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const userId = req.user!.id;
    const data = await dashboardService.getRequesterDashboardData(userId);
    const serialized = serializeRequesterDashboard(data);
    return res.status(200).json(serialized);
  } catch (error) {
    console.error('Requester dashboard error:', error);
    return sendApiError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}

export async function getStaffDashboard(req: Request, res: Response): Promise<any> {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const userId = req.user!.id;
    const role = req.user!.role;
    const data = await dashboardService.getStaffDashboardData(userId, role);
    const serialized = serializeStaffDashboard(data);
    return res.status(200).json(serialized);
  } catch (error) {
    console.error('Staff dashboard error:', error);
    return sendApiError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}
