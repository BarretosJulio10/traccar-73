import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StorageIcon from '@mui/icons-material/Storage';
import TableRowsIcon from '@mui/icons-material/TableRows';

import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import { sessionActions } from '../store';
import { useHudTheme } from '../common/util/ThemeContext';

const LogsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { theme } = useHudTheme();

  useEffect(() => {
    dispatch(sessionActions.enableLogs(true));
    return () => dispatch(sessionActions.enableLogs(false));
  }, []);

  const items = useSelector((state) => state.session.logs);

  const registerDevice = (uniqueId) => {
    const query = new URLSearchParams({ uniqueId });
    navigate(`/app/settings/device?${query.toString()}`);
  };

  return (
    <PwaPageLayout title={t('sharedLogs')}>
      <div className="flex flex-col gap-4 pb-10">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-3xl p-5 shadow-md border flex flex-col gap-4 transition-colors"
            style={{ background: theme.bgSecondary, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ background: theme.bg, color: theme.accent, boxShadow: `inset 2px 2px 5px rgba(0,0,0,0.1), 0 0 8px ${theme.accent}33` }}
                >
                  <StorageIcon sx={{ fontSize: 18 }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                    {item.uniqueId}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: theme.textMuted }}>
                    Protocolo: {item.protocol}
                  </span>
                </div>
              </div>
              <div>
                {item.deviceId ? (
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                  </div>
                ) : (
                  <button
                    onClick={() => registerDevice(item.uniqueId)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 active:bg-red-500/20 transition-all"
                  >
                    <HelpOutlineIcon sx={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border shadow-inner" style={{ background: theme.bg, borderColor: theme.border }}>
              <p className="text-[7px] font-black uppercase mb-1" style={{ color: theme.textMuted }}>Dados Brutos (Hex/Text)</p>
              <p className="text-[9px] font-mono break-all leading-relaxed" style={{ color: theme.textPrimary }}>
                {item.data}
              </p>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale" style={{ color: theme.textMuted }}>
            <TableRowsIcon sx={{ fontSize: 40, mb: 1 }} />
            <span className="text-xs font-black uppercase tracking-widest">Nenhum log recebido</span>
          </div>
        )}
      </div>
    </PwaPageLayout>
  );
};

export default LogsPage;
