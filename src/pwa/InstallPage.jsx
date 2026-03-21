import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Notifications as NotifIcon,
  LocationOn as LocationIcon,
  CameraAlt as CameraIcon,
  CheckCircle as CheckIcon,
  Cancel as DeniedIcon,
  HourglassEmpty as PendingIcon,
  IosShare as ShareIcon,
  PhoneIphone as PhoneIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../common/components/LocalizationProvider';
import { useTenant } from '../common/components/TenantProvider';
import usePwaInstallPrompt from '../common/util/usePwaInstallPrompt';
import useDevicePermissions from '../common/util/useDevicePermissions';

const StatusChip = ({ status }) => {
  const { t } = useLocalization();

  const config = {
    granted: { label: t('pwaPermissionGranted'), color: 'success', icon: <CheckIcon /> },
    denied: { label: t('pwaPermissionDenied'), color: 'error', icon: <DeniedIcon /> },
    prompt: { label: t('pwaPermissionPending'), color: 'warning', icon: <PendingIcon /> },
    unsupported: { label: t('pwaPermissionUnsupported'), color: 'default', icon: <DeniedIcon /> },
  };

  const cfg = config[status] || config.prompt;

  return <Chip label={cfg.label} color={cfg.color} icon={cfg.icon} size="small" />;
};

const PermissionCard = ({ icon, label, status, onRequest, disabled }) => (
  <Card
    variant="outlined"
    sx={{
      flex: '1 1 140px',
      textAlign: 'center',
      borderRadius: 3,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 4 },
    }}
  >
    <CardContent
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 2 }}
    >
      {icon}
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
      <StatusChip status={status} />
      {status === 'prompt' && (
        <Button
          size="small"
          variant="outlined"
          onClick={onRequest}
          disabled={disabled}
          sx={{ mt: 1, borderRadius: 2, textTransform: 'none' }}
        >
          Permitir
        </Button>
      )}
    </CardContent>
  </Card>
);

const InstallPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { tenant } = useTenant();
  const { canInstall, isInstalled, promptInstall, isIos, isIosSafari } = usePwaInstallPrompt();
  const { permissions, requestPermission, requestAllPermissions, PERMISSION_TYPES } =
    useDevicePermissions();

  const allGranted = Object.values(permissions).every(
    (s) => s === 'granted' || s === 'unsupported',
  );

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      // Will be detected by appinstalled event
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {/* Logo */}
            {tenant?.logo_url && (
              <Box
                component="img"
                src={tenant.logo_url}
                alt={tenant.company_name}
                sx={{ height: 60, maxWidth: 200, objectFit: 'contain' }}
              />
            )}

            <Typography variant="h5" fontWeight={700} textAlign="center">
              {t('pwaInstallTitle')}
            </Typography>

            {/* Install Section */}
            <Card
              variant="outlined"
              sx={{ width: '100%', borderRadius: 3, bgcolor: theme.palette.action.hover }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 3,
                }}
              >
                <PhoneIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />

                {isInstalled ? (
                  <>
                    <Chip
                      label={t('pwaInstalled')}
                      color="success"
                      icon={<CheckIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {t('pwaInstalledDescription')}
                    </Typography>
                  </>
                ) : canInstall ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<InstallIcon />}
                    onClick={handleInstall}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, px: 4 }}
                  >
                    {t('pwaInstallButton')}
                  </Button>
                ) : isIos ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('pwaIosInstructions')}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                      }}
                    >
                      <ShareIcon color="primary" />
                      <Typography variant="body2" fontWeight={600}>
                        {t('pwaIosStep')}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {t('pwaOpenInBrowser')}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Permissions Section */}
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                {t('pwaPermissions')}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <PermissionCard
                  icon={<NotifIcon sx={{ fontSize: 32, color: '#FF9800' }} />}
                  label={t('pwaPermissionNotification')}
                  status={permissions.notification}
                  onRequest={() => requestPermission(PERMISSION_TYPES.notification)}
                />
                <PermissionCard
                  icon={<LocationIcon sx={{ fontSize: 32, color: '#4CAF50' }} />}
                  label={t('pwaPermissionLocation')}
                  status={permissions.geolocation}
                  onRequest={() => requestPermission(PERMISSION_TYPES.geolocation)}
                />
                <PermissionCard
                  icon={<CameraIcon sx={{ fontSize: 32, color: '#2196F3' }} />}
                  label={t('pwaPermissionCamera')}
                  status={permissions.camera}
                  onRequest={() => requestPermission(PERMISSION_TYPES.camera)}
                />
              </Box>
            </Box>

            {/* Allow All Button */}
            {!allGranted && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={requestAllPermissions}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.5 }}
              >
                {t('pwaAllowAll')}
              </Button>
            )}

            {allGranted && isInstalled && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.5 }}
              >
                {t('pwaGoToApp')}
              </Button>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default InstallPage;
