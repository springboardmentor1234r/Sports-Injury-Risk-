import mongoose from 'mongoose';
import AnalysisHistory from '../models/AnalysisHistory.js';
import Athlete from '../models/Athlete.js';
import { successResponse } from '../utils/apiResponse.js';

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit };
};

export const getAnalysisHistory = async (req, res, next) => {
  try {
    const { search = '', athleteId, riskLevel, sort = 'desc' } = req.query;
    const { page, limit } = getPagination(req.query);
    const filter = { uploadedBy: req.user._id };

    if (athleteId) {
      if (!mongoose.isValidObjectId(athleteId)) {
        res.status(400);
        throw new Error('Invalid athlete ID');
      }
      filter.athleteId = athleteId;
    }
    if (riskLevel) filter.riskLevel = riskLevel;

    if (search.trim()) {
      const expression = new RegExp(search.trim(), 'i');
      const matchingAthletes = await Athlete.find({ createdBy: req.user._id, fullName: expression }).select('_id');
      filter.$or = [
        { 'video.originalFileName': expression },
        { athleteId: { $in: matchingAthletes.map(({ _id }) => _id) } },
      ];
    }

    const [items, total] = await Promise.all([
      AnalysisHistory.find(filter)
        .select('-rawResponse')
        .populate('athleteId', 'fullName sport')
        .sort({ createdAt: sort === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AnalysisHistory.countDocuments(filter),
    ]);

    res.status(200).json(successResponse({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  } catch (error) {
    next(error);
  }
};

export const getAnalysisHistoryById = async (req, res, next) => {
  try {
    const analysis = await AnalysisHistory.findOne({ _id: req.params.id, uploadedBy: req.user._id })
      .populate('athleteId', 'fullName sport');
    if (!analysis) {
      res.status(404);
      throw new Error('Analysis history record not found');
    }
    res.status(200).json(successResponse(analysis));
  } catch (error) {
    next(error);
  }
};

export const deleteAnalysisHistory = async (req, res, next) => {
  try {
    const analysis = await AnalysisHistory.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!analysis) {
      res.status(404);
      throw new Error('Analysis history record not found');
    }

    await analysis.deleteOne();
    res.status(200).json(successResponse(null, 'Analysis history deleted successfully'));
  } catch (error) {
    next(error);
  }
};

