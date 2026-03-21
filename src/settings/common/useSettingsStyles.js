import { makeStyles } from 'tss-react/mui';

export default makeStyles()((theme) => ({
  table: {
    marginBottom: theme.spacing(10),
  },
  columnAction: {
    width: '1%',
    paddingRight: theme.spacing(1),
  },
  container: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1),
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
  },
  buttons: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-evenly',
    gap: theme.spacing(1),
    '& > *': {
      flexBasis: '33%',
    },
    [theme.breakpoints.down('sm')]: {
      position: 'sticky',
      bottom: 0,
      background: theme.palette.background.paper,
      padding: theme.spacing(1.5),
      margin: theme.spacing(0, -1),
      borderTop: `1px solid ${theme.palette.divider}`,
      zIndex: 2,
    },
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(1.5),
      paddingBottom: theme.spacing(2),
    },
  },
  verticalActions: {
    display: 'flex',
    flexDirection: 'column',
  },
}));
