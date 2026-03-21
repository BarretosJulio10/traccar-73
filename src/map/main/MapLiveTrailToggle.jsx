import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip, Box } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { sessionActions } from '../../store';
import { useAttributePreference } from '../../common/util/preferences';

const MapLiveTrailToggle = () => {
  const dispatch = useDispatch();
  const liveRoutesOverride = useSelector((state) => state.session.liveRoutesOverride);
  const currentType = liveRoutesOverride || useAttributePreference('mapLiveRoutes', 'none');

  const toggleMode = () => {
    let next;
    if (currentType === 'none') next = 'selected';
    else if (currentType === 'selected') next = 'all';
    else next = 'none';
    dispatch(sessionActions.updateLiveRoutes(next));
  };

  const getIconColor = () => {
    if (currentType === 'all') return '#39ff14'; // Neon green for all
    if (currentType === 'selected') return '#3b82f6'; // Blue for selected
    return 'rgba(255, 255, 255, 0.5)'; // Muted for none
  };

  const getLabel = () => {
    if (currentType === 'all') return 'Rastro: Todos';
    if (currentType === 'selected') return 'Rastro: Selecionado';
    return 'Rastro: Desativado';
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 80,
        right: 10,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Tooltip title={getLabel()} placement="left">
        <IconButton
          onClick={toggleMode}
          sx={{
            backgroundColor: 'rgba(30, 31, 36, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: getIconColor(),
            '&:hover': {
              backgroundColor: 'rgba(30, 31, 36, 0.95)',
              border: `1px solid ${getIconColor()}`,
            },
            width: 44,
            height: 44,
            boxShadow: currentType !== 'none' ? `0 0 15px ${getIconColor()}44` : '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <TimelineIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default MapLiveTrailToggle;
