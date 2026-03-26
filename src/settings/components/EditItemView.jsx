import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { Snackbar } from '@mui/material';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import PwaPageLayout from '../../common/components/PwaPageLayout';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { useHudTheme } from '../../common/util/ThemeContext';
import { useTenant } from '../../common/components/TenantProvider';

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
  const tenantCtx = useTenant();
  const logoUrl = tenantCtx?.tenant?.logo_url;
  const [saved, setSaved] = useState(false);

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
    setSaved(true);
    setTimeout(() => navigate(-1), 1200);
  });

  const isDisabled = !item || (validate && !validate());

  const headerActions = (
    <button
      onClick={handleSave}
      disabled={isDisabled}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${isDisabled ? 'opacity-20' : 'opacity-100'}`}
      style={{
        background: saved ? theme.accent : theme.bgSecondary,
        borderColor: theme.border,
        color: saved ? (theme.isDark ? '#000' : '#fff') : theme.accent,
        boxShadow: `0 4px 12px ${theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      {saved ? <CheckIcon sx={{ fontSize: 20 }} /> : <SaveIcon sx={{ fontSize: 20 }} />}
    </button>
  );

  return (
    <PwaPageLayout title={title || t('sharedEdit')} actions={headerActions}>
      <div className="flex flex-col min-h-full pb-8">
        {item ? (
          children
        ) : (
          <div className="p-6 rounded-3xl animate-pulse flex flex-col gap-6" style={{ background: theme.bgSecondary }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl w-full" style={{ background: theme.bg, borderColor: theme.border, borderWidth: 1 }} />
            ))}
          </div>
        )}

        {logoUrl && (
          <div className="mt-auto flex justify-center pt-6" style={{ paddingBottom: 10 }}>
            <img src={logoUrl} alt="logo" style={{ maxHeight: 120, maxWidth: '80%', opacity: 0.85, objectFit: 'contain' }} />
          </div>
        )}
      </div>

      <Snackbar
        open={saved}
        autoHideDuration={1200}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <div className="flex items-center gap-2">
            <CheckIcon sx={{ fontSize: 16, color: theme.accent }} />
            <span className="text-[12px] font-bold uppercase tracking-widest">Salvo com sucesso</span>
          </div>
        }
        ContentProps={{ style: { background: theme.bgSecondary, color: theme.textPrimary, borderRadius: 16, border: `1px solid ${theme.border}` } }}
      />
    </PwaPageLayout>
  );
};

export default EditItemView;
