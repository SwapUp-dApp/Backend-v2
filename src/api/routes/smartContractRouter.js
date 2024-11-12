import express from 'express';
import { smartContractController } from '../controllers/smartContractController';



export const smartContractRouter = express.Router();

smartContractRouter
  .post('/create-swap/:walletId', smartContractController.create_swap)
  .post('/complete-swap/:walletId', smartContractController.complete_swap);