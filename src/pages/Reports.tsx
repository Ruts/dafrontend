import * as React from "react";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Environment, Harvest } from "./FarmManager";

import { farmManagerStore } from "../stores/FarmManagerStore";
import { farmReportStore } from "../stores/FarmReportStore";
import { observer } from "mobx-react";
import { toJS } from "mobx";

interface ReportsProps {
  token: string;
}

@observer
class Reports extends React.Component<ReportsProps> {
  componentDidMount() {
    farmReportStore.fetchReportData(this.props.token);
  }

  render() {
    return (
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          📊 Farm Performance Report
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid container spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Farm</InputLabel>
              <Select
                value={farmReportStore.selectedFarmId}
                label="Farm"
                onChange={(e) => farmReportStore.setFarmFilter(e.target.value)}
              >
                <MenuItem value="">All Farms</MenuItem>
                {farmManagerStore.farms.map((farm) => (
                  <MenuItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid container spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Crop</InputLabel>
              <Select
                value={farmReportStore.selectedCrop}
                label="Crop"
                onChange={(e) => farmReportStore.setCropFilter(e.target.value)}
              >
                <MenuItem value="">All Crops</MenuItem>
                {[...new Set(farmReportStore.harvests.map((h) => h.crop))].map(
                  (crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {farmReportStore.loading && (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
            <Typography>Loading report...</Typography>
          </Box>
        )}

        {!farmReportStore.hasData && !farmReportStore.loading && (
          <Typography>
            No data available yet. Start by adding harvest or environmental
            records.
          </Typography>
        )}

        {!farmReportStore.loading && farmReportStore.hasData && (
          <Grid container spacing={3}>
            <Grid container spacing={2}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Yield Over Time
                  </Typography>
                  <LineChart
                    width={500}
                    height={300}
                    data={toJS(farmReportStore.filteredHarvest)}
                  >
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="#82ca9d"
                      dot={false}
                    />
                  </LineChart>
                </CardContent>
              </Card>
            </Grid>

            <Grid container spacing={2}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    SoilPH vs Yield
                  </Typography>
                  <LineChart
                    width={500}
                    height={300}
                    data={toJS(
                      this.mergeByDate(
                        farmReportStore.filteredHarvest,
                        farmReportStore.filteredEnvironment
                      )
                    )}
                  >
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      dataKey="yield"
                      stroke="#82ca9d"
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="soilPH"
                      stroke="#8884d8"
                      dot={false}
                    />
                  </LineChart>
                </CardContent>
              </Card>
            </Grid>

            <Grid container spacing={2}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Harvest Table
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Farm</TableCell>
                        <TableCell>Crop</TableCell>
                        <TableCell>Yield (kg)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {farmReportStore.filteredHarvest.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.date}</TableCell>
                          <TableCell>
                            {
                              farmManagerStore.farms.find(
                                (f) => f.id === h.farmId
                              )?.name || h.farmId
                            }
                          </TableCell>
                          <TableCell>{h.crop}</TableCell>
                          <TableCell>{h.yield}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  }

  private mergeByDate(harvests: Harvest[], env: Environment[]) {
    const map = new Map();

    harvests.forEach((h) => {
      map.set(h.date, { date: h.date, yield: h.yield });
    });

    env.forEach((e) => {
      const existing = map.get(e.date) || { date: e.date };
      map.set(e.date, { ...existing, soilPH: e.soilPH });
    });

    return Array.from(map.values());
  }
}

export default Reports;

