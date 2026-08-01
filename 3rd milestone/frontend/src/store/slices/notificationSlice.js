import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
  },
  reducers: {
    setNotifications: (state, action) => { state.notifications = action.payload; },
  },
});

export const { setNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
