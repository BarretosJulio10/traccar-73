/**
 * Shared styles for login-related pages (LoginPage, RegisterPage, ResetPasswordPage).
 * Extracted to avoid DRY violation across 3 files.
 */
export const lightInputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#1e293b',
    backgroundColor: '#fff',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0,0,0,0.1)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(0,0,0,0.2)',
      borderWidth: '1.5px',
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
    color: '#ff8a80',
  },
  '& .MuiIconButton-root': {
    color: '#64748b',
  },
};
