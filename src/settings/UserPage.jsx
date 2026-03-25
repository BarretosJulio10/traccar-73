import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Dialog,
  DialogContent,
  DialogActions,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MapIcon from '@mui/icons-material/Map';
import LinkIcon from '@mui/icons-material/Link';
import { useDispatch, useSelector } from 'react-redux';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useUserAttributes from '../common/attributes/useUserAttributes';
import { sessionActions } from '../store';
import SelectField from '../common/components/SelectField';
import useCommonUserAttributes from '../common/attributes/useCommonUserAttributes';
import { useAdministrator, useRestriction, useManager } from '../common/util/permissions';
import { useCatch } from '../reactHelper';
import useMapStyles from '../map/core/useMapStyles';
import { map } from '../map/core/MapView';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const UserPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const admin = useAdministrator();
  const manager = useManager();
  const fixedEmail = useRestriction('fixedEmail');

  const currentUser = useSelector((state) => state.session.user);
  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const openIdForced = useSelector((state) => state.session.server.openIdForce);
  const totpEnable = useSelector((state) => state.session.server.attributes.totpEnable);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const mapStyles = useMapStyles();
  const commonUserAttributes = useCommonUserAttributes(t);
  const userAttributes = useUserAttributes(t);

  const { id } = useParams();
  const [item, setItem] = useState(id === currentUser.id.toString() ? currentUser : null);

  const [deleteEmail, setDeleteEmail] = useState();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const handleDelete = useCatch(async () => {
    if (deleteEmail === currentUser.email) {
      setDeleteFailed(false);
      await fetchOrThrow(`/api/users/${currentUser.id}`, { method: 'DELETE' });
      navigate('/login');
      dispatch(sessionActions.updateUser(null));
    } else {
      setDeleteFailed(true);
    }
  });

  const handleGenerateTotp = useCatch(async () => {
    const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
    setItem({ ...item, totpKey: await response.text() });
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const attribute = searchParams.get('attribute');

  useEffect(() => {
    if (item && attribute) {
      if (!item.attributes.hasOwnProperty(attribute)) {
        setItem({ ...item, attributes: { ...item.attributes, [attribute]: '' } });
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('attribute');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [item, searchParams, setSearchParams, attribute]);

  const onItemSaved = (result) => {
    if (result.id === currentUser.id) {
      dispatch(sessionActions.updateUser(result));
    }
  };

  const validate = () =>
    item &&
    item.name &&
    item.email &&
    (item.id || item.password) &&
    (admin || !totpForce || item.totpKey);

  const NeumorphicSection = ({ title, icon: Icon, children, defaultOpen = false, error = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div 
        className={`mb-4 rounded-3xl shadow-md border overflow-hidden transition-all duration-300`}
        style={{ background: theme.bgSecondary, borderColor: error ? '#ef444455' : theme.border }}
      >
        <div
          className="p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div 
              className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner`}
              style={{ background: theme.bg, color: error ? '#ef4444' : theme.accent, border: `1px solid ${theme.border}` }}
            >
              <Icon sx={{ fontSize: 16 }} />
            </div>
            <h3 
              className={`text-[11px] font-black uppercase tracking-widest`}
              style={{ color: error ? '#f87171' : theme.textPrimary }}
            >{title}</h3>
          </div>
          <ExpandMoreIcon sx={{ fontSize: 18 }} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }} />
        </div>
        <Collapse in={isOpen}>
          <div className="p-4 pt-1 flex flex-col gap-4">
            <div className="h-px mb-1 opacity-10" style={{ background: theme.textMuted }} />
            {children}
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <EditItemView
      endpoint="users"
      item={item}
      setItem={setItem}
      defaultItem={admin ? { deviceLimit: -1 } : {}}
      validate={validate}
      onItemSaved={onItemSaved}
      title={t('settingsUser')}
    >
      {item && (
        <div className="flex flex-col gap-1 px-1">
          <NeumorphicSection title={t('sharedRequired')} icon={PersonIcon}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('sharedName')}</span>
              <TextField
                value={item.name || ''}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('userEmail')}</span>
              <TextField
                value={item.email || ''}
                onChange={(e) => setItem({ ...item, email: e.target.value })}
                disabled={fixedEmail && item.id === currentUser.id}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            {!openIdForced && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('userPassword')}</span>
                <TextField
                  type="password"
                  autoComplete="new-password"
                  onChange={(e) => setItem({ ...item, password: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('loginTotpKey')}</span>
              <FormControl fullWidth size="small">
                <OutlinedInput
                  readOnly
                  value={item.totpKey || ''}
                  sx={{ 
                    fontSize: '13px', 
                    borderRadius: '12px',
                    background: theme.bg,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border }
                  }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={handleGenerateTotp} style={{ color: theme.accent }}>
                        <CachedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setItem({ ...item, totpKey: null })}
                        style={{ color: theme.textMuted }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </div>
          </NeumorphicSection>

          <NeumorphicSection title={t('sharedPreferences')} icon={TuneIcon}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('sharedPhone')}</span>
              <TextField
                value={item.phone || ''}
                onChange={(e) => setItem({ ...item, phone: e.target.value })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Idioma</span>
              <FormControl fullWidth size="small">
                <Select
                  value={(item.attributes && item.attributes.language) || ''}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, language: e.target.value } })}
                  sx={{ fontSize: '13px', borderRadius: '12px' }}
                >
                  <MenuItem value="">Padrão do navegador</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="pt_BR">Português (Brasil)</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="ru">Русский</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('mapDefault')}</span>
              <FormControl fullWidth size="small">
                <Select
                  value={item.map || 'locationIqStreets'}
                  onChange={(e) => setItem({ ...item, map: e.target.value })}
                  sx={{ fontSize: '13px', borderRadius: '12px' }}
                >
                  {mapStyles.filter((style) => style.available).map((style) => (
                    <MenuItem key={style.id} value={style.id}>{style.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('settingsSpeedUnit')}</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.speedUnit) || 'kn'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, speedUnit: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="kn">{t('sharedKn')}</MenuItem>
                    <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                    <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('settingsDistanceUnit')}</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.distanceUnit) || 'km'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, distanceUnit: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="km">{t('sharedKm')}</MenuItem>
                    <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                    <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('sharedTimezone')}</span>
              <SelectField
                value={item.attributes && item.attributes.timezone}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, timezone: e.target.value } })}
                endpoint="/api/server/timezones"
                keyGetter={(it) => it}
                titleGetter={(it) => it}
                fullWidth
                size="small"
                sx={{ fontSize: '13px', borderRadius: '12px' }}
              />
            </div>
          </NeumorphicSection>

          <NeumorphicSection title={t('sharedLocation')} icon={LocationOnIcon}>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Lat</span>
                <TextField type="number" size="small" value={item.latitude || 0} onChange={(e) => setItem({ ...item, latitude: Number(e.target.value) })} sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Lon</span>
                <TextField type="number" size="small" value={item.longitude || 0} onChange={(e) => setItem({ ...item, longitude: Number(e.target.value) })} sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Zoom</span>
                <TextField type="number" size="small" inputProps={{ min: 1, max: 20, step: 0.5 }} value={item.zoom || 12} onChange={(e) => setItem({ ...item, zoom: Number(e.target.value) })} sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              </div>
            </div>
            <button
              type="button"
              className="py-2.5 rounded-xl border shadow-md text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.accent }}
              onClick={() => {
                const { lng, lat } = map.getCenter();
                setItem({ ...item, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)), zoom: Number(map.getZoom().toFixed(1)) });
              }}
            >
              {t('mapCurrentLocation')}
            </button>
          </NeumorphicSection>

          <NeumorphicSection title="Mapa & Interface" icon={MapIcon}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Comportamento do Mapa</span>
              <FormGroup
                className="p-4 rounded-3xl border grid grid-cols-2 gap-1 shadow-inner"
                style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
              >
                <FormControlLabel control={<Checkbox size="small" checked={!!(item.attributes && item.attributes.mapFollow)} onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, mapFollow: e.target.checked } })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>Seguir veículo</span>} />
                <FormControlLabel control={<Checkbox size="small" checked={!!(item.attributes && item.attributes.mapCluster)} onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, mapCluster: e.target.checked } })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>Agrupar ícones</span>} />
                <FormControlLabel control={<Checkbox size="small" checked={!!(item.attributes && item.attributes.mapDirection)} onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, mapDirection: e.target.checked } })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>Seta de direção</span>} />
                <FormControlLabel control={<Checkbox size="small" checked={!!(item.attributes && item.attributes.mapGeofences)} onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, mapGeofences: e.target.checked } })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>Cercas no mapa</span>} />
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Linha 1 do card</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.devicePrimary) || ''}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, devicePrimary: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="">Automático</MenuItem>
                    <MenuItem value="name">Nome</MenuItem>
                    <MenuItem value="uniqueId">ID único</MenuItem>
                    <MenuItem value="phone">Telefone</MenuItem>
                    <MenuItem value="model">Modelo</MenuItem>
                    <MenuItem value="contact">Contato</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Linha 2 do card</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.deviceSecondary) || ''}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, deviceSecondary: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="">Automático</MenuItem>
                    <MenuItem value="name">Nome</MenuItem>
                    <MenuItem value="uniqueId">ID único</MenuItem>
                    <MenuItem value="phone">Telefone</MenuItem>
                    <MenuItem value="model">Modelo</MenuItem>
                    <MenuItem value="contact">Contato</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Som de eventos</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.soundEvents) || ''}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, soundEvents: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="">Sem som</MenuItem>
                    <MenuItem value="default">Padrão</MenuItem>
                    <MenuItem value="warning">Alerta</MenuItem>
                    <MenuItem value="sos">SOS</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">Som de alarmes</span>
                <FormControl fullWidth size="small">
                  <Select
                    value={(item.attributes && item.attributes.soundAlarms) || ''}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, soundAlarms: e.target.value } })}
                    sx={{ fontSize: '13px', borderRadius: '12px' }}
                  >
                    <MenuItem value="">Sem som</MenuItem>
                    <MenuItem value="default">Padrão</MenuItem>
                    <MenuItem value="warning">Alerta</MenuItem>
                    <MenuItem value="sos">SOS</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Escala dos ícones</span>
              <TextField
                type="number"
                size="small"
                inputProps={{ min: 0.5, max: 4, step: 0.25 }}
                value={(item.attributes && item.attributes.iconScale) || 1}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, iconScale: Number(e.target.value) } })}
                fullWidth
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
          </NeumorphicSection>

          <NeumorphicSection title="Segurança" icon={VpnKeyIcon}>
            {manager && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('userExpirationTime')}</span>
                  <TextField
                    type="date"
                    size="small"
                    value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                    onChange={(e) => { if (e.target.value) { setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() }); } }}
                    fullWidth
                    sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </div>
                <FormGroup
                  className="p-4 rounded-3xl border grid grid-cols-1 gap-1 shadow-inner"
                  style={{ background: `${theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'}`, borderColor: theme.border }}
                >
                  <FormControlLabel control={<Checkbox size="small" checked={item.disabled} onChange={(e) => setItem({ ...item, disabled: e.target.checked })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('sharedDisabled')}</span>} />
                  {admin && <FormControlLabel control={<Checkbox size="small" checked={item.administrator} onChange={(e) => setItem({ ...item, administrator: e.target.checked })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('userAdmin')}</span>} />}
                  <FormControlLabel control={<Checkbox size="small" checked={item.readonly} onChange={(e) => setItem({ ...item, readonly: e.target.checked })} sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />} label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('serverReadonly')}</span>} />
                </FormGroup>
                {admin && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase px-1">Limite de dispositivos (-1 = ilimitado)</span>
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ min: -1 }}
                      value={item.deviceLimit ?? -1}
                      onChange={(e) => setItem({ ...item, deviceLimit: Number(e.target.value) })}
                      fullWidth
                      sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </div>
                )}
              </>
            )}
          </NeumorphicSection>

          <NeumorphicSection title="Integrações" icon={LinkIcon}>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">App de navegação (URL)</span>
              <TextField
                placeholder="https://waze.com/ul?ll={latitude},{longitude}"
                value={(item.attributes && item.attributes.navigationAppLink) || ''}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, navigationAppLink: e.target.value } })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Nome do app de navegação</span>
              <TextField
                placeholder="Waze"
                value={(item.attributes && item.attributes.navigationAppTitle) || ''}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, navigationAppTitle: e.target.value } })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Telegram Chat ID</span>
              <TextField
                value={(item.attributes && item.attributes.telegramChatId) || ''}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, telegramChatId: e.target.value } })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase px-1">Pushover User Key</span>
              <TextField
                value={(item.attributes && item.attributes.pushoverUserKey) || ''}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, pushoverUserKey: e.target.value } })}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </div>
          </NeumorphicSection>

          <div className="mb-4">
            <EditAttributesAccordion
              attribute={attribute}
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonUserAttributes, ...userAttributes }}
              focusAttribute={attribute}
            />
          </div>

          {registrationEnabled && item.id === currentUser.id && !manager && (
            <NeumorphicSection title={t('userDeleteAccount')} icon={DeleteForeverIcon} error>
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Para confirmar, digite seu e-mail abaixo:</p>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-500 uppercase px-1">{t('userEmail')}</span>
                <TextField
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  error={deleteFailed}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-input': { fontSize: '13px' }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest active:bg-red-500/20 transition-all"
              >
                {t('userDeleteAccount')}
              </button>
            </NeumorphicSection>
          )}
        </div>
      )}
    </EditItemView>
  );
};

export default UserPage;
