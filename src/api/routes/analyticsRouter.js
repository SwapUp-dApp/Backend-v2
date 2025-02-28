import express from 'express';
import { analyticsController } from '../controllers/analyticsController';


export const analyticsRouter = express.Router();

analyticsRouter
  .get('/new-members', analyticsController.list_new_members)
  .get('/new-subnames', analyticsController.list_new_subnames)
  .get('/top-traders', analyticsController.list_top_traders)
  .get('/trending-token-pairs', analyticsController.list_trending_token_pairs)
  .get('/trending-tokens', analyticsController.list_trending_tokens);