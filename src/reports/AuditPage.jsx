import { useState } from 'react';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import ReportFilter from './components/ReportFilter';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import HistoryIcon from '@mui/icons-material/History';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { useHudTheme } from '../common/util/ThemeContext';

const columnsArray = [
  ['actionTime', 'positionServerTime'],
  ['address', 'positionAddress'],
  ['userId', 'settingsUser'],
  ['actionType', 'sharedActionType'],
  ['objectType', 'sharedQbjectType'],
  ['objectId', 'deviceIdentifier'],
];
const columnsMap = new Map(columnsArray);

const AuditPage = () => {
  const t = useTranslation();
  const { theme } = useHudTheme();

  const [columns, setColumns] = usePersistedState('auditColumns', [
    'actionTime',
    'userId',
    'actionType',
    'objectType',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetchOrThrow(`/api/audit?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  return (
    <PwaPageLayout title={t('reportAudit')}>
      <div className="flex flex-col gap-6">
        <ReportFilter onShow={onShow} deviceType="none" loading={loading}>
          <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
        </ReportFilter>

        {/* Results List */}
        <div className="flex flex-col gap-4 pb-10">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl p-5 shadow-md border flex flex-col gap-4 transition-colors"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ background: theme.bg, color: theme.accent, boxShadow: `inset 2px 2px 5px rgba(0,0,0,0.1), 0 0 8px ${theme.accent}33` }}
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: theme.textPrimary }}>
                    Registro de Auditoria
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: theme.textMuted }}>
                    {formatTime(item.actionTime, 'minutes')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                {columns.filter(c => c !== 'actionTime').map((key) => (
                  <div key={key} className="p-3 rounded-2xl border shadow-inner" style={{ background: theme.bg, borderColor: theme.border }}>
                    <p className="text-[7px] font-black uppercase mb-1" style={{ color: theme.textMuted }}>{t(columnsMap.get(key))}</p>
                    <p className="text-[10px] font-black uppercase leading-none truncate" style={{ color: theme.textPrimary }}>
                      {item[key]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && items.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale" style={{ color: theme.textMuted }}>
              <TableRowsIcon sx={{ fontSize: 40, mb: 1 }} />
              <span className="text-xs font-black uppercase tracking-widest">Nenhum dado</span>
            </div>
          )}
        </div>
      </div>
    </PwaPageLayout>
  );
};

export default AuditPage;
