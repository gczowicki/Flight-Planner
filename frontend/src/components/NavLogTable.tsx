import type { NavLogOutput, PointOutput } from '../types';

interface NavLogTableProps {
  navLog: NavLogOutput | null;
  onPointClick: (point: PointOutput) => void;
  onRemovePoint: (index: number) => void;
}

export default function NavLogTable({ navLog, onPointClick, onRemovePoint }: NavLogTableProps) {
  if (!navLog || navLog.rows.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Add at least 2 points on the map</p>
        <p className="text-sm">to see the Navigation Log</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <table className="min-w-[450px] text-xs border-collapse border border-gray-300 table-fixed">
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-2 text-center font-bold text-gray-700 border border-gray-300">FROM</th>
            <th className="px-2 py-2 text-center font-bold text-gray-700 border border-gray-300">TO</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">TC [°]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">WCA [°]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">TH [°]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-900 bg-gray-200 border border-gray-300">MH [°]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">DIST [NM]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">GS [KT]</th>
            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">TIME [MIN]</th>
          </tr>
        </thead>
        <tbody>
          {navLog.rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td
                onClick={() => onPointClick(row.leg.start_point)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemovePoint(index);
                }}
                className="px-2 py-2 text-gray-800 border border-gray-300 text-center font-medium cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                title="Left-click: Add as next point | Right-click: Remove this point"
              >
                {row.leg.start_point.ident || `WP${index + 1}`}
              </td>

              <td
                onClick={() => onPointClick(row.leg.end_point)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemovePoint(index + 1);
                }}
                className="px-2 py-2 text-gray-800 border border-gray-300 text-center font-medium cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                title="Left-click: Add as next point | Right-click: Remove this point"
              >
                {row.leg.end_point.ident || `WP${index + 2}`}
              </td>

              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.leg.true_course}</td>
              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.wca > 0 ? '+' : ''}{row.wca}</td>
              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.true_heading}</td>
              <td className="px-2 py-2 text-right text-gray-800 bg-gray-100 border border-gray-300">
                {row.magnetic_heading}
              </td>
              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.leg.distance_nm}</td>
              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.ground_speed}</td>
              <td className="px-2 py-2 text-right text-gray-600 border border-gray-300">{row.time_min}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td colSpan={2} className="px-2 py-2 text-gray-800 border border-gray-300 text-center font-bold">TOTAL</td>
            <td className="px-2 py-2 border border-gray-300"></td>
            <td className="px-2 py-2 border border-gray-300"></td>
            <td className="px-2 py-2 border border-gray-300"></td>
            <td className="px-2 py-2 border border-gray-300"></td>
            <td className="px-2 py-2 text-right text-gray-800 border border-gray-300 font-bold">{navLog.total_distance_nm}</td>
            <td className="px-2 py-2 border border-gray-300"></td>
            <td className="px-2 py-2 text-right text-gray-800 border border-gray-300 font-bold">{navLog.total_time_min}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}