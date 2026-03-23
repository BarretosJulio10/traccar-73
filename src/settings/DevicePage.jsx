import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FormControlLabel,
  Checkbox,
  TextField,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import TuneIcon from '@mui/icons-material/Tune';
import ImageIcon from '@mui/icons-material/Image';
import { MuiFileInput } from 'mui-file-input';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useAdministrator } from '../common/util/permissions';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const DevicePage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const admin = useAdministrator();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleFileInput = useCatch(async (newFile) => {
    setImageFile(newFile);
    if (newFile && item?.id) {
      const response = await fetchOrThrow(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: newFile,
      });
      setItem({ ...item, attributes: { ...item.attributes, deviceImage: await response.text() } });
    } else if (!newFile) {
      // eslint-disable-next-line no-unused-vars
      const { deviceImage, ...remainingAttributes } = item.attributes || {};
      setItem({ ...item, attributes: remainingAttributes });
    }
  });

  const validate = () => item && item.name && item.uniqueId;

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
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      title={t('sharedDevice')}
    >
      {item && (
        <div className="flex flex-col gap-1 px-1">

          {/* ── NECESSÁRIO ─────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedRequired')} icon={DirectionsCarIcon} defaultOpen>
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
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('deviceIdentifier')}</span>
              <TextField
                value={item.uniqueId || ''}
                onChange={(e) => setItem({ ...item, uniqueId: e.target.value })}
                fullWidth
                size="small"
                disabled={Boolean(uniqueId)}
                helperText={t('deviceIdentifierHelp')}
                sx={fieldSx}
              />
            </div>
          </NeumorphicSection>

          {/* ── ADICIONAL ──────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedExtra')} icon={TuneIcon} defaultOpen>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('groupParent')}</span>
              <SelectField
                value={item.groupId}
                onChange={(e) => setItem({ ...item, groupId: Number(e.target.value) })}
                endpoint="/api/groups"
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('sharedPhone')}</span>
              <TextField
                value={item.phone || ''}
                onChange={(e) => setItem({ ...item, phone: e.target.value })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('deviceModel')}</span>
              <TextField
                value={item.model || ''}
                onChange={(e) => setItem({ ...item, model: e.target.value })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('deviceContact')}</span>
              <TextField
                value={item.contact || ''}
                onChange={(e) => setItem({ ...item, contact: e.target.value })}
                fullWidth
                size="small"
                sx={fieldSx}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('deviceCategory')}</span>
              <SelectField
                value={item.category || 'default'}
                onChange={(e) => setItem({ ...item, category: e.target.value })}
                data={deviceCategories
                  .map((category) => ({
                    id: category,
                    name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))}
                fullWidth
                size="small"
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

            {admin && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase px-1" style={{ color: theme.textMuted }}>{t('userExpirationTime')}</span>
                <TextField
                  type="date"
                  value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                  onChange={(e) => {
                    if (e.target.value) {
                      setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                    }
                  }}
                  fullWidth
                  size="small"
                  sx={fieldSx}
                />
              </div>
            )}

            {admin && (
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                style={{ background: theme.bg, borderColor: theme.border }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>
                  {t('sharedDisabled')}
                </span>
                <Checkbox
                  size="small"
                  checked={!!item.disabled}
                  onChange={(e) => setItem({ ...item, disabled: e.target.checked })}
                  sx={{ color: theme.border, '&.Mui-checked': { color: theme.accent }, p: 0 }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              style={{ background: theme.bg, borderColor: theme.border, color: theme.accent }}
            >
              {t('sharedQrCode')}
            </button>
          </NeumorphicSection>

          {/* ── IMAGEM ─────────────────────────────────────────────── */}
          {item.id && (
            <NeumorphicSection title={t('attributeDeviceImage')} icon={ImageIcon}>
              <MuiFileInput
                placeholder={t('attributeDeviceImage')}
                value={imageFile}
                onChange={handleFileInput}
                inputProps={{ accept: 'image/*' }}
                size="small"
                fullWidth
                sx={fieldSx}
              />
            </NeumorphicSection>
          )}

          {/* ── ATRIBUTOS ──────────────────────────────────────────── */}
          <div className="mb-4">
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
            />
          </div>
        </div>
      )}
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
