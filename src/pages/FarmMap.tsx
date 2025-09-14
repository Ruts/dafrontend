import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

import * as L from 'leaflet';

import { MapContainer, Marker, Polygon, TileLayer, useMapEvents } from 'react-leaflet';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useState } from 'react';

const GeocoderControl = () => {
  const map = useMap();

  useEffect(() => {
    // const geocoder = L.Control.geocoder().addTo(map);
    const geocoder = (L.Control as any).geocoder().addTo(map);
    // const geocoder = L.Control.geocoder({
    //   defaultMarkGeocode: true,
    // }).addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);

  return null;
};

L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

type Coordinates = { lat: number; lng: number };

const pointIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href, // Replace with your actual image path
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/marker-shadow.png', // Optional
  shadowSize: [41, 41],
});

type Props = {
    onClose: () => void;
    onSave: (polygon: Coordinates[]) => void; // or whatever signature it has
};

type LatLng = { lat: number; lng: number };

type MapClickHandlerProps = {
  points: LatLng[];
  setPoints: React.Dispatch<React.SetStateAction<LatLng[]>>;
};

const MapClickHandler = ({ points, setPoints }: MapClickHandlerProps) => {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number; }; }) {
      setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    }
  });

  return null;
};

const FarmMap = ({ onClose, onSave }: Props) => {
  const [points, setPoints] = useState<LatLng[]>([]);

  return (
    <div className="map-popup">
        <MapContainer center={[-1.3, 36.8]} zoom={13} style={{ height: '300px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <GeocoderControl />
            <MapClickHandler points={points} setPoints={setPoints} />
            {points.map((point, index) => (
                <Marker
                    key={index}
                    position={[point.lat, point.lng]}
                    icon={pointIcon}
                    draggable={true}
                    eventHandlers={{
                    dragend: (e: { target: { getLatLng: () => LatLng; }; }) => {
                        const newLatLng = e.target.getLatLng();
                        setPoints(prev => {
                        const updated = [...prev];
                        updated[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
                        return updated;
                        });
                    }
                    }}
                />
                ))}

                {points.length > 2 && (
                <Polygon positions={points.map(p => [p.lat, p.lng])} />
            )}
        </MapContainer>
        <button onClick={() => setPoints([])}>Reset</button>
        <button onClick={() => onSave(points)}>Save Shape</button>
        <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default FarmMap;
