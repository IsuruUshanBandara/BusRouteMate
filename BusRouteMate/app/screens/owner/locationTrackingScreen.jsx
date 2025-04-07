import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { realtimeDb } from '../../db/firebaseConfig'
import { ref, set, serverTimestamp } from 'firebase/database';

const LocationTrackingScreen = ({ route, navigation }) => {
  // You can pass userId, tripId or other identifiers through route.params
  const userId = route?.params?.userId || 'test-user';
  const tripId = route?.params?.tripId || 'test-trip';
  
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef(null);
  
  // Request location permissions and start getting location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      
      // Get initial location
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation.coords);
    })();
  }, []);

  // Start/stop location tracking
  useEffect(() => {
    let locationSubscription = null;
    
    if (isTracking) {
      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000,   // Or at least every 5 seconds
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          
          // Update state with new location
          setLocation(newLocation.coords);
          
          // Save location to Firebase Realtime Database
          const locationRef = ref(realtimeDb, `/locations/${tripId}/${userId}`);
          set(locationRef, {
            latitude,
            longitude,
            timestamp: serverTimestamp(),
          }).catch(error => {
            console.error('Error updating location in database:', error);
          });
            
          // Animate map to new location
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      );
    }
    
    // Cleanup subscription on unmount or when tracking stops
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking, tripId, userId]);
  
  // Toggle tracking state
  const toggleTracking = () => {
    setIsTracking(prev => !prev);
    
    // If stopping tracking, update status in Firebase
    if (isTracking) {
      const statusRef = ref(realtimeDb, `/locations/${tripId}/${userId}/status`);
      set(statusRef, 'offline').catch(error => {
        console.error('Error updating status in database:', error);
      });
    } else {
      const statusRef = ref(realtimeDb, `/locations/${tripId}/${userId}/status`);
      set(statusRef, 'online').catch(error => {
        console.error('Error updating status in database:', error);
      });
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={isTracking ? "Live Location" : "Last Location"}
            description={`${new Date().toLocaleTimeString()}`}
          />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Getting your location...</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
          onPress={toggleTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Status: {isTracking ? "Tracking" : "Not Tracking"}
        </Text>
        {location && (
          <Text style={styles.locationText}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
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
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
  },
  locationText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LocationTrackingScreen;