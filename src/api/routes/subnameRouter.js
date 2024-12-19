import express from 'express';
import { subnameController } from '../controllers/subnameController.js';

export const subnameRouter = express.Router();

subnameRouter
  .post('/mint/:minterAddress', subnameController.mint_subname)
  .get('/mint-params', subnameController.get_subname_mint_Params);
