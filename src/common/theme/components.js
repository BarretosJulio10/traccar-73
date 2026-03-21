export default {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 20,
      },
      elevation1: {
        boxShadow: '4px 4px 10px rgba(0,0,0,0.3), -4px -4px 10px rgba(255,255,255,0.02)',
      },
      elevation3: {
        boxShadow: '8px 8px 20px rgba(0,0,0,0.4), -8px -8px 20px rgba(255,255,255,0.02)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        boxShadow: '6px 6px 15px rgba(0,0,0,0.3), -6px -6px 15px rgba(255,255,255,0.02)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        backgroundColor: theme.palette.background.default,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.divider,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: '1.5px',
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
        padding: '10px 24px',
      },
      sizeMedium: {
        height: '44px',
      },
      contained: ({ theme }) => ({
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      enterNextDelay: 500,
    },
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: '0.75rem',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        '@media print': {
          color: theme.palette.alwaysDark.main,
        },
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        margin: '2px 8px',
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        borderRadius: 12,
      }),
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: 64,
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        margin: '4px',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: '56px !important',
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.15)',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
    },
  },
};
