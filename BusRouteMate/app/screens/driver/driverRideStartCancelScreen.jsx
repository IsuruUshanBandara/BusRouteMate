import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { Menu, Provider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { realtimeDb, db, auth } from '../../db/firebaseConfig';
import { ref, set, serverTimestamp, remove, onValue } from 'firebase/database';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as geolib from 'geolib'; // Import geolib for distance calculations

const DriverRideStartCancel = () => {
  const router = useRouter();
  const { licensePlateNumber } = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);
  const [destMenuVisible, setDestMenuVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  const [currentCity, setCurrentCity] = useState(null); // Store the current closest city
  const [cityUpdateInterval, setCityUpdateInterval] = useState(null); // Store the interval for city updates
  
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

  // Fetch route data when a route is selected
  useEffect(() => {
    const fetchRouteData = async () => {
      if (!selectedRoute) {
        setRouteData(null);
        setDestinationOptions([]);
        setSelectedDestination('');
        return;
      }

      try {
        // Fetch the route document from Firestore
        const routeDocRef = doc(db, 'routes', `${licensePlateNumber}-${selectedRoute}`);
        const routeDocSnap = await getDoc(routeDocRef);

        if (routeDocSnap.exists()) {
          const data = routeDocSnap.data();
          setRouteData(data);

          // Extract origin and destination from coordinates array
          if (data.coordinates && data.coordinates.length >= 2) {
            const originName = data.coordinates[0]?.name || '';
            const destName = data.coordinates[data.coordinates.length - 1]?.name || '';
            
            // Set destination options
            setDestinationOptions([originName, destName]);
            
            // Set default destination to the last item in coordinates array
            setSelectedDestination(destName);
            setIsReversed(false);
          }
        } else {
          console.log('No such route document!');
          setRouteData(null);
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
        Alert.alert('Error', 'Failed to load route data. Please try again.');
      }
    };

    fetchRouteData();
  }, [selectedRoute, licensePlateNumber]);
  
  const toggleMenuVisibility = () => {
    setMenuVisible(!menuVisible);
  };

  const toggleDestMenuVisibility = () => {
    setDestMenuVisible(!destMenuVisible);
  };

  // Handle destination change
  const handleDestinationChange = async (destination) => {
    if (!routeData || !routeData.coordinates || !selectedRoute) return;
    
    const originName = routeData.coordinates[0]?.name;
    const destName = routeData.coordinates[routeData.coordinates.length - 1]?.name;
    
    // If selected destination is not the current destination, reverse is needed
    const needsReverse = destination !== destName;
    
    setSelectedDestination(destination);
    setIsReversed(needsReverse);
    setDestMenuVisible(false);
    
    try {
      // Construct the document ID based on license plate number and selected route
      const docId = `${licensePlateNumber}-${selectedRoute}`;
      
      // Reference to the document
      const routeDocRef = doc(db, 'routes', docId);
      
      // Update data with new destination and reversed coordinates if needed
      const updateData = {
        destination: destination
      };
      
      // If direction changed, reverse the coordinates array
      if (needsReverse) {
        // Create a deep copy of coordinates array and reverse it
        const reversedCoordinates = [...routeData.coordinates].reverse();
        updateData.coordinates = reversedCoordinates;
        
        // Also update origin and destination if they exist in the document
        if (routeData.origin && routeData.destination) {
          updateData.origin = routeData.destination;
          updateData.destination = routeData.origin;
        }
        
        console.log('Reversing coordinates array');
      }
      
      // Update Firestore document
      await updateDoc(routeDocRef, updateData);
      
      // If a document exists in startedRoutes, update it as well
      const startedRouteDocRef = doc(db, 'startedRoutes', docId);
      const startedRouteDocSnap = await getDoc(startedRouteDocRef);
      
      if (startedRouteDocSnap.exists()) {
        await updateDoc(startedRouteDocRef, updateData);
        console.log(`Updated corresponding document in startedRoutes collection`);
      }
      
      // Update route data in local state to reflect changes
      if (needsReverse) {
        setRouteData({
          ...routeData,
          coordinates: [...routeData.coordinates].reverse(),
          origin: routeData.destination,
          destination: routeData.origin
        });
      } else {
        setRouteData({
          ...routeData,
          destination: { name: destination }
        });
      }
      
      console.log(`Route updated with new destination: ${destination}, reversed: ${needsReverse}`);
    } catch (error) {
      console.error('Error updating destination:', error);
      Alert.alert('Error', 'Failed to update destination. Please try again.');
    }
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

  // Find the closest city to the current location
  const findClosestCity = (currentLocation, coordinates) => {
    if (!currentLocation || !coordinates || coordinates.length === 0) return null;
    
    console.log('Current location:', currentLocation);
    console.log('Available coordinates points:', coordinates.length);
    
    let closestCity = null;
    let minDistance = Infinity;
    
    coordinates.forEach(cityCoord => {
      const distance = geolib.getDistance(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: cityCoord.latitude, longitude: cityCoord.longitude }
      );
      
      console.log(`Distance to ${cityCoord.name}: ${distance} meters`);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = cityCoord;
      }
    });
    
    console.log(`Closest city found: ${closestCity?.name}, distance: ${minDistance} meters`);
    return closestCity;
  };

  // Update current city in Firestore
  const updateCurrentCityInFirestore = async (cityData) => {
    if (!cityData || !selectedRoute || !licensePlateNumber) return;
    
    const docId = `${licensePlateNumber}-${selectedRoute}`;
    
    try {
      // Update in routes collection
      const routeDocRef = doc(db, 'routes', docId);
      await updateDoc(routeDocRef, {
        currentCity: cityData.name,
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`Updated current city to ${cityData.name} in routes collection`);
      
      // Update in startedRoutes collection if exists
      const startedRouteDocRef = doc(db, 'startedRoutes', docId);
      const startedRouteDocSnap = await getDoc(startedRouteDocRef);
      
      if (startedRouteDocSnap.exists()) {
        await updateDoc(startedRouteDocRef, {
          currentCity: cityData.name,
          lastUpdated: new Date().toISOString()
        });
        console.log(`Updated current city to ${cityData.name} in startedRoutes collection`);
      }
      
      // Update local state
      setCurrentCity(cityData.name);
    } catch (error) {
      console.error('Error updating current city in Firestore:', error);
    }
  };

  // Setup real-time location monitoring for closest city detection
  const setupCurrentCityTracking = () => {
    const tripId = selectedRoute ? `${licensePlateNumber}-${selectedRoute}` : null;
    
    if (!tripId || !routeData || !routeData.coordinates) return;
    
    // Clear any existing intervals
    if (cityUpdateInterval) {
      clearInterval(cityUpdateInterval);
    }
    
    // Reference to the location in realtime database
    const locationRef = ref(realtimeDb, `/locations/${tripId}`);
    
    // Set up listener for location changes
    onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.latitude || !data.longitude) return;
      
      console.log('Received real-time location update:', data);
      
      // Find the closest city to the current location
      const closestCity = findClosestCity(
        { latitude: data.latitude, longitude: data.longitude },
        routeData.coordinates
      );
      
      // Only update if we found a city and it's different from the current one
      if (closestCity && closestCity.name !== currentCity) {
        console.log(`City changed from ${currentCity || 'none'} to ${closestCity.name}`);
        updateCurrentCityInFirestore(closestCity);
      }
    }, (error) => {
      console.error('Error getting location from realtime database:', error);
    });
    
    // Also set an interval as a backup mechanism to check for city updates
    // This will run every 30 seconds
    const interval = setInterval(() => {
      console.log('Running periodic city update check');
      
      // Get the current location from realtime database
      onValue(locationRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.latitude || !data.longitude) return;
        
        const closestCity = findClosestCity(
          { latitude: data.latitude, longitude: data.longitude },
          routeData.coordinates
        );
        
        if (closestCity && closestCity.name !== currentCity) {
          console.log(`Periodic check: City changed from ${currentCity || 'none'} to ${closestCity.name}`);
          updateCurrentCityInFirestore(closestCity);
        }
      }, { onlyOnce: true });
    }, 30000); // Check every 30 seconds
    
    setCityUpdateInterval(interval);
  };

  // Clean up city tracking interval
  const cleanupCityTracking = () => {
    if (cityUpdateInterval) {
      clearInterval(cityUpdateInterval);
      setCityUpdateInterval(null);
      console.log('City tracking interval cleared');
    }
  };

  // Update the status field and destination in both collections
  const updateRouteStatus = async (isActive) => {
    if (!selectedRoute || !licensePlateNumber || !selectedDestination) return;
    
    try {
      // Construct the document ID based on license plate number and selected route
      const docId = `${licensePlateNumber}-${selectedRoute}`;
      
      // Reference to the document in routes collection
      const routeDocRef = doc(db, 'routes', docId);
      
      // Update fields in routes collection
      await updateDoc(routeDocRef, {
        status: isActive,
        destination: selectedDestination,
        isReversed: isReversed,
        updatedAt: new Date().toISOString()
      });
      
      // Handle startedRoutes collection based on isActive status
      const startedRouteDocRef = doc(db, 'startedRoutes', docId);
      
      if (isActive) {
        // If activating route, get the current route data and copy to startedRoutes
        const routeDocSnap = await getDoc(routeDocRef);
        if (routeDocSnap.exists()) {
          const routeData = routeDocSnap.data();
          // Copy all data from routes collection to startedRoutes
          await setDoc(startedRouteDocRef, {
            ...routeData,
            status: isActive,
            destination: selectedDestination,
            isReversed: isReversed,
            updatedAt: new Date().toISOString(),
            startedAt: new Date().toISOString()  // Add tracking start time
          });
          console.log(`Created copy of route in startedRoutes collection: ${docId}`);
        }
      } else {
        // If deactivating route, remove from startedRoutes
        await deleteDoc(startedRouteDocRef);
        console.log(`Removed route from startedRoutes collection: ${docId}`);
      }
      
      console.log(`Route updated: ${docId}, status: ${isActive}, destination: ${selectedDestination}`);
    } catch (error) {
      console.error("Error updating route data:", error);
      Alert.alert("Error", "Failed to update route data.");
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
          
          // Save location to Firebase Realtime Database
          const locationRef = ref(realtimeDb, `/locations/${tripId}`);
          set(locationRef, {
            latitude,
            longitude,
            timestamp: serverTimestamp(),
            status: 'Started',
            licensePlate: licensePlateNumber,
            selectedRoute: selectedRoute,
            isReversed: isReversed, // Add flag to indicate if route is reversed
            selectedDestination: selectedDestination // Add selected destination
          }).catch(error => {
            console.error('Error updating location in database:', error);
          });
          
          // Find closest city on each location update
          if (routeData && routeData.coordinates) {
            const closestCity = findClosestCity(
              { latitude, longitude },
              routeData.coordinates
            );
            
            if (closestCity && closestCity.name !== currentCity) {
              console.log(`City changed during location tracking: ${currentCity || 'none'} -> ${closestCity.name}`);
              updateCurrentCityInFirestore(closestCity);
            }
          }
        }
      );
      
      // Store the subscription in state so we can access it later
      setLocationSubscription(subscription);
      
      // Setup city tracking based on realtime database updates
      setupCurrentCityTracking();
      
      console.log('Location tracking and city tracking started');
    } catch (error) {
      console.error("Error starting location tracking:", error);
      Alert.alert("Error", "Failed to start location tracking. Please try again.");
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    const tripId = selectedRoute ? `${licensePlateNumber}-${selectedRoute}` : null;
    
    if (!tripId) return;
    
    // Update status to canceled in database
    const locationRef = ref(realtimeDb, `/locations/${tripId}`);
    set(locationRef, {
      status: 'canceled',
      timestamp: serverTimestamp(),
      licensePlate: licensePlateNumber,
      selectedRoute: selectedRoute,
      isReversed: isReversed,
      selectedDestination: selectedDestination
    }).catch(error => {
      console.error('Error updating status in database:', error);
    });
    
    // Remove the subscription if it exists
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // Clean up city tracking
    cleanupCityTracking();
    
    console.log('Location tracking and city tracking stopped');
  };

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
      cleanupCityTracking();
    };
  }, []);

  // Function to sync route data between collections
  const syncRouteData = async (docId) => {
    try {
      // Get current route data
      const routeDocRef = doc(db, 'routes', docId);
      const routeDocSnap = await getDoc(routeDocRef);
      
      if (routeDocSnap.exists()) {
        // Reference to the document in startedRoutes collection
        const startedRouteDocRef = doc(db, 'startedRoutes', docId);
        
        // Copy all data from routes collection to startedRoutes
        await setDoc(startedRouteDocRef, {
          ...routeDocSnap.data(),
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Synced route data to startedRoutes collection: ${docId}`);
      }
    } catch (error) {
      console.error("Error syncing route data:", error);
    }
  };

  const startRide = async () => {
    if (!selectedRoute) {
      Alert.alert("Error", "Please select a route before starting the ride.");
      return;
    }

    if (!selectedDestination) {
      Alert.alert("Error", "Please select a destination before starting the ride.");
      return;
    }
    
    try {
      // Update the route status and destination in both collections
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
      // Update route status in both collections
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
            {/* Header with bus plate number */}
            <View style={styles.headerContainer}>
              <Text style={styles.plateNumber}>Bus: {licensePlateNumber}</Text>
            </View>
  
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Select Your Route</Text>
  
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading routes...</Text>
                </View>
              ) : (
                <>
                  {/* Route Dropdown */}
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <Pressable onPress={toggleMenuVisibility} style={styles.inputContainer}>
                        <TextInput
                          label="Select your route"
                          value={selectedRoute || ""}
                          placeholder={!selectedRoute ? "Select a route" : ""}
                          mode="outlined"
                          editable={false}
                          outlineColor="#1976d2"
                          activeOutlineColor="#1976d2"
                          right={
                            <TextInput.Icon 
                              icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                              onPress={toggleMenuVisibility}
                              color="#1976d2" 
                            />
                          }
                          style={styles.input}
                          theme={{ colors: { primary: '#1976d2' } }}
                        />
                      </Pressable>
                    }
                    contentStyle={styles.menuContent}
                  >
                    <ScrollView style={styles.dropdownScroll}>
                      {routes.length > 0 ? (
                        routes.map((route, index) => (
                          <Menu.Item
                            key={index}
                            onPress={() => {
                              setSelectedRoute(route);
                              setMenuVisible(false);
                            }}
                            title={route}
                            titleStyle={styles.menuItemText}
                            style={styles.menuItem}
                          />
                        ))
                      ) : (
                        <Menu.Item
                          title="No routes found"
                          disabled
                          titleStyle={styles.disabledMenuText}
                          style={styles.menuItem}
                        />
                      )}
                    </ScrollView>
                  </Menu>
  
                  {/* Destination Dropdown - Only show if route is selected */}
                  {selectedRoute && destinationOptions.length > 0 && (
                    <View style={styles.destinationSection}>
                      <Text style={styles.subHeading}>Select Destination</Text>
                      <Menu
                        visible={destMenuVisible}
                        onDismiss={() => setDestMenuVisible(false)}
                        anchor={
                          <Pressable onPress={toggleDestMenuVisibility} style={styles.inputContainer}>
                            <TextInput
                              label="Select destination"
                              value={selectedDestination || ""}
                              placeholder={!selectedDestination ? "Select a destination" : ""}
                              mode="outlined"
                              editable={false}
                              outlineColor="#1976d2"
                              activeOutlineColor="#1976d2"
                              right={
                                <TextInput.Icon 
                                  icon={destMenuVisible ? 'chevron-up' : 'chevron-down'} 
                                  onPress={toggleDestMenuVisibility}
                                  color="#1976d2"
                                />
                              }
                              style={styles.input}
                              theme={{ colors: { primary: '#1976d2' } }}
                            />
                          </Pressable>
                        }
                        contentStyle={styles.menuContent}
                      >
                        <ScrollView style={styles.dropdownScroll}>
                          {destinationOptions.map((destination, index) => (
                            <Menu.Item
                              key={index}
                              onPress={() => handleDestinationChange(destination)}
                              title={destination}
                              titleStyle={styles.menuItemText}
                              style={styles.menuItem}
                            />
                          ))}
                        </ScrollView>
                      </Menu>
  
                      {/* Direction indicator */}
                      {destinationOptions.length === 2 && (
                        <View style={styles.directionContainer}>
                          <Text style={styles.directionText}>
                            Direction: {isReversed ? destinationOptions[1] : destinationOptions[0]} → {selectedDestination}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
              
            {/* Current City Display */}
            {isTracking && currentCity && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Current Location</Text>
                <View style={styles.locationContainer}>
                  <Text style={styles.currentCityText}>Near: {currentCity}</Text>
                </View>
              </View>
            )}
              
            {/* Start Ride Section */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Start Your Ride</Text>
              <Pressable 
                style={[
                  styles.circleButton, 
                  isTracking ? styles.activeButton : styles.startButton,
                  (!selectedRoute || !selectedDestination) ? styles.disabledButton : null
                ]}
                onPress={startRide}
                disabled={isTracking || !selectedRoute || !selectedDestination}
              >
                <Text style={styles.buttonText}>
                  {isTracking ? 'Started' : 'Start'}
                </Text>
              </Pressable>
  
              {/* Display note about required selections if button is disabled */}
              {(!selectedRoute || !selectedDestination) && !isTracking && (
                <Text style={styles.requirementText}>
                  Please select both route and destination to start the ride.
                </Text>
              )}
  
              {/* Tracking Status */}
              {isTracking && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    Status: Tracking - Location is being shared
                  </Text>
                </View>
              )}
            </View>
  
            {/* Cancel Ride Section */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>Cancel Your Ride</Text>
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  You are not allowed to cancel the ride unless the bus faces any 
                  (accidents, tire puncture, or technical failure) that causes the bus not to move.
                </Text>
              </View>
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
      backgroundColor: '#f5f8fb',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    centeredContent: {
      flex: 1,
      paddingTop: 12,
    },
    headerContainer: {
      backgroundColor: '#1976d2',
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    plateNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#ffffff',
    },
    cardContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1976d2',
      textAlign: 'center',
      marginBottom: 16,
      textShadowColor: 'rgba(25, 118, 210, 0.15)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    loadingContainer: {
      padding: 12,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#757575',
    },
    inputContainer: {
      marginVertical: 8,
      width: '100%',
    },
    input: {
      backgroundColor: '#ffffff',
    },
    menuContent: {
      maxWidth: '90%',
      marginHorizontal: '5%',
      backgroundColor: '#ffffff',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
    },
    dropdownScroll: {
      maxHeight: 150,
    },
    menuItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    menuItemText: {
      color: '#1976d2',
      fontSize: 15,
    },
    disabledMenuText: {
      color: '#9e9e9e',
      fontSize: 15,
    },
    subHeading: {
      fontSize: 16,
      fontWeight: '600',
      color: '#757575',
      textAlign: 'center',
      marginBottom: 8,
    },
    destinationSection: {
      marginTop: 12,
    },
    directionContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: 'rgba(25, 118, 210, 0.05)',
      borderRadius: 4,
    },
    directionText: {
      fontSize: 14,
      color: '#1976d2',
      textAlign: 'center',
    },
    locationContainer: {
      padding: 12,
      backgroundColor: 'rgba(25, 118, 210, 0.05)',
      borderRadius: 8,
      alignItems: 'center',
    },
    currentCityText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1976d2',
    },
    warningContainer: {
      padding: 12,
      backgroundColor: 'rgba(244, 67, 54, 0.05)',
      borderRadius: 8,
      marginBottom: 16,
    },
    warningText: {
      fontSize: 14,
      color: '#f44336',
      textAlign: 'center',
    },
    requirementText: {
      fontSize: 14,
      color: '#FF9800',
      textAlign: 'center',
      marginTop: 12,
    },
    circleButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    startButton: {
      backgroundColor: '#2196F3',
    },
    activeButton: {
      backgroundColor: '#1976d2',
    },
    cancelButton: {
      backgroundColor: '#f44336',
    },
    disabledButton: {
      backgroundColor: '#9e9e9e',
      opacity: 0.7,
      shadowOpacity: 0.1,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    statusContainer: {
      marginTop: 12,
      padding: 10,
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: 8,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 14,
      color: '#4caf50',
      fontWeight: '500',
    }
  });