import React, { useMemo } from 'react';
import { BarChart as RechartsBarChart, Bar, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
  color: string;
}

const BarChart: React.FC<Props> = ({ data, color }) => {
  // Memoize data to prevent chart internal calculations if data hasn't changed
  const chartData = useMemo(() => {
    return data.map((d, i) => ({ ...d, index: i }));
  }, [data]);

  return (
    <div className="h-24 w-full mt-4 opacity-90 hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={chartData}>
          <YAxis hide domain={['auto', 'auto']} />
          <Bar 
            dataKey="value" 
            fill={color} 
            radius={[2, 2, 0, 0]}
            isAnimationActive={false} // Disable animation for performance in high-frequency updates
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(BarChart);