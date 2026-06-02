import { createSlice } from '@reduxjs/toolkit';

const getInitialIsDealer = () => {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('isDealer');
    if (saved !== null) {
      return JSON.parse(saved);
    }
  }
  return false;
};

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState: {
    isDealer: getInitialIsDealer(),
  },
  reducers: {
    setIsDealer: (state, action) => {
      state.isDealer = action.payload;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isDealer', JSON.stringify(action.payload));
      }
    },
  },
});

export const { setIsDealer } = exchangeSlice.actions;
export default exchangeSlice.reducer;
