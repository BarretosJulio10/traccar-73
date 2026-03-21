import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fade,
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
  Android as AndroidIcon,
  ArrowForward as ArrowIcon,
  MoreVert as MoreVertIcon,
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
    granted: { label: t('pwaPermissionGranted') || 'Concedida', color: 'success', icon: <CheckIcon /> },
    denied: { label: t('pwaPermissionDenied') || 'Negada', color: 'error', icon: <DeniedIcon /> },
    prompt: { label: t('pwaPermissionPending') || 'Pendente', color: 'warning', icon: <PendingIcon /> },
    unsupported: { label: 'N/A', color: 'default', icon: <DeniedIcon /> },
  };
  const cfg = config[status] || config.prompt;
  return <Chip label={cfg.label} color={cfg.color} icon={cfg.icon} size="small" />;
};

// ─── Step item visually clean — sem depender de Stepper ─────────────────────
const StepItem = ({ number, title, description, icon }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box
        sx={{
          minWidth: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.875rem',
          flexShrink: 0,
        }}
      >
        {icon || number}
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

// ─── iOS Guide ───────────────────────────────────────────────────────────────
const IosGuide = () => (
  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Chip label="Safari iOS / iPadOS" icon={<PhoneIcon />} size="small" color="info" />
    <StepItem
      number={1}
      icon={<ShareIcon sx={{ fontSize: 16 }} />}
      title="Toque em Compartilhar"
      description="Botão de compartilhar na barra inferior do Safari (quadrado com seta para cima)"
    />
    <StepItem
      number={2}
      icon={<InstallIcon sx={{ fontSize: 16 }} />}
      title='Toque "Adicionar à Tela de Início"'
      description='Role a lista de opções e toque em "Adicionar à Tela de Início"'
    />
    <StepItem
      number={3}
      icon={<CheckIcon sx={{ fontSize: 16 }} />}
      title="Confirme tocando em Adicionar"
      description='Toque em "Adicionar" no canto superior direito para concluir'
    />
  </Box>
);

// ─── Android Guide ───────────────────────────────────────────────────────────
const AndroidGuide = ({ isSamsungBrowser }) => (
  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Chip
      label={isSamsungBrowser ? 'Samsung Internet' : 'Chrome Android'}
      icon={<AndroidIcon />}
      size="small"
      color="success"
    />
    <StepItem
      number={1}
      icon={<MoreVertIcon sx={{ fontSize: 16 }} />}
      title="Toque no menu (⋮)"
      description="Três pontos no canto superior direito do navegador"
    />
    <StepItem
      number={2}
      icon={<InstallIcon sx={{ fontSize: 16 }} />}
      title={isSamsungBrowser ? 'Toque em "Adicionar página à"' : 'Toque em "Instalar app"'}
      description={
        isSamsungBrowser
          ? 'Selecione "Tela inicial" ou "Aplicativos"'
          : 'Ou "Adicionar à tela inicial"'
      }
    />
  </Box>
);

// ─── Permission Card ──────────────────────────────────────────────────────────
const PermissionCard = ({ icon, label, status, onRequest }) => (
  <Card
    variant="outlined"
    sx={{
      flex: '1 1 130px',
      textAlign: 'center',
      borderRadius: 3,
      transition: 'all 0.2s',
      borderColor: status === 'granted' ? 'success.main' : 'divider',
      '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
    }}
  >
    <CardContent sx={{ p: '12px !important', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
      <StatusChip status={status} />
      {status === 'prompt' && (
        <Button size="small" variant="outlined" onClick={onRequest}
          sx={{ mt: 0.5, borderRadius: 2, textTransform: 'none', fontSize: '0.7rem', px: 1 }}>
          Permitir
        </Button>
      )}
    </CardContent>
  </Card>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const InstallPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLocalization();

  // TenantProvider pode retornar null — proteger desestruturação
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant ?? tenantCtx ?? null;

  const {
    canInstall,
    isInstalled,
    promptInstall,
    isIos,
    isAndroid,
    isSamsungBrowser,
  } = usePwaInstallPrompt();

  const {
    permissions,
    requestPermission,
    requestAllPermissions,
    PERMISSION_TYPES,
  } = useDevicePermissions();

  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);

  const allGranted = Object.values(permissions).every(
    (s) => s === 'granted' || s === 'unsupported',
  );

  const handleInstall = async () => {
    setInstalling(true);
    setInstallError(false);
    try {
      const result = await promptInstall();
      if (!result) {
        setInstallError(true);
      }
    } catch (err) {
      setInstallError(true);
    } finally {
      setInstalling(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          minHeight: '100vh',
          background: isDark
            ? 'linear-gradient(160deg, #0f172a 0%, #134e4a 60%, #0d9488 100%)'
            : 'linear-gradient(160deg, #f0fdf4 0%, #ccfbf1 60%, #99f6e4 100%)',
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
              boxShadow: isDark
                ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,148,136,0.15)'
                : '0 20px 60px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)',
              background: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.94)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>

              {/* Logo */}
              {tenant?.logo_url ? (
                <Box component="img" src={tenant.logo_url} alt={tenant.company_name || 'Logo'}
                  sx={{ height: 52, maxWidth: 180, objectFit: 'contain' }} />
              ) : (
                <Box sx={{
                  width: 64, height: 64, borderRadius: 3,
                  background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(13,148,136,0.35)',
                }}>
                  <PhoneIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>
              )}

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {t('pwaInstallTitle') || 'Instalar HyperTraccar'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rastreamento em tempo real na sua tela inicial
                </Typography>
              </Box>

              {/* ── Instalação ── */}
              <Card variant="outlined" sx={{
                width: '100%', borderRadius: 3,
                borderColor: isInstalled ? 'success.main' : 'divider',
                background: theme.palette.action.hover,
              }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {isInstalled ? (
                    <>
                      <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                      <Chip label="App instalado ✓" color="success" sx={{ fontWeight: 700 }} />
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        O HyperTraccar já está na sua tela inicial.
                      </Typography>
                    </>
                  ) : canInstall ? (
                    <>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Instale para acesso rápido e uso offline
                      </Typography>
                      <Button
                        variant="contained" size="large" startIcon={<InstallIcon />}
                        onClick={handleInstall} disabled={installing}
                        sx={{
                          borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 4, py: 1.5,
                          background: installError ? 'rgba(239, 68, 68, 0.1)' : 'linear-gradient(135deg, #0d9488, #06b6d4)',
                          color: installError ? 'error.main' : '#fff',
                          boxShadow: installError ? 'none' : '0 4px 14px rgba(13,148,136,0.4)',
                          border: installError ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                          '&:hover': { boxShadow: installError ? 'none' : '0 6px 20px rgba(13,148,136,0.6)' },
                        }}
                      >
                        {installing ? 'Instalando...' : installError ? 'Usar Menu do Navegador' : (t('pwaInstallButton') || 'Instalar App')}
                      </Button>

                      {installError && (
                        <Typography variant="caption" color="error" textAlign="center" sx={{ mt: 1, fontWeight: 600 }}>
                          O navegador bloqueou o prompt. Toque no menu (⋮) e escolha "Instalar App".
                        </Typography>
                      )}
                    </>
                  ) : isIos ? (
                    <IosGuide />
                  ) : isAndroid ? (
                    <AndroidGuide isSamsungBrowser={isSamsungBrowser} />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
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
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  {t('pwaPermissions') || 'Permissões do App'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <PermissionCard
                    icon={<NotifIcon sx={{ fontSize: 28, color: '#FF9800' }} />}
                    label={t('pwaPermissionNotification') || 'Notificações'}
                    status={permissions.notification}
                    onRequest={() => requestPermission(PERMISSION_TYPES.notification)}
                  />
                  <PermissionCard
                    icon={<LocationIcon sx={{ fontSize: 28, color: '#4CAF50' }} />}
                    label={t('pwaPermissionLocation') || 'Localização'}
                    status={permissions.geolocation}
                    onRequest={() => requestPermission(PERMISSION_TYPES.geolocation)}
                  />
                  <PermissionCard
                    icon={<CameraIcon sx={{ fontSize: 28, color: '#2196F3' }} />}
                    label={t('pwaPermissionCamera') || 'Câmera'}
                    status={permissions.camera}
                    onRequest={() => requestPermission(PERMISSION_TYPES.camera)}
                  />
                </Box>
              </Box>

              {/* ── Ações ── */}
              {!allGranted && (
                <Button variant="outlined" fullWidth size="large" onClick={requestAllPermissions}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.5 }}>
                  {t('pwaAllowAll') || 'Permitir Todas as Permissões'}
                </Button>
              )}

              <Button
                variant={allGranted && isInstalled ? 'contained' : 'text'}
                fullWidth size="large" endIcon={<ArrowIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.5,
                  ...(allGranted && isInstalled && {
                    background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
                    boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
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
