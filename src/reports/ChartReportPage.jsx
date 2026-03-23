import dayjs from 'dayjs';
import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, useTheme } from '@mui/material';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PwaPageLayout from '../common/components/PwaPageLayout';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import { useHudTheme } from '../common/util/ThemeContext';
import {
  altitudeFromMeters,
  distanceFromMeters,
  speedFromKnots,
  speedToKnots,
  volumeFromLiters,
} from '../common/util/converter';
import fetchOrThrow from '../common/util/fetchOrThrow';

const ChartReportPage = () => {
  const theme = useTheme();
  const { theme: appTheme } = useHudTheme();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['speed']);
  const [selectedTypes, setSelectedTypes] = useState(['speed']);
  const [timeType, setTimeType] = useState('fixTime');

  const values = items.map((it) =>
    selectedTypes.map((type) => it[type]).filter((value) => value != null),
  ).flat();
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const valueRange = maxValue - minValue;

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const positions = await response.json();
    const keySet = new Set();
    const keyList = [];
    const formattedPositions = positions.map((position) => {
      const data = { ...position, ...position.attributes };
      const formatted = {};
      formatted.fixTime = dayjs(position.fixTime).valueOf();
      formatted.deviceTime = dayjs(position.deviceTime).valueOf();
      formatted.serverTime = dayjs(position.serverTime).valueOf();
      Object.keys(data)
        .filter((key) => !['id', 'deviceId'].includes(key))
        .forEach((key) => {
          const value = data[key];
          if (typeof value === 'number') {
            keySet.add(key);
            const definition = positionAttributes[key] || {};
            switch (definition.dataType) {
              case 'speed':
                if (key == 'obdSpeed') {
                  formatted[key] = speedFromKnots(speedToKnots(value, 'kmh'), speedUnit);
                } else {
                  formatted[key] = speedFromKnots(value, speedUnit);
                }
                break;
              case 'altitude':
                formatted[key] = altitudeFromMeters(value, altitudeUnit);
                break;
              case 'distance':
                formatted[key] = distanceFromMeters(value, distanceUnit);
                break;
              case 'volume':
                formatted[key] = volumeFromLiters(value, volumeUnit);
                break;
              case 'hours':
                formatted[key] = (value / 1000);
                break;
              default:
                formatted[key] = value;
                break;
            }
          }
        });
      return formatted;
    });
    Object.keys(positionAttributes).forEach((key) => {
      if (keySet.has(key)) {
        keyList.push(key);
        keySet.delete(key);
      }
    });
    setTypes([...keyList, ...keySet]);
    setItems(formattedPositions);
  });

  const colorPalette = [
    '#39ff14', // Neon Green
    '#ff3939', // Neon Red
    '#3b82f6', // Bright Blue
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
  ];

  return (
    <PwaPageLayout title="Gráfico de Telemetria">
      <div className="flex flex-col gap-4">
        <ReportFilter onShow={onShow} deviceType="single">
          <div className="flex flex-col gap-4 pl-1 pb-1">
            <FormControl variant="outlined" fullWidth size="small">
              <InputLabel style={{ color: appTheme.textMuted }}>{t('reportChartType')}</InputLabel>
              <Select
                label={t('reportChartType')}
                value={selectedTypes}
                onChange={(e) => setSelectedTypes(e.target.value)}
                multiple
                disabled={!items.length}
                className="rounded-xl shadow-inner transition-colors"
                style={{ background: appTheme.bg, color: appTheme.textPrimary }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: appTheme.border } }}
              >
                {types.map((key) => (
                  <MenuItem key={key} value={key}>
                    {positionAttributes[key]?.name || key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="outlined" fullWidth size="small">
              <InputLabel style={{ color: appTheme.textMuted }}>{t('reportTimeType')}</InputLabel>
              <Select
                label={t('reportTimeType')}
                value={timeType}
                onChange={(e) => setTimeType(e.target.value)}
                disabled={!items.length}
                className="rounded-xl shadow-inner transition-colors"
                style={{ background: appTheme.bg, color: appTheme.textPrimary }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: appTheme.border } }}
              >
                <MenuItem value="fixTime">{t('positionFixTime')}</MenuItem>
                <MenuItem value="deviceTime">{t('positionDeviceTime')}</MenuItem>
                <MenuItem value="serverTime">{t('positionServerTime')}</MenuItem>
              </Select>
            </FormControl>
          </div>
        </ReportFilter>

        {items.length > 0 && (
          <div 
            className="p-5 rounded-3xl shadow-md border h-[40vh] min-h-[220px] max-h-[400px] transition-colors"
            style={{ background: appTheme.bgSecondary, borderColor: appTheme.border }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={appTheme.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey={timeType}
                  type="number"
                  tickFormatter={(value) => dayjs(value).format('HH:mm')}
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  tick={{ fontSize: 9, fill: appTheme.textMuted }}
                  axisLine={false}
                />
                <YAxis
                  type="number"
                  tickFormatter={(value) => value.toFixed(1)}
                  domain={[minValue - valueRange / 5, maxValue + valueRange / 5]}
                  tick={{ fontSize: 9, fill: appTheme.textMuted }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: appTheme.bg, borderColor: appTheme.border, borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ color: appTheme.accent }}
                  labelFormatter={(value) => dayjs(value).format('HH:mm:ss')}
                  formatter={(value, key) => [value.toFixed(2), positionAttributes[key]?.name || key]}
                />
                {selectedTypes.map((type, index) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={colorPalette[index % colorPalette.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: appTheme.accent, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </PwaPageLayout>
  );
};

export default ChartReportPage;
