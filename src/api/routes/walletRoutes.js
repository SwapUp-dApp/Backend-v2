import express from 'express';
import { walletController } from '../controllers/walletController.js';

export const walletRouter = express.Router();

walletRouter
    .get('/token-breakdown/:walletId', walletController.token_breakdown_against_wallet)
    .get('/subscription-token-balance/:walletId', walletController.get_subscription_token_balance)
    .get("/test", walletController.test);
