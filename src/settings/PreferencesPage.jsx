import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Autocomplete,
  TextField,
  createFilterOptions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MapIcon from '@mui/icons-material/Map';
import DevicesIcon from '@mui/icons-material/Devices';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import useMapStyles from '../map/core/useMapStyles';
import useMapOverlays from '../map/overlay/useMapOverlays';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const deviceFields = [
  { id: 'name', name: 'sharedName' },
  { id: 'uniqueId', name: 'deviceIdentifier' },
  { id: 'phone', name: 'sharedPhone' },
  { id: 'model', name: 'deviceModel' },
  { id: 'contact', name: 'deviceContact' },
  { id: 'geofenceIds', name: 'sharedGeofence' },
  { id: 'driverUniqueId', name: 'sharedDriver' },
  { id: 'motion', name: 'positionMotion' },
];

const PreferencesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const user = useSelector((state) => state.session.user);
  const [attributes, setAttributes] = useState(user.attributes || {});

  const versionApp = import.meta.env.VITE_APP_VERSION;
  const versionServer = useSelector((state) => state.session.server.version);
  const socket = useSelector((state) => state.session.socket);

  const [token, setToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(
    dayjs().add(1, 'week').locale('en').format('YYYY-MM-DD'),
  );

  const mapStyles = useMapStyles();
  const mapOverlays = useMapOverlays();
  const positionAttributes = usePositionAttributes(t);
  const filter = createFilterOptions();

  const generateToken = useCatch(async () => {
    const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
    const response = await fetchOrThrow('/api/session/token', {
      method: 'POST',
      body: new URLSearchParams(`expiration=${expiration}`),
    });
    setToken(await response.text());
  });

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const handleSave = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
    navigate(-1);
  });

  const handleReboot = useCatch(async () => {
    const response = await fetchOrThrow('/api/server/reboot', { method: 'POST' });
    throw Error(response.statusText);
  });

  const NeumorphicSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div 
        className="mb-6 rounded-3xl shadow-md border overflow-hidden transition-all duration-300"
        style={{ background: theme.bgSecondary, borderColor: theme.border }}
      >
        <div
          className="p-5 flex items-center justify-between cursor-pointer active:opacity-70 transition-all font-bold"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: theme.bg, color: theme.accent, border: `1px solid ${theme.border}` }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{title}</h3>
          </div>
          <ExpandMoreIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }} />
        </div>
        <Collapse in={isOpen}>
          <div className="p-5 pt-0 flex flex-col gap-5">
            <div className="h-px mb-2 opacity-10" style={{ background: theme.textMuted }} />
            {children}
          </div>
        </Collapse>
      </div>
    );
  };

  const headerActions = (
    <button
      onClick={handleSave}
      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md border active:scale-95 transition-all duration-300"
      style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.accent }}
    >
      <SaveIcon sx={{ fontSize: 20 }} />
    </button>
  );

  return (
    <PwaPageLayout title={t('sharedPreferences')} actions={headerActions}>
      <div className="flex flex-col pb-32">
        {!readonly && (
          <>
            <NeumorphicSection title={t('mapTitle')} icon={MapIcon} defaultOpen>
              <div className="flex flex-col gap-4">
                <FormControl variant="outlined" fullWidth size="small">
                  <InputLabel className="text-slate-400">{t('mapActive')}</InputLabel>
                  <Select
                    label={t('mapActive')}
                    value={attributes.activeMapStyles?.split(',') || ['locationIqStreets', 'locationIqDark', 'openFreeMap']}
                    onChange={(e, child) => {
                      const clickedStyle = Array.isArray(child) ? child[0] : child;
                      const clicked = mapStyles.find((s) => s.id === clickedStyle.props.value);
                      if (clicked.available) {
                        setAttributes({ ...attributes, activeMapStyles: e.target.value.join(',') });
                      } else if (clicked.id !== 'custom') {
                        const query = new URLSearchParams({ attribute: clicked.attribute });
                        navigate(`/app/settings/user/${user.id}?${query.toString()}`);
                      }
                    }}
                    multiple
                    className="rounded-xl border-none shadow-inner"
                    style={{ background: theme.bg, color: theme.textPrimary }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  >
                    {mapStyles.map((style) => (
                      <MenuItem key={style.id} value={style.id}>
                        <Typography component="span" color={style.available ? 'textPrimary' : 'error'}>
                          {style.title}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl variant="outlined" fullWidth size="small">
                  <InputLabel className="text-slate-400">{t('mapOverlay')}</InputLabel>
                  <Select
                    label={t('mapOverlay')}
                    value={attributes.selectedMapOverlay || ''}
                    className="rounded-xl border-none shadow-inner"
                    style={{ background: theme.bg, color: theme.textPrimary }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    onChange={(e) => {
                      const clicked = mapOverlays.find((o) => o.id === e.target.value);
                      if (!clicked || clicked.available) {
                        setAttributes({ ...attributes, selectedMapOverlay: e.target.value });
                      } else if (clicked.id !== 'custom') {
                        const query = new URLSearchParams({ attribute: clicked.attribute });
                        navigate(`/app/settings/user/${user.id}?${query.toString()}`);
                      }
                    }}
                  >
                    <MenuItem value="">{'\u00a0'}</MenuItem>
                    {mapOverlays.map((overlay) => (
                      <MenuItem key={overlay.id} value={overlay.id}>
                        <Typography component="span" color={overlay.available ? 'textPrimary' : 'error'}>
                          {overlay.title}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormGroup 
                  className="p-4 rounded-2xl border shadow-inner"
                  style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
                >
                  <FormControlLabel
                    control={<Checkbox checked={attributes.hasOwnProperty('mapGeofences') ? attributes.mapGeofences : true}
                      onChange={(e) => setAttributes({ ...attributes, mapGeofences: e.target.checked })}
                      sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />}
                    label={<span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('attributeShowGeofences')}</span>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={attributes.hasOwnProperty('mapCluster') ? attributes.mapCluster : true}
                      onChange={(e) => setAttributes({ ...attributes, mapCluster: e.target.checked })}
                      sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />}
                    label={<span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('mapClustering')}</span>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={attributes.hasOwnProperty('mapFollow') ? attributes.mapFollow : false}
                      onChange={(e) => setAttributes({ ...attributes, mapFollow: e.target.checked })}
                      sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />}
                    label={<span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('deviceFollow')}</span>}
                  />
                </FormGroup>
              </div>
            </NeumorphicSection>

            <NeumorphicSection title={t('deviceTitle')} icon={DevicesIcon}>
              <div className="flex flex-col gap-4">
                <SelectField
                  value={attributes.devicePrimary || 'name'}
                  onChange={(e) => setAttributes({ ...attributes, devicePrimary: e.target.value })}
                  data={deviceFields}
                  titleGetter={(it) => t(it.name)}
                  label={t('devicePrimaryInfo')}
                />
                <SelectField
                  value={attributes.deviceSecondary}
                  onChange={(e) => setAttributes({ ...attributes, deviceSecondary: e.target.value })}
                  data={deviceFields}
                  titleGetter={(it) => t(it.name)}
                  label={t('deviceSecondaryInfo')}
                />
              </div>
            </NeumorphicSection>

            <NeumorphicSection title={t('sharedSound')} icon={NotificationsActiveIcon}>
              <div className="flex flex-col gap-4" style={{ color: theme.textPrimary }}>
                <SelectField
                  multiple
                  value={attributes.soundEvents?.split(',') || []}
                  onChange={(e) => setAttributes({ ...attributes, soundEvents: e.target.value.join(',') })}
                  endpoint="/api/notifications/types"
                  keyGetter={(it) => it.type}
                  titleGetter={(it) => t(prefixString('event', it.type))}
                  label={t('eventsSoundEvents')}
                />
                <SelectField
                  multiple
                  value={attributes.soundAlarms?.split(',') || ['sos']}
                  onChange={(e) => setAttributes({ ...attributes, soundAlarms: e.target.value.join(',') })}
                  data={alarms}
                  keyGetter={(it) => it.key}
                  label={t('eventsSoundAlarms')}
                />
              </div>
            </NeumorphicSection>
          </>
        )}

        <NeumorphicSection title={t('userToken')} icon={VpnKeyIcon}>
          <div className="flex flex-col gap-4">
            <TextField
              label={t('userExpirationTime')}
              type="date"
              value={tokenExpiration}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                setTokenExpiration(e.target.value);
                setToken(null);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: theme.bg } }}
            />
            <div className="relative">
              <OutlinedInput
                multiline
                rows={4}
                readOnly
                fullWidth
                value={token || ''}
                placeholder="Clique para gerar token..."
                className="rounded-2xl shadow-inner text-xs font-mono border-none"
                style={{ background: theme.bg, color: theme.textPrimary }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
              />
              <div className="absolute right-3 bottom-3 flex flex-col gap-2">
                <IconButton
                  size="small"
                  onClick={generateToken}
                  disabled={!!token}
                  className="shadow-md border"
                  style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.accent }}
                >
                  <CachedIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => navigator.clipboard.writeText(token)}
                  disabled={!token}
                  className="shadow-md border"
                  style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.accent }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </div>
            </div>
          </div>
        </NeumorphicSection>

        <NeumorphicSection title={t('sharedInfoTitle')} icon={InfoIcon}>
          <div className="flex flex-col gap-4">
            <div 
              className="flex justify-between items-center p-3 rounded-xl border shadow-inner"
              style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{t('settingsAppVersion')}</span>
              <span className="text-xs font-black" style={{ color: theme.accent }}>{versionApp}</span>
            </div>
            <div 
              className="flex justify-between items-center p-3 rounded-xl border shadow-inner"
              style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{t('settingsServerVersion')}</span>
              <span className="text-xs font-black" style={{ color: theme.textPrimary }}>{versionServer || '-'}</span>
            </div>
            <div 
              className="flex justify-between items-center p-3 rounded-xl border shadow-inner"
              style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{t('settingsConnection')}</span>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full transition-all`} 
                  style={{ 
                    background: socket ? theme.accent : '#ef4444', 
                    boxShadow: socket ? `0 0 8px ${theme.accent}` : '0 0 8px #ef4444' 
                  }} 
                />
                <span className="text-xs font-black uppercase" style={{ color: theme.textPrimary }}>{socket ? t('deviceStatusOnline') : t('deviceStatusOffline')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => navigate('/app/emulator')}
                className="py-3 rounded-2xl border shadow-md active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.accent }}
              >
                {t('sharedEmulator')}
              </button>
              {admin && (
                <button
                  onClick={handleReboot}
                  className="py-3 rounded-2xl border shadow-md active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                  style={{ background: theme.bgSecondary, borderColor: theme.border, color: '#ef4444' }}
                >
                  {t('serverReboot')}
                </button>
              )}
            </div>
          </div>
        </NeumorphicSection>

        {/* Action Buttons */}
        <div className="fixed left-4 right-4 z-40 flex gap-4 pointer-events-none" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 1rem)' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto flex-1 h-14 rounded-[20px] border shadow-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.textMuted }}
          >
            {t('sharedCancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="pointer-events-auto flex-1 h-14 rounded-[20px] shadow-lg font-black uppercase tracking-[2px] text-xs active:scale-95 transition-all"
            style={{ background: theme.accent, color: theme.isDark ? 'black' : 'white' }}
          >
            {t('sharedSave')}
          </button>
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default PreferencesPage;
