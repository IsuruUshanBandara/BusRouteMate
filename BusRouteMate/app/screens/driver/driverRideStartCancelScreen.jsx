import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Menu, Provider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { realtimeDb } from '../../db/firebaseConfig';
import { ref, set, serverTimestamp, remove } from 'firebase/database';

const DriverRideStartCancel = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  
  // User and trip identifiers - you can modify as needed
  const userId = 'driver-1'; 
  const tripId = 'trip-1';
  
  const toggleMenuVisibility = () => {
    setMenuVisible(!menuVisible);
  };

  // Request location permissions when component mounts
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
    const startLocationTracking = async () => {
      if (isTracking) {
        try {
          const subscription = await Location.watchPositionAsync(
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
                status: 'online',
                selectedRoute: selectedRoute || 'Not selected'
              }).catch(error => {
                console.error('Error updating location in database:', error);
              });
            }
          );
          
          // Store the subscription in state so we can access it later
          setLocationSubscription(subscription);
        } catch (error) {
          console.error("Error starting location tracking:", error);
        }
      } else {
        // Update status to canceled in database instead of just setting status to offline
        const locationRef = ref(realtimeDb, `/locations/${tripId}/${userId}`);
        set(locationRef, {
          status: 'canceled',
          timestamp: serverTimestamp(),
          selectedRoute: selectedRoute || 'Not selected'
          // No location data - this will hide the location on the map
        }).catch(error => {
          console.error('Error updating status in database:', error);
        });
        
        // Remove the subscription if it exists
        if (locationSubscription) {
          locationSubscription.remove();
          setLocationSubscription(null);
        }
      }
    };
    
    startLocationTracking();
    
    // Cleanup function only runs on unmount or when dependencies change
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
    };
  }, [isTracking, tripId, userId, selectedRoute]);

  const startRide = () => {
    setIsTracking(true);
  };

  const cancelRide = () => {
    setIsTracking(false);
  };

  const routes = [
    "Kegalle-Avissawella",
    "Kegalle-Colombo",
    "Kegalle-Kandy",
    "Petta-kandy",
    "Avisawella-Kotiyakubura",
  ];

  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centeredContent}>
            <Text style={styles.heading}>Select Route from Below</Text>

            {/* Dropdown */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                  <Pressable onPress={toggleMenuVisibility} style={styles.input}>
                      <TextInput
                          label="Select your route"
                          value={selectedRoute || ""}
                          placeholder={!selectedRoute ? "Select a route" : ""}
                          mode="outlined"
                          editable={false}
                          right={
                              <TextInput.Icon 
                                  icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                                  onPress={toggleMenuVisibility} 
                              />
                          }
                      />
                  </Pressable>
              }
              contentStyle={[styles.menuContent, { width: '100%' }]}
            >
              <ScrollView style={{ maxHeight: 150 }}>
                  {routes.map((route, index) => (
                      <Menu.Item
                          key={index}
                          onPress={() => {
                              setSelectedRoute(route);
                              setMenuVisible(false);
                          }}
                          title={route}
                          style={styles.menuItem}
                      />
                  ))}
              </ScrollView>
            </Menu>
            
            {/* Start Ride Section */}
            <Text style={styles.heading}>Click the Below Button to Start the Ride</Text>
            <Pressable 
              style={[
                styles.circleButton, 
                isTracking ? styles.activeButton : styles.startButton
              ]}
              onPress={startRide}
              disabled={isTracking}
            >
              <Text style={styles.buttonText}>
                {isTracking ? 'Started' : 'Start'}
              </Text>
            </Pressable>

            {/* Tracking Status */}
            {isTracking && (
              <Text style={styles.statusText}>
                Status: Tracking - Location is being shared
              </Text>
            )}

            {/* Cancel Ride Section */}
            <Text style={styles.heading}>Click Below Button to Cancel the Ride</Text>
            <Text style={styles.warning}>
              You are not allowed to cancel the ride unless the bus faces any 
              (accidents, tire puncture, or technical failure) that causes the bus not to move.
            </Text>
            <Pressable 
              style={[styles.circleButton, styles.cancelButton]}
              onPress={cancelRide}
              disabled={!isTracking}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
};

export default DriverRideStartCancel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: '5%',
    paddingBottom: '5%',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginVertical: 10,
    width: '100%',
  },
  menuContent: {
    maxWidth: '100%',
    paddingHorizontal: 10,
  },
  menuItem: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  warning: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  circleButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    alignSelf: 'center',
  },
  startButton: {
    backgroundColor: '#4caf50', // Green
  },
  activeButton: {
    backgroundColor: '#2e7d32', // Darker Green
  },
  cancelButton: {
    backgroundColor: '#f44336', // Red
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: '#4caf50',
    textAlign: 'center',
    marginVertical: 10,
  }
});