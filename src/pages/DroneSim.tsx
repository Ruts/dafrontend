import '../styles/FarmManager.css';

import * as React from "react";

import { farmManagerStore } from '../stores/FarmManagerStore';
import { gridImageStore } from '../stores/GridImageStore';
import { observer } from 'mobx-react';
import { soilSampleStore } from '../stores/SoilSampleStore';

interface DroneSimProps {
    token: string;
}

@observer
class DroneSim extends React.Component<DroneSimProps> {    
    public componentDidMount() {
        farmManagerStore.token = this.props.token;
        farmManagerStore.fetchFarms();
        gridImageStore.fetchGridImages(this.props.token);
        soilSampleStore.fetchSamples(this.props.token);
    }

    render() {
        return (
            <div className="farm-manager">
                <div>
                    <h2>🧪 Add Soil Sample</h2>

                    <select value={soilSampleStore.sample.farmId} onChange={e => this.handleChange("farmId", e.target.value)}>
                        <option value="">Select Farm</option>
                        {farmManagerStore.farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>

                    <input type="date" value={soilSampleStore.sample.date} onChange={e => this.handleChange("date", e.target.value)} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <p>pH</p>
                        <input type="number" placeholder="pH" value={soilSampleStore.sample.pH} onChange={e => this.handleChange("pH", parseFloat(e.target.value))} />
                        <p>EC (dS/m)</p>
                        <input type="number" placeholder="EC (dS/m)" value={soilSampleStore.sample.electricalConductivity} onChange={e => this.handleChange("electricalConductivity", parseFloat(e.target.value))} />
                        <p>Organic Matter (%)</p>
                        <input type="number" placeholder="Organic Matter (%)" value={soilSampleStore.sample.organicMatter} onChange={e => this.handleChange("organicMatter", parseFloat(e.target.value))} />
                        <p>Nitrogen (ppm)</p>
                        <input type="number" placeholder="Nitrogen (ppm)" value={soilSampleStore.sample.nitrogen} onChange={e => this.handleChange("nitrogen", parseFloat(e.target.value))} />
                        <p>Potassium (ppm)</p>
                        <input type="number" placeholder="Potassium (ppm)" value={soilSampleStore.sample.phosphorus} onChange={e => this.handleChange("phosphorus", parseFloat(e.target.value))} />
                        <p>Potassium (ppm)</p>
                        <input type="number" placeholder="Potassium (ppm)" value={soilSampleStore.sample.potassium} onChange={e => this.handleChange("potassium", parseFloat(e.target.value))} />
                        <p>Calcium (ppm)</p>
                        <input type="number" placeholder="Calcium (ppm)" value={soilSampleStore.sample.calcium} onChange={e => this.handleChange("calcium", parseFloat(e.target.value))} />
                        <p>Magnesium (ppm)</p>
                        <input type="number" placeholder="Magnesium (ppm)" value={soilSampleStore.sample.magnesium} onChange={e => this.handleChange("magnesium", parseFloat(e.target.value))} />
                        <p>Sulfur (ppm)</p>
                        <input type="number" placeholder="Sulfur (ppm)" value={soilSampleStore.sample.sulfur} onChange={e => this.handleChange("sulfur", parseFloat(e.target.value))} />
                        <p>Zinc (ppm)</p>
                        <input type="number" placeholder="Zinc (ppm)" value={soilSampleStore.sample.zinc} onChange={e => this.handleChange("zinc", parseFloat(e.target.value))} />
                        <p>Iron (ppm)</p>
                        <input type="number" placeholder="Iron (ppm)" value={soilSampleStore.sample.iron} onChange={e => this.handleChange("iron", parseFloat(e.target.value))} />
                        <p>Soil Texture</p>
                        <input type="text" placeholder="Soil Texture" value={soilSampleStore.sample.soilTexture} onChange={e => this.handleChange("soilTexture", e.target.value)} />
                        <p>Moisture (%)</p>
                        <input type="number" placeholder="Moisture (%)" value={soilSampleStore.sample.moistureContent} onChange={e => this.handleChange("moistureContent", parseFloat(e.target.value))} />
                    </div>

                    <button onClick={() => soilSampleStore.submitSample(this.props.token)} disabled={soilSampleStore.submitting}>
                        {soilSampleStore.submitting ? "Submitting..." : "Submit Sample"}
                    </button>

                    {soilSampleStore.success && <p>✅ Sample stored successfully!</p>}
                </div>
                <div>
                    <h2>🧪 Soil Sample Viewer</h2>

                    <select onChange={e => soilSampleStore.setFilter("farmId", e.target.value)}>
                        <option value="">All Farms</option>
                        {farmManagerStore.farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>

                    <input type="date" onChange={e => soilSampleStore.setFilter("startDate", e.target.value)} />
                    <input type="date" onChange={e => soilSampleStore.setFilter("endDate", e.target.value)} />
                    <button onClick={() => soilSampleStore.fetchSamples(this.props.token)}>Filter</button>

                    {soilSampleStore.loading ? (
                        <p>Loading samples...</p>
                    ) : (
                        soilSampleStore.samples?.map((sample, i) => (
                        <div key={i} style={{ marginBottom: "1rem" }}>
                            <h4>🌾 {farmManagerStore.farms.find(f => f.id === sample.farmId)?.name || sample.farmId}</h4>
                            <p>📅 {sample.date}</p>
                            <ul>
                            <li>pH: {sample.pH}</li>
                            <li>EC: {sample.electricalConductivity} dS/m</li>
                            <li>Organic Matter: {sample.organicMatter}%</li>
                            <li>N: {sample.nitrogen} ppm</li>
                            <li>P: {sample.phosphorus} ppm</li>
                            <li>K: {sample.potassium} ppm</li>
                            <li>Ca: {sample.calcium} ppm</li>
                            <li>Mg: {sample.magnesium} ppm</li>
                            <li>S: {sample.sulfur} ppm</li>
                            <li>Zn: {sample.zinc} ppm</li>
                            <li>Fe: {sample.iron} ppm</li>
                            <li>Texture: {sample.soilTexture}</li>
                            <li>Moisture: {sample.moistureContent}%</li>
                            </ul>
                        </div>
                        ))
                    )}
                </div>
                <div>
                    <h2>🖼️ Grid Image Upload</h2>
                    <input type="date" onChange={e => gridImageStore.setDate(e.target.value)} />
                    <select onChange={e => gridImageStore.setFarmId(e.target.value)}>
                        {farmManagerStore.farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <input
                        type="file"
                        multiple
                        onChange={e => {
                            if (e.target.files) {
                            gridImageStore.setFiles(e.target.files);
                            }
                        }}
                    />

                    <button onClick={this.handleSubmit} disabled={gridImageStore.uploading}>
                        {gridImageStore.uploading ? "Uploading..." : "Upload"}
                    </button>

                    {gridImageStore.uploadSuccess && <p>✅ Upload successful!</p>}

                    <h3>📂 Uploaded Grid Images</h3>
                    {gridImageStore.gridImages.length === 0 ? (
                        <p>No grid images available yet.</p>
                    ) : (
                        gridImageStore.gridImages.map((img, i) => (
                        <div key={i}>
                            <h4>🌾 Farm: {farmManagerStore.getFarmName(img.farmId)}</h4>
                            <p>📅 Date: {img.date}</p>

                            {img.imageUrl.map((url: string, j: number) => {
                                return (
                                    <div key={j} style={{ marginBottom: "1rem" }}>
                                    <img src={url} alt={`Grid ${img.date} - ${j}`} width="300" />
                                    </div>
                                );
                            })}
                        </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    private handleSubmit = () => {
        gridImageStore.submitImages(gridImageStore.farmId, gridImageStore.date, gridImageStore.files, this.props.token);
    };

    private handleChange = (key: string, value: string | number) => {
        soilSampleStore.setField(key as any, value);
    };
}

export default DroneSim;
