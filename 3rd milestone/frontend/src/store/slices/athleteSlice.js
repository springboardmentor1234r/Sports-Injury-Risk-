import { createSlice } from '@reduxjs/toolkit';

const athleteSlice = createSlice({
  name: 'athlete',
  initialState: {
    athletes: [],
    loading: false,
    error: null,
  },
  reducers: {
    setAthletes: (state, action) => { state.athletes = action.payload; },
  },
});

export const { setAthletes } = athleteSlice.actions;
export default athleteSlice.reducer;
