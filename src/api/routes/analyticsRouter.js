import express from 'express';
import { analyticsController } from '../controllers/analyticsController';


export const analyticsRouter = express.Router();

analyticsRouter
  .get('/new-members', analyticsController.list_new_members)
  .get('/top-traders', analyticsController.list_top_traders);