import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  Collapse,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FenceIcon from '@mui/icons-material/Fence';
import TuneIcon from '@mui/icons-material/Tune';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useGeofenceAttributes from '../common/attributes/useGeofenceAttributes';
import SelectField from '../common/components/SelectField';
import { geofencesActions } from '../store';
import { useHudTheme } from '../common/util/ThemeContext';
import { GEOFENCE_TYPES } from '../common/util/geofenceTypes';

const GeofencePage = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const geofenceAttributes = useGeofenceAttributes(t);
  const [item, setItem] = useState();

  const onItemSaved = (result) => {
    dispatch(geofencesActions.update([result]));
  };

  const validate = () => item && item.name;

  // ── NeumorphicSection (same pattern as UserPage) ──────────────────────────
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
      endpoint="geofences"
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={onItemSaved}
      title="Cerca Virtual"
    >
      {item && (
        <div className="flex flex-col gap-1 px-1">

          {/* ── NECESSÁRIO ─────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedRequired')} icon={FenceIcon} defaultOpen>
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
          </NeumorphicSection>

          {/* ── ADICIONAL ──────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedExtra')} icon={TuneIcon} defaultOpen>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('sharedDescription')}</span>
              <TextField
                value={item.description || ''}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
                fullWidth
                size="small"
                multiline
                rows={2}
                sx={fieldSx}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('sharedCalendar')}</span>
              <SelectField
                value={item.calendarId}
                onChange={(e) => setItem({ ...item, calendarId: Number(e.target.value) })}
                endpoint="/api/calendars"
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>

            {/* Tipo / Categoria */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>Categoria / Tipo</span>
              <div className="flex flex-wrap gap-2">
                {GEOFENCE_TYPES.map((typeObj) => {
                  const current = item.attributes?.type || 'custom';
                  const isSelected = current === typeObj.value;
                  return (
                    <button
                      key={typeObj.value}
                      type="button"
                      onClick={() => setItem({ ...item, attributes: { ...item.attributes, type: typeObj.value } })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95"
                      style={{
                        background: isSelected
                          ? typeObj.color
                          : theme.isDark ? `${typeObj.color}14` : `${typeObj.color}10`,
                        borderColor: isSelected ? typeObj.color : `${typeObj.color}50`,
                        color: isSelected ? '#fff' : typeObj.color,
                        boxShadow: isSelected ? `0 4px 14px ${typeObj.color}55` : 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                        {typeObj.icon}
                      </span>
                      {typeObj.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtrar no mapa */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
              style={{ background: theme.bg, borderColor: theme.border }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>
                {t('sharedFilterMap')}
              </span>
              <Checkbox
                size="small"
                checked={!!item.attributes?.hide}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, hide: e.target.checked } })}
                sx={{ color: theme.border, '&.Mui-checked': { color: theme.accent }, p: 0 }}
              />
            </div>
          </NeumorphicSection>

          {/* ── ATRIBUTOS ──────────────────────────────────────────── */}
          <div className="mb-4">
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={geofenceAttributes}
            />
          </div>
        </div>
      )}
    </EditItemView>
  );
};

export default GeofencePage;
