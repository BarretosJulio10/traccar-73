import React, { useState } from 'react';
import {
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';
import EventIcon from '@mui/icons-material/Event';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import EditItemView from './components/EditItemView';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';

const NotificationPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();
  const [item, setItem] = useState();

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const testNotificators = useCatch(async () => {
    await Promise.all(
      item.notificators.split(/[, ]+/).map(async (notificator) => {
        await fetchOrThrow(`/api/notifications/test/${notificator}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }),
    );
  });

  const validate = () =>
    item &&
    item.type &&
    item.notificators &&
    (!item.notificators?.includes('command') || item.commandId);

  const NeumorphicSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <div 
        className="mb-6 rounded-3xl shadow-md border overflow-hidden transition-all duration-300"
        style={{ background: theme.bgSecondary, borderColor: theme.border }}
      >
        <div
          className="p-5 flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border"
              style={{ background: theme.bg, color: theme.accent, borderColor: theme.border }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textPrimary }}>{title}</h3>
          </div>
          <ExpandMoreIcon className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        <Collapse in={isOpen}>
          <div className="p-5 pt-0 flex flex-col gap-5">
            <div className="h-px mb-2" style={{ background: theme.border }} />
            {children}
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <EditItemView
      endpoint="notifications"
      item={item}
      setItem={setItem}
      validate={validate}
      title={t('sharedNotification')}
    >
      {item && (
        <div className="flex flex-col gap-1">
          <NeumorphicSection title={t('sharedRequired')} icon={NotificationsActiveIcon} defaultOpen>
            <SelectField
              value={item.type}
              onChange={(e) => setItem({ ...item, type: e.target.value })}
              endpoint="/api/notifications/types"
              keyGetter={(it) => it.type}
              titleGetter={(it) => t(prefixString('event', it.type))}
              label={t('sharedType')}
            />
            {item.type === 'alarm' && (
              <SelectField
                multiple
                value={item.attributes?.alarms ? item.attributes.alarms.split(/[, ]+/) : []}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, alarms: e.target.value.join() } })}
                data={alarms}
                keyGetter={(it) => it.key}
                label={t('sharedAlarms')}
              />
            )}
            <SelectField
              multiple
              value={item.notificators ? item.notificators.split(/[, ]+/) : []}
              onChange={(e) => setItem({ ...item, notificators: e.target.value.join() })}
              endpoint="/api/notifications/notificators"
              keyGetter={(it) => it.type}
              titleGetter={(it) => t(prefixString('notificator', it.type))}
              label={t('notificationNotificators')}
            />

            <button
              type="button"
              onClick={testNotificators}
              disabled={!item.notificators}
              className={`py-3 rounded-2xl border shadow-md text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all`}
              style={{ 
                background: theme.bg, 
                borderColor: theme.border,
                color: !item.notificators ? theme.textMuted : theme.accent
              }}
            >
              {t('sharedTestNotificators')}
            </button>

            <FormGroup className="bg-black/10 p-4 rounded-2xl border border-white/5">
              <FormControlLabel
                control={<Checkbox checked={item.always}
                  onChange={(e) => setItem({ ...item, always: e.target.checked })}
                  sx={{ color: theme.accent, '&.Mui-checked': { color: theme.accent } }} />}
                label={<span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('notificationAlways')}</span>}
              />
            </FormGroup>
          </NeumorphicSection>

          <NeumorphicSection title={t('sharedExtra')} icon={SettingsIcon}>
            <TextField
              value={item.description || ''}
              onChange={(e) => setItem({ ...item, description: e.target.value })}
              label={t('sharedDescription')}
              fullWidth
              size="small"
            />
            <SelectField
              value={item.calendarId}
              onChange={(e) => setItem({ ...item, calendarId: Number(e.target.value) })}
              endpoint="/api/calendars"
              label={t('sharedCalendar')}
              fullWidth
            />
            {['geofenceEnter', 'geofenceExit'].includes(item.type) && (
              <SelectField
                multiple
                value={item.attributes?.geofenceIds ? item.attributes.geofenceIds.split(',') : []}
                onChange={(e) => {
                  const geofenceIds = e.target.value.join();
                  const attributes = { ...item.attributes };
                  if (geofenceIds) { attributes.geofenceIds = geofenceIds; } else { delete attributes.geofenceIds; }
                  setItem({ ...item, attributes });
                }}
                endpoint="/api/geofences"
                keyGetter={(it) => String(it.id)}
                label={t('sharedGeofences')}
                fullWidth
              />
            )}
          </NeumorphicSection>
        </div>
      )}
    </EditItemView>
  );
};

export default NotificationPage;
