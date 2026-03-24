import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'geofences',
  initialState: {
    items: {},
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => (state.items[item.id] = item));
    },
    update(state, action) {
      action.payload.forEach((item) => (state.items[item.id] = item));
    },
    remove(state, action) {
      action.payload.forEach((id) => { delete state.items[id]; });
    },
  },
});

export { actions as geofencesActions };
export { reducer as geofencesReducer };
