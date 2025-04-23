import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { Menu, Provider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { realtimeDb, db, auth } from '../../db/firebaseConfig';
import { ref, set, serverTimestamp, remove } from 'firebase/database';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';

const DriverRideStartCancel = () => {
  const router = useRouter();
  const { licensePlateNumber } = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      if (!auth.currentUser) {
        Alert.alert(
          "Not Authenticated",
          "You need to sign in to access this page.",
          [{ text: "OK", onPress: () => router.replace('/') }]
        );
      }
    };
    
    checkAuth();
  }, []);

  // Fetch routes from Firestore based on license plate number
  useEffect(() => {
    const fetchRoutes = async () => {
      if (!licensePlateNumber) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const routesCollection = collection(db, 'routes');
        const routesList = [];
        
        // Query for all documents in the routes collection
        const q = query(routesCollection);
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          // Check if document ID starts with the license plate number
          if (doc.id.startsWith(`${licensePlateNumber}-`)) {
            // Extract route name from document ID (after license plate)
            const routeName = doc.id.split('-').slice(1).join('-');
            routesList.push(routeName);
          }
        });
        
        setRoutes(routesList);
      } catch (error) {
        console.error("Error fetching routes:", error);
        Alert.alert("Error", "Failed to load routes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoutes();
  }, [licensePlateNumber]);
  
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

  // Update the status field in Firestore document
  const updateRouteStatus = async (isActive) => {
    if (!selectedRoute || !licensePlateNumber) return;
    
    try {
      // Construct the document ID based on license plate number and selected route
      const docId = `${licensePlateNumber}-${selectedRoute}`;
      
      // Reference to the document
      const routeDocRef = doc(db, 'routes', docId);
      
      // Update the status field
      await updateDoc(routeDocRef, {
        status: isActive
      });
      
      console.log(`Route status updated: ${docId}, status: ${isActive}`);
    } catch (error) {
      console.error("Error updating route status:", error);
      Alert.alert("Error", "Failed to update route status.");
    }
  };

  // Start location tracking
  const startLocationTracking = async () => {
    // Create a trip ID based on license plate and selected route
    const tripId = selectedRoute ? `${licensePlateNumber}-${selectedRoute}` : null;
    
    if (!tripId) return;
    
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
          
          // Save location to Firebase Realtime Database - removed userId from path
          const locationRef = ref(realtimeDb, `/locations/${tripId}`);
          set(locationRef, {
            latitude,
            longitude,
            timestamp: serverTimestamp(),
            status: 'Started', // Keep only status field and remove isActive
            licensePlate: licensePlateNumber,
            selectedRoute: selectedRoute
          }).catch(error => {
            console.error('Error updating location in database:', error);
          });
        }
      );
      
      // Store the subscription in state so we can access it later
      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error starting location tracking:", error);
      Alert.alert("Error", "Failed to start location tracking. Please try again.");
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    const tripId = selectedRoute ? `${licensePlateNumber}-${selectedRoute}` : null;
    
    if (!tripId) return;
    
    // Update status to canceled in database - removed userId from path
    const locationRef = ref(realtimeDb, `/locations/${tripId}`);
    set(locationRef, {
      status: 'canceled', // Only using status field, removed isActive
      timestamp: serverTimestamp(),
      licensePlate: licensePlateNumber,
      selectedRoute: selectedRoute
    }).catch(error => {
      console.error('Error updating status in database:', error);
    });
    
    // Remove the subscription if it exists
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
    };
  }, []);

  const startRide = async () => {
    if (!selectedRoute) {
      Alert.alert("Error", "Please select a route before starting the ride.");
      return;
    }
    
    try {
      // Update the route status in Firestore
      await updateRouteStatus(true);
      
      // Start tracking location
      await startLocationTracking();
      
      // Update tracking state
      setIsTracking(true);
    } catch (error) {
      console.error("Error starting ride:", error);
      Alert.alert("Error", "Failed to start the ride. Please try again.");
    }
  };

  const cancelRide = async () => {
    try {
      // Update route status in Firestore
      await updateRouteStatus(false);
      
      // Stop tracking location
      await stopLocationTracking();
      
      // Update tracking state
      setIsTracking(false);
    } catch (error) {
      console.error("Error canceling ride:", error);
      Alert.alert("Error", "Failed to cancel the ride. Please try again.");
    }
  };

  // If not authenticated, show nothing (redirect will happen)
  if (!auth.currentUser) {
    return null;
  }

  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centeredContent}>
            <Text style={styles.plateNumber}>Bus: {licensePlateNumber}</Text>
            <Text style={styles.heading}>Select Route from Below</Text>

            {isLoading ? (
              <Text style={styles.loadingText}>Loading routes...</Text>
            ) : (
              <>
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
                    {routes.length > 0 ? (
                      routes.map((route, index) => (
                        <Menu.Item
                          key={index}
                          onPress={() => {
                            setSelectedRoute(route);
                            setMenuVisible(false);
                          }}
                          title={route}
                          style={styles.menuItem}
                        />
                      ))
                    ) : (
                      <Menu.Item
                        title="No routes found"
                        disabled
                        style={styles.menuItem}
                      />
                    )}
                  </ScrollView>
                </Menu>
              </>
            )}
            
            {/* Start Ride Section */}
            <Text style={styles.heading}>Click the Below Button to Start the Ride</Text>
            <Pressable 
              style={[
                styles.circleButton, 
                isTracking ? styles.activeButton : styles.startButton,
                (!selectedRoute) ? styles.disabledButton : null
              ]}
              onPress={startRide}
              disabled={isTracking || !selectedRoute}
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
              style={[
                styles.circleButton, 
                styles.cancelButton,
                !isTracking ? styles.disabledButton : null
              ]}
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
  plateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#2196F3',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
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
  disabledButton: {
    backgroundColor: '#9e9e9e', // Gray
    opacity: 0.7,
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