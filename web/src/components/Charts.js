// Simple Bar Chart Component (no external dependencies)
export function SimpleBarChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="text-xs font-semibold text-gray-700">
              {typeof item.value === 'number' && item.value > 999 
                ? `₹${(item.value / 1000).toFixed(1)}k`
                : item.value
              }
            </div>
            <div 
              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-700 hover:to-green-500 transition-colors cursor-pointer"
              style={{ height: `${barHeight}px`, minHeight: '20px' }}
              title={`${item.label}: ${item.value}`}
            ></div>
            <div className="text-xs text-gray-600 text-center break-words w-full">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Line Chart Component
export function SimpleLineChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((item, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height: height - 30 }}>
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
        
        {/* Gradient fill */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
          className="drop-shadow-md"
        />
        
        {/* Data points */}
        {data.map((item, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 100;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#16a34a" stroke="white" strokeWidth="1.5">
              <title>{item.label}: ₹{item.value}</title>
            </circle>
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2">
        {data.map((item, i) => (
          <div key={i} className="text-xs text-gray-600 text-center" style={{ width: `${100 / data.length}%` }}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut Chart Component
export function DonutChart({ data, centerText }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;
  
  const colors = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
  
  const segments = data.map((item, i) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      ...item,
      color: colors[i % colors.length],
      path: `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`,
      percentage: percentage.toFixed(1)
    };
  });
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, i) => (
            <path
              key={i}
              d={segment.path}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{segment.label}: {segment.percentage}%</title>
            </path>
          ))}
          <circle cx="50" cy="50" r="25" fill="white" />
          <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-xs font-bold fill-gray-700">
            {centerText}
          </text>
        </svg>
      </div>
      
      <div className="space-y-2">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: segment.color }}></div>
            <span className="text-sm text-gray-700">{segment.label}</span>
            <span className="text-sm font-semibold text-gray-900">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
