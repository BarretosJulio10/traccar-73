import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
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
      <div className="flex flex-col pb-8">
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
          <div className="flex justify-center pt-10 pb-4">
            <img src={logoUrl} alt="logo" style={{ maxHeight: 48, maxWidth: '60%', opacity: 0.5, objectFit: 'contain' }} />
          </div>
        )}
      </div>
    </PwaPageLayout>
  );
};

export default EditItemView;
