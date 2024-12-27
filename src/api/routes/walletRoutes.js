import express from 'express';
import { walletController } from '../controllers/walletController.js';

export const walletRouter = express.Router();

walletRouter
    .get('/token-breakdown/:walletId', walletController.token_breakdown_against_wallet)
    .get('/subscription-token-balance/:walletId', walletController.get_subscription_token_balance)
    .get("/test", walletController.test)
    .get("/test-smart-account/:privateKey", walletController.test_smart_account_though_private_key)
    .get("/test-encryption-decryption/:privateKey", walletController.test_encryption_decryption_by_private_key)
    .get("/smart-wallet-details/:walletId", walletController.get_smart_wallet_details)
    .get("/tokens/:walletId", walletController.get_wallet_tokens);
