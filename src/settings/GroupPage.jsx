import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextField, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import TuneIcon from '@mui/icons-material/Tune';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import { useTranslation } from '../common/components/LocalizationProvider';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import useGroupAttributes from '../common/attributes/useGroupAttributes';
import { useCatch } from '../reactHelper';
import { groupsActions } from '../store';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const GroupPage = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const { theme } = useHudTheme();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const groupAttributes = useGroupAttributes(t);

  const [item, setItem] = useState();

  const onItemSaved = useCatch(async () => {
    const response = await fetchOrThrow('/api/groups');
    dispatch(groupsActions.refresh(await response.json()));
  });

  const validate = () => item && item.name;

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
      endpoint="groups"
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={onItemSaved}
      title={t('groupDialog')}
    >
      {item && (
        <div className="flex flex-col gap-1 px-1">

          {/* ── NECESSÁRIO ─────────────────────────────────────────── */}
          <NeumorphicSection title={t('sharedRequired')} icon={FolderIcon} defaultOpen>
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
          </NeumorphicSection>

          {/* ── ATRIBUTOS ──────────────────────────────────────────── */}
          <div className="mb-4">
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonDeviceAttributes, ...groupAttributes }}
            />
          </div>
        </div>
      )}
    </EditItemView>
  );
};

export default GroupPage;
