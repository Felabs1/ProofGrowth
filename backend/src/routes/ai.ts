import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import {
  suggestCompetitionField,
  suggestFieldSchema,
} from '../services/competitionSuggest.js';

export const aiRouter = Router();

aiRouter.post(
  '/suggest-competition-field',
  asyncHandler(async (req, res) => {
    const parsed = suggestFieldSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await suggestCompetitionField(parsed.data);
    res.json(result);
  }),
);
