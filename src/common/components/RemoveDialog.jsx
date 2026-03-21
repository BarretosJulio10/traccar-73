import Button from '@mui/material/Button';
import { Snackbar } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from './LocalizationProvider';
import { useCatch } from '../../reactHelper';
import { snackBarDurationLongMs } from '../util/duration';
import fetchOrThrow from '../util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    [theme.breakpoints.down('md')]: {
      bottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(2)})`,
    },
    '& .MuiSnackbarContent-root': {
      backgroundColor: '#1e1f24',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '10px 10px 30px rgba(0,0,0,0.6)',
      color: '#f1f5f9',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: theme.spacing(1, 3),
    }
  },
  button: {
    height: 'auto',
    marginTop: 0,
    marginBottom: 0,
    fontWeight: 'black',
    fontSize: '10px !important',
    letterSpacing: '1px',
    color: '#ff3939 !important',
  },
}));

const RemoveDialog = ({ open, endpoint, itemId, onResult }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const handleRemove = useCatch(async () => {
    await fetchOrThrow(`/api/${endpoint}/${itemId}`, { method: 'DELETE' });
    onResult(true);
  });

  return (
    <Snackbar
      className={classes.root}
      open={open}
      autoHideDuration={snackBarDurationLongMs}
      onClose={() => onResult(false)}
      message={t('sharedRemoveConfirm')}
      action={
        <Button size="small" className={classes.button} onClick={handleRemove}>
          {t('sharedRemove')}
        </Button>
      }
    />
  );
};

export default RemoveDialog;
