import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { devicesActions, sessionActions, eventsActions, geofencesActions } from '../store';
import dayjs from 'dayjs';
import { DEMO_USER } from '../common/util/constants';

const DEMO_DEVICE_IDS = [99901, 99902, 99903, 99904, 99905];

const DEMO_GEOFENCES = [
  {
    id: 1001,
    name: 'Sede MAB Tracker',
    description: 'Escritório Central',
    area: 'CIRCLE (-23.5505 -46.6333, 500)',
    attributes: { color: '#39ff14' },
  },
  {
    id: 1002,
    name: 'Logística Tatuapé',
    description: 'Centro de Distribuição',
    area: 'CIRCLE (-23.52 -46.59, 800)',
    attributes: { color: '#3b82f6' },
  },
];

const DEMO_VEHICLES = [
  {
    id: 99901,
    name: 'Fiorino MAB-01',
    uniqueId: 'DEMO001',
    category: 'van',
    status: 'online',
    phone: '',
    model: 'Fiat Fiorino',
    contact: 'João',
    groupId: 0,
    disabled: false,
    positionId: 90001,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 99902,
    name: 'HB20 MAB-02',
    uniqueId: 'DEMO002',
    category: 'car',
    status: 'online',
    phone: '',
    model: 'Hyundai HB20',
    contact: 'Maria',
    groupId: 0,
    disabled: false,
    positionId: 90002,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 99903,
    name: 'Truck MAB-03',
    uniqueId: 'DEMO003',
    category: 'truck',
    status: 'online',
    phone: '',
    model: 'VW Delivery',
    contact: 'Carlos',
    groupId: 0,
    disabled: false,
    positionId: 90003,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 99904,
    name: 'Moto MAB-04',
    uniqueId: 'DEMO004',
    category: 'motorcycle',
    status: 'online',
    phone: '',
    model: 'Honda CG 160',
    contact: 'Pedro',
    groupId: 0,
    disabled: false,
    positionId: 90004,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: 99905,
    name: 'S10 MAB-05',
    uniqueId: 'DEMO005',
    category: 'car',
    status: 'online',
    phone: '',
    model: 'Chevrolet S10',
    contact: 'Ana',
    groupId: 0,
    disabled: false,
    positionId: 90005,
    lastUpdate: new Date().toISOString(),
  },
];

// São Paulo region base coordinates
const BASE_POSITIONS = [
  { lat: -23.5505, lng: -46.6333, address: 'Praça da Sé, Centro, São Paulo, SP' },
  { lat: -23.5631, lng: -46.6544, address: 'Av. Paulista, 1578, Bela Vista, São Paulo, SP' },
  { lat: -23.5875, lng: -46.658, address: 'Parque Ibirapuera, Moema, São Paulo, SP' },
  { lat: -23.52, lng: -46.59, address: 'Av. Radial Leste, Tatuapé, São Paulo, SP' },
  { lat: -23.61, lng: -46.695, address: 'Av. Interlagos, 2255, Interlagos, São Paulo, SP' },
];

const ALERT_TYPES = [
  { type: 'deviceOverspeed', messageKey: 'demoOverspeed' },
  { type: 'geofenceExit', messageKey: 'demoGeofenceExit' },
  { type: 'geofenceEnter', messageKey: 'demoGeofenceEnter' },
  { type: 'deviceStopped', messageKey: 'demoDeviceStopped' },
  { type: 'alarm', messageKey: 'demoAlarmSos', alarm: 'sos' },
  { type: 'ignitionOn', messageKey: 'demoIgnitionOn' },
  { type: 'ignitionOff', messageKey: 'demoIgnitionOff' },
];

const DEMO_SERVER = {
  id: 1,
  attributes: {
    mapLiveRoutes: 'selected',
    'web.liveRouteLength': 20,
    mapCluster: true,
  },
};

export const getMockReportData = (type, deviceIds, from, to) => {
  const data = [];
  const fromDate = dayjs(from);
  const toDate = dayjs(to);
  const hoursDiff = toDate.diff(fromDate, 'hour');
  const count = Math.min(20, Math.max(5, Math.floor(hoursDiff / 2)));

  deviceIds.forEach((deviceId) => {
    const deviceName = DEMO_VEHICLES.find((v) => v.id === deviceId)?.name || 'Veículo Demo';

    if (type === 'combined') {
      const events = [];
      const positions = [];
      const route = [];

      for (let i = 0; i < count; i++) {
        const time = fromDate.add(i * (hoursDiff / count), 'hour').toISOString();
        const basePos = BASE_POSITIONS[deviceId % 5];
        const lat = basePos.lat + (Math.random() - 0.5) * 0.05;
        const lng = basePos.lng + (Math.random() - 0.5) * 0.05;
        const positionId = 90000 + deviceId + i;

        events.push({
          id: Math.floor(Math.random() * 100000),
          deviceId,
          type: ALERT_TYPES[i % ALERT_TYPES.length].type,
          eventTime: time,
          positionId,
          attributes: { message: `[DEMO] Alerta simulado #${i}` },
        });

        positions.push({
          id: positionId,
          deviceId,
          latitude: lat,
          longitude: lng,
          deviceTime: time,
          speed: 10 + Math.random() * 80,
          attributes: {},
        });

        route.push({ latitude: lat, longitude: lng });
      }

      data.push({
        deviceId,
        events,
        positions,
        route,
      });
    } else if (type === 'summary') {
      data.push({
        deviceId,
        deviceName,
        distance: 50 + Math.random() * 200,
        averageSpeed: 30 + Math.random() * 40,
        maxSpeed: 80 + Math.random() * 40,
        spentFuel: 5 + Math.random() * 15,
        engineHours: count * 3600000,
      });
    } else if (type === 'events') {
      for (let i = 0; i < count; i++) {
        const basePos = BASE_POSITIONS[deviceId % 5];
        const eventTime = fromDate.add(i * (hoursDiff / count), 'hour').toISOString();
        data.push({
          id: Math.floor(Math.random() * 100000),
          deviceId,
          type: ALERT_TYPES[i % ALERT_TYPES.length].type,
          eventTime,
          positionId: 80000 + deviceId + i,
          latitude: basePos.lat + (Math.random() - 0.5) * 0.02,
          longitude: basePos.lng + (Math.random() - 0.5) * 0.02,
          address: basePos.address,
          attributes: { message: `[DEMO] Alerta simulado #${i}` },
        });
      }
    } else if (type === 'trips' || type === 'stops') {
      for (let i = 0; i < count; i++) {
        const timeStart = fromDate.add(i * (hoursDiff / count), 'hour').toISOString();
        const timeEnd = fromDate.add(i * (hoursDiff / count) + 0.5, 'hour').toISOString();
        const basePos = BASE_POSITIONS[deviceId % 5];
        data.push({
          deviceId,
          deviceName,
          startPositionId: 1000 + i,
          endPositionId: 2000 + i,
          startTime: timeStart,
          endTime: timeEnd,
          startLat: basePos.lat,
          startLon: basePos.lng,
          endLat: basePos.lat + 0.01,
          endLon: basePos.lng + 0.01,
          startAddress: basePos.address,
          endAddress: 'Rua Simulada, 123, São Paulo, SP',
          spentFuel: Math.random() * 5,
          distance: 5 + Math.random() * 10,
          duration: 1800000,
          averageSpeed: 20 + Math.random() * 30,
          maxSpeed: 60 + Math.random() * 20,
        });
      }
    } else if (type === 'geofences') {
      for (let i = 0; i < count; i++) {
        const timeStart = fromDate.add(i * (hoursDiff / count), 'hour').toISOString();
        const timeEnd = fromDate.add(i * (hoursDiff / count) + 0.2, 'hour').toISOString();
        data.push({
          deviceId,
          geofenceId: 1001,
          startTime: timeStart,
          endTime: timeEnd,
        });
      }
    } else if (type === 'positions') {
      for (let i = 0; i < count * 5; i++) { // More points for detailed route
        const time = fromDate.add(i * (hoursDiff / (count * 5)), 'hour').toISOString();
        const basePos = BASE_POSITIONS[deviceId % 5];
        const lat = basePos.lat + (Math.random() - 0.5) * 0.08;
        const lng = basePos.lng + (Math.random() - 0.5) * 0.08;
        data.push({
          id: 70000 + deviceId + i,
          deviceId,
          latitude: lat,
          longitude: lng,
          deviceTime: time,
          fixTime: time,
          speed: (10 + Math.random() * 80) / 1.852, // km/h to knots
          course: Math.random() * 360,
          altitude: 700 + Math.random() * 100,
          valid: true,
          protocol: 'demo',
          address: `${basePos.address.split(',')[0]} (Ponto ${i})`,
          attributes: {
            ignition: Math.random() > 0.1,
            distance: 10 + Math.random() * 50,
            totalDistance: 100000 + i * 10,
          },
        });
      }
    }
  });

  return data;
};

const DemoController = ({ active }) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const positionsRef = useRef(
    BASE_POSITIONS.map((pos, i) => ({
      lat: pos.lat,
      lng: pos.lng,
      speed: i === 3 ? 0 : 20 + Math.random() * 60, // moto offline = parada
      course: Math.random() * 360,
    })),
  );

  const createPosition = useCallback((deviceId, idx) => {
    const pos = positionsRef.current[idx];
    return {
      id: 90000 + deviceId,
      deviceId,
      protocol: 'demo',
      serverTime: new Date().toISOString(),
      deviceTime: new Date().toISOString(),
      fixTime: new Date().toISOString(),
      valid: true,
      latitude: pos.lat,
      longitude: pos.lng,
      altitude: 750 + Math.random() * 50,
      speed: pos.speed / 1.852, // convert km/h to knots
      course: pos.course,
      address: BASE_POSITIONS[idx].address,
      geofenceIds: [99901, 99903, 99905].includes(deviceId) ? [1001] : [],
      attributes: {
        batteryLevel: 40 + Math.random() * 60,
        ignition: deviceId !== 99904 || Math.random() > 0.5,
        motion: pos.speed > 5,
        distance: Math.random() * 1000,
        totalDistance: 50000 + Math.random() * 100000,
        hours: 360000000 + Math.random() * 100000000,
        sat: 8 + Math.floor(Math.random() * 8),
      },
    };
  }, []);

  const injectDemoData = useCallback(() => {
    // Inject server and user basics
    dispatch(sessionActions.updateServer(DEMO_SERVER));

    // Inject devices
    dispatch(devicesActions.refresh(DEMO_VEHICLES));

    // Inject geofences
    dispatch(geofencesActions.refresh(DEMO_GEOFENCES));

    // Inject positions
    const positions = DEMO_VEHICLES.map((v, i) => createPosition(v.id, i));
    dispatch(sessionActions.updatePositions(positions));
  }, [dispatch, createPosition]);

  const updateMovement = useCallback(() => {
    positionsRef.current = positionsRef.current.map((pos, i) => {
      if (i === 3 && Math.random() > 0.1) return pos; // moto stays stopped mostly

      // Random movement
      const speedChange = (Math.random() - 0.5) * 20;
      const newSpeed = Math.max(0, Math.min(120, pos.speed + speedChange));
      const courseChange = (Math.random() - 0.5) * 30;
      const newCourse = (pos.course + courseChange + 360) % 360;

      // Move position based on speed
      const distKm = (newSpeed / 3600) * 3; // 3 seconds interval
      const dLat = (distKm / 111) * Math.cos((newCourse * Math.PI) / 180);
      const dLng =
        (distKm / (111 * Math.cos((pos.lat * Math.PI) / 180))) *
        Math.sin((newCourse * Math.PI) / 180);

      return {
        lat: pos.lat + dLat,
        lng: pos.lng + dLng,
        speed: newSpeed,
        course: newCourse,
      };
    });

    const positions = DEMO_VEHICLES.map((v, i) => createPosition(v.id, i));
    dispatch(sessionActions.updatePositions(positions));
  }, [dispatch, createPosition]);

  const cleanupDemo = useCallback(() => {
    DEMO_DEVICE_IDS.forEach((id) => {
      dispatch(devicesActions.remove(id));
    });
    dispatch(geofencesActions.refresh([]));
    dispatch(eventsActions.deleteAll());
  }, [dispatch]);

  useEffect(() => {
    if (active) {
      injectDemoData();
      intervalRef.current = setInterval(updateMovement, 3000);
    } else {
      cleanupDemo();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, injectDemoData, updateMovement, cleanupDemo]);

  return null;
};

export { DEMO_DEVICE_IDS };
export default DemoController;
