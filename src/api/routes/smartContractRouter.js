import express from 'express';
import { smartContractController } from '../controllers/smartContractController';

export const smartContractRouter = express.Router();

smartContractRouter
  .post('/create-swap/:walletId', smartContractController.create_swap)
  .post('/propose-swap/:walletId', smartContractController.propose_swap)
  .post('/complete-swap/:walletId', smartContractController.complete_swap)
  .patch('/cancel-swap/:walletId', smartContractController.cancel_swap)
  .patch('/counter-swap/:walletId', smartContractController.counter_swap)
  .get('/sign-string/:walletId', smartContractController.get_sign_message_string);