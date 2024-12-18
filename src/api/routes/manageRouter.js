import express from 'express';
import { manageController } from '../controllers/manageController.js';

export const manageRouter = express.Router();

manageRouter
  .get("/subscription-token", manageController.get_subscription_tokens)
  .post("/subscription-token", manageController.add_new_subscription_token)
  .put("/subscription-token/:id", manageController.update_subscription_token)
  .delete("/subscription-token/:id", manageController.delete_subscription_token)
  .get("/subname-access", manageController.get_subname_access)
  .post("/subname-access", manageController.add_new_subname_access)
  .put("/subname-access/:id", manageController.update_subname_access)
  .delete("/subname-access/:id", manageController.delete_subscription_token)

