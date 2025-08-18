import React, { useEffect, useState, useCallback } from 'react';
import { toast } from "react-toastify";
import {
    CheckOutlined as CheckOutlinedIcon,
} from '@mui/icons-material';

import {
    Button,
    ButtonGroup,
    Typography,
    LinearProgress,
} from "@mui/material";

import HealthBarChart from '../components/HealthBarChart.jsx';
import LiveExecutionsChart from '../components/LiveExecutionsGraph.jsx';

const HealthPage = (props) => {
    const { userdata, globalUrl } = props;
    const [healthData, setHealthData] = useState(null);
    const [selectedRange, setSelectedRange] = useState('30d');
    const [liveExecutionsData, setLiveExecutionsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [averageUptime, setAverageUptime] = useState(0);
    const [liveExecutionsRange, setLiveExecutionsRange] = useState('1h'); // Default to 1h
    const [isHealthLoading, setIsHealthLoading] = useState(false); // Loading state for HealthBarChart
    const [isLiveExecutionsLoading, setIsLiveExecutionsLoading] = useState(false); // Loading state for LiveExecutionsChart

    const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");

    const fetchHealthStats = useCallback(async () => {
        setIsHealthLoading(true); // Start loading for HealthBarChart
        try {
            const response = await fetch(`${globalUrl}/api/v1/health/stats`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch health stats");
            }
            const data = await response.json();
            setHealthData(data);
        } catch (error) {
            console.error("Error fetching health stats:", error);
            toast.error("Failed loading health stats");
        } finally {
            setIsHealthLoading(false); // Stop loading for HealthBarChart
        }
    }, [globalUrl]);

    const fetchLiveExecutions = useCallback(async (range = '1h') => {
        setIsLiveExecutionsLoading(true); // Start loading for LiveExecutionsChart
        try {
            const fetchOptions = {
                method: "GET",
                credentials: "include",
            };

            if (window.location.host !== "localhost:3002") {
                fetchOptions.headers = {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                };
            }

            const now = Math.floor(Date.now() / 1000);
            // let after = now - 3600; // Default to 1h
            let mode = ""

            switch (range) {
                case '1h':
                    mode = "1h"
                    break;
                case '7h':
                    mode = "7h"
                    break;
                case '1d':
                    mode = "1d"
                    break;
                case '7d':
                    mode = "7d"
                    break;
                case 'month':
                    mode = "month"
                    break;
                default:
                    mode = "1h"
            }

            if (!userdata.support_access) {
                return
            }

            const response = await fetch(
                `${globalUrl}/api/v1/health/executions/live?mode=${mode}`,
                fetchOptions
            );

            if (!response.ok) {
                throw new Error("Failed to fetch live executions");
            }

            const data = await response.json();
            console.log("Raw live executions data:", data);

            if (Array.isArray(data)) {
                const formattedData = data
                    .map(item => ({
                        ...item,
                        // failed: Number(item.failed) || 0,
                        executing: Number(item.executing) || 0,
                        finished: Number(item.finished) || 0,
                        aborted: Number(item.aborted) || 0,
                        created_at: Number(item.created_at) || 0
                    }))
                    .sort((a, b) => a.created_at - b.created_at);

                console.log("Formatted live executions data:", formattedData);
                setLiveExecutionsData(formattedData);
            } else {
                console.error("Received invalid data format:", data);
                setLiveExecutionsData([]);
            }
        } catch (error) {
            console.error("Error fetching live executions:", error);
            toast.error("Failed loading live executions data");
        } finally {
            setIsLiveExecutionsLoading(false); // Stop loading for LiveExecutionsChart
        }
    }, [globalUrl]);

    useEffect(() => {
        fetchHealthStats();
        fetchLiveExecutions(liveExecutionsRange);

        const interval = setInterval(() => fetchLiveExecutions(liveExecutionsRange), 60000);
        return () => clearInterval(interval);
    }, [fetchHealthStats, fetchLiveExecutions, liveExecutionsRange]);

    const extractRunFinished = (data, range) => {
        if (!data || !Array.isArray(data)) return [];

        const currentDate = new Date().getTime();
        const rangeInMillis = {
            '24hr': 24 * 60 * 60 * 1000,
            '7day': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        const filteredData = data.filter(item => currentDate - item.updated * 1000 <= rangeInMillis[range]);

        const aggregatedData = new Map();

        filteredData.forEach(item => {
            const timestamp = item.updated * 1000; // Convert Unix timestamp to milliseconds
            let key;

            switch (range) {
                case '24hr':
                    const date = new Date(timestamp);
                    const hour = date.getHours();
                    const formattedDate = `${date.toLocaleDateString()} ${hour}:00`;
                    key = formattedDate;
                    break;
                case '7day':
                    const date1 = new Date(timestamp);
                    const hour1 = date1.getHours();
                    const formattedDate1 = `${date1.toLocaleDateString()} ${hour1}:00`;
                    key = formattedDate1;
                    break;
                default:
                    key = new Date(timestamp).toLocaleDateString();
            }

            // Check if date already exists in the map
            if (aggregatedData.has(key)) {
                // Update aggregated values
                const existingData = aggregatedData.get(key);
                existingData.totalEntries++;
                existingData.totalRunFinished += item.workflows.run_finished ? 1 : 0;
                existingData.executionIds.push(item.workflows.execution_id);
            } else {
                // Add new entry to the map
                aggregatedData.set(key, {
                    totalEntries: 1,
                    totalRunFinished: item.workflows.run_finished ? 1 : 0,
                    executionIds: [item.workflows.execution_id]
                });
            }
        });

        // Calculate averages and assign colors
        const result = Array.from(aggregatedData.entries()).map(([key, { totalEntries, totalRunFinished, executionIds }]) => {
            const avg = totalEntries > 0 ? totalRunFinished / totalEntries : 0;
            const FinalAvg = avg * 100;
            let color;

            if (FinalAvg >= 100) {
                color = '#00F670';
            } else if (FinalAvg >= 98.50 && FinalAvg <= 99.99) {
                color = '#FFD700';
            } else if (FinalAvg <= 98.49) {
                color = '#FF354C';
            }

            return {
                date: range === '24hr' ? `${key}:00` : key,
                avgRunFinished: FinalAvg,
                color,
                executionIds
            };
        });

        return result;
    };

    useEffect(() => {
        if (healthData) {
            const newData = extractRunFinished(healthData, selectedRange);
            setFilteredData(newData);

            const totalUptime = newData.reduce((acc, curr) => acc + curr.avgRunFinished, 0);
            const avgUptime = totalUptime / newData.length;
            setAverageUptime(avgUptime);
        }
    }, [selectedRange, healthData]);

    const filterDataByRange = (range) => {
        setSelectedRange(range);
    };

    const updateChartData = () => {
        if (!filteredData) {
            return {
                labels: [],
                datasets: [{
                    label: "",
                    data: [],
                    backgroundColor: [],
                    borderWidth: 1,
                    barThickness: 7, // Default bar thickness
                }],
            };
        }
        let barThickness = 7;

        const labels = filteredData.map((value, i) => {
            if (selectedRange === '24hr') {
                const [datePart, hourPart] = value.date.split(' ');
                const [month, day, year] = datePart.split('/');
                const monthIndex = parseInt(month, 10) - 1;
                const date = new Date(year, monthIndex, day);
                let formattedDate = `${date.toLocaleString('en-US', { month: 'short', day: '2-digit' })}`;
                // Add hour part if available
                if (hourPart) {
                    formattedDate += `, ${hourPart.split(':').slice(0, 2).join(':')}`;
                }

                return `${formattedDate} \nUptime: ${value.avgRunFinished.toFixed(2)}%`;
            } else if (selectedRange === '7day') {
                const [datePart, hourPart] = value.date.split(' ');
                const [month, day, year] = datePart.split('/');
                const monthIndex = parseInt(month, 10) - 1;
                const date = new Date(year, monthIndex, day);
                let formattedDate = `${date.toLocaleString('en-US', { month: 'short', day: '2-digit' })}`;

                // Add hour part if available
                if (hourPart) {
                    formattedDate += `, ${hourPart.split(':').slice(0, 2).join(':')}`;
                }
                return `${formattedDate} \nUptime: ${value.avgRunFinished.toFixed(2)}%`;
            }
            else {
                const dateParts = value.date.split('/'); // Assuming the date format is "DD/MM/YYYY"
                const date = new Date(`${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`); // Reformat the date string to "YYYY-MM-DD"

                return `${date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} \nUptime: ${value.avgRunFinished.toFixed(2)}%`;
            }
        });

        if (selectedRange === '24hr') {
            barThickness = 35;
        }
        else if (selectedRange === '7day') {
            barThickness = 5;
        }
        else if (selectedRange === '30d') {
            barThickness = 25;
        }

        const datasets = [{
            label: "",
            data: filteredData.map(item => 1),
            backgroundColor: filteredData.map(item => item.color),
            borderWidth: 1,
            barThickness: barThickness,
        }];

        return { labels, datasets };
    };

    const options = {
        legend: {
            display: false
        },
        layout: {
            padding: {
                top: 0, // Adjust the top padding as needed
                bottom: 20, // Adjust the bottom padding as needed
                left: 20, // Adjust the left padding as needed
                right: 20 // Adjust the right padding as needed
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    display: false
                }
            }],
            xAxes: [{
                ticks: {
                    display: false
                }
            }]
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    const label = data.labels[tooltipItem.index];
                    return label.split('\n')[0]; // Return only the date part
                },
                afterLabel: function (tooltipItem, data) {
                    const label = data.labels[tooltipItem.index];
                    const uptime = label.match(/Uptime:\s*(\d+(?:\.\d+)?)/)[1]; // Extract uptime value using regex
                    return `Test-Workflow Health: ${uptime}%`; // Customize the uptime display
                },
                title: function () {
                    return 'Fully Operational'; // Hide the tooltip title
                }
            }
        }
    };

    const handleBarClick = (event, elements) => {
        if (event && event.length > 0) {
            const clickedIndex = event[0]._index
            const clickedData = filteredData[clickedIndex]
            const executionIds = clickedData.executionIds
                .filter(executionId => {
                    const item = healthData.find(dataItem => dataItem.workflows.execution_id === executionId);
                    return item && item.workflows.run_finished === false;
                });

            // console.log("Filtered Execution IDs:", executionIds);
            if (executionIds.length > 0) {
                const url = `${globalUrl}/api/v1/health/stats?execution_id=${executionIds.join(',')}`;
                window.open(url, '_blank');
            } else {
                toast.success("All executions in selected period succeeded");
            }
        }
    };

	  const healthBarData = updateChartData()


    return (
        <div style={{ paddingTop: 30, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Health Bar Chart Section */}
            <ButtonGroup style={{ display: 'flex', margin: "auto", marginBottom: 10, width: 300, borderRadius: 30, background: "#000000" }}>
                <Button variant="contained" style={{ flex: 1, borderBottom: selectedRange === '24hr' ? '2px solid #FF8444' : 'none', background: "#000000", color: selectedRange === '24hr' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => filterDataByRange('24hr')} disabled={isHealthLoading}>24h</Button>
                <Button variant="contained" style={{ flex: 1, borderBottom: selectedRange === '7day' ? '2px solid #FF8444' : 'none', background: "#000000", color: selectedRange === '7day' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => filterDataByRange('7day')} disabled={isHealthLoading}>7d</Button>
                <Button variant="contained" style={{ flex: 1, borderBottom: selectedRange === '30d' ? '2px solid #FF8444' : 'none', background: "#000000", color: selectedRange === '30d' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => filterDataByRange('30d')} disabled={isHealthLoading}>30d</Button>
                <Button disabled variant="contained" style={{ flex: 1, borderBottom: selectedRange === '90d' ? '2px solid #FF8444' : 'none', background: "#000000", color: false === false ? "grey" : selectedRange === '90d' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => filterDataByRange('90d')} disabled={isHealthLoading}>90d</Button>
                <Button disabled variant="contained" style={{ flex: 1, borderBottom: selectedRange === '180d' ? '2px solid #FF8444' : 'none', background: "#000000", color: false === false ? "grey" : selectedRange === '180d' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => filterDataByRange('180d')} disabled={isHealthLoading}>180d</Button>
            </ButtonGroup>

            {/* Loading Bar for HealthBarChart */}
            {isHealthLoading && (
                <LinearProgress style={{ width: '100%', marginBottom: 10 }} />
            )}

            <div style={{ margin: '0 auto', padding: 10, width: 800, backgroundColor: '#000000', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckOutlinedIcon style={{ borderRadius: 20, fontSize: 24, backgroundColor: '#00e600', marginRight: 10 }} />
                        <div>
                            <Typography style={{ color: '#ffffff', fontSize: 16 }}>Workflow Health</Typography>
                            <Typography style={{ color: '#00FF00', fontSize: 12, fontWeight: 100 }}>Operational</Typography>
                        </div>
                    </div>
                    <div>
                        <Typography style={{ color: '#ffffff', fontSize: 16, textAlign: 'end' }}>{averageUptime.toFixed(2)}%</Typography>
                        <Typography style={{ color: '#ffffff', fontSize: 12, fontWeight: 100 }}>Success Rate</Typography>
                    </div>
                </div>
                <HealthBarChart
                    filteredData={filteredData}
                    onBarClick={handleBarClick}
                />
            </div>

            {userdata.support_access && (
                <div style={{ margin: '20px auto', padding: 20, width: 1000, justifyContent: "center", color: '#ffffff', backgroundColor: '#000000', fontSize: '16px', borderRadius: '16px' }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                        <Typography variant="h6" style={{ marginLeft: 10 }}>Live Executions</Typography>
                        <ButtonGroup style={{ marginLeft: 'auto', borderRadius: 30, background: "#000000" }}>
                            <Button
                                variant="contained"
                                style={{
                                    flex: 1,
                                    borderBottom: liveExecutionsRange === '1h' ? '2px solid #FF8444' : 'none',
                                    background: "#000000",
                                    color: liveExecutionsRange === '1h' ? '#FF8444' : '#cfd8dc',
                                    textTransform: 'none'
                                }}
                                onClick={() => setLiveExecutionsRange('1h')}
                                disabled={isLiveExecutionsLoading}
                            >
                                1h
                            </Button>
                            <Button
                                variant="contained"
                                style={{
                                    flex: 1,
                                    borderBottom: liveExecutionsRange === '7h' ? '2px solid #FF8444' : 'none',
                                    background: "#000000",
                                    color: liveExecutionsRange === '7h' ? '#FF8444' : '#cfd8dc',
                                    textTransform: 'none'
                                }}
                                onClick={() => setLiveExecutionsRange('7h')}
                                disabled={isLiveExecutionsLoading}
                            >
                                7h
                            </Button>
                            <Button
                                variant="contained"
                                style={{
                                    flex: 1,
                                    borderBottom: liveExecutionsRange === '1d' ? '2px solid #FF8444' : 'none',
                                    background: "#000000",
                                    color: liveExecutionsRange === '1d' ? '#FF8444' : '#cfd8dc',
                                    textTransform: 'none'
                                }}
                                onClick={() => setLiveExecutionsRange('1d')}
                                disabled={isLiveExecutionsLoading}
                            >
                                1d
                            </Button>
                            <Button
                                variant="contained"
                                style={{
                                    flex: 1,
                                    borderBottom: liveExecutionsRange === '7d' ? '2px solid #FF8444' : 'none',
                                    background: "#000000",
                                    color: liveExecutionsRange === '7d' ? '#FF8444' : '#cfd8dc',
                                    textTransform: 'none'
                                }}
                                onClick={() => setLiveExecutionsRange('7d')}
                                disabled={isLiveExecutionsLoading}
                            >
                                7d
                            </Button>
                            {/* <Button variant="contained" style={{ flex: 1, borderBottom: liveExecutionsRange === 'month' ? '2px solid #FF8444' : 'none', background: "#000000", color: liveExecutionsRange === 'month' ? '#FF8444' : '#cfd8dc', textTransform: 'none' }} onClick={() => setLiveExecutionsRange('month')} disabled={isLiveExecutionsLoading}>Month</Button> */}
                        </ButtonGroup>
                    </div>
                    {/* Loading Bar for LiveExecutionsChart */}
                    {isLiveExecutionsLoading && (
                        <LinearProgress style={{ width: '100%', marginBottom: 10 }} />
                    )}
                    <LiveExecutionsChart data={liveExecutionsData} />
                </div>
            )}


        </div>
    );
};

export default HealthPage;
