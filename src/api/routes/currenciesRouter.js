import express from 'express';
import { currenciesController } from '../controllers/currenciesController';

export const currenciesRouter = express.Router();

currenciesRouter
  .get('/coin-ranking', currenciesController.get_coin_ranking_currencies)
  .get('/:chainId', currenciesController.get_currencies_by_chain_id);
