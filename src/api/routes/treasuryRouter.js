import express from 'express';
import { treasuryController } from '../controllers/treasuryController';



export const treasuryRouter = express.Router();

treasuryRouter
  .post('/transfer/erc20', treasuryController.transfer_erc20_tokens)
  .get('/balance', treasuryController.smart_treasury_wallet_balance_check);