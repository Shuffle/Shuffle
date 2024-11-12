import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const HealthBarChart = (props) => {
    const { globalUrl, filteredData, options, onBarClick  } = props;

    return (
        <Bar
            data={filteredData}
            options={options}
            height="35.5rem"
            width={filteredData.width}
            getElementAtEvent={(elements) => {
                if (elements && elements.length > 0) {
                    onBarClick(elements);
                }
            }}
        />
    );
};

export default HealthBarChart;
