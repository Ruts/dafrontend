import '../styles/FarmManager.css';

import * as React from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { CircleMarker, MapContainer, Polygon, TileLayer } from 'react-leaflet';

import FarmMap from './FarmMap';
import { farmManagerStore } from '../stores/FarmManagerStore';
import { gridImageStore } from '../stores/GridImageStore';
import { observer } from 'mobx-react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FarmForm {
    id: string;
    name: string;
    crop: string;
    acreage: number;
    coordinates: Coordinates[]; // polygon
    latitude?: number | null;
    longitude?: number | null;
};

export interface Harvest {
    id: string;
    farmId: string;
    owner: string;
    date: string;
    yield: number;
    crop: string;
}

export interface Environment {
    id: string;
    farmId: string;
    owner: string;
    date: string;
    soilMoisture: string;
    soilPH: number;
    temperature: number;
}

@observer
class FarmManager extends React.Component<{ token: string }> {
  componentDidMount() {
    farmManagerStore.token = this.props.token;
    farmManagerStore.fetchFarms();
    gridImageStore.fetchGridImages(this.props.token);
  }

  getCenter(coords: Coordinates[]) {
    if (coords.length === 0) return null;
    const latSum = coords.reduce((sum, p) => sum + p.lat, 0);
    const lngSum = coords.reduce((sum, p) => sum + p.lng, 0);
    return {
      lat: latSum / coords.length,
      lng: lngSum / coords.length,
    };
  }

  render() {
    return (
      <Box p={3}>
        {farmManagerStore.step === "Farms" && (
          <Box>
            <Typography variant="h4" gutterBottom>My Farms</Typography>
            {farmManagerStore.farms.length > 0 ? (
              <Grid container spacing={3}>
                {farmManagerStore.farms.map(farm => {
                  const center = farm.latitude != null && farm.longitude != null
                    ? { lat: farm.latitude, lng: farm.longitude }
                    : this.getCenter(farm.coordinates);
                  const mapsUrl = center ? `https://www.google.com/maps?q=${center.lat},${center.lng}` : '';
                  return (
                    <Grid container spacing={2} key={farm.id}>
                      <Card elevation={3}>
                        <CardContent>
                          <Typography variant="h6">{farm.name}</Typography>
                          <Typography variant="body2">{farm.crop}, {farm.acreage} acres</Typography>
                          {center ? <>
                          <Box mt={2}>
                            <MapContainer
                              center={[center.lat, center.lng]}
                              zoom={17}
                              style={{ height: '200px', width: '100%' }}
                            >
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              {farm.coordinates.length >= 3
                                ? <Polygon positions={farm.coordinates.map(p => [p.lat, p.lng])} />
                                : <CircleMarker center={[center.lat, center.lng]} radius={6} />}
                            </MapContainer>
                          </Box>
                          <Box mt={1}>
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                              📍 View Location on Google Maps
                            </a>
                          </Box>
                          </> : (
                            <Typography variant="body2">No location set. Add a pin in Profile &amp; Weather.</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Typography>No farms found. Click add</Typography>
            )}
            <Box mt={3}>
              <Button variant="contained" onClick={() => farmManagerStore.setStep("AddFarm")}>Add Farm</Button>
              <Button variant="outlined" sx={{ ml: 2 }} onClick={() => farmManagerStore.setStep("AddHarvest")}>Add Harvest</Button>
            </Box>
          </Box>
        )}

        {farmManagerStore.step === "AddFarm" && (
          <Box mt={3}>
            <Typography variant="h5" gutterBottom>Add New Farm</Typography>
            <TextField fullWidth label="Farm Name" margin="normal" onChange={e => farmManagerStore.farm.name = e.target.value} />
            <TextField fullWidth label="Crop Grown" margin="normal" onChange={e => farmManagerStore.farm.crop = e.target.value} />
            <TextField fullWidth label="Acreage" type="number" margin="normal" onChange={e => farmManagerStore.farm.acreage = parseFloat(e.target.value)} />
            <Box mt={2}>
              <Button variant="contained" onClick={() => farmManagerStore.setStep("Farms")}>Cancel</Button>
              <Button variant="outlined" onClick={() => farmManagerStore.showMap = true}>Set Coordinates</Button>
              <Button variant="contained" sx={{ ml: 2 }} onClick={() => farmManagerStore.handleSubmit()}>Save Farm</Button>
            </Box>

            {farmManagerStore.showMap && (
              <FarmMap
                onClose={() => farmManagerStore.showMap = false}
                onSave={(polygon: Coordinates[]) => {
                  farmManagerStore.farm.coordinates = polygon;
                  farmManagerStore.showMap = false;
                }}
              />
            )}
          </Box>
        )}

        {farmManagerStore.step === "AddHarvest" && (
          <Box mt={3}>
            <Typography variant="h5" gutterBottom>Add Harvest</Typography>
            <Select fullWidth defaultValue="" onChange={e => farmManagerStore.harvest.farmId = e.target.value}>
              {farmManagerStore.farms.map(f => (
                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
              ))}
            </Select>
            <TextField fullWidth label="Yield (kg)" type="number" margin="normal" onChange={e => farmManagerStore.harvest.yield = parseFloat(e.target.value)} />
            <TextField fullWidth label="Crop" margin="normal" onChange={e => farmManagerStore.harvest.crop = e.target.value} />
            <TextField fullWidth label="Harvest Date" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={farmManagerStore.harvest.date} onChange={e => farmManagerStore.harvest.date = e.target.value} />
            <Box mt={2}>
              <Button variant="contained" onClick={() => farmManagerStore.postHarvest()}>Save Harvest</Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
}

export default FarmManager;
