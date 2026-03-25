import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { errorsReducer as errors } from './errors';
import { sessionReducer as session } from './session';
import { devicesReducer as devices } from './devices';
import { eventsReducer as events } from './events';
import { motionReducer as motion } from './motion';
import { geofencesReducer as geofences } from './geofences';
import { groupsReducer as groups } from './groups';
import { driversReducer as drivers } from './drivers';
import { maintenancesReducer as maintenances } from './maintenances';
import { calendarsReducer as calendars } from './calendars';
const appReducer = combineReducers({
  errors,
  session,
  devices,
  events,
  motion,
  geofences,
  groups,
  drivers,
  maintenances,
  calendars,
});

// Root reducer: intercepts RESET_ALL to flush all user/tenant data.
// Preserves session.server (server config is not user-specific).
const rootReducer = (state, action) => {
  if (action.type === 'store/resetAll') {
    const fresh = appReducer(undefined, action);
    return {
      ...fresh,
      session: { ...fresh.session, server: state?.session?.server ?? { attributes: {} } },
    };
  }
  return appReducer(state, action);
};

/** Dispatch this on logout or tenant switch to wipe all user/tenant data from Redux. */
export const resetAll = () => ({ type: 'store/resetAll' });

export { errorsActions } from './errors';
export { sessionActions } from './session';
export { devicesActions } from './devices';
export { eventsActions } from './events';
export { motionActions } from './motion';
export { geofencesActions } from './geofences';
export { groupsActions } from './groups';
export { driversActions } from './drivers';
export { maintenancesActions } from './maintenances';
export { calendarsActions } from './calendars';

export default configureStore({
  reducer: rootReducer,
});
