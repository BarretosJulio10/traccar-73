import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

export default (server, darkMode, direction, tenant) =>
  useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily:
            '"Outfit", "Quicksand", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          h6: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          subtitle1: {
            fontWeight: 600,
          },
          body1: {
            fontSize: '0.9375rem',
          },
          body2: {
            fontSize: '0.8125rem',
          },
          caption: {
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
          },
        },
        shape: {
          borderRadius: 12,
        },
        palette: palette(server, darkMode, tenant),
        direction,
        dimensions,
        components,
      }),
    [server, darkMode, direction, tenant],
  );
