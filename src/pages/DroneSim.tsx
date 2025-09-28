import * as React from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";

import Grid from '@mui/material/Grid';
import { farmManagerStore } from "../stores/FarmManagerStore";
import { gridImageStore } from "../stores/GridImageStore";
import { observer } from "mobx-react";
import { soilSampleStore, type SoilSample } from "../stores/SoilSampleStore";

interface DroneSimProps {
  token: string;
}

export interface GridImage {
  id: string;
  farmId: string;
  owner: string;
  date: string;
  imageUrl: string[];
}

@observer
class DroneSim extends React.Component<DroneSimProps> {
    componentDidMount() {
        farmManagerStore.token = this.props.token;
        farmManagerStore.fetchFarms();
        gridImageStore.fetchGridImages(this.props.token);
        soilSampleStore.fetchSamples(this.props.token);
    }

    render() {
        return (
        <Box p={3}>
            {/* Soil Sample Form */}
            <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>🧪 Add Soil Sample</Typography>
                <Grid container spacing={2}>
                <Grid container spacing={2}>
                    <FormControl fullWidth>
                    <InputLabel>Farm</InputLabel>
                    <Select
                        value={soilSampleStore.sample.farmId}
                        label="Farm"
                        onChange={(e) => this.handleChange("farmId", e.target.value)}
                    >
                        <MenuItem value="">Select Farm</MenuItem>
                        {farmManagerStore.farms.map((f) => (
                        <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid container spacing={2}>
                    <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={soilSampleStore.sample.date}
                    onChange={(e) => this.handleChange("date", e.target.value)}
                    />
                </Grid>

                {([
                    ["pH", "pH"],
                    ["EC (dS/m)", "electricalConductivity"],
                    ["Organic Matter (%)", "organicMatter"],
                    ["Nitrogen (ppm)", "nitrogen"],
                    ["Phosphorus (ppm)", "phosphorus"],
                    ["Potassium (ppm)", "potassium"],
                    ["Calcium (ppm)", "calcium"],
                    ["Magnesium (ppm)", "magnesium"],
                    ["Sulfur (ppm)", "sulfur"],
                    ["Zinc (ppm)", "zinc"],
                    ["Iron (ppm)", "iron"],
                    ["Soil Texture", "soilTexture"],
                    ["Moisture (%)", "moistureContent"],
                    ] as [string, keyof SoilSample][]).map(([label, key]) => (
                    <Grid container spacing={2} key={key}>
                        <TextField
                        fullWidth
                        label={label}
                        type={key === "soilTexture" ? "text" : "number"}
                        value={soilSampleStore.sample[key]}
                        onChange={(e) =>
                            soilSampleStore.setField(
                            key,
                            key === "soilTexture" ? e.target.value : parseFloat(e.target.value)
                            )
                        }
                        />
                    </Grid>
                    ))}
                </Grid>

                <Box mt={2}>
                <Button
                    variant="contained"
                    onClick={() => soilSampleStore.submitSample(this.props.token)}
                    disabled={soilSampleStore.submitting}
                >
                    {soilSampleStore.submitting ? "Submitting..." : "Submit Sample"}
                </Button>
                {soilSampleStore.success && (
                    <Typography mt={2} color="success.main">✅ Sample stored successfully!</Typography>
                )}
                </Box>
            </CardContent>
            </Card>

            {/* Soil Sample Viewer */}
            <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>🧪 Soil Sample Viewer</Typography>
                <Grid container spacing={2}>
                <Grid container spacing={2}>
                    <FormControl fullWidth>
                    <InputLabel>Farm</InputLabel>
                    <Select
                        label="Farm"
                        onChange={(e: SelectChangeEvent) =>
                            soilSampleStore.setFilter("farmId", e.target.value)
                        }
                    >
                        <MenuItem value="">All Farms</MenuItem>
                        {farmManagerStore.farms.map((f) => (
                        <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid container spacing={2}>
                    <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => soilSampleStore.setFilter("startDate", e.target.value)}
                    />
                </Grid>
                <Grid container spacing={2}>
                    <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => soilSampleStore.setFilter("endDate", e.target.value)}
                    />
                </Grid>
                </Grid>

                <Box mt={2}>
                <Button variant="outlined" onClick={() => soilSampleStore.fetchSamples(this.props.token)}>
                    Filter
                </Button>
                </Box>

                <Box mt={3}>
                {soilSampleStore.loading ? (
                    <Typography>Loading samples...</Typography>
                ) : (
                    soilSampleStore.samples?.map((sample, i) => (
                    <Card key={i} sx={{ mb: 2 }}>
                        <CardContent>
                        <Typography variant="h6">
                            🌾 {farmManagerStore.getFarmName(sample.farmId)}
                        </Typography>
                        <Typography variant="body2">📅 {sample.date}</Typography>
                        <ul>
                            {Object.entries(sample).map(([key, value]) =>
                            key !== "farmId" && key !== "date" ? (
                                <li key={key}>
                                {key}: {value}
                                </li>
                            ) : null
                            )}
                        </ul>
                        </CardContent>
                    </Card>
                    ))
                )}
                </Box>
            </CardContent>
            </Card>

            {/* Grid Image Upload */}
            <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>🖼️ Grid Image Upload</Typography>
                <Grid container spacing={2}>
                <Grid container spacing={2}>
                    <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => gridImageStore.setDate(e.target.value)}
                    />
                </Grid>
                <Grid container spacing={2}>
                    <FormControl fullWidth>
                    <InputLabel>Farm</InputLabel>
                    <Select
                        label="Farm"
                        onChange={(e: SelectChangeEvent) =>
                            soilSampleStore.setFilter("farmId", e.target.value)
                        }
                    >
                        {farmManagerStore.farms.map((f) => (
                        <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid container spacing={2}>
                    <Button variant="outlined" component="label" fullWidth>
                    Upload Images
                    <input
                        type="file"
                        multiple
                        hidden
                        onChange={(e) => {
                        if (e.target.files) {
                            gridImageStore.setFiles(e.target.files);
                        }
                        }}
                    />
                    </Button>
                </Grid>
                </Grid>

                <Box mt={2}>
                <Button
                    variant="contained"
                    onClick={this.handleSubmit}
                    disabled={gridImageStore.uploading}
                >
                    {gridImageStore.uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button sx={{ ml: 2 }} variant="outlined" onClick={this.handleSimulation}>
                    Simulate
                </Button>
                {gridImageStore.uploadSuccess && (
                    <Typography mt={2} color="success.main">✅ Upload successful!</Typography>
                )}
                </Box>

                <Box mt={4}>
                <Typography variant="h6">📂 Uploaded Grid Images</Typography>
                {gridImageStore.gridImages.length === 0 ? (
                    <Typography>No grid images available yet.</Typography>
                ) : (
                    gridImageStore.gridImages.map((img, i) => (
                    <Box key={i} mb={2}>
                        <Typography variant="subtitle1">
                        🌾 Farm: {farmManagerStore.getFarmName(img.farmId)}
                        </Typography>
                        <Typography variant="body2">📅 Date: {img.date}</Typography>
                        <Grid container spacing={2}>
                                            {img.imageUrl.map((url: string, j: number) => (
                        <Grid container spacing={2} key={j}>
                            <Card>
                            <CardContent>
                                <img
                                src={url}
                                alt={`Grid ${img.date} - ${j}`}
                                style={{ width: '100%', borderRadius: 8 }}
                                />
                            </CardContent>
                            </Card>
                        </Grid>
                        ))}
                    </Grid>
                    </Box>
                ))
                )}
            </Box>
            </CardContent>
        </Card>
        </Box>
        );
    }

    private handleSubmit = () => {
        gridImageStore.submitImages(
        gridImageStore.farmId,
        gridImageStore.date,
        gridImageStore.files,
        this.props.token
        );
    };

    private handleSimulation = () => {
        gridImageStore.simulateTest(
        gridImageStore.farmId,
        gridImageStore.date,
        this.props.token
        );
    };

    private handleChange = <K extends keyof SoilSample>(key: K, value: SoilSample[K]) => {
        soilSampleStore.setField(key, value);
    };
}

export default DroneSim;
