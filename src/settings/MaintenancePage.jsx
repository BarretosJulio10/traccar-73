import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import { prefixString } from '../common/util/stringUtils';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useAttributePreference } from '../common/util/preferences';
import {
  speedFromKnots,
  speedToKnots,
  distanceFromMeters,
  distanceToMeters,
} from '../common/util/converter';
import { useTranslation } from '../common/components/LocalizationProvider';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useHudTheme } from '../common/util/ThemeContext';

const MaintenancePage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const positionAttributes = usePositionAttributes(t);

  const [item, setItem] = useState();
  const [labels, setLabels] = useState({ start: '', period: '' });

  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');

  const convertToList = (attributes) => {
    const otherList = [];
    Object.keys(attributes).forEach((key) => {
      const value = attributes[key];
      if (value.type === 'number' || key.endsWith('Time')) {
        otherList.push({ key, name: value.name, type: value.type });
      }
    });
    return otherList;
  };

  useEffect(() => {
    const attribute = positionAttributes[item?.type];
    if (item?.type?.endsWith('Time')) {
      setLabels({ ...labels, start: null, period: t('sharedDays') });
    } else if (attribute && attribute.dataType) {
      switch (attribute.dataType) {
        case 'speed':
          setLabels({
            ...labels,
            start: t(prefixString('shared', speedUnit)),
            period: t(prefixString('shared', speedUnit)),
          });
          break;
        case 'distance':
          setLabels({
            ...labels,
            start: t(prefixString('shared', distanceUnit)),
            period: t(prefixString('shared', distanceUnit)),
          });
          break;
        case 'hours':
          setLabels({ ...labels, start: t('sharedHours'), period: t('sharedHours') });
          break;
        default:
          setLabels({ ...labels, start: null, period: null });
          break;
      }
    } else {
      setLabels({ ...labels, start: null, period: null });
    }
  }, [item?.type]);

  const rawToValue = (start, value) => {
    const attribute = positionAttributes[item.type];
    if (item.type?.endsWith('Time')) {
      if (start) {
        return dayjs(value).locale('en').format('YYYY-MM-DD');
      }
      return value / 86400000;
    }
    if (attribute && attribute.dataType) {
      switch (attribute.dataType) {
        case 'speed':
          return speedFromKnots(value, speedUnit);
        case 'distance':
          return distanceFromMeters(value, distanceUnit);
        case 'hours':
          return value / 3600000;
        default:
          return value;
      }
    }
    return value;
  };

  const valueToRaw = (start, value) => {
    const attribute = positionAttributes[item.type];
    if (item.type?.endsWith('Time')) {
      if (start) {
        return dayjs(value, 'YYYY-MM-DD').valueOf();
      }
      return value * 86400000;
    }
    if (attribute && attribute.dataType) {
      switch (attribute.dataType) {
        case 'speed':
          return speedToKnots(value, speedUnit);
        case 'distance':
          return distanceToMeters(value, distanceUnit);
        case 'hours':
          return value * 3600000;
        default:
          return value;
      }
    }
    return value;
  };

  const validate = () => item && item.name && item.type && item.start && item.period;

  const NeumorphicSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div
        className="mb-4 rounded-3xl shadow-md border overflow-hidden transition-all duration-300"
        style={{ background: theme.bgSecondary, borderColor: theme.border }}
      >
        <div
          className="p-4 flex items-center justify-between cursor-pointer active:opacity-70 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
              style={{ background: theme.bg, color: theme.accent, border: `1px solid ${theme.border}` }}
            >
              <Icon sx={{ fontSize: 16 }} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>
              {title}
            </h3>
          </div>
          <ExpandMoreIcon
            sx={{ fontSize: 18 }}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: theme.textMuted }}
          />
        </div>
        <Collapse in={isOpen}>
          <div className="p-4 pt-1 flex flex-col gap-4">
            <div className="h-px mb-1 opacity-10" style={{ background: theme.textMuted }} />
            {children}
          </div>
        </Collapse>
      </div>
    );
  };

  const fieldSx = {
    '& .MuiInputBase-input': { fontSize: '13px', color: theme.textPrimary },
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      background: theme.bg,
      '& fieldset': { borderColor: theme.border },
      '&:hover fieldset': { borderColor: theme.accent },
      '&.Mui-focused fieldset': { borderColor: theme.accent },
    },
    '& .MuiInputLabel-root': { color: theme.textMuted, fontSize: '12px' },
    '& .MuiSelect-icon': { color: theme.textMuted },
  };

  return (
    <EditItemView
      endpoint="maintenance"
      item={item}
      setItem={setItem}
      validate={validate}
      title={t('sharedMaintenance')}
    >
      {item && (
        <div className="flex flex-col gap-1 px-1">

          {/* ── NECESSÁRIO ─────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedRequired')} icon={BuildIcon} defaultOpen>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('sharedName')}</span>
              <TextField
                value={item.name || ''}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('sharedType')}</span>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <Select
                  value={item.type || ''}
                  onChange={(e) => setItem({ ...item, type: e.target.value, start: 0, period: 0 })}
                  sx={{ borderRadius: '12px', background: theme.bg, color: theme.textPrimary, '& fieldset': { borderColor: theme.border } }}
                  MenuProps={{ PaperProps: { sx: { background: theme.bgSecondary } } }}
                >
                  {convertToList(positionAttributes).map(({ key, name }) => (
                    <MenuItem key={key} value={key} sx={{ fontSize: '13px', color: theme.textPrimary }}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>
                {labels.start ? `${t('maintenanceStart')} (${labels.start})` : t('maintenanceStart')}
              </span>
              <TextField
                type={item.type?.endsWith('Time') ? 'date' : 'number'}
                value={rawToValue(true, item.start) || ''}
                onChange={(e) => setItem({ ...item, start: valueToRaw(true, e.target.value) })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>
                {labels.period ? `${t('maintenancePeriod')} (${labels.period})` : t('maintenancePeriod')}
              </span>
              <TextField
                type="number"
                value={rawToValue(false, item.period) || ''}
                onChange={(e) => setItem({ ...item, period: valueToRaw(false, e.target.value) })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>
          </NeumorphicSection>

          {/* ── ATRIBUTOS ──────────────────────────────────────────── */}
          <div className="mb-4">
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{}}
            />
          </div>
        </div>
      )}
    </EditItemView>
  );
};

export default MaintenancePage;
