import { useState, useEffect, useCallback, useRef } from 'react';
import FlightMap from './components/FlightMap';
import ControlPanel from './components/ControlPanel';
import NavLogTable from './components/NavLogTable';
import { createFlightPlan } from './api';
import type { PointInput, FlightPlanResponse, PointOutput } from './types';

function loadState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function App() {
  const [points, setPoints] = useState<PointInput[]>(() => loadState('fp_points', []));
  const [tas, setTas] = useState(() => loadState('fp_tas', 100));
  const [windDirection, setWindDirection] = useState(() => loadState('fp_windDir', 0));
  const [windSpeed, setWindSpeed] = useState(() => loadState('fp_windSpd', 0));
  const [magneticDeclination, setMagneticDeclination] = useState(() => loadState('fp_magDec', 6));

  const [flightPlan, setFlightPlan] = useState<FlightPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(() => loadState('fp_sidebarWidth', 520));

  const isResizing = useRef(false);

  useEffect(() => {
    localStorage.setItem('fp_points', JSON.stringify(points));
    localStorage.setItem('fp_tas', JSON.stringify(tas));
    localStorage.setItem('fp_windDir', JSON.stringify(windDirection));
    localStorage.setItem('fp_windSpd', JSON.stringify(windSpeed));
    localStorage.setItem('fp_magDec', JSON.stringify(magneticDeclination));
    localStorage.setItem('fp_sidebarWidth', JSON.stringify(sidebarWidth));
  }, [points, tas, windDirection, windSpeed, magneticDeclination, sidebarWidth]);

  const handleAddPoint = useCallback((point: PointInput) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const handleNavLogPointClick = useCallback((point: PointOutput) => {
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      const lastPoint = prev[prev.length - 1];
      const isLast = Math.abs(point.lat - lastPoint.lat) < 0.000001 &&
        Math.abs(point.lon - lastPoint.lon) < 0.000001;
      if (isLast) return prev;
      return [...prev, {
        lat: point.lat,
        lon: point.lon,
        ident: point.ident
      }];
    });
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRequestClear = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClearRoute = useCallback(() => {
    setPoints([]);
    setFlightPlan(null);
    setError(null);
    setShowClearConfirm(false);
  }, []);

  const handleReverseRoute = useCallback(() => {
    setPoints((prev) => [...prev].reverse());
  }, []);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.max(300, Math.min(e.clientX, 520));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (points.length < 2) {
      setFlightPlan(null);
      setError(null);
      return;
    }
    if (windSpeed >= tas) {
      setError('Wind speed cannot be greater than or equal to TAS');
      setFlightPlan(null);
      return;
    }

    const fetchFlightPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await createFlightPlan({
          route_points: points,
          aircraft: { tas },
          wind: {
            direction: windDirection,
            speed: windSpeed,
          },
          magnetic_declination: magneticDeclination,
        });
        setFlightPlan(response);
      } catch (err) {
        console.error('API error:', err);
        setError('Connection error');
        setFlightPlan(null);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchFlightPlan, 300);
    return () => clearTimeout(timeoutId);
  }, [points, tas, windDirection, windSpeed, magneticDeclination]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden relative">
      {/* Top Bar */}
      <header className="h-[60px] bg-gray-800 flex items-center justify-between px-6 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg tracking-wide">Flight Planner v1.0.0</h1>
        </div>
        <div className="flex items-center">
          <a
            href="https://github.com/your-username/repo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            GitHub
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT SIDEBAR */}
        <div
          className="bg-white flex flex-col shrink-0 z-10 shadow-lg"
          style={{ width: sidebarWidth }}
        >
          {/* 1. Parameters Section */}
          <div className="shrink-0 border-b border-gray-200">
            <div className="h-12 px-6 flex items-center border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Parameters</h2>
            </div>
            <div className="px-6 py-6">
              <ControlPanel
                tas={tas}
                windDirection={windDirection}
                windSpeed={windSpeed}
                magneticDeclination={magneticDeclination}
                onTasChange={setTas}
                onWindDirectionChange={setWindDirection}
                onWindSpeedChange={setWindSpeed}
                onMagneticDeclinationChange={setMagneticDeclination}
                onClearRoute={handleRequestClear}
                onReverseRoute={handleReverseRoute}
                pointsCount={points.length}
              />
            </div>
          </div>

          {/* 2. Navigation Log Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="h-12 px-6 shrink-0 flex items-center border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-bold text-gray-800">Navigation Log</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loading && (
                <div className="text-center text-gray-500 py-4">Calculating...</div>
              )}
              {error && (
                <div className="text-center text-red-500 py-4 text-sm">{error}</div>
              )}
              {!loading && !error && (
                <NavLogTable
                  navLog={flightPlan?.nav_log || null}
                  onPointClick={handleNavLogPointClick}
                  onRemovePoint={handleRemovePoint}
                />
              )}
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-gray-300 hover:bg-blue-400 cursor-ew-resize shrink-0 z-20 transition-colors"
        />

        {/* RIGHT SIDE - Map */}
        <div className="flex-1 relative z-0 min-w-0">
          <FlightMap
            points={points}
            navLogRows={flightPlan?.nav_log.rows || []}
            onAddPoint={handleAddPoint}
            onRemovePoint={handleRemovePoint}
          />
        </div>
      </div>

      {/* Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setShowClearConfirm(false)} />
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-80 relative z-10">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Clear Route?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to clear the entire route?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
              >
                No
              </button>
              <button
                onClick={confirmClearRoute}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;