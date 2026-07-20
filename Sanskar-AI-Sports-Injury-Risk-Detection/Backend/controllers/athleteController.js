import Athlete from '../models/Athlete.js';
import { successResponse } from '../utils/apiResponse.js';

export const createAthlete = async (req, res, next) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      height,
      weight,
      sport,
      playingPosition,
      experienceYears,
      previousInjuryHistory,
      trainingLoad,
    } = req.body;

    const requiredFields = {
      fullName,
      dateOfBirth,
      gender,
      height,
      weight,
      sport,
      playingPosition,
      experienceYears,
      previousInjuryHistory,
      trainingLoad,
    };

    const missingFields = Object.entries(requiredFields).filter(([, value]) => value === undefined || value === null || value === '');

    if (missingFields.length > 0) {
      res.status(400);
      throw new Error('Please provide all required athlete profile fields');
    }

    const athlete = await Athlete.create({
      fullName,
      dateOfBirth,
      gender,
      height,
      weight,
      sport,
      playingPosition,
      experienceYears,
      previousInjuryHistory,
      trainingLoad,
      createdBy: req.user._id,
    });

    res.status(201).json(successResponse(athlete));
  } catch (error) {
    next(error);
  }
};

export const getAthletes = async (req, res, next) => {
  try {
    const athletes = await Athlete.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(successResponse(athletes));
  } catch (error) {
    next(error);
  }
};

export const getAthleteById = async (req, res, next) => {
  try {
    const athlete = await Athlete.findOne({ _id: req.params.id, createdBy: req.user._id });

    if (!athlete) {
      res.status(404);
      throw new Error('Athlete not found');
    }

    res.status(200).json(successResponse(athlete));
  } catch (error) {
    next(error);
  }
};

export const updateAthlete = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    if (updateData.dateOfBirth === undefined) {
      delete updateData.dateOfBirth;
    }

    const athlete = await Athlete.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!athlete) {
      res.status(404);
      throw new Error('Athlete not found');
    }

    res.status(200).json(successResponse(athlete));
  } catch (error) {
    next(error);
  }
};

export const deleteAthlete = async (req, res, next) => {
  try {
    const athlete = await Athlete.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });

    if (!athlete) {
      res.status(404);
      throw new Error('Athlete not found');
    }

    res.status(200).json(successResponse(null, 'Athlete deleted successfully'));
  } catch (error) {
    next(error);
  }
};
