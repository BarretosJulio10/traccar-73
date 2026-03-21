import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import PwaPageLayout from '../../common/components/PwaPageLayout';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { useHudTheme } from '../../common/util/ThemeContext';

const EditItemView = ({
  children,
  endpoint,
  item,
  setItem,
  defaultItem,
  validate,
  onItemSaved,
  title,
}) => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { id } = useParams();
  const { theme } = useHudTheme();

  useEffectAsync(async () => {
    if (!item) {
      if (id) {
        const response = await fetchOrThrow(`/api/${endpoint}/${id}`);
        setItem(await response.json());
      } else {
        setItem(defaultItem || {});
      }
    }
  }, [id, item, defaultItem]);

  const handleSave = useCatch(async () => {
    let url = `/api/${endpoint}`;
    if (id) {
      url += `/${id}`;
    }

    const response = await fetchOrThrow(url, {
      method: !id ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (onItemSaved) {
      onItemSaved(await response.json());
    }
    navigate(-1);
  });

  const headerActions = (
    <button
      onClick={handleSave}
      disabled={!item || (validate && !validate())}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${!item || (validate && !validate()) ? 'opacity-20' : 'opacity-100'}`}
      style={{ 
        background: theme.bgSecondary, 
        borderColor: theme.border,
        color: theme.accent,
        boxShadow: `0 4px 12px ${theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
      }}
    >
      <SaveIcon sx={{ fontSize: 20 }} />
    </button>
  );

  return (
    <PwaPageLayout title={title || t('sharedEdit')} actions={headerActions}>
      <div className="flex flex-col h-full pb-32">
        {item ? (
          children
        ) : (
          <div className="p-6 rounded-3xl animate-pulse flex flex-col gap-6" style={{ background: theme.bgSecondary }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl w-full" style={{ background: theme.bg, borderColor: theme.border, borderWidth: 1 }} />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-24 left-4 right-4 z-40 flex gap-3 pointer-events-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto flex-1 h-11 rounded-2xl border font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all"
            style={{ 
              background: theme.bgSecondary, 
              borderColor: theme.border, 
              color: theme.textMuted,
              boxShadow: theme.sidebarShadow 
            }}
          >
            {t('sharedCancel')}
          </button>
          <button
            type="button"
            disabled={!item || (validate && !validate())}
            onClick={handleSave}
            className={`pointer-events-auto flex-1 h-11 rounded-2xl font-black uppercase tracking-[1.5px] text-[10px] transition-all ${!item || (validate && !validate()) ? 'opacity-50' : 'active:scale-95'}`}
            style={{
              background: !item || (validate && !validate()) ? theme.bg : theme.accent,
              color: !item || (validate && !validate()) ? theme.textMuted : (theme.isDark ? '#000' : '#fff'),
              boxShadow: !item || (validate && !validate()) ? 'none' : `0 4px 15px ${theme.accent}4D`
            }}
          >
            {t('sharedSave')}
          </button>
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default EditItemView;
