import { createSlice } from '@reduxjs/toolkit';

const analysisSlice = createSlice({
  name: 'analysis',
  initialState: {
    results: null,
    loading: false,
  },
  reducers: {
    setAnalysisResults: (state, action) => { state.results = action.payload; },
  },
});

export const { setAnalysisResults } = analysisSlice.actions;
export default analysisSlice.reducer;
