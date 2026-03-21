import { Fragment } from 'react';
import {
  List,
  ListItemText,
  ListItemIcon,
  Divider,
  ListSubheader,
  ListItemButton,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const SideNav = ({ routes }) => {
  const location = useLocation();

  return (
    <List disablePadding style={{ paddingTop: '16px' }}>
      {routes.map((route) =>
        route.subheader ? (
          <Fragment key={route.subheader}>
            <Divider />
            <ListSubheader>{route.subheader}</ListSubheader>
          </Fragment>
        ) : (
          <ListItemButton
            disableRipple
            component={Link}
            key={route.href}
            to={route.href}
            selected={location.pathname.match(route.match || route.href) !== null}
            sx={{
              borderRadius: 2,
              mx: 1,
              my: 0.25,
              py: 0.75,
              px: 1.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{route.icon}</ListItemIcon>
            <ListItemText
              primary={route.name}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: location.pathname.match(route.match || route.href) !== null ? 600 : 400,
                noWrap: true,
              }}
            />
          </ListItemButton>
        ),
      )}
    </List>
  );
};

export default SideNav;
