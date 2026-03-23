import { useState, useRef, useCallback } from 'react';
import {
  AppBar,
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';

import { getGlassmorphismStyle } from '../../themes/tenantTheming';

const useStyles = makeStyles()((theme) => {
  const glass = getGlassmorphismStyle(theme);
  return {
    overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(6px)',
    padding: theme.spacing(3),
  },
  floatingCard: {
    width: '90vw',
    maxWidth: 1200,
    height: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...glass,
  },
  floatingHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: 56,
  },
  floatingBody: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  floatingSidebar: {
    width: 220,
    minWidth: 220,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowY: 'auto',
    flexShrink: 0,
    backgroundColor: theme.palette.background.default,
  },
  floatingContent: {
    flexGrow: 1,
    minWidth: 0,
    overflowY: 'auto',
    overflowX: 'auto',
    padding: theme.spacing(3),
  },
  mobileRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
    overscrollBehaviorY: 'none',
  },
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
    '@media print': {
      display: 'none',
    },
  },
  mobileToolbar: {
    zIndex: 1,
    '@media print': {
      display: 'none',
    },
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'auto',
    [theme.breakpoints.down('md')]: {
      paddingBottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(4)} + env(safe-area-inset-bottom, 0px))`,
    },
  },
  };
});

const PageTitle = ({ breadcrumbs }) => {
  const t = useTranslation();
  return (
    <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
      {t(breadcrumbs[0])}
    </Typography>
  );
};

const MobilePageTitle = ({ breadcrumbs }) => {
  const t = useTranslation();
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography
          variant="h6"
          color="inherit"
          key={breadcrumb}
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          {t(breadcrumb)}
        </Typography>
      ))}
      <Typography
        variant="h6"
        color="textPrimary"
        sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}
      >
        {t(breadcrumbs[breadcrumbs.length - 1])}
      </Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();
  const closingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setTimeout(() => navigate(-1), 0);
  }, [navigate]);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [searchParams] = useSearchParams();
  const [openDrawer, setOpenDrawer] = useState(!desktop && searchParams.has('menu'));
  const [touchY, setTouchY] = useState(0);

  if (desktop) {
    return (
      <div className={classes.overlay} onClick={handleClose}>
        <Paper className={classes.floatingCard} elevation={24} onClick={(e) => e.stopPropagation()}>
          <div className={classes.floatingHeader}>
            <Tooltip title={t('sharedBack')}>
              <IconButton size="small" onClick={handleClose} sx={{ mr: 1.5 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <PageTitle breadcrumbs={breadcrumbs} />
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title={t('sharedHide')}>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
          <div className={classes.floatingBody}>
            <div className={classes.floatingSidebar}>{menu}</div>
            <div className={classes.floatingContent}>{children}</div>
          </div>
        </Paper>
      </div>
    );
  }

  return (
    <div className={classes.mobileRoot}>
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        classes={{ paper: classes.mobileDrawer }}
      >
        {menu}
      </Drawer>
      {/* iOS Style Pull-to-Dismiss Handle */}
      <div 
        className="w-full flex justify-center py-2 cursor-grab touch-none"
        style={{ backgroundColor: theme.palette.background.paper }}
        onTouchStart={(e) => setTouchY(e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (e.changedTouches[0].clientY - touchY > 60) {
            handleClose();
          }
        }}
      >
        <div className="w-10 h-1.5 rounded-full bg-slate-300" />
      </div>
      <AppBar
        className={classes.mobileToolbar}
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <Tooltip title={t('sharedBack')}>
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <MobilePageTitle breadcrumbs={breadcrumbs} />
          <Tooltip title={t('settingsTitle')}>
            <IconButton color="inherit" sx={{ ml: 'auto' }} onClick={() => setOpenDrawer(true)}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
