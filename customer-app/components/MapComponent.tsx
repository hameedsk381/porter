import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
    location: any;
    theme: any;
    mapStyle: any;
}

export default function MapComponent({ location, theme, mapStyle }: MapComponentProps) {
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
