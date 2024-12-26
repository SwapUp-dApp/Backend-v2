import express from 'express';

import { userController } from '../controllers/userController';
import { blobController } from '../controllers/blobController';

export const userRouter = express.Router();

userRouter
  .get('/new-members', userController.list_new_members)
  .get('/top-traders', userController.list_top_traders)
  .get('/:walletId', userController.get_user_by_wallet)
  .post('/create/:walletId', userController.create_user)
  .get('/twitter-access/:walletId', userController.get_user_twitter_access_by_wallet)
  .post('/upload-profile-picture', blobController.upload_middleware, blobController.upload_profile_picture)
  .patch('/delete-profile-picture', blobController.delete_profile_picture)
  .patch('/update-points/:walletId', userController.update_user_points)
  .patch('/updated-profile-details/:walletId', userController.edit_user_profile)
  .get(`/test/aa`, userController.test_aa_address_using_key)
  .post('/create-platform-wallet/:walletId', userController.create_user_platform_wallet);