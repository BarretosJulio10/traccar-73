import { useEffect, useState } from 'react';
import {
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  Button,
  TextField,
  Link,
  Snackbar,
  IconButton,
  Tooltip,
  Box,
  InputAdornment,
  Typography,
} from '@mui/material';
import ReactCountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions, devicesActions, eventsActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../common/components/NativeInterface';
import LogoImage from './LogoImage';
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { apiUrl } from '../common/util/apiUrl';
import { DEFAULT_TENANT_SLUG, DEMO_USER } from '../common/util/constants';
import { lightInputSx } from './loginStyles';
import usePwaInstallPrompt from '../common/util/usePwaInstallPrompt';
import { auditLog } from '../common/util/audit';

const useStyles = makeStyles()((theme) => ({
  options: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(4),
    marginTop: theme.spacing(0.5),
  },
  link: {
    cursor: 'pointer',
  },
  smartBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    background: 'rgba(30, 31, 36, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    boxShadow: '0 4px 25px rgba(0,0,0,0.5)',
    animation: '$slideDown 0.5s ease-out',
  },
  '@keyframes slideDown': {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isInstalled } = usePwaInstallPrompt();

  const { languages, language, setLocalLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({
    code: values[0],
    country: values[1].country,
    name: values[1].name,
  }));

  const [failed, setFailed] = useState(false);
  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerTooltip, setShowServerTooltip] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => {
    const attributes = state.session.server.attributes;
    return !attributes.language && !attributes['ui.disableLoginLanguage'];
  });
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const [dismissedBanner, setDismissedBanner] = useState(false);

  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    if (window.sessionStorage.getItem('sessionExpired')) {
      setSessionExpired(true);
      window.sessionStorage.removeItem('sessionExpired');
    }
  }, []);

  const handleDemoLogin = () => {
    auditLog('login_demo', { email: DEMO_USER.email });
    dispatch(sessionActions.updateUser(DEMO_USER));
    dispatch(devicesActions.refresh([]));
    dispatch(eventsActions.deleteAll());
    dispatch(sessionActions.updatePositions([]));
    window.sessionStorage.setItem('demoMode', 'true');
    navigate('/app', { replace: true });
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
      const response = await fetch(apiUrl('/api/session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-tenant-slug': tenantSlug,
          'x-traccar-email': email,
        },
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        auditLog('login_success', { email, user_id: user.id });
        localStorage.setItem('traccarEmail', email);
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/app';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetchOrThrow(`/api/session?token=${encodeURIComponent(token)}`);
    const user = await response.json();
    dispatch(sessionActions.updateUser(user));
    navigate('/app');
  });

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('hostname') !== window.location.hostname) {
      window.localStorage.setItem('hostname', window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <LoginLayout>
      {isMobile && !isInstalled && !dismissedBanner && (
        <div className={classes.smartBanner}>
          <Box
            component="img"
            src="/apple-touch-icon-180x180.png"
            sx={{ width: 44, height: 44, borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          />
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              HyperTraccar
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Instale para melhor experiência
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate('/install')}
            sx={{
              bgcolor: '#39ff14',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.7rem',
              px: 2,
              borderRadius: '6px',
              '&:hover': { bgcolor: '#32e612' }
            }}
          >
            INSTALAR
          </Button>
          <IconButton size="small" onClick={() => setDismissedBanner(true)} sx={{ color: 'rgba(255,255,255,0.3)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      )}
      <div className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <IconButton
            sx={{ color: 'rgba(255,255,255,0.7)' }}
            onClick={() => navigate('/change-server')}
          >
            <Tooltip
              title={`${t('settingsServer')}: ${window.location.hostname}`}
              open={showServerTooltip}
              arrow
            >
              <VpnLockIcon />
            </Tooltip>
          </IconButton>
        )}
        {!nativeEnvironment && (
          <IconButton sx={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => setShowQr(true)}>
            <QrCode2Icon />
          </IconButton>
        )}
        {languageEnabled && (
          <FormControl size="small">
            <Select
              value={language}
              onChange={(e) => setLocalLanguage(e.target.value)}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                fontWeight: 600,
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '.MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <Box component="span" sx={{ mr: 1 }}>
                    <ReactCountryFlag countryCode={it.country} svg />
                  </Box>
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      <div className={classes.container}>
        <div>
          <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff', mb: 0.5 }}>
            {t('loginLogin')}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>
            {t('loginCredentialsSubtitle')}
          </Typography>
        </div>
        {!openIdForced && (
          <>
            <TextField
              required
              error={failed}
              placeholder={t('userEmail')}
              name="email"
              value={email}
              autoComplete="email"
              autoFocus={!email}
              onChange={(e) => setEmail(e.target.value)}
              helperText={failed && t('loginInvalidCredentials')}
              size="small"
              sx={lightInputSx}
            />
            <TextField
              required
              error={failed}
              placeholder={t('userPassword')}
              name="password"
              value={password}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus={!!email}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              sx={lightInputSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {codeEnabled && (
              <TextField
                required
                error={failed}
                placeholder={t('loginTotpCode')}
                name="code"
                value={code}
                type="number"
                onChange={(e) => setCode(e.target.value)}
                size="small"
                sx={lightInputSx}
              />
            )}
            <Button
              onClick={handlePasswordLogin}
              type="submit"
              variant="contained"
              disabled={!email || !password || (codeEnabled && !code)}
              startIcon={<LoginIcon />}
              sx={{
                bgcolor: '#fff',
                color: '#1e293b',
                py: 1.2,
                fontSize: '0.875rem',
                fontWeight: 700,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: '#f1f5f9',
                },
                '&.Mui-disabled': {
                  color: '#94a3b8',
                  bgcolor: 'rgba(255,255,255,0.5)',
                },
              }}
            >
              {t('loginLogin')}
            </Button>
          </>
        )}
        {openIdEnabled && (
          <Button
            onClick={() => handleOpenIdLogin()}
            variant="contained"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: '#fff',
              py: 1.2,
              border: '1px solid rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
            }}
          >
            {t('loginOpenId')}
          </Button>
        )}        <Button
          onClick={handleDemoLogin}
          variant="outlined"
          type="button"
          sx={{
            py: 1,
            fontSize: '0.8rem',
            fontWeight: 600,
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.8)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {t('loginDemoButton')}
        </Button>
        {!openIdForced && (
          <div className={classes.extraContainer}>
            {registrationEnabled && (
              <Link
                onClick={() => navigate('/register')}
                className={classes.link}
                underline="none"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.6)',
                  '&:hover': { color: '#fff' },
                }}
              >
                {t('loginRegister')}
              </Link>
            )}
            {emailEnabled && (
              <Link
                onClick={() => navigate('/reset-password')}
                className={classes.link}
                underline="none"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.6)',
                  '&:hover': { color: '#fff' },
                }}
              >
                {t('loginReset')}
              </Link>
            )}
          </div>
        )}
      </div>
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <Snackbar
        open={sessionExpired}
        message={t('loginSessionExpired')}
        autoHideDuration={6000}
        onClose={() => setSessionExpired(false)}
      />
    </LoginLayout>

  );
};

export default LoginPage;
