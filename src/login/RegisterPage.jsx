import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, TextField, Typography, Snackbar, IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch, useEffectAsync } from '../reactHelper';
import { sessionActions } from '../store';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { lightInputSx } from './loginStyles';
import { useTenant } from '../common/components/TenantProvider';
import { getContrastColor } from '../common/util/colors';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.spacing(3),
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    textTransform: 'uppercase',
  },
}));

const RegisterPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const server = useSelector((state) => state.session.server);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;
  const sidebarColor = tenant?.login_sidebar_color;
  const manualTextColor = tenant?.login_text_color;
  const textColor = getContrastColor(sidebarColor, manualTextColor);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffectAsync(async () => {
    if (totpForce) {
      const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
      setTotpKey(await response.text());
    }
  }, [totpForce, setTotpKey]);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    await fetchOrThrow('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, totpKey }),
    });
    setSnackbarOpen(true);
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        <div className={classes.header}>
          {!server.newServer && (
            <IconButton onClick={() => navigate('/login')} sx={{ color: textColor }}>
              <BackIcon />
            </IconButton>
          )}
          <Typography className={classes.title} sx={{ color: textColor }}>
            {t('loginRegister')}
          </Typography>
        </div>
        <TextField
          required
          placeholder={t('sharedName')}
          name="name"
          value={name}
          autoComplete="name"
          autoFocus
          onChange={(event) => setName(event.target.value)}
          size="small"
          sx={lightInputSx}
        />
        <TextField
          required
          type="email"
          placeholder={t('userEmail')}
          name="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          size="small"
          sx={lightInputSx}
        />
        <TextField
          required
          placeholder={t('userPassword')}
          name="password"
          value={password}
          type="password"
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          size="small"
          sx={lightInputSx}
        />
        {totpForce && (
          <TextField
            required
            placeholder={t('loginTotpKey')}
            name="totpKey"
            value={totpKey || ''}
            InputProps={{
              readOnly: true,
            }}
            size="small"
            sx={lightInputSx}
          />
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          type="submit"
          disabled={!name || !password || !(server.newServer || /(.+)@(.+)\.(.{2,})/.test(email))}
          fullWidth
          sx={{
            bgcolor: textColor === '#ffffff' ? '#ffffff' : 'primary.main',
            color: textColor === '#ffffff' ? '#1e293b' : '#ffffff',
            py: 1.2,
            fontSize: '0.875rem',
            fontWeight: 700,
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: textColor === '#ffffff' ? '#f1f5f9' : 'primary.dark',
            },
            '&.Mui-disabled': {
              color: '#94a3b8',
              bgcolor: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {t('loginRegister')}
        </Button>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => {
          dispatch(sessionActions.updateServer({ ...server, newServer: false }));
          navigate('/login');
        }}
        autoHideDuration={snackBarDurationShortMs}
        message={t('loginCreated')}
      />
    </LoginLayout>
  );
};

export default RegisterPage;
