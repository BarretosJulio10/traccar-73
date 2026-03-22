export default {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        backgroundColor: '#F8FAFC',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 28,
      },
      elevation1: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      },
      elevation3: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 28,
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.03)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        backgroundColor: theme.palette.background.paper,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(0,0,0,0.08)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: '2px',
          borderColor: theme.palette.primary.main,
        },
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 999, // Pill style
        textTransform: 'none',
        fontWeight: 700,
        letterSpacing: '0.01em',
        padding: '10px 28px',
      },
      sizeMedium: {
        height: '48px',
      },
      contained: ({ theme }) => ({
        boxShadow: '0 8px 20px rgba(6,182,212,0.2)',
        '&:hover': {
          boxShadow: '0 12px 28px rgba(6,182,212,0.3)',
        },
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        '&:hover': {
          backgroundColor: 'rgba(6,182,212,0.08)',
        },
      }),
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
        borderRadius: 12,
        fontSize: '0.75rem',
        padding: '8px 12px',
        backgroundColor: 'rgba(15,23,42,0.9)',
        backdropFilter: 'blur(4px)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: '1px solid rgba(0,0,0,0.04)',
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
        boxShadow: '10px 0 40px rgba(0,0,0,0.03)',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 16,
        margin: '4px 12px',
        '&.Mui-selected': {
          backgroundColor: 'rgba(6,182,212,0.08)',
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: 'rgba(6,182,212,0.12)',
          },
        },
      }),
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        borderRadius: 16,
      }),
    },
  },
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        height: 80,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0,0,0,0.04)',
      },
    },
  },
  MuiBottomNavigationAction: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 20,
        margin: '8px 4px',
        maxWidth: 'none',
        '&.Mui-selected': {
          color: theme.palette.primary.main,
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            fontWeight: 700,
          },
        },
      }),
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: '72px !important',
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 32,
        boxShadow: '0 30px 90px rgba(0,0,0,0.15)',
        padding: 8,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        boxShadow: '0 15px 40px rgba(0,0,0,0.08)',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        margin: '4px 12px',
        fontWeight: 500,
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        border: '2px solid #FFFFFF',
      },
    },
  },
};
