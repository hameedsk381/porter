import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    mapStyle: any;
}

export default function MapComponent({ location, mapStyle }: MapComponentProps) {
    return (
        <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
                latitude: location?.latitude || 19.0760,
                longitude: location?.longitude || 72.8777,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            customMapStyle={mapStyle}
        >
            <Marker coordinate={{ latitude: 19.0760, longitude: 72.8777 }} />
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },
});
