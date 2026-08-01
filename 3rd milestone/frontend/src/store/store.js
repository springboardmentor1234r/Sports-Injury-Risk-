import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import athleteReducer from './slices/athleteSlice';
import videoReducer from './slices/videoSlice';
import analysisReducer from './slices/analysisSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    athlete: athleteReducer,
    video: videoReducer,
    analysis: analysisReducer,
    dashboard: dashboardReducer,
    notification: notificationReducer,
  },
});
