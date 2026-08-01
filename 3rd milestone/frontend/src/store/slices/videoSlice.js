import { createSlice } from '@reduxjs/toolkit';

const videoSlice = createSlice({
  name: 'video',
  initialState: {
    videos: [],
    loading: false,
  },
  reducers: {
    setVideos: (state, action) => { state.videos = action.payload; },
  },
});

export const { setVideos } = videoSlice.actions;
export default videoSlice.reducer;
