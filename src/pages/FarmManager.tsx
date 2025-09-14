import '../styles/FarmManager.css';

import * as React from "react";

import { MapContainer, Polygon, TileLayer } from 'react-leaflet';

import FarmMap from './FarmMap';
import { farmManagerStore } from '../stores/FarmManagerStore';
import { gridImageStore } from '../stores/GridImageStore';
import { observer } from 'mobx-react';

export interface Coordinates {
    lat: number;
    lng: number 
};

export interface FarmForm {
    id: string;
    name: string;
    crop: string;
    acreage: number;
    coordinates: Coordinates[]; // polygon
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

interface FarmManagerProps {
    token: string;
}

@observer
class FarmManager extends React.Component<FarmManagerProps> {    
    public componentDidMount() {
        farmManagerStore.token = this.props.token;
        farmManagerStore.fetchFarms();
        gridImageStore.fetchGridImages(this.props.token);
    }

    render() {
        return (
            <div className="farm-manager">
                {farmManagerStore.step === "Farms" && (
                    farmManagerStore.farms.length > 0 ? 
                    <div>
                        <h2>My Farms</h2>
                        <ul>
                            {farmManagerStore.farms.map(farm => {
                                const center = this.getCenter(farm.coordinates); // ✅ now it's used
                                const mapsUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}`;
                                return (
                                    <li key={farm.id}>
                                        <strong>{farm.name}</strong> — {farm.crop}, {farm.acreage} acres
                                        <br />
                                        <MapContainer
                                            center={[farm.coordinates[0].lat, farm.coordinates[0].lng]}
                                            zoom={17}
                                            style={{ height: '200px', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Polygon positions={farm.coordinates.map(p => [p.lat, p.lng])} />
                                        </MapContainer>
                                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                            📍 View Location on Google Maps
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                        <button onClick={() => farmManagerStore.setStep("AddFarm")}>Add Farm</button>
                        <button onClick={() => farmManagerStore.setStep("AddHarvest")}>Add Harvest</button>
                    </div>
                    :   <div>
                            <h2>My Farms</h2>
                            <p>No farms found. Click add</p>
                            <button onClick={() => farmManagerStore.setStep("AddFarm")}>Add Farm</button>
                        </div>
                )}

                {farmManagerStore.step === "AddFarm" && (
                    <div>
                        <h3>Add New Farm</h3>
                        <input placeholder="Farm Name" onChange={e => farmManagerStore.farm.name = e.target.value} />
                        <input placeholder="Crop Grown" onChange={e => farmManagerStore.farm.crop = e.target.value} />
                        <input placeholder="Acreage" type="number" onChange={e => farmManagerStore.farm.acreage = parseFloat(e.target.value)} />
                        <button onClick={() => farmManagerStore.showMap = true}>Set Coordinates</button>
                        <button onClick={() => farmManagerStore.handleSubmit()}>Save Farm</button>

                        {farmManagerStore.showMap && (
                            <FarmMap
                                onClose={() => farmManagerStore.showMap = false}
                                onSave={(polygon: Coordinates[]) => {
                                    farmManagerStore.farm.coordinates = polygon;
                                    farmManagerStore.showMap = false;
                                }}
                            />
                        )}
                    </div>
                )}

                {farmManagerStore.step === "AddHarvest" && (
                    <div>
                        <h3>Add Harvest</h3>
                        <select onChange={e => farmManagerStore.harvest.farmId = e.target.value}>
                            {farmManagerStore.farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <input type="number" placeholder="Yield (kg)" onChange={e => farmManagerStore.harvest.yield = parseFloat(e.target.value)} />
                        <input placeholder="Crop" onChange={e => farmManagerStore.harvest.crop = e.target.value} />
                        <input
                            type="date"
                            value={farmManagerStore.harvest.date}
                            onChange={(e) => farmManagerStore.harvest.date = e.target.value}
                            placeholder="Harvest Date"
                        />
                        <button onClick={() => farmManagerStore.postHarvest()}>Save Harvest</button>
                    </div>
                )}
            </div>
        );
    }

    private getCenter(coords: Coordinates[]): { lat: number; lng: number } {
        const latSum = coords.reduce((sum, p) => sum + p.lat, 0);
        const lngSum = coords.reduce((sum, p) => sum + p.lng, 0);
        return {
            lat: latSum / coords.length,
            lng: lngSum / coords.length
        };
    }
}

export default FarmManager;
