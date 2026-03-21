import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Typography,
  useTheme,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
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
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Android as AndroidIcon,
  DesktopMac as DesktopIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../common/components/LocalizationProvider';
import { useTenant } from '../common/components/TenantProvider';
import usePwaInstallPrompt from '../common/util/usePwaInstallPrompt';
import useDevicePermissions from '../common/util/useDevicePermissions';

// ─── Status Chip ─────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const { t } = useLocalization();
  const config = {
    granted: { label: t('pwaPermissionGranted'), color: 'success', icon: <CheckIcon /> },
    denied: { label: t('pwaPermissionDenied'), color: 'error', icon: <DeniedIcon /> },
    prompt: { label: t('pwaPermissionPending'), color: 'warning', icon: <PendingIcon /> },
    unsupported: { label: 'N/A', color: 'default', icon: <DeniedIcon /> },
  };
  const cfg = config[status] || config.prompt;
  return <Chip label={cfg.label} color={cfg.color} icon={cfg.icon} size="small" />;
};

// ─── Permission Card ──────────────────────────────────────────────────────────
const PermissionCard = ({ icon, label, status, onRequest }) => (
  <Card
    variant="outlined"
    sx={{
      flex: '1 1 140px',
      textAlign: 'center',
      borderRadius: 3,
      transition: 'all 0.25s ease',
      borderColor: status === 'granted' ? 'success.main' : 'divider',
      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
    }}
  >
    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 2 }}>
      {icon}
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <StatusChip status={status} />
      {status === 'prompt' && (
        <Button
          size="small"
          variant="outlined"
          onClick={onRequest}
          sx={{ mt: 0.5, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
        >
          Permitir
        </Button>
      )}
    </CardContent>
  </Card>
);

// ─── iOS Instructions ─────────────────────────────────────────────────────────
const IosInstructions = () => {
  const steps = [
    {
      label: 'Toque em Compartilhar',
      description: 'Toque no ícone de compartilhar na barra inferior do Safari.',
      icon: <ShareIcon sx={{ color: '#007AFF', fontSize: 28 }} />,
    },
    {
      label: 'Toque em "Adicionar à Tela de Início"',
      description: 'Role a lista de opções e toque em "Adicionar à Tela de Início".',
      icon: <InstallIcon sx={{ color: '#34C759', fontSize: 28 }} />,
    },
    {
      label: 'Confirme a instalação',
      description: 'Toque em "Adicionar" no canto superior direito para concluir.',
      icon: <CheckIcon sx={{ color: '#30D158', fontSize: 28 }} />,
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Chip
        label="Safari iOS"
        icon={<PhoneIcon />}
        size="small"
        color="info"
        sx={{ mb: 2 }}
      />
      <Stepper orientation="vertical" sx={{ '& .MuiStepConnector-line': { minHeight: 16 } }}>
        {steps.map((step) => (
          <Step key={step.label} active expanded>
            <StepLabel
              icon={step.icon}
              sx={{
                '& .MuiStepLabel-label': { fontWeight: 600, fontSize: '0.875rem' },
              }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

// ─── Android / Chrome Instructions ───────────────────────────────────────────
const AndroidInstructions = ({ isSamsungBrowser }) => {
  const steps = isSamsungBrowser
    ? [
        { label: 'Toque no menu (⋮)', description: 'Toque nos três pontos no canto superior direito.', icon: <MoreVertIcon sx={{ color: '#1428A0', fontSize: 28 }} /> },
        { label: 'Toque em "Adicionar página à"', description: 'Selecione "Tela inicial" ou "Aplicativos".', icon: <InstallIcon sx={{ color: '#34C759', fontSize: 28 }} /> },
      ]
    : [
        { label: 'Toque no menu (⋮)', description: 'Toque nos três pontos no canto superior direito do Chrome.', icon: <MoreVertIcon sx={{ color: '#4285F4', fontSize: 28 }} /> },
        { label: 'Toque em "Instalar app"', description: 'Ou "Adicionar à tela inicial".', icon: <AndroidIcon sx={{ color: '#34A853', fontSize: 28 }} /> },
      ];

  return (
    <Box sx={{ width: '100%' }}>
      <Chip
        label={isSamsungBrowser ? 'Samsung Browser' : 'Chrome Android'}
        icon={<AndroidIcon />}
        size="small"
        color="success"
        sx={{ mb: 2 }}
      />
      <Stepper orientation="vertical" sx={{ '& .MuiStepConnector-line': { minHeight: 16 } }}>
        {steps.map((step) => (
          <Step key={step.label} active expanded>
            <StepLabel
              icon={step.icon}
              sx={{ '& .MuiStepLabel-label': { fontWeight: 600, fontSize: '0.875rem' } }}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const InstallPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { tenant } = useTenant();
  const {
    canInstall,
    isInstalled,
    promptInstall,
    isIos,
    isSafari,
    isAndroid,
    isSamsungBrowser,
  } = usePwaInstallPrompt();

  const { permissions, requestPermission, requestAllPermissions, PERMISSION_TYPES } =
    useDevicePermissions();

  const [installing, setInstalling] = useState(false);

  const allGranted = Object.values(permissions).every(
    (s) => s === 'granted' || s === 'unsupported',
  );

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setInstalling(false);
    }
  };

  // iOS requer Safari especificamente para add-to-homescreen
  const showIosInstructions = isIos;
  // Mostra instruções Android quando: Android + não tem prompt nativo + não é iOS
  const showAndroidInstructions = !canInstall && isAndroid && !isIos;
  // Mostra botão nativo quando disponível (Chrome Android, Edge, Chrome Desktop)
  const showInstallButton = canInstall && !isInstalled;

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0d9488 100%)`
            : `linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 50%, #99f6e4 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,148,136,0.2)'
                : '0 25px 60px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(20px)',
              background: theme.palette.mode === 'dark'
                ? 'rgba(15,23,42,0.85)'
                : 'rgba(255,255,255,0.92)',
            }}
          >
            <CardContent
              sx={{
                p: { xs: 3, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {/* Logo / Header */}
              {tenant?.logo_url ? (
                <Box
                  component="img"
                  src={tenant.logo_url}
                  alt={tenant.company_name}
                  sx={{ height: 56, maxWidth: 180, objectFit: 'contain' }}
                />
              ) : (
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(13,148,136,0.4)',
                  }}
                >
                  <PhoneIcon sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
              )}

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {t('pwaInstallTitle') || 'Instalar HyperTraccar'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rastreamento em tempo real direto na sua tela inicial
                </Typography>
              </Box>

              {/* ── Estado de instalação ── */}
              <Card
                variant="outlined"
                sx={{
                  width: '100%',
                  borderRadius: 3,
                  border: isInstalled ? `1.5px solid ${theme.palette.success.main}` : undefined,
                  background: theme.palette.action.hover,
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
                  {isInstalled ? (
                    <>
                      <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      <Chip label="App instalado ✓" color="success" sx={{ fontWeight: 700 }} />
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        O HyperTraccar está instalado na sua tela inicial.
                      </Typography>
                    </>
                  ) : showInstallButton ? (
                    <>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Instale agora para acesso rápido e offline
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<InstallIcon />}
                        onClick={handleInstall}
                        disabled={installing}
                        sx={{
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 4,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                          boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
                          '&:hover': { boxShadow: '0 6px 20px rgba(13,148,136,0.6)' },
                        }}
                      >
                        {installing ? 'Instalando...' : (t('pwaInstallButton') || 'Instalar App')}
                      </Button>
                    </>
                  ) : showIosInstructions ? (
                    <IosInstructions />
                  ) : showAndroidInstructions ? (
                    <AndroidInstructions isSamsungBrowser={isSamsungBrowser} />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <DesktopIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Abra no Chrome ou Edge para instalar como app
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Divider sx={{ width: '100%' }} />

              {/* ── Permissões ── */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  {t('pwaPermissions') || 'Permissões do App'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <PermissionCard
                    icon={<NotifIcon sx={{ fontSize: 30, color: '#FF9800' }} />}
                    label={t('pwaPermissionNotification') || 'Notificações'}
                    status={permissions.notification}
                    onRequest={() => requestPermission(PERMISSION_TYPES.notification)}
                  />
                  <PermissionCard
                    icon={<LocationIcon sx={{ fontSize: 30, color: '#4CAF50' }} />}
                    label={t('pwaPermissionLocation') || 'Localização'}
                    status={permissions.geolocation}
                    onRequest={() => requestPermission(PERMISSION_TYPES.geolocation)}
                  />
                  <PermissionCard
                    icon={<CameraIcon sx={{ fontSize: 30, color: '#2196F3' }} />}
                    label={t('pwaPermissionCamera') || 'Câmera'}
                    status={permissions.camera}
                    onRequest={() => requestPermission(PERMISSION_TYPES.camera)}
                  />
                </Box>
              </Box>

              {/* ── Ações ── */}
              {!allGranted && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={requestAllPermissions}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.5 }}
                >
                  {t('pwaAllowAll') || 'Permitir Todas as Permissões'}
                </Button>
              )}

              <Button
                variant={allGranted && isInstalled ? 'contained' : 'text'}
                fullWidth
                size="large"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  ...(allGranted && isInstalled && {
                    background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                    boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
                    '&:hover': { boxShadow: '0 6px 20px rgba(13,148,136,0.6)' },
                  }),
                }}
              >
                {t('pwaGoToApp') || 'Ir para o App'}
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Fade>
  );
};

export default InstallPage;
