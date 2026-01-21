interface ControlPanelProps {
  tas: number;
  windDirection: number;
  windSpeed: number;
  magneticDeclination: number;
  onTasChange: (value: number) => void;
  onWindDirectionChange: (value: number) => void;
  onWindSpeedChange: (value: number) => void;
  onMagneticDeclinationChange: (value: number) => void;
  onClearRoute: () => void;
  onReverseRoute: () => void;
  pointsCount: number;
}

export default function ControlPanel({
  tas,
  windDirection,
  windSpeed,
  magneticDeclination,
  onTasChange,
  onWindDirectionChange,
  onWindSpeedChange,
  onMagneticDeclinationChange,
  onClearRoute,
  onReverseRoute,
  pointsCount,
}: ControlPanelProps) {
  return (
    <div className="space-y-5">

      {/* TAS */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          TAS: {tas} kt
        </label>
        <input
          type="range"
          min="50"
          max="200"
          value={tas}
          onChange={(e) => onTasChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Wind Direction */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Wind Direction: {windDirection}°
        </label>
        <input
          type="range"
          min="0"
          max="359"
          value={windDirection}
          onChange={(e) => onWindDirectionChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Wind Speed */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Wind Speed: {windSpeed} kt
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={windSpeed}
          onChange={(e) => onWindSpeedChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Magnetic Declination */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Mag. Declination: {magneticDeclination}°
        </label>
        <input
          type="range"
          min="-30"
          max="30"
          value={magneticDeclination}
          onChange={(e) => onMagneticDeclinationChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Buttons: Clear & Reverse side-by-side */}
      <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
        <button
          onClick={onClearRoute}
          disabled={pointsCount === 0}
          className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={onReverseRoute}
          disabled={pointsCount < 2}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Reverse
        </button>
      </div>
    </div>
  );
}