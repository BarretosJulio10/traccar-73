import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

const MenuItem = ({ title, link, icon, selected, onClick }) => (
  <Tooltip title={title} placement="right" enterDelay={600}>
    <ListItemButton
      {...(onClick ? { onClick } : { component: Link, to: link })}
      selected={selected}
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
      <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{icon}</ListItemIcon>
      <ListItemText
        primary={title}
        primaryTypographyProps={{
          fontSize: '0.875rem',
          fontWeight: selected ? 600 : 400,
          noWrap: true,
        }}
      />
    </ListItemButton>
  </Tooltip>
);

export default MenuItem;
