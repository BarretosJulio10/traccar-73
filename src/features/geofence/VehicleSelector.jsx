import { useSelector } from 'react-redux';
import CheckIcon from '@mui/icons-material/Check';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useHudTheme } from '../../common/util/ThemeContext';

const VehicleSelector = ({ selectedIds, onToggle, onSelectAll }) => {
  const { theme } = useHudTheme();
  const devices = useSelector((state) => state.devices.items);
  const deviceList = Object.values(devices);

  if (deviceList.length === 0) {
    return (
      <p className="text-xs py-2 text-center" style={{ color: theme.textMuted }}>
        Nenhum veículo disponível
      </p>
    );
  }

  const allSelected = deviceList.length > 0 && deviceList.every((d) => selectedIds.includes(d.id));

  return (
    <div className="flex flex-col gap-1.5">
      {/* Select all */}
      <button
        type="button"
        onClick={() => onSelectAll(allSelected ? [] : deviceList.map((d) => d.id))}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98]"
        style={{
          background: allSelected ? `${theme.accent}12` : theme.bgSecondary,
          borderColor: allSelected ? `${theme.accent}50` : theme.borderCard,
        }}
      >
        <span
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            borderColor: allSelected ? theme.accent : theme.textMuted,
            background: allSelected ? theme.accent : 'transparent',
          }}
        >
          {allSelected && <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />}
        </span>
        <span className="text-xs font-bold flex-1 text-left" style={{ color: allSelected ? theme.accent : theme.textSecondary }}>
          Selecionar todos ({deviceList.length})
        </span>
      </button>

      {/* Device list */}
      <div className="flex flex-col gap-1 max-h-44 overflow-y-auto scrollbar-hide">
        {deviceList.map((device) => {
          const checked = selectedIds.includes(device.id);
          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onToggle(device.id)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border transition-all active:scale-[0.98]"
              style={{
                background: checked ? `${theme.accent}10` : theme.bgCard,
                borderColor: checked ? `${theme.accent}40` : theme.borderCard,
              }}
            >
              <span
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: checked ? theme.accent : theme.borderCard,
                  background: checked ? theme.accent : 'transparent',
                }}
              >
                {checked && <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />}
              </span>
              <DirectionsCarIcon sx={{ fontSize: 14, color: checked ? theme.accent : theme.textMuted, flexShrink: 0 }} />
              <span
                className="text-xs font-semibold flex-1 text-left truncate"
                style={{ color: checked ? theme.textPrimary : theme.textSecondary }}
              >
                {device.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleSelector;
