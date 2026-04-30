import { Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';
import { useTenant } from '../common/components/TenantProvider';
import { useTranslation } from '../common/components/LocalizationProvider';
import { getContrastColor } from '../common/util/colors';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(4),
    width: '420px',
    maxWidth: '92%',
    maxHeight: '92vh',
    position: 'relative',
    overflow: 'y',
    zIndex: 10,
    padding: theme.spacing(6, 4),
    borderRadius: 24,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
    [theme.breakpoints.down('lg')]: {
      width: '100%',
      minHeight: '100%',
      maxHeight: '100%',
      maxWidth: '100%',
      borderRadius: 0,
      border: 'none',
      boxShadow: 'none',
      justifyContent: 'space-between',
    },
  },
  sidebarOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 10% 10%, rgba(6,182,212,0.05) 0%, transparent 50%)',
    pointerEvents: 'none',
    borderRadius: 'inherit',
  },
  logoZone: {
    flex: 'none',
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('lg')]: {
      marginTop: 'auto',
      marginBottom: 'auto',
    }
  },
  formZone: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 1,
    marginBottom: theme.spacing(2),
  },
  form: {
    width: '100%',
    maxWidth: '340px',
  },
  contentArea: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    [theme.breakpoints.down('lg')]: {
      display: 'none',
    },
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.1)',
    zIndex: 0,
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const tenantCtx = useTenant();
  const tenant = tenantCtx?.tenant;
  const bgImage = tenant?.login_bg_image || tenant?.bgImage || tenant?.bg_image;
  const bgColor = tenant?.login_bg_color || tenant?.bgColor || tenant?.bg_color;
  const sidebarColor = tenant?.login_sidebar_color;
  const manualTextColor = tenant?.login_text_color;

  const sidebarBg = sidebarColor || `linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)`;
  const logoColor = theme.palette.primary.main;

  // Standardize text color for both PC and PWA using robust contrast logic
  const textColor = getContrastColor(sidebarColor, manualTextColor);

  const contentStyle = {};
  if (bgImage) {
    contentStyle.backgroundImage = `url(${bgImage})`;
    contentStyle.backgroundSize = 'cover';
    contentStyle.backgroundPosition = 'center';
  } else if (bgColor) {
    contentStyle.backgroundColor = bgColor;
  } else {
    contentStyle.background =
      theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f0fdfa 0%, #f5f7fa 50%, #ecfdf5 100%)';
  }

  return (
    <main className={classes.root}>
      <div className={classes.contentArea} style={contentStyle}>
        {bgImage && <div className={classes.bgOverlay} />}
      </div>
      <div className={classes.sidebar} style={{ background: sidebarBg }}>
        <div className={classes.sidebarOverlay} />
        <div className={classes.logoZone}>
          <LogoImage color={logoColor} />
          <Typography
            sx={{
              color: textColor,
              opacity: 0.8,
              mt: 1,
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: '0.02em',
            }}
          >
            {t('loginSmartTracking')}
          </Typography>
        </div>
        <div className={classes.formZone}>
          <form className={classes.form}>{children}</form>
        </div>
      </div>
    </main>
  );
};

export default LoginLayout;
