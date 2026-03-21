import { useDispatch, useSelector, connect } from 'react-redux';
import {
  geofencesActions,
  groupsActions,
  driversActions,
  maintenancesActions,
  calendarsActions,
} from './store';
import { useEffectAsync } from './reactHelper';
import fetchOrThrow from './common/util/fetchOrThrow';

const CachingController = ({ demoMode }) => {
  const authenticated = useSelector((state) => !!state.session.user);
  const dispatch = useDispatch();

  useEffectAsync(async () => {
    if (authenticated && !demoMode) {
      const response = await fetchOrThrow('/api/geofences');
      dispatch(geofencesActions.refresh(await response.json()));
    }
  }, [authenticated, demoMode]);

  useEffectAsync(async () => {
    if (authenticated && !demoMode) {
      const response = await fetchOrThrow('/api/groups');
      dispatch(groupsActions.refresh(await response.json()));
    }
  }, [authenticated, demoMode]);

  useEffectAsync(async () => {
    if (authenticated && !demoMode) {
      const response = await fetchOrThrow('/api/drivers');
      dispatch(driversActions.refresh(await response.json()));
    }
  }, [authenticated, demoMode]);

  useEffectAsync(async () => {
    if (authenticated && !demoMode) {
      const response = await fetchOrThrow('/api/maintenance');
      dispatch(maintenancesActions.refresh(await response.json()));
    }
  }, [authenticated, demoMode]);

  useEffectAsync(async () => {
    if (authenticated && !demoMode) {
      const response = await fetchOrThrow('/api/calendars');
      dispatch(calendarsActions.refresh(await response.json()));
    }
  }, [authenticated, demoMode]);

  return null;
};

export default connect()(CachingController);
