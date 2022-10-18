import React from "react";
import { Grid, Container, Divider } from "@mui/material";

import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import { LineChart, LineSeries, BarChart } from "reaviz";
import { GridStripe } from "reaviz";
//import { GridlineSeries } from "reaviz";

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const data = [
  {
    key: new Date("11/29/2019"),
    data: 10,
  },
  {
    key: new Date("11/30/2019"),
    data: 14,
  },
  {
    key: new Date("12/01/2019"),
    data: 5,
  },
  {
    key: new Date("12/02/2019"),
    data: 18,
  },
];

const useStyles1 = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));


const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  root: {
    minWidth: 275,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9),
];

const DashboardPage = () => {
  const classes = useStyles();
  const classes1 = useStyles1();

  const [age, setAge] = React.useState(0);

  const handleChange = (event) => {
    setAge(event.target.value);

  };

  return (
    <Container maxWidth="xl">
      <Grid>
        <Grid item xl={8} style={{"border":"20px"}}>
          <center>
            <Typography type="title" variant="h1" color="inherit">
              Dashboard
            </Typography>
            <div style={{
            "paddingLeft": "50px"
          }}>
            <FormControl className={classes1.formControl}>
              <InputLabel id="demo-simple-select-label">Organization</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                onChange={handleChange}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
          </div>
          </center>
          </Grid>
          <Divider />
        </Grid>
      <Grid
        container
        spacing={2}
        style={{
          maxWidth: "1250px",
          margin: "auto auto 10px",
          padding: "10px",
        }}
      >
        <Grid item xs={4}>
          <Card
            className={classes.root}
            style={{
              color: "white",
              backgroundColor: "RGB(31, 32, 36)",
              height: "100px",
              border: "2px solid rgb(197, 17, 82)",
            }}
          >
            <CardContent>
              <Typography
                className={classes.title}
                color="textSecondary"
                gutterBottom
              >
                Total workflows executions
              </Typography>
              <Typography
                variant="h1"
                className={classes.pos}
                color="textSecondary"
              >
                456
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card
            className={classes.root}
            style={{
              color: "white",
              backgroundColor: "RGB(31, 32, 36)",
              height: "100px",
              border: "2px solid rgb(244, 194, 13)",
            }}
          >
            <CardContent>
              <Typography
                className={classes.title}
                color="textSecondary"
                gutterBottom
              >
                Total Apps executions
              </Typography>
              <Typography
                variant="h1"
                className={classes.pos}
                color="textSecondary"
              >
                587
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card
            className={classes.root}
            style={{
              color: "white",
              backgroundColor: "RGB(31, 32, 36)",
              height: "100px",
              border: "2px solid rgb(72, 133, 237)",
            }}
          >
            <CardContent>
              <Typography
                className={classes.title}
                color="textSecondary"
                gutterBottom
              >
                Total failed executions
              </Typography>
              <Typography
                variant="h1"
                className={classes.pos}
                color="textSecondary"
              >
                999
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={3}
        style={{
          maxWidth: "1250px",
          margin: "auto auto 10px",
          color: "white",
          backgroundColor: "rgb(39, 41, 45)",
          padding: "20px",
        }}
      >
        <Grid item md={6}>
          <BarChart width={600} height={400} data={data} />
        </Grid>
        <Grid item md={6}>
          <LineChart
            width={600}
            height={400}
            data={data}
            line={<GridStripe fill={"a#393c3e"} />}
            series={<LineSeries symbols={null} />}
          />
        </Grid>
      </Grid>
      <Grid
        container
        spacing={1}
        style={{
          maxWidth: "1250px",
          margin: "auto auto 10px",
          color: "white",
          backgroundColor: "rgb(39, 41, 45)",
          padding: "20px",
        }}
      >
        <Grid item md={12}>
          <TableContainer
            component={Paper}
            style={{
              color: "white",
              backgroundColor: "rgb(39, 41, 45) ",
            }}
          >
            <Table
              className={classes.table}
              size="small"
              aria-label="a dense table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Dessert (100g serving)</TableCell>
                  <TableCell align="right">Calories</TableCell>
                  <TableCell align="right">Fat&nbsp;(g)</TableCell>
                  <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                  <TableCell align="right">Protein&nbsp;(g)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">{row.calories}</TableCell>
                    <TableCell align="right">{row.fat}</TableCell>
                    <TableCell align="right">{row.carbs}</TableCell>
                    <TableCell align="right">{row.protein}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
