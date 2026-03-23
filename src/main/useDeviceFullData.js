import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import fetchOrThrow from '../common/util/fetchOrThrow';

/**
 * Hook que combina dados em tempo real do WebSocket (Redux) com
 * dados REST da API Traccar para um veículo específico.
 * Fonte principal: WebSocket (positions store) — atualiza em tempo real.
 * Fonte secundária: /api/devices/{id} — metadados estáticos do dispositivo.
 */
const useDeviceFullData = (deviceId) => {
    const device = useSelector((state) => state.devices.items[deviceId]);
    const position = useSelector((state) => state.session.positions[deviceId]);

    const [deviceDetails, setDeviceDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDetails = useCallback(async () => {
        if (!deviceId) return;
        setLoading(true);
        setError(null);
        try {
            const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
            if (!isDemo) {
                const res = await fetchOrThrow(`/api/devices?id=${deviceId}`, {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                setDeviceDetails(Array.isArray(data) ? data[0] : data);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    // Processamento e normalização dos dados
    const pos = position || {};
    const attrs = pos.attributes || {};
    const device_ = deviceDetails || device || {};

    const speedKmh = Math.round((pos.speed || 0) * 1.852);
    const batteryLevel = attrs.batteryLevel ?? null;
    const ignition = attrs.ignition === true || attrs.ignition === 'true';
    const motion = attrs.motion === true || attrs.motion === 'true';
    const totalDistanceKm = Math.round((attrs.totalDistance || 0) / 1000);
    const engineHours = ((attrs.hours || 0) / 3600000).toFixed(1);
    const odometer = Math.round((attrs.odometer || attrs.totalDistance || 0) / 1000);

    // Curso (direção)
    const courseLabel = (deg) => {
        if (deg === null || deg === undefined) return '--';
        const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
        return dirs[Math.round(deg / 45) % 8];
    };

    return {
        device: device_,
        position: pos,
        attributes: attrs,
        loading,
        error,
        refetch: fetchDetails,

        // Dados calculados
        speedKmh,
        batteryLevel,
        ignition,
        motion,
        totalDistanceKm,
        engineHours,
        odometer,
        courseLabel: courseLabel(pos.course),

        // Telemetria
        altitude: pos.altitude?.toFixed(0) ?? '--',
        accuracy: pos.accuracy?.toFixed(0) ?? '--',
        satellites: attrs.sat ?? attrs.satellites ?? '--',
        hdop: attrs.hdop?.toFixed(1) ?? '--',
        protocol: pos.protocol ?? '--',
        valid: pos.valid,
        latitude: pos.latitude?.toFixed(6) ?? '--',
        longitude: pos.longitude?.toFixed(6) ?? '--',
        address: pos.address || null,

        // Energia
        power: attrs.power?.toFixed(2) ?? '--',
        battery: attrs.battery?.toFixed(2) ?? '--',
        charge: attrs.charge === true || attrs.charge === 'true',

        // Combustível
        fuel1: attrs.fuel1 ?? attrs.fuel ?? '--',
        fuel2: attrs.fuel2 ?? '--',

        // Motor
        rpm: attrs.rpm ?? '--',
        temperature: attrs.temp1 ?? attrs.temperature1 ?? '--',

        // Rede/GSM
        rssi: attrs.rssi ?? '--',
        operatorName: pos.network?.operatorName ?? attrs.operator ?? '--',
        signalStrength: pos.network?.signalStrength ?? '--',

        // Alarme
        alarm: attrs.alarm ?? null,

        // Motorista
        driverName: attrs.driver ?? attrs.driverName ?? null,
        driverUniqueId: attrs.driverUniqueId ?? null,

        // Horários
        fixTime: pos.fixTime ?? null,
        deviceTime: pos.deviceTime ?? null,
        serverTime: pos.serverTime ?? null,
        lastUpdate: device_?.lastUpdate ?? null,
    };
};

export default useDeviceFullData;
