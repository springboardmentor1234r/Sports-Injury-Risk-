import mongoose from 'mongoose';

const athleteSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      trim: true,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [0, 'Height cannot be negative'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight cannot be negative'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
    },
    playingPosition: {
      type: String,
      required: [true, 'Playing position is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    previousInjuryHistory: {
      type: String,
      required: [true, 'Previous injury history is required'],
      trim: true,
    },
    trainingLoad: {
      type: String,
      required: [true, 'Training load is required'],
      trim: true,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid training load',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Athlete = mongoose.model('Athlete', athleteSchema);

export default Athlete;
