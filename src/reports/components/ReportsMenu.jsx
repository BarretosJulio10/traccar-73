import { Divider, List } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';

const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const buildLink = (path) => {
    const fullPath = `/app${path}`;
    const sourceParams = new URLSearchParams(location.search);
    const deviceIds = sourceParams.getAll('deviceId');
    const groupIds = sourceParams.getAll('groupId');
    if (!deviceIds.length && !groupIds.length) {
      return fullPath;
    }
    const params = new URLSearchParams();
    if (path === '/reports/chart' || path === '/reports/route' || path === '/replay') {
      const [firstDeviceId] = deviceIds;
      if (firstDeviceId != null) {
        params.append('deviceId', firstDeviceId);
      }
    } else {
      deviceIds.forEach((deviceId) => params.append('deviceId', deviceId));
      groupIds.forEach((groupId) => params.append('groupId', groupId));
    }
    const search = params.toString();
    return search ? `${fullPath}?${search}` : fullPath;
  };

  return (
    <>
      <List>
        <MenuItem
          title={t('reportCombined')}
          link={buildLink('/reports/combined')}
          icon={<StarIcon />}
          selected={location.pathname === '/app/reports/combined'}
        />
        <MenuItem
          title={t('reportEvents')}
          link={buildLink('/reports/events')}
          icon={<NotificationsActiveIcon />}
          selected={location.pathname === '/app/reports/events'}
        />
        <MenuItem
          title={t('sharedGeofences')}
          link={buildLink('/reports/geofences')}
          icon={<PlaceIcon />}
          selected={location.pathname === '/app/reports/geofences'}
        />
        <MenuItem
          title={t('reportTrips')}
          link={buildLink('/reports/trips')}
          icon={<PlayCircleFilledIcon />}
          selected={location.pathname === '/app/reports/trips'}
        />
        <MenuItem
          title={t('reportStops')}
          link={buildLink('/reports/stops')}
          icon={<PauseCircleFilledIcon />}
          selected={location.pathname === '/app/reports/stops'}
        />
        <MenuItem
          title={t('reportSummary')}
          link={buildLink('/reports/summary')}
          icon={<FormatListBulletedIcon />}
          selected={location.pathname === '/app/reports/summary'}
        />
        <MenuItem
          title={t('reportChart')}
          link={buildLink('/reports/chart')}
          icon={<TrendingUpIcon />}
          selected={location.pathname === '/app/reports/chart'}
        />
        <MenuItem
          title={t('reportReplay')}
          link={buildLink('/replay')}
          icon={<RouteIcon />}
          selected={location.pathname === '/app/replay'}
        />
        <MenuItem
          title={t('reportPositions')}
          link={buildLink('/reports/route')}
          icon={<TimelineIcon />}
          selected={location.pathname === '/app/reports/route'}
        />
      </List>
      <Divider />
      <List>
        <MenuItem
          title={t('sharedLogs')}
          link="/app/reports/logs"
          icon={<NotesIcon />}
          selected={location.pathname === '/app/reports/logs'}
        />
        {!readonly && (
          <MenuItem
            title={t('reportScheduled')}
            link="/app/reports/scheduled"
            icon={<EventRepeatIcon />}
            selected={location.pathname === '/app/reports/scheduled'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('statisticsTitle')}
            link="/app/reports/statistics"
            icon={<BarChartIcon />}
            selected={location.pathname === '/app/reports/statistics'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('reportAudit')}
            link="/app/reports/audit"
            icon={<VerifiedUserIcon />}
            selected={location.pathname === '/app/reports/audit'}
          />
        )}
      </List>
    </>
  );
};

export default ReportsMenu;
