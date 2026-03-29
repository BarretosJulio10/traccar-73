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
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { apiUrl } from '../common/util/apiUrl';
import { DEFAULT_TENANT_SLUG, DEMO_USER } from '../common/util/constants';
import { lightInputSx } from './loginStyles';
import usePwaInstallPrompt from '../common/util/usePwaInstallPrompt';
import useDevicePermissions from '../common/util/useDevicePermissions';
import { auditLog } from '../common/util/audit';
import { demoService } from '../core/services';
import { useHudTheme } from '../common/util/ThemeContext';
import { getContrastColor } from '../common/util/colors';
import { useTenant } from '../common/components/TenantProvider';

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
    background: 'var(--hud-bg2)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--hud-border)',
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
  const { canInstall, isInstalled, promptInstall } = usePwaInstallPrompt();
  const { requestAllPermissions } = useDevicePermissions();
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;

  const sidebarColor = tenant?.login_sidebar_color;
  const manualTextColor = tenant?.login_text_color;
  const textColor = getContrastColor(sidebarColor, manualTextColor);

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

  const handleInstallClick = async () => {
    // 1. Double-check if the prompt is available (even globally)
    const promptAvailable = canInstall || !!window.deferredPwaPrompt;

    // 2. Trigger install prompt IMMEDIATELY to preserve user gesture
    if (promptAvailable) {
      const success = await promptInstall();
      requestAllPermissions();
      if (success) return;
    } else {
      // 3. Fallback to guide for iOS or if native prompt is absolutely not ready
      requestAllPermissions();
      navigate('/install');
    }
  };

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
    demoService.enable();
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
        sessionStorage.setItem('traccarEmail', email);
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
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}
            >
              HyperTraccar
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              Instale para melhor experiência
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={handleInstallClick}
            sx={{
              fontSize: '0.7rem',
              px: 2,
              borderRadius: '8px',
            }}
          >
            INSTALAR
          </Button>
          <IconButton
            size="small"
            onClick={() => setDismissedBanner(true)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      )}
      <div className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <IconButton
            sx={{ color: textColor, opacity: 0.7 }}
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
          <IconButton sx={{ color: textColor, opacity: 0.7 }} onClick={() => setShowQr(true)}>
            <QrCode2Icon />
          </IconButton>
        )}
        {languageEnabled && (
          <FormControl size="small">
            <Select
              value={language}
              onChange={(e) => setLocalLanguage(e.target.value)}
              sx={{
                color: textColor,
                bgcolor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                borderRadius: '12px',
                fontWeight: 600,
                '.MuiOutlinedInput-notchedOutline': { borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '.MuiSvgIcon-root': { color: textColor, opacity: 0.6 },
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
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.75rem', color: textColor, letterSpacing: '-0.02em', mb: 0.5 }}>
            {t('loginLogin')}
          </Typography>
          <Typography sx={{ color: textColor, opacity: 0.6, fontWeight: 500, fontSize: '0.875rem' }}>
            {t('loginCredentialsSubtitle')}
          </Typography>
        </Box>
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
                        sx={{ color: 'text.secondary' }}
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
              fullWidth
            >
              {t('loginLogin')}
            </Button>
          </>
        )}
        {openIdEnabled && (
          <Button
            onClick={() => handleOpenIdLogin()}
            variant="outlined"
            fullWidth
            sx={{
              py: 1.2,
              borderColor: 'rgba(0,0,0,0.1)',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            {t('loginOpenId')}
          </Button>
        )}
        <Button
          onClick={handleDemoLogin}
          variant="text"
          type="button"
          sx={{
            py: 1,
            color: textColor,
            opacity: 0.7,
            fontWeight: 700,
            '&:hover': { color: 'primary.main', opacity: 1 },
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
                  fontWeight: 600,
                  color: textColor,
                  opacity: 0.8,
                  '&:hover': { textDecoration: 'underline', opacity: 1 },
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
                  fontWeight: 600,
                  color: textColor,
                  opacity: 0.6,
                  '&:hover': { color: textColor, opacity: 1 },
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
