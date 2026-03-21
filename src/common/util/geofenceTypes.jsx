import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';
import FenceIcon from '@mui/icons-material/Fence';

export const GEOFENCE_TYPES = [
  { value: 'safe', label: 'Área Segura', icon: <SecurityIcon sx={{ fontSize: 16 }} />, color: '#10b981' },
  { value: 'risk', label: 'Área de Risco', icon: <WarningIcon sx={{ fontSize: 16 }} />, color: '#ef4444' },
  { value: 'customer', label: 'Cliente/Ponto', icon: <BusinessIcon sx={{ fontSize: 16 }} />, color: '#3b82f6' },
  { value: 'watch', label: 'Zona de Atenção', icon: <VisibilityIcon sx={{ fontSize: 16 }} />, color: '#f59e0b' },
  { value: 'custom', label: 'Personalizada', icon: <MapIcon sx={{ fontSize: 16 }} />, color: '#8b5cf6' },
];

export const getGeofenceTheme = (type) => {
  switch (type) {
    case 'safe': return { icon: SecurityIcon, color: '#10b981', label: 'Área Segura' };
    case 'risk': return { icon: WarningIcon, color: '#ef4444', label: 'Área de Risco' };
    case 'customer': return { icon: BusinessIcon, color: '#3b82f6', label: 'Cliente/Ponto' };
    case 'watch': return { icon: VisibilityIcon, color: '#f59e0b', label: 'Zona de Atenção' };
    case 'custom':
    default: return { icon: FenceIcon, color: '#39ff14', label: 'Personalizada' };
  }
};
