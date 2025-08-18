import React, { useState } from 'react';

const HealthBarChart = (props) => {
  const { filteredData, onBarClick } = props;
  const [hoveredBar, setHoveredBar] = useState(null); 
  
  if (!filteredData || !Array.isArray(filteredData)) {
    console.error('Invalid chart data format');
    return null; 
  }
  
  const formatData = () => {
    return filteredData.map((item) => ({
      label: item.date, 
      value: item.avgRunFinished, 
      color: item.color, 
      executionIds: item.executionIds, 
    }));
  };
  
  const handleBarClick = (data) => {
    if (onBarClick) {
      onBarClick(data); 
    }
  };
  
  const chartData = formatData();
  
  const barWidth = `calc((100% - ${(chartData.length - 1) * 5}px) / ${chartData.length})`;
  const barGap = '5px';
  
  return (
    <div style={{ 
      height: '5rem', 
      width: '100%', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center', // Center the content vertically
      justifyContent: 'center', // Center the content horizontally
      padding: '0.5rem 0' // Add some padding for spacing
    }}>
      {/* Chart Container */}
      <div style={{ 
        display: 'flex',
        height: '80%', // Take up 80% of the parent height
        width: '100%',
        alignItems: 'center', // Center the bars vertically
        gap: barGap,
      }}>
        {chartData.map((item, index) => (
          <div
            key={index}
            style={{
              width: barWidth,
              height: '70%', // 70% of the container height
              backgroundColor: item.color,
              cursor: 'pointer',
              borderRadius: '2px',
            }}
            onMouseEnter={() => setHoveredBar(item)}
            onMouseLeave={() => setHoveredBar(null)}
            onClick={() => handleBarClick(item)}
          />
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredBar && (
        <div
          style={{
            position: 'absolute',
            top: '-3rem', // Position above the chart
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333333',
            color: '#ffffff',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        >
          <div>Date: {hoveredBar.label}</div>
          <div>Uptime: {hoveredBar.value}%</div>
          <div>Executions: {hoveredBar.executionIds.length}</div>
        </div>
      )}
    </div>
  );
};

export default HealthBarChart;
