/**
 * Shared styles for login-related pages (LoginPage, RegisterPage, ResetPasswordPage).
 * Extracted to avoid DRY violation across 3 files.
 */
export const lightInputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#0f172a', // Slate 900
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    '& fieldset': {
      borderColor: 'rgba(0,0,0,0.06)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(6,182,212,0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#06b6d4',
      borderWidth: '2px',
    },
    '& input::placeholder': {
      color: '#94a3b8',
      opacity: 1,
    },
  },
  '& .MuiInputLabel-root': {
    display: 'none',
  },
  '& .MuiFormHelperText-root': {
    color: '#ef4444',
  },
  '& .MuiIconButton-root': {
    color: '#64748b',
  },
};
