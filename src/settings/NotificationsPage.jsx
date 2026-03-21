import { useState } from 'react';
import { CircularProgress, IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

import { useEffectAsync } from '../reactHelper';
import { prefixString } from '../common/util/stringUtils';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import CollectionActions from './components/CollectionActions';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const NotificationsPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/notifications');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const formatList = (prefix, value) => {
    if (value) {
      return value
        .split(/[, ]+/)
        .filter(Boolean)
        .map((it) => t(prefixString(prefix, it)))
        .join(', ');
    }
    return '';
  };

  const headerActions = (
    <button
      onClick={() => window.location.hash = '/settings/notification'}
      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md border active:scale-95 transition-all duration-300"
      style={{ background: theme.bgSecondary, borderColor: theme.border, color: theme.accent }}
    >
      <AddIcon sx={{ fontSize: 24 }} />
    </button>
  );

  const filteredItems = items.filter((item) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      (item.description && item.description.toLowerCase().includes(keyword)) ||
      t(prefixString('event', item.type)).toLowerCase().includes(keyword)
    );
  });

  return (
    <PwaPageLayout title={t('sharedNotifications')} actions={headerActions}>
      <div className="flex flex-col gap-6">

        {/* Search Bar */}
        <div 
          className="rounded-2xl p-1 shadow-inner border flex items-center px-4 gap-3 transition-colors"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          <SearchIcon sx={{ fontSize: 18 }} style={{ color: theme.textMuted }} />
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={t('sharedSearch')}
            className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium"
            style={{ color: theme.textPrimary }}
          />
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-4 pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} sx={{ color: theme.accent }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>{t('sharedLoading')}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div 
              className="p-10 rounded-3xl border flex flex-col items-center justify-center gap-3 shadow-md"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <NotificationsIcon sx={{ fontSize: 40 }} style={{ color: theme.textMuted }} />
              <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>{t('sharedNoResults')}</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl p-5 shadow-md border flex flex-col gap-4 border transition-all"
                style={{ background: theme.bgSecondary, borderColor: theme.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border"
                      style={{ background: theme.bg, color: theme.accent, borderColor: theme.border }}
                    >
                      <NotificationsIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                        {t(prefixString('event', item.type))}
                      </h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: theme.textMuted }}>
                        {item.description || t('sharedNoDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/notification"
                      endpoint="notifications"
                      setTimestamp={setTimestamp}
                      customButtons={(
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.hash = `/settings/notification/${item.id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border active:scale-95 transition-all"
                            style={{ background: theme.bg, borderColor: theme.border, color: theme.textMuted }}
                          >
                            <EditIcon sx={{ fontSize: 14 }} />
                          </button>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl shadow-inner border" style={{ background: theme.bg, borderColor: theme.border }}>
                    <p className="text-[7px] font-black uppercase mb-1" style={{ color: theme.textMuted }}>{t('notificationNotificators')}</p>
                    <p className="text-[9px] font-bold uppercase truncate" style={{ color: theme.textPrimary }}>
                      {formatList('notificator', item.notificators)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl shadow-inner border" style={{ background: theme.bg, borderColor: theme.border }}>
                    <p className="text-[7px] font-black uppercase mb-1" style={{ color: theme.textMuted }}>{t('notificationAlways')}</p>
                    <p className={`text-[9px] font-black uppercase`} style={{ color: item.always ? theme.accent : theme.textMuted }}>
                      {item.always ? t('sharedYes') : t('sharedNo')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default NotificationsPage;
