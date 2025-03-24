// import React, { useEffect, useState } from 'react';
// import Switch from '@mui/material/Switch';
// import { Typography, Button } from '@mui/material';
// import { useNavigate, Link, useParams } from "react-router-dom";
// import { Bar } from 'react-chartjs-2';
// import Grid from '@mui/material/Grid';
// import SearchIcon from '@mui/icons-material/Search';
// import NewReleasesIcon from '@mui/icons-material/NewReleases';
// import MailOutlineIcon from '@mui/icons-material/MailOutline';

const AnalyticsTab = (props) => {
    const { userdata, globalUrl, serverside } = props;

    console.log("if you need this, work without react-rechartjs-2")

    // const [checked, setChecked] = useState(false);
    // const [selectedOption, setSelectedOption] = useState('all');
    // const [expand, setExpand] = useState(false)
    // const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
    
    // const handleOptionChange = (option) => {
    //     setSelectedOption(option);
    //     // You can perform actions based on the selected option, such as filtering data
    // };

    // const handleChange = (event) => {
    //     setChecked(event.target.checked);
    // };

    // const allData = {
    //     labels: ['Email analysis', 'Email Management', 'EDR to Ticket', 'Ticket Analysis'],
    //     datasets: [
    //         {
    //             label: 'Revisions',
    //             data: [12, 19, 3, 5], // Data for revisions
    //             backgroundColor: '#FF8444',
    //             borderWidth: 1,
    //             // borderRadius: 60,
    //             barPercentage: 0.7,
    //             categoryPercentage: 0.5,
    //         },
    //         {
    //             label: 'Runs',
    //             data: [8, 15, 5, 8], // Data for runs
    //             backgroundColor: '#9747FF',
    //             borderWidth: 1,
    //             // borderRadius: 60,
    //             barPercentage: 0.7,
    //             categoryPercentage: 0.5
    //         }
    //     ]
    // };

    // let data;
    // if (selectedOption === 'all') {
    //     data = allData;
    // } else if (selectedOption === 'revisions') {
    //     data = {
    //         labels: allData.labels,
    //         datasets: [allData.datasets[0]] // Show only revisions data
    //     };
    // } else if (selectedOption === 'run') {
    //     data = {
    //         labels: allData.labels,
    //         datasets: [allData.datasets[1]] // Show only runs data
    //     };
    // }

    // // Options for the chart
    // const options = {
    //     scales: {
    //         yAxes: [
    //             {
    //                 ticks: {
    //                     beginAtZero: true
    //                 }
    //             }
    //         ]
    //     },
    // };
    // return (
    //     <div style={{ width: 1030, marginLeft: 20, marginTop:10, paddingRight: 17, paddingLeft: 17}}>
    //         <div style={{ width: 985, display: 'flex', alignItems: 'start', paddingTop: 16, paddingBottom: '48px', fontSize: '16px', color: '#ffffff', backgroundColor: '#1A1A1A', borderRadius: '16px', }}>
    //             <div style={{ marginLeft: 18 }}>Timeline</div>
    //         </div>
    //         <div style={{ display: "flex", width: "100%", marginTop: 16 }}>
    //             <div>
    //                 <div style={{ width: 595, alignItems: 'start', paddingTop: 16, paddingBottom: checked ? 28 : 20, marginRight: 20, fontSize: '16px', color: '#ffffff', backgroundColor: '#1A1A1A', borderRadius: '16px', }}>
    //                     <div style={{ display: "flex", alignItems: "center" }}>
    //                         <div style={{ marginLeft: 18, marginRight: 310 }}>Apps</div>
    //                         <Switch checked={checked}
    //                             onChange={handleChange} /> Category
    //                         <div style={{ marginLeft: 16, borderLeft: "1px solid #D9D9D9", width: 10, height: 15 }} />
    //                         <Link onClick={() => { setExpand(prevExpand => !prevExpand); }} style={{ color: "#FF8444" }}>Expand</Link>
    //                     </div>
    //                     {expand ? null :
    //                         <div style={{ marginTop: 8, display: "flex" }}>
    //                             <div style={{ marginLeft: 19, }}>
    //                                 <Typography style={{ fontSize: 13, color: "#9E9E9E", textAlign: "start" }}>Onboarding</Typography>
    //                                 <Grid container spacing={2} style={{ marginTop: 1 }} >
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 0.5s ease',
    //                                                 }}><SearchIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 0.5s ease',
    //                                                 }}><MailOutlineIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 0.5s ease',
    //                                                 }}><NewReleasesIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                 </Grid>
    //                             </div>
    //                             <div style={{ borderLeft: "1px solid #494949", justifyContent: "center", alignItems: "center", marginTop: 40, marginLeft: 20, marginRight: 20, height: 40 }}></div>
    //                             <div style={{}}>
    //                                 <Typography style={{ fontSize: 13, color: "#9E9E9E", textAlign: "start" }}>Other</Typography>
    //                                 <Grid container spacing={2} style={{ marginTop: 1 }} >
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 0.5s ease',
    //                                                 }}><SearchIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 10s ease-in-out',
    //                                                 }}><NewReleasesIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                     <Grid item xs={4}>
    //                                         <div style={{ position: 'relative' }}>
    //                                             <img src="/images/adminpage/app1.svg" style={{ margin: 'auto' }} />
    //                                             {checked ?
    //                                                 <div style={{
    //                                                     position: 'absolute',
    //                                                     bottom: 0,
    //                                                     left: '50%',
    //                                                     top: 30,
    //                                                     transform: 'translateX(-50%)',
    //                                                     backgroundColor: '#2f2f2f',
    //                                                     borderRadius: '50%',
    //                                                     height: 24,
    //                                                     width: 24,
    //                                                     transition: 'transform 10s ease-in-out',
    //                                                 }}><MailOutlineIcon style={{ width: 16, height: 16, marginTop: 5 }} /></div> :
    //                                                 null
    //                                             }
    //                                         </div>
    //                                     </Grid>
    //                                 </Grid>
    //                             </div>
    //                         </div>}
    //                 </div>
    //                 <div style={{ width: 595, height: 322, marginTop: 16, paddingTop: 16, paddingBottom: '48px', fontSize: '16px', color: '#ffffff', backgroundColor: '#1A1A1A', borderRadius: '16px', }}>
    //                     <div style={{ marginLeft: 18, textAlign: "start" }}>Workflows</div>
    //                     <div style={{textAlign:"center"}}>
    //                         <Button style={{ textTransform: "capitalize", background: selectedOption === 'all' ? "#494949" : "#1A1A1A", borderRadius: selectedOption === 'all' ? 15 : null, color: "#FFFFFF" }} onClick={() => handleOptionChange('all')}>All</Button>
    //                         <Button style={{ textTransform: "capitalize", background: selectedOption === 'revisions' ? "#494949" : "#1A1A1A", borderRadius: selectedOption === 'revisions' ? 15 : null, color: "#FFFFFF" }} onClick={() => handleOptionChange('revisions')}>Revisions</Button>
    //                         <Button style={{ textTransform: "capitalize", background: selectedOption === 'run' ? "#494949" : "#1A1A1A", borderRadius: selectedOption === 'run' ? 15 : null, color: "#FFFFFF" }} onClick={() => handleOptionChange('run')}>Runs</Button>
    //                     </div>
    //                     <Bar data={data} options={options} style={{ width: 400, marginLeft: 25, padding:20,marginTop: 10 }} />
    //                 </div>
    //             </div>
    //             <div style={{ width: 375, height: 440, display: 'flex', alignItems: 'start', paddingTop: '16px', paddingBottom: '48px', fontSize: '16px', color: '#ffffff', backgroundColor: '#1A1A1A', borderRadius: '16px', }}>
    //                 <div style={{ marginLeft: 18 }}>Insights</div>
    //             </div>
    //         </div>
    //         <div style={{ width: 985, paddingTop: 16, marginTop: 16, paddingBottom: '48px', fontSize: '16px', color: '#ffffff', backgroundColor: '#1A1A1A', borderRadius: '16px', }}>
    //             <div style={{ marginLeft: 18, textAlign: 'start', marginBottom: 16 }}>Sessions Overview</div>
    //             <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
    //                 <div style={{ fontSize: '16px',width: "30%", borderRadius: 8, background: '#212121', color: '#9CA3AF' }}>
    //                     <div style={{ marginTop: 21, color: "#ffffff",  marginLeft:20,fontSize: 16, fontWeight: "bold", }}>
    //                         2.8 Hours
    //                     </div>
    //                     <div style={{ marginTop: 13, marginBottom: 16, marginLeft:20, }}>
    //                         Avg. Activity per session
    //                     </div>
    //                 </div>
    //                 <div style={{ marginLeft: 16, fontSize: '16px', width: "30%", borderRadius: 8, background: '#212121', color: '#9CA3AF' }}>
    //                     <div style={{ marginTop: 21, marginLeft:20, color: "#ffffff", fontSize: 16, fontWeight: "bold", }}>
    //                         /usercases/edr to ticket
    //                     </div>
    //                     <div style={{ marginTop: 13, marginLeft:20, marginBottom: 16, }}>
    //                         Last visited page
    //                     </div>
    //                 </div>
    //                 <div style={{ marginLeft: 16, fontSize: '16px', width: "30%", borderRadius: 8, background: '#212121', color: '#9CA3AF' }}>
    //                     <div style={{ marginTop: 21,  marginLeft:20,color: "#ffffff", fontSize: 16, fontWeight: "bold", }}>
    //                         /workflow/email management
    //                     </div>
    //                     <div style={{ marginTop: 13, marginLeft:20, marginBottom: 16, }}>
    //                         Most visited page
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // );
};

export default AnalyticsTab;
