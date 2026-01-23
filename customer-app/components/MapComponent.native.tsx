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

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    theme: any;
    mapStyle: any;
}

export default function MapComponent({ location, theme, mapStyle }: MapComponentProps) {
    if (Platform.OS === 'web' || !MapView) {
        return (
            <View style={[styles.map, { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>Map View (Web Preview)</Text>
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
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}
            customMapStyle={mapStyle}
        >
            {location && (
                <Marker coordinate={location}>
                    <View style={[styles.myLocationMarker, { backgroundColor: theme.colors.primary }]}>
                        <View style={styles.myLocationInner} />
                    </View>
                </Marker>
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        width: width,
        height: height,
    },
    myLocationMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    myLocationInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});
