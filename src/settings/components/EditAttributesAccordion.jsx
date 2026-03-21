import { useState } from 'react';

import {
  Button,
  Checkbox,
  OutlinedInput,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import AddAttributeDialog from './AddAttributeDialog';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAttributePreference } from '../../common/util/preferences';
import { useHudTheme } from '../../common/util/ThemeContext';
import {
  distanceFromMeters,
  distanceToMeters,
  distanceUnitString,
  speedFromKnots,
  speedToKnots,
  speedUnitString,
  volumeFromLiters,
  volumeToLiters,
  volumeUnitString,
} from '../../common/util/converter';
import useFeatures from '../../common/util/useFeatures';

const EditAttributesAccordion = ({
  attribute,
  attributes,
  setAttributes,
  definitions,
  focusAttribute,
}) => {
  const t = useTranslation();
  const features = useFeatures();
  const { theme } = useHudTheme();

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [addDialogShown, setAddDialogShown] = useState(false);
  const [isOpen, setIsOpen] = useState(!!attribute);

  const updateAttribute = (key, value, type, subtype) => {
    const updatedAttributes = { ...attributes };
    switch (subtype) {
      case 'speed':
        updatedAttributes[key] = speedToKnots(Number(value), speedUnit);
        break;
      case 'distance':
        updatedAttributes[key] = distanceToMeters(Number(value), distanceUnit);
        break;
      case 'volume':
        updatedAttributes[key] = volumeToLiters(Number(value), volumeUnit);
        break;
      default:
        updatedAttributes[key] = type === 'number' ? Number(value) : value;
        break;
    }
    setAttributes(updatedAttributes);
  };

  const deleteAttribute = (key) => {
    const updatedAttributes = { ...attributes };
    delete updatedAttributes[key];
    setAttributes(updatedAttributes);
  };

  const getAttributeName = (key, subtype) => {
    const definition = definitions[key];
    const name = definition ? definition.name : key;
    switch (subtype) {
      case 'speed':
        return `${name} (${speedUnitString(speedUnit, t)})`;
      case 'distance':
        return `${name} (${distanceUnitString(distanceUnit, t)})`;
      case 'volume':
        return `${name} (${volumeUnitString(volumeUnit, t)})`;
      default:
        return name;
    }
  };

  const getAttributeType = (value) => {
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    return 'string';
  };

  const getAttributeSubtype = (key) => {
    const definition = definitions[key];
    return definition && definition.subtype;
  };

  const getDisplayValue = (value, subtype) => {
    if (value) {
      switch (subtype) {
        case 'speed':
          return speedFromKnots(value, speedUnit);
        case 'distance':
          return distanceFromMeters(value, distanceUnit);
        case 'volume':
          return volumeFromLiters(value, volumeUnit);
        default:
          return value;
      }
    }
    return '';
  };

  const convertToList = (attributes) => {
    const booleanList = [];
    const otherList = [];
    const excludeAttributes = [
      'speedUnit',
      'distanceUnit',
      'altitudeUnit',
      'volumeUnit',
      'timezone',
    ];
    Object.keys(attributes || [])
      .filter((key) => !excludeAttributes.includes(key))
      .forEach((key) => {
        const value = attributes[key];
        const type = getAttributeType(value);
        const subtype = getAttributeSubtype(key);
        if (type === 'boolean') {
          booleanList.push({
            key,
            value,
            type,
            subtype,
          });
        } else {
          otherList.push({
            key,
            value,
            type,
            subtype,
          });
        }
      });
    return [...otherList, ...booleanList];
  };

  const handleAddResult = (definition) => {
    setAddDialogShown(false);
    if (definition) {
      switch (definition.type) {
        case 'number':
          updateAttribute(definition.key, 0);
          break;
        case 'boolean':
          updateAttribute(definition.key, false);
          break;
        default:
          updateAttribute(definition.key, '');
          break;
      }
    }
  };

  if (features.disableAttributes) {
    return null;
  }

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
            <TuneIcon sx={{ fontSize: 16 }} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{t('sharedAttributes')}</h3>
        </div>
        <ExpandMoreIcon sx={{ fontSize: 18 }} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }} />
      </div>
      <Collapse in={isOpen}>
        <div className="p-4 pt-1 flex flex-col gap-4">
          <div className="h-px mb-1 opacity-10" style={{ background: theme.textMuted }} />

          {convertToList(attributes).map(({ key, value, type, subtype }) => {
            if (type === 'boolean') {
              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-2 px-3 rounded-2xl border shadow-inner"
                  style={{ background: theme.bg, borderColor: theme.border }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={value}
                        onChange={(e) => updateAttribute(key, e.target.checked)}
                        sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }}
                      />
                    }
                    label={<span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{getAttributeName(key, subtype)}</span>}
                  />
                  <IconButton size="small" onClick={() => deleteAttribute(key)} style={{ color: theme.textMuted }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </div>
              );
            }
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{getAttributeName(key, subtype)}</span>
                <FormControl key={key} fullWidth size="small">
                  <OutlinedInput
                    type={type === 'number' ? 'number' : 'text'}
                    value={getDisplayValue(value, subtype)}
                    onChange={(e) => updateAttribute(key, e.target.value, type, subtype)}
                    autoFocus={focusAttribute === key}
                    sx={{ 
                      borderRadius: '12px', 
                      background: theme.bg, 
                      fontSize: '12px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.accent },
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={() => deleteAttribute(key)} style={{ color: theme.textMuted }}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setAddDialogShown(true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border shadow-md text-[9px] font-black uppercase tracking-widest mt-1 active:scale-95 transition-all"
            style={{ 
              background: theme.bg, 
              borderColor: theme.border, 
              color: theme.accent,
              boxShadow: theme.isDark ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <AddIcon sx={{ fontSize: 14 }} />
            {t('sharedAdd')}
          </button>

          <AddAttributeDialog
            open={addDialogShown}
            onResult={handleAddResult}
            definitions={definitions}
          />
        </div>
      </Collapse>
    </div>
  );
};

export default EditAttributesAccordion;
