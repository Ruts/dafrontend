import * as React from "react";

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { Environment, Harvest } from "./FarmManager";

import { farmManagerStore } from "../stores/FarmManagerStore";
import { farmReportStore } from '../stores/FarmReportStore';
import { observer } from 'mobx-react';
import { toJS } from "mobx";

interface ReportsProps {
    token: string;
}

@observer
class Reports extends React.Component<ReportsProps> {
    public componentDidMount() {
        farmReportStore.fetchReportData(this.props.token);
    }
    
    render() {
        return (
            <div style={{ padding: '2rem' }}>

                <select onChange={(e) => farmReportStore.setFarmFilter(e.target.value)}>
                    <option value="">All Farms</option>
                    {farmManagerStore.farms.map(farm => (
                        <option key={farm.id} value={farm.id}>
                        {farm.name}
                        </option>
                    ))}
                </select>

                <select onChange={(e) => farmReportStore.setCropFilter(e.target.value)}>
                    <option value="">All Crops</option>
                    {[...new Set(farmReportStore.harvests.map(h => h.crop))].map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                    ))}
                </select>

            {farmReportStore.loading && (<p>Loading report...</p>)}
            {!farmReportStore.hasData && (<p>No data available yet. Start by adding harvest or environmental records.</p>)}
            {!farmReportStore.loading && farmReportStore.hasData && (
                <div>
                    <h2>📊 Farm Performance Report</h2>

                    <section>
                        <h3>Yield Over Time</h3>
                        <LineChart width={600} height={300} data={toJS(farmReportStore.filteredHarvest)}>
                        <CartesianGrid stroke="#ccc" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="yield" stroke="#82ca9d" />
                        </LineChart>
                    </section>

                    <section>
                        <h3>SoilPH vs Yield</h3>
                        <LineChart width={600} height={300} data={toJS(this.mergeByDate(farmReportStore.filteredHarvest, farmReportStore.filteredEnvironment))}>
                        <CartesianGrid stroke="#ccc" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line yAxisId="left" dataKey="yield" stroke="#82ca9d" />
                        <Line yAxisId="right" dataKey="soilPH" stroke="#8884d8" />
                        </LineChart>
                    </section>

                    <section>
                        <h3>📋 Harvest Table</h3>
                        <table>
                        <thead>
                            <tr>
                            <th>Date</th>
                            <th>Farm</th>
                            <th>Crop</th>
                            <th>Yield (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {farmReportStore.filteredHarvest.map(h => (
                            <tr key={h.id}>
                                <td>{h.date}</td>
                                <td>{
                                    farmManagerStore.farms.find(f => f.id === h.farmId)?.name || h.farmId
                                }</td>
                                <td>{h.crop}</td>
                                <td>{h.yield}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </section>
                </div>
            )}
            </div>
        );
    }

    private mergeByDate(harvests: Harvest[], env: Environment[]) {
        const map = new Map();

        harvests.forEach(h => {
            map.set(h.date, { date: h.date, yield: h.yield });
        });

        env.forEach(e => {
            const existing = map.get(e.date) || { date: e.date };
            map.set(e.date, { ...existing, rainfall: e.soilPH });
        });

        return Array.from(map.values());
    }
}

export default Reports;


