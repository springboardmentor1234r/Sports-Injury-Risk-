import express from 'express';
import {
  createAthlete,
  getAthletes,
  getAthleteById,
  updateAthlete,
  deleteAthlete,
} from '../controllers/athleteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createAthlete)
  .get(protect, getAthletes);

router.route('/:id')
  .get(protect, getAthleteById)
  .put(protect, updateAthlete)
  .delete(protect, deleteAthlete);

export default router;
