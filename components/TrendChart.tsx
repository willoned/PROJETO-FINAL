import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
  color: string;
}

const TrendChart: React.FC<Props> = ({ data, color }) => {
  // Memoize data to prevent chart internal calculations if data hasn't changed
  const chartData = useMemo(() => {
    return data.map((d, i) => ({ ...d, index: i }));
  }, [data]);

  return (
    <div className="h-24 w-full mt-4 opacity-80 hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          {/* Min/Max scaling allows the chart to look dynamic even with small variations */}
          <YAxis hide domain={['auto', 'auto']} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            isAnimationActive={false} // Disable animation for performance in high-frequency updates
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// React.memo is crucial here. Recharts is expensive.
export default React.memo(TrendChart);
