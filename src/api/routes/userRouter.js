import express from 'express';
import { userController } from '../controllers/userController';

export const userRouter = express.Router();

userRouter
  .get('/list', userController.list_all_users)
  .post('/create/:walletId', userController.create_user)
  .get('/twitter-access/:walletId', userController.get_user_twitter_access_by_wallet)
  .get("/test", userController.test);
