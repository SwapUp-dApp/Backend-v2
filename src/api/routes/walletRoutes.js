import express from 'express';
import { walletController } from '../controllers/walletController.js';

export const walletRouter = express.Router();

walletRouter
    .get('/', walletController.list_all_wallets)
    .post('/', walletController.create_wallet)
    .get('/token-breakdown/:walletId', walletController.token_breakdown_against_wallet)
    .get("/test", walletController.test);
