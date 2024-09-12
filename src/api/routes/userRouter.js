import express from 'express';

import { userController } from '../controllers/userController';
import { blobController } from '../controllers/blobController';

export const userRouter = express.Router();

userRouter
  .get('/list', userController.list_all_users)
  .post('/create/:walletId', userController.create_user)
  .get('/twitter-access/:walletId', userController.get_user_twitter_access_by_wallet)
  .post('/upload-profile-picture', blobController.upload_middleware, blobController.upload_profile_picture)
  .delete('/delete-profile-picture/:blobName', blobController.delete_profile_picture);