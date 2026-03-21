import { Divider, List } from '@mui/material';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ShareLocationOutlinedIcon from '@mui/icons-material/ShareLocationOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import SettingsRemoteOutlinedIcon from '@mui/icons-material/SettingsRemoteOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import MenuItem from '../../common/components/MenuItem';
import WhatsAppAlertsDialog from '../WhatsAppAlertsDialog';

const SettingsMenu = () => {
  const t = useTranslation();
  const location = useLocation();
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector((state) => state.session.server.attributes.support);
  const billingLink = useSelector((state) => state.session.user.attributes.billingLink);

  const features = useFeatures();

  return (
    <>
      <List>
        <MenuItem
          title={t('sharedPreferences')}
          link="/app/settings/preferences"
          icon={<SettingsSuggestOutlinedIcon />}
          selected={location.pathname === '/app/settings/preferences'}
        />
        {!readonly && (
          <>
            <MenuItem
              title={t('sharedNotifications')}
              link="/app/settings/notifications"
              icon={<NotificationsOutlinedIcon />}
              selected={location.pathname.startsWith('/app/settings/notification')}
            />
            <MenuItem
              title={t('settingsUser')}
              link={`/app/settings/user/${userId}`}
              icon={<AccountCircleOutlinedIcon />}
              selected={location.pathname === `/app/settings/user/${userId}`}
            />
            <MenuItem
              title={t('deviceTitle')}
              link="/app/settings/devices"
              icon={<DirectionsCarOutlinedIcon />}
              selected={location.pathname.startsWith('/app/settings/device')}
            />
            <MenuItem
              title={t('sharedGeofences')}
              link="/app/geofences"
              icon={<ShareLocationOutlinedIcon />}
              selected={location.pathname.startsWith('/app/geofence')}
            />
            {!features.disableGroups && (
              <MenuItem
                title={t('settingsGroups')}
                link="/app/settings/groups"
                icon={<FolderOpenOutlinedIcon />}
                selected={location.pathname.startsWith('/app/settings/group')}
              />
            )}
            {!features.disableDrivers && (
              <MenuItem
                title={t('sharedDrivers')}
                link="/app/settings/drivers"
                icon={<BadgeOutlinedIcon />}
                selected={location.pathname.startsWith('/app/settings/driver')}
              />
            )}
            {!features.disableCalendars && (
              <MenuItem
                title={t('sharedCalendars')}
                link="/app/settings/calendars"
                icon={<TodayOutlinedIcon />}
                selected={location.pathname.startsWith('/app/settings/calendar')}
              />
            )}
            {!features.disableComputedAttributes && (
              <MenuItem
                title={t('sharedComputedAttributes')}
                link="/app/settings/attributes"
                icon={<DataObjectOutlinedIcon />}
                selected={location.pathname.startsWith('/app/settings/attribute')}
              />
            )}
            {!features.disableMaintenance && (
              <MenuItem
                title={t('sharedMaintenance')}
                link="/app/settings/maintenances"
                icon={<HandymanOutlinedIcon />}
                selected={location.pathname.startsWith('/app/settings/maintenance')}
              />
            )}
            <MenuItem
              title={t('commandCenter')}
              link="/app/settings/command-center"
              icon={<SettingsRemoteOutlinedIcon />}
              selected={location.pathname === '/app/settings/command-center'}
            />
            {!features.disableSavedCommands && (
              <MenuItem
                title={t('sharedSavedCommands')}
                link="/app/settings/commands"
                icon={<TerminalOutlinedIcon />}
                selected={
                  location.pathname.startsWith('/app/settings/command') &&
                  location.pathname !== '/app/settings/command-center'
                }
              />
            )}
          </>
        )}
        {billingLink && (
          <MenuItem title={t('userBilling')} link={billingLink} icon={<PaymentOutlinedIcon />} />
        )}
        {supportLink && (
          <MenuItem
            title={t('settingsSupport')}
            link={supportLink}
            icon={<HelpOutlineOutlinedIcon />}
          />
        )}
      </List>
      {manager && (
        <>
          <Divider />
          <List>
            <MenuItem
              title={t('serverAnnouncement')}
              link="/app/settings/announcement"
              icon={<CampaignOutlinedIcon />}
              selected={location.pathname === '/app/settings/announcement'}
            />
            {admin && (
              <>
                <MenuItem
                  title={t('settingsServer')}
                  link="/app/settings/server"
                  icon={<AdminPanelSettingsOutlinedIcon />}
                  selected={location.pathname === '/app/settings/server'}
                />
                <MenuItem
                  title={t('whatsappSettings')}
                  icon={<WhatsAppIcon />}
                  onClick={() => setWhatsappOpen(true)}
                />
              </>
            )}
            <MenuItem
              title={t('settingsUsers')}
              link="/app/settings/users"
              icon={<GroupOutlinedIcon />}
              selected={
                location.pathname.startsWith('/app/settings/user') &&
                location.pathname !== `/app/settings/user/${userId}`
              }
            />
          </List>
        </>
      )}
      <WhatsAppAlertsDialog open={whatsappOpen} onClose={() => setWhatsappOpen(false)} />
    </>
  );
};

export default SettingsMenu;
