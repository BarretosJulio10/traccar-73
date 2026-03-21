import { useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Logo from '../resources/images/logo.svg?react';
import { useTenant } from '../common/components/TenantProvider';

const useStyles = makeStyles()((theme) => ({
  image: {
    alignSelf: 'center',
    maxWidth: '100%',
    maxHeight: '200px',
    width: 'auto',
    height: 'auto',
    margin: theme.spacing(3),
    objectFit: 'contain',
  },
}));

const LogoImage = ({ color, size, className, style }) => {
  const theme = useTheme();
  const { classes, cx } = useStyles();

  const desktop = useMediaQuery(theme.breakpoints.up('lg'));

  const tenantCtx = useTenant();
  const tenantLogo = tenantCtx?.tenant?.logo_url;

  const logo = useSelector((state) => state.session.server?.attributes?.logo);
  const logoInverted = useSelector((state) => state.session.server?.attributes?.logoInverted);

  // Priority: tenant logo > Traccar server logo > default SVG
  const effectiveLogo = tenantLogo || logo;
  const effectiveInverted = tenantLogo || logoInverted;

  const imageStyle = {
    height: size || 'auto',
    ...style
  };

  if (effectiveLogo) {
    if (desktop && effectiveInverted) {
      return (
        <img 
          className={cx(classes.image, className)} 
          src={effectiveInverted} 
          alt="Logo" 
          style={imageStyle} 
        />
      );
    }
    return (
      <img 
        className={cx(classes.image, className)} 
        src={effectiveLogo} 
        alt="Logo" 
        style={imageStyle} 
      />
    );
  }

  return (
    <Logo 
      className={cx(classes.image, className)} 
      style={{ color: color || 'inherit', height: size || 28, ...style }} 
    />
  );
};

export default LogoImage;
