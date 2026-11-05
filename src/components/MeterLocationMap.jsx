import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { TallerColors, FontFamily, cardShadow } from '@/constants/taller-colors';

/**
 * HTML de Leaflet + OpenStreetMap cargado dentro del WebView.
 *
 * La página nunca se recarga cuando cambian las coordenadas: React Native
 * envía comandos con `injectJavaScript` y la página responde con
 * `window.ReactNativeWebView.postMessage`.
 */
const MAP_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #e2e4e9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-attribution {
      font-size: 9px;
      background: #FFFFFF;
    }
    .meter-pin {
      background: transparent;
      border: none;
    }
    .meter-pin__body {
      position: relative;
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #357ca5;
      border: 3px solid #FFFFFF;
      box-shadow: 0 5px 14px rgba(0, 31, 63, 0.4);
      box-sizing: border-box;
    }
    .meter-pin__dot {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #FFFFFF;
    }
    .map-error {
      position: absolute;
      inset: 0;
      z-index: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #111111;
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      background: #e2e4e9;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var map = null;
      var marker = null;
      var currentMode = 'gps';
      var readOnly = false;
      var currentPosition = null;
      var defaultCenter = [-0.1807, -78.4678];

      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function createPinIcon() {
        return L.divIcon({
          className: 'meter-pin',
          html: '<div class="meter-pin__body"><div class="meter-pin__dot"></div></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });
      }

      function enableDragging(enabled) {
        if (!marker || !marker.dragging) return;
        if (enabled) {
          marker.dragging.enable();
        } else {
          marker.dragging.disable();
        }
      }

      function applyPosition(latitude, longitude, options) {
        var opts = options || {};
        currentPosition = [latitude, longitude];

        if (!map) return;

        if (!marker) {
          marker = L.marker([latitude, longitude], {
            icon: createPinIcon(),
            draggable: true,
          }).addTo(map);

          marker.on('dragend', function () {
            if (readOnly || currentMode !== 'manual') return;
            var point = marker.getLatLng();
            post({
              type: 'location',
              latitude: point.lat,
              longitude: point.lng,
              mode: 'manual',
            });
          });
        } else {
          marker.setLatLng([latitude, longitude]);
        }

        enableDragging(!readOnly && currentMode === 'manual');

        if (opts.center !== false) {
          map.setView([latitude, longitude], opts.zoom || 16, { animate: true });
        }
      }

      function setMode(mode) {
        currentMode = mode;
        enableDragging(!readOnly && mode === 'manual');

        if (mode === 'manual' && currentPosition) {
          applyPosition(currentPosition[0], currentPosition[1], { center: false });
        }
      }

      function setReadOnly(value) {
        readOnly = Boolean(value);
        enableDragging(!readOnly && currentMode === 'manual');

        var zoomControl = document.querySelector('.leaflet-control-zoom');
        if (zoomControl) {
          zoomControl.style.display = readOnly ? 'none' : '';
        }
      }

      window.__meterMapReceive = function (payload) {
        if (!payload || !payload.type) return;

        if (payload.type === 'setPosition') {
          var latitude = Number(payload.latitude);
          var longitude = Number(payload.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

          applyPosition(latitude, longitude, {
            center: payload.center !== false,
            zoom: payload.zoom,
          });
          return;
        }

        if (payload.type === 'setMode') {
          setMode(payload.mode);
          return;
        }

        if (payload.type === 'setReadOnly') {
          setReadOnly(payload.value);
        }
      };

      function showMapError(message) {
        var container = document.getElementById('map');
        if (!container) return;

        var errorBox = document.createElement('div');
        errorBox.className = 'map-error';
        errorBox.textContent = message;
        container.appendChild(errorBox);
      }

      function init() {
        if (typeof L === 'undefined') {
          var message = 'No se pudo cargar Leaflet. Verifica la conexión a internet.';
          showMapError(message);
          post({ type: 'error', message: message });
          return;
        }

        map = L.map('map', {
          zoomControl: false,
          attributionControl: true,
        }).setView(defaultCenter, 13);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        map.on('click', function (event) {
          if (readOnly || currentMode !== 'manual') return;

          applyPosition(event.latlng.lat, event.latlng.lng, { center: false });
          post({
            type: 'location',
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
            mode: 'manual',
          });
        });

        map.whenReady(function () {
          post({ type: 'ready' });
        });
      }

      window.addEventListener('load', init);
    })();
  </script>
</body>
</html>`;

/**
 * Mapa de ubicación reutilizable para el registro y la consulta de lecturas.
 *
 * - `gps`: obtiene la posición del dispositivo con `expo-location`.
 * - `manual`: permite arrastrar el marcador o tocar el mapa.
 * - `readOnly`: muestra solo el marcador estático de una lectura guardada.
 *
 * @param {{
 *   initialPosition?: { latitude: number, longitude: number } | null,
 *   onLocationChange?: (payload: { latitude: number, longitude: number, isManualLocation: boolean }) => void,
 *   readOnly?: boolean,
 *   height?: number,
 *   title?: string,
 * }} props
 */
export default function MeterLocationMap({
  initialPosition = null,
  onLocationChange,
  readOnly = false,
  height = 300,
  title = 'Ubicación del medidor',
}) {
  const webviewRef = useRef(null);
  const mountedRef = useRef(true);
  const gpsRequestedRef = useRef(false);
  const locationCallbackRef = useRef(onLocationChange);
  const positionRef = useRef(initialPosition);
  const modeRef = useRef(readOnly ? 'static' : 'gps');

  const [mode, setMode] = useState(readOnly ? 'static' : 'gps');
  const [position, setPosition] = useState(initialPosition);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    locationCallbackRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sendToMap = useCallback((payload) => {
    if (!webviewRef.current) return;

    const command = `window.__meterMapReceive && window.__meterMapReceive(${JSON.stringify(payload)}); true;`;
    webviewRef.current.injectJavaScript(command);
  }, []);

  const notifyPosition = useCallback((coords, isManualLocation) => {
    locationCallbackRef.current?.({
      latitude: coords.latitude,
      longitude: coords.longitude,
      isManualLocation,
    });
  }, []);

  const locateDevice = useCallback(async () => {
    if (readOnly) return;

    setLocating(true);
    setGpsError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setGpsError('Permiso de ubicación denegado. Activa el GPS o usa el marcador manual.');
        setMode('manual');
        modeRef.current = 'manual';
        sendToMap({ type: 'setMode', mode: 'manual' });
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120000,
        requiredAccuracy: 250,
      });

      let coords = lastKnown?.coords;
      if (!coords) {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = current.coords;
      }

      if (!mountedRef.current) return;

      const nextPosition = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setPosition(nextPosition);
      positionRef.current = nextPosition;
      sendToMap({
        type: 'setPosition',
        latitude: nextPosition.latitude,
        longitude: nextPosition.longitude,
        center: true,
        zoom: 16,
      });
      notifyPosition(nextPosition, false);
    } catch (error) {
      console.warn('[MeterLocationMap] No se pudo obtener la ubicación:', error);
      if (mountedRef.current) {
        setGpsError('No se pudo obtener el GPS. Puedes ajustar la ubicación manualmente.');
      }
    } finally {
      if (mountedRef.current) {
        setLocating(false);
      }
    }
  }, [notifyPosition, readOnly, sendToMap]);

  // Solicita el GPS una sola vez al abrir el mapa, salvo en modo lectura.
  // La posición inicial de una lectura grabada ya llega por `useState`.
  useEffect(() => {
    if (readOnly) return;

    if (!gpsRequestedRef.current) {
      gpsRequestedRef.current = true;
      void locateDevice();
    }
  }, [locateDevice, readOnly]);

  const handleMapMessage = useCallback(
    (event) => {
      let payload;
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (payload?.type === 'ready') {
        sendToMap({ type: 'setReadOnly', value: readOnly });

        const currentPosition = positionRef.current;
        if (currentPosition) {
          sendToMap({
            type: 'setPosition',
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            center: true,
            zoom: 16,
          });
        }

        sendToMap({ type: 'setMode', mode: readOnly ? 'static' : modeRef.current });
        return;
      }

      if (payload?.type === 'location') {
        const latitude = Number(payload.latitude);
        const longitude = Number(payload.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const nextPosition = { latitude, longitude };
        setPosition(nextPosition);
        positionRef.current = nextPosition;
        setMode('manual');
        notifyPosition(nextPosition, true);
        return;
      }

      if (payload?.type === 'error') {
        setMapError(payload.message || 'No se pudo cargar el mapa.');
      }
    },
    [notifyPosition, readOnly, sendToMap]
  );

  const handleModeChange = (nextMode) => {
    if (readOnly || nextMode === mode) return;

    setMode(nextMode);
    modeRef.current = nextMode;
    setGpsError(null);
    sendToMap({ type: 'setMode', mode: nextMode });

    if (nextMode === 'gps') {
      void locateDevice();
      return;
    }

    // Al pasar a manual se conserva la última coordenada conocida.
    const currentPosition = positionRef.current;
    if (currentPosition) {
      notifyPosition(currentPosition, true);
    }
  };

  const isManual = mode === 'manual';
  const hasPosition = Boolean(position);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {readOnly
              ? 'Coordenadas grabadas de la lectura'
              : isManual
                ? 'Arrastra el marcador o toca el mapa'
                : 'Ubicación obtenida automáticamente'}
          </Text>
        </View>

        <View style={[styles.badge, isManual ? styles.badgeManual : styles.badgeGps]}>
          <Ionicons
            name={readOnly ? 'location' : isManual ? 'hand-left' : 'navigate'}
            size={13}
            color={isManual ? TallerColors.textPrimary : TallerColors.brand}
          />
          <Text style={[styles.badgeText, isManual ? styles.badgeTextManual : styles.badgeTextGps]}>
            {readOnly ? 'Guardada' : isManual ? 'Manual' : 'GPS'}
          </Text>
        </View>
      </View>

      {!readOnly ? (
        <View style={styles.toggle} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !isManual }}
            onPress={() => handleModeChange('gps')}
            style={[styles.toggleButton, !isManual && styles.toggleButtonActive]}
          >
            <Ionicons
              name="navigate-outline"
              size={17}
              color={!isManual ? '#FFFFFF' : TallerColors.textSecondary}
            />
            <Text style={[styles.toggleText, !isManual && styles.toggleTextActive]}>
              GPS automático
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isManual }}
            onPress={() => handleModeChange('manual')}
            style={[styles.toggleButton, isManual && styles.toggleButtonActive]}
          >
            <Ionicons
              name="hand-left-outline"
              size={17}
              color={isManual ? '#FFFFFF' : TallerColors.textSecondary}
            />
            <Text style={[styles.toggleText, isManual && styles.toggleTextActive]}>
              Marcador manual
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.mapContainer, { height }]}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: MAP_HTML }}
          onMessage={handleMapMessage}
          onError={() => setMapError('No se pudo cargar el mapa. Revisa tu conexión.')}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          geolocationEnabled={false}
          setSupportMultipleWindows={false}
          style={styles.webview}
        />

        {locating ? (
          <View style={styles.mapOverlay} pointerEvents="none">
            <ActivityIndicator color={TallerColors.brand} size="large" />
            <Text style={styles.mapOverlayText}>Obteniendo ubicación GPS…</Text>
          </View>
        ) : null}

        {mapError ? (
          <View style={styles.mapOverlay} pointerEvents="none">
            <Ionicons name="cloud-offline-outline" size={28} color={TallerColors.danger} />
            <Text style={styles.mapOverlayText}>{mapError}</Text>
          </View>
        ) : null}
      </View>

      {gpsError ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={17} color={TallerColors.danger} />
          <Text style={styles.errorText}>{gpsError}</Text>
        </View>
      ) : null}

      <View style={styles.coordinatesRow}>
        <Ionicons name="pin-outline" size={16} color={TallerColors.textSecondary} />
        <Text style={styles.coordinatesText}>
          {hasPosition
            ? `Lat ${position.latitude.toFixed(6)}  ·  Lng ${position.longitude.toFixed(6)}`
            : 'Aún sin coordenadas seleccionadas'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: TallerColors.surface,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: TallerColors.textPrimary,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeGps: {
    backgroundColor: TallerColors.softBrand,
  },
  badgeManual: {
    backgroundColor: TallerColors.warning,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badgeTextGps: {
    color: TallerColors.textPrimary,
  },
  badgeTextManual: {
    color: TallerColors.textPrimary,
  },
  toggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: TallerColors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 9,
    paddingHorizontal: 8,
  },
  toggleButtonActive: {
    backgroundColor: TallerColors.brand,
  },
  toggleText: {
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.semibold,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: TallerColors.background,
    borderWidth: 1,
    borderColor: TallerColors.border,
  },
  webview: {
    flex: 1,
    backgroundColor: TallerColors.background,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 26,
    backgroundColor: TallerColors.background,
  },
  mapOverlayText: {
    color: TallerColors.textPrimary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    backgroundColor: TallerColors.surface,
    borderRadius: 10,
    padding: 11,
  },
  errorText: {
    flex: 1,
    color: TallerColors.danger,
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
    fontWeight: '600',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: TallerColors.border,
  },
  coordinatesText: {
    flex: 1,
    color: TallerColors.textSecondary,
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
