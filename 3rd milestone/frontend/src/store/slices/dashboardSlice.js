import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
  },
  reducers: {
    setStats: (state, action) => { state.stats = action.payload; },
  },
});

export const { setStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
