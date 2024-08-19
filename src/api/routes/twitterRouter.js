import express from "express";
import { twitterController } from "../controllers/twitterController";

export const twitterRouter = express.Router();

twitterRouter
  .get("/", twitterController.test)
  .post("/create-post", twitterController.upload_image_to_twitter)
  .post("/code-to-access-token", twitterController.exchange_code_for_access_token);