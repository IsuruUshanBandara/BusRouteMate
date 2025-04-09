import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { realtimeDb } from '../../db/firebaseConfig';
import { ref, onValue, off } from 'firebase/database';

const LocationTrackingScreen = ({ route }) => {
  // You can customize these values or pass them as props
  const userId = route?.params?.userId || 'driver-1';
  const tripId = route?.params?.tripId || 'trip-1';
  
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverStatus, setDriverStatus] = useState('offline'); // 'online', 'offline', or 'canceled'
  const [routeInfo, setRouteInfo] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const mapRef = useRef(null);
  
  // Subscribe to driver location updates
  useEffect(() => {
    const locationRef = ref(realtimeDb, `/locations/${tripId}/${userId}`);
    
    // Set up listener for location changes
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Update status
        setDriverStatus(data.status || 'offline');
        
        // Update route if available
        if (data.selectedRoute) {
          setRouteInfo(data.selectedRoute);
        }
        
        // Update timestamp
        if (data.timestamp) {
          setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
        }
        
        // Only set location if latitude and longitude exists
        if (data.latitude && data.longitude) {
          setDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude
          });
          
          // Animate map to new location if marker exists
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        } else {
          // No location data (canceled)
          setDriverLocation(null);
        }
      } else {
        // No data found
        setDriverStatus('offline');
        setDriverLocation(null);
      }
    });
    
    // Clean up listener on unmount
    return () => {
      off(locationRef, 'value', unsubscribe);
    };
  }, [tripId, userId]);

  const getStatusColor = () => {
    switch (driverStatus) {
      case 'online': return '#4CAF50'; // Green
      case 'canceled': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey for offline
    }
  };

  const getStatusText = () => {
    switch (driverStatus) {
      case 'online': return 'Driver Active';
      case 'canceled': return 'Ride Canceled';
      default: return 'Driver Offline';
    }
  };

  // Show a message instead of the map when ride is canceled or driver is offline
  const renderContent = () => {
    if (driverStatus === 'canceled') {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.canceledText}>Ride Canceled</Text>
          <Text style={styles.subText}>
            The driver has canceled this ride due to an emergency.
          </Text>
        </View>
      );
    } else if (!driverLocation || driverStatus === 'offline') {
      return (
        <View style={styles.loadingContainer}>
          <Text>Waiting for driver to start the trip...</Text>
        </View>
      );
    } else {
      return (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title={driverStatus === 'online' ? "Driver Live Location" : "Last Known Location"}
            description={routeInfo}
            pinColor={getStatusColor()}
          />
        </MapView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      <View style={styles.statusBar}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          Status: {getStatusText()}
        </Text>
        {routeInfo && (
          <Text style={styles.routeText}>
            Route: {routeInfo}
          </Text>
        )}
        {driverLocation && driverStatus === 'online' && (
          <Text style={styles.locationText}>
            Location: {driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)}
          </Text>
        )}
        {lastUpdate && (
          <Text style={styles.updateText}>
            Last Update: {lastUpdate}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  canceledText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  statusText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 4,
  },
  locationText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
  updateText: {
    color: '#FFC107',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  }
});

export default LocationTrackingScreen;