import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import { useHudTheme } from '../common/util/ThemeContext';

const MainToolbar = ({
  filteredDevices,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
}) => {
  const navigate = useNavigate();
  const t = useTranslation();
  const deviceReadonly = useDeviceReadonly();
  const { theme } = useHudTheme();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  const filterRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const deviceStatusCount = (status) =>
    Object.values(devices).filter((d) => d.status === status).length;

  return (
    <div 
      className="px-5 py-4 flex items-center gap-3 transition-colors duration-500 z-20 relative border-b border-slate-100"
      style={{ background: '#FFFFFF' }}
    >
      {/* Search Input */}
      <div className="flex-1 relative flex items-center">
        <div 
          className="absolute left-4 flex items-center justify-center pointer-events-none"
          style={{ color: '#94a3b8' }}
        >
          <SearchIcon sx={{ fontSize: 20 }} />
        </div>
        <input
          type="text"
          placeholder={t('sharedSearchDevices')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full text-[14px] font-bold rounded-2xl py-3 pl-11 pr-12 focus:outline-none focus:ring-2 transition-all border border-slate-100 placeholder:text-slate-400"
          style={{ 
            background: '#F8FAFC', 
            borderColor: '#F1F5F9', 
            color: '#0f172a',
            '--tw-ring-color': theme.accent + '33'
          }}
        />

        {/* Filter Button inside input right */}
        <button
          ref={filterRef}
          onClick={() => setFilterAnchorEl(filterRef.current)}
          className="absolute right-2.5 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer pointer-events-auto hover:bg-slate-200/50"
          style={{ color: '#64748b' }}
          title={t('sharedSearch')}
        >
          <Badge
            variant="dot"
            invisible={!filter.statuses.length && !filter.groups.length}
            sx={{ '& .MuiBadge-badge': { backgroundColor: theme.accent, right: 2, top: 2 } }}
          >
            <TuneIcon sx={{ fontSize: 20, color: (filter.statuses.length || filter.groups.length) ? theme.accent : 'inherit' }} />
          </Badge>
        </button>
      </div>

      {/* Add Device Button */}
      {!deviceReadonly && (
        <button
          onClick={() => navigate('/app/settings/device')}
          className="w-12 h-12 flex-shrink-0 rounded-2xl shadow-lg shadow-cyan-500/20 flex items-center justify-center transition-transform active:scale-95"
          style={{ background: theme.accent, color: 'white' }}
          title={t('sharedAdd')}
        >
          <AddIcon sx={{ fontSize: 24, fontWeight: 'bold' }} />
        </button>
      )}

      {/* Popover for filters */}
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: { 
              mt: 1, 
              borderRadius: '20px', 
              boxShadow: theme.isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary
            }
          }
        }}
      >
        <div className="p-6 flex flex-col gap-5 w-[320px]">
          <div className="pb-3 border-b" style={{ borderColor: theme.border }}>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('sharedSearch')}</h3>
          </div>

          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel sx={{ color: theme.textMuted }}>{t('deviceStatus')}</InputLabel>
            <Select
              label={t('deviceStatus')}
              value={filter.statuses}
              onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
              multiple
              sx={{ 
                borderRadius: '12px',
                background: theme.bg,
                color: theme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.accent },
              }}
            >
              <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
              <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
              <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel sx={{ color: theme.textMuted }}>{t('settingsGroups')}</InputLabel>
            <Select
              label={t('settingsGroups')}
              value={filter.groups}
              onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
              multiple
              sx={{ 
                borderRadius: '12px',
                background: theme.bg,
                color: theme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.accent },
              }}
            >
              {Object.values(groups)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel sx={{ color: theme.textMuted }}>{t('sharedSortBy')}</InputLabel>
            <Select
              label={t('sharedSortBy')}
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              displayEmpty
              sx={{ 
                borderRadius: '12px',
                background: theme.bg,
                color: theme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.accent },
              }}
            >
              <MenuItem value="">{'\u00a0'}</MenuItem>
              <MenuItem value="name">{t('sharedName')}</MenuItem>
              <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
            </Select>
          </FormControl>

          <FormGroup className="p-2 rounded-xl" style={{ background: theme.bg }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={filterMap} 
                  onChange={(e) => setFilterMap(e.target.checked)} 
                  sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }}
                />
              }
              label={<span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('sharedFilterMap')}</span>}
            />
          </FormGroup>
        </div>
      </Popover>
    </div>
  );
};

export default MainToolbar;
