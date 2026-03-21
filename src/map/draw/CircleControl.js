/**
 * Custom MapLibre control for creating circle geofences.
 *
 * Flow:
 * 1. User clicks the circle button → enters placement mode (cursor changes to crosshair)
 * 2. User clicks on the map → center is placed, enters radius mode
 * 3. User moves mouse → circle preview updates dynamically
 * 4. User clicks again → radius is confirmed, geofence is created
 *
 * The circle is stored in Traccar's CIRCLE format: "CIRCLE (lat lon, radius_meters)"
 */
import circle from '@turf/circle';

class CircleControl {
  constructor({ onCircleCreated }) {
    this._onCircleCreated = onCircleCreated;
    this._active = false;
    this._center = null;
    this._container = null;
    this._button = null;
    this._map = null;
    this._previewSourceId = 'circle-preview-source';
    this._previewLayerId = 'circle-preview-layer';
    this._previewOutlineId = 'circle-preview-outline';
  }

  /**
   * Attach the circle button to an existing draw control group,
   * inserting it above the trash button.
   */
  attach(mapInstance, drawControlContainer) {
    this._map = mapInstance;

    this._button = document.createElement('button');
    this._button.type = 'button';
    this._button.title = 'Draw circle';
    this._button.setAttribute('aria-label', 'Draw circle');
    this._button.className = 'mapbox-gl-draw_ctrl-draw-btn';
    this._button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    `;
    this._button.style.cssText =
      'display:flex;align-items:center;justify-content:center;cursor:pointer;';

    this._button.addEventListener('click', () => this._toggleActive());

    // Find the trash button and insert circle before it
    const trashButton = drawControlContainer.querySelector('.mapbox-gl-draw_trash');
    if (trashButton) {
      drawControlContainer.insertBefore(this._button, trashButton);
    } else {
      drawControlContainer.appendChild(this._button);
    }
  }

  detach() {
    this._deactivate();
    if (this._button?.parentNode) {
      this._button.parentNode.removeChild(this._button);
    }
    this._map = null;
  }

  _toggleActive() {
    if (this._active) {
      this._deactivate();
    } else {
      this._activate();
    }
  }

  _activate() {
    this._active = true;
    this._center = null;
    this._button.classList.add('active');
    this._button.style.backgroundColor = 'rgba(45, 212, 191, 0.2)';
    this._map.getCanvas().style.cursor = 'crosshair';

    this._onMapClick = this._handleMapClick.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    this._map.on('click', this._onMapClick);
    document.addEventListener('keydown', this._onKeyDown);
  }

  _deactivate() {
    this._active = false;
    this._center = null;
    if (this._button) {
      this._button.classList.remove('active');
      this._button.style.backgroundColor = '';
    }
    if (this._map) {
      this._map.getCanvas().style.cursor = '';
      this._map.off('click', this._onMapClick);
      this._map.off('mousemove', this._onMouseMove);
      this._removePreview();
    }
    document.removeEventListener('keydown', this._onKeyDown);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      this._deactivate();
    }
  }

  _handleMapClick(e) {
    if (!this._center) {
      // First click — set center
      this._center = [e.lngLat.lng, e.lngLat.lat];
      this._addPreviewSource();
      this._map.on('mousemove', this._onMouseMove);
    } else {
      // Second click — confirm radius
      const radiusMeters = this._calculateDistance(this._center, [e.lngLat.lng, e.lngLat.lat]);
      const finalRadius = Math.max(radiusMeters, 10); // minimum 10m

      const lat = this._center[1];
      const lon = this._center[0];
      const area = `CIRCLE (${lat} ${lon}, ${finalRadius.toFixed(1)})`;

      this._onCircleCreated(area);
      this._deactivate();
    }
  }

  _handleMouseMove(e) {
    if (!this._center) return;

    const radius = this._calculateDistance(this._center, [e.lngLat.lng, e.lngLat.lat]);
    const effectiveRadius = Math.max(radius, 10);
    const polygon = circle(this._center, effectiveRadius, { steps: 64, units: 'meters' });

    const source = this._map.getSource(this._previewSourceId);
    if (source) {
      source.setData(polygon);
    }
  }

  _addPreviewSource() {
    const emptyGeoJSON = { type: 'FeatureCollection', features: [] };

    if (!this._map.getSource(this._previewSourceId)) {
      this._map.addSource(this._previewSourceId, { type: 'geojson', data: emptyGeoJSON });
    }

    if (!this._map.getLayer(this._previewLayerId)) {
      this._map.addLayer({
        id: this._previewLayerId,
        type: 'fill',
        source: this._previewSourceId,
        paint: {
          'fill-color': '#2dd4bf',
          'fill-opacity': 0.2,
        },
      });
    }

    if (!this._map.getLayer(this._previewOutlineId)) {
      this._map.addLayer({
        id: this._previewOutlineId,
        type: 'line',
        source: this._previewSourceId,
        paint: {
          'line-color': '#2dd4bf',
          'line-width': 2,
        },
      });
    }
  }

  _removePreview() {
    if (this._map.getLayer(this._previewOutlineId)) {
      this._map.removeLayer(this._previewOutlineId);
    }
    if (this._map.getLayer(this._previewLayerId)) {
      this._map.removeLayer(this._previewLayerId);
    }
    if (this._map.getSource(this._previewSourceId)) {
      this._map.removeSource(this._previewSourceId);
    }
  }

  /**
   * Haversine distance in meters between two [lng, lat] points
   */
  _calculateDistance(from, to) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(to[1] - from[1]);
    const dLon = toRad(to[0] - from[0]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from[1])) * Math.cos(toRad(to[1])) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export default CircleControl;
