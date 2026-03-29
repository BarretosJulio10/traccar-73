import { Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';
import { useTenant } from '../common/components/TenantProvider';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: theme.dimensions.sidebarWidth,
    position: 'relative',
    overflow: 'auto',
    padding: theme.spacing(5, 3),
    [theme.breakpoints.down('lg')]: {
      width: '100%',
    },
  },
  sidebarOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 10% 10%, rgba(6,182,212,0.05) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  logoZone: {
    flex: '0 0 auto',
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  formZone: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  form: {
    width: '100%',
    maxWidth: '340px',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    [theme.breakpoints.down('lg')]: {
      display: 'none',
    },
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.2)',
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

  const sidebarBg = sidebarColor || `linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)`;
  const logoColor = theme.palette.primary.main;

  // Determine if sidebar color is dark to adjust text color
  const isDarkSidebar = sidebarColor && !['#ffffff', '#fff', 'white', '#f8fafc'].includes(sidebarColor.toLowerCase());

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
      <div className={classes.sidebar} style={{ background: sidebarBg, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
        <div className={classes.sidebarOverlay} />
        <div className={classes.logoZone}>
          <LogoImage color={logoColor} />
          <Typography
            sx={{
              color: isDarkSidebar ? 'rgba(255,255,255,0.8)' : 'text.secondary',
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
      <div className={classes.contentArea} style={contentStyle}>
        {bgImage && <div className={classes.bgOverlay} />}
      </div>
    </main>
  );
};

export default LoginLayout;
