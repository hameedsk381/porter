import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';

let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
    try {
        const Maps = require('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    } catch (e) {
        console.warn('react-native-maps not found');
    }
}

const { width } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    mapStyle: any;
}

export default function MapComponent({ location, mapStyle }: MapComponentProps) {
    if (Platform.OS === 'web' || !MapView) {
        return (
            <View style={[styles.map, { backgroundColor: '#242f3e', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Map View (Web Preview)</Text>
            </View>
        );
    }

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
