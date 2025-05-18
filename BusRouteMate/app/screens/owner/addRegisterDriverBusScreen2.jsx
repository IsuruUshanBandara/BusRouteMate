import 'react-native-get-random-values';
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {GOOGLE_MAPS_API_KEY} from '@env';
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRef, useState, useEffect, useMemo } from "react";
import MapViewDirections from "react-native-maps-directions";
import { router, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const AddRegisterDriverBusScreen2 = () => {
  const { busData } = useLocalSearchParams();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [allRoutesData, setAllRoutesData] = useState([]);
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');

  // Refs for tracking state
  const mapRef = useRef(null);
  const coordinateCache = useRef({});

  // Parse and memoize route data
  const parsedData = useMemo(() => {
    try {
      return busData ? JSON.parse(busData) : null;
    } catch (e) {
      setError("Invalid route data format");
      return null;
    }
  }, [busData]);

  const routes = parsedData?.routes || [];
  const plateNum = parsedData?.licencePlateNum || '';
  
  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch owner details from Firestore using the email
          const email = user.email;
          const ownerDocRef = doc(db, 'ownerDetails', email);
          const ownerDoc = await getDoc(ownerDocRef);

          if (ownerDoc.exists()) {
            setOwnerPhoneNumber(ownerDoc.data().phoneNumber);
          } else {
            console.error('Owner document not found in Firestore.');
          }
        } catch (error) {
          console.error('Error fetching owner details:', error);
        }
      } else {
        router.push('../../(auth)/owner/privateSignIn');
      }
    });
    return unsubscribe;
  }, []);

  // Memoize current route to prevent unnecessary recalculations
  const currentRoute = useMemo(() => {
    return routes[routeIndex] || {};
  }, [routes, routeIndex]);

  const geocodeRoutePoints = async (passingCities) => {
    try {
      if (!passingCities || !Array.isArray(passingCities)) {
        throw new Error("Invalid passingCities array");
      }
      
      const geocodedPoints = [];
      
      for (const [index, point] of passingCities.entries()) {
        if (!point) continue;
        
        if (coordinateCache.current[point]) {
          geocodedPoints.push(coordinateCache.current[point]);
          continue;
        }
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(point)}&key=${GOOGLE_API_KEY}`
        );
        const json = await response.json();
        
        if (json.results.length > 0) {
          const { lat, lng } = json.results[0].geometry.location;
          const pointData = {
            name: point,
            latitude: lat,
            longitude: lng
          };
          coordinateCache.current[point] = pointData;
          geocodedPoints.push(pointData);
        }
      }
      
      if (geocodedPoints.length < 2) {
        throw new Error("Could not geocode enough points");
      }
      
      return geocodedPoints;
    } catch (error) {
      console.error("Geocoding failed:", error);
      throw error;
    }
  };

  // Load all routes when component mounts
  useEffect(() => {
    const loadAllRoutes = async () => {
      setLoading(true);
      try {
        const routesData = [];
        
        for (const route of routes) {
          const coords = await geocodeRoutePoints(route.passingCities);
          routesData.push({
            ...route,
            coordinates: coords,
            distance: 0, // Will be calculated later
            duration: 0
          });
        }
        
        setAllRoutesData(routesData);
        if (routesData.length > 0) {
          updateCurrentRouteData(routesData[0]);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (routes.length > 0) {
      loadAllRoutes();
    }
  }, [routes]);

  const updateCurrentRouteData = (routeData) => {
    setCoordinates(routeData.coordinates);
    setDistance(routeData.distance);
    setDuration(routeData.duration);
    fitMapToCoordinates(routeData.coordinates);
  };

  const fitMapToCoordinates = (coords) => {
    if (mapRef.current && coords.length > 0) {
      setTimeout(() => {
        try {
          mapRef.current?.fitToCoordinates(
            coords.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
            {
              edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
              animated: true
            }
          );
        } catch (e) {
          console.error("Error fitting map:", e);
        }
      }, 500);
    }
  };

  const traceRouteOnReady = (args) => {
    if (args) {
      setDistance(args.distance);
      setDuration(args.duration);
      
      // Update the distance and duration in allRoutesData
      setAllRoutesData(prev => {
        const updated = [...prev];
        updated[routeIndex] = {
          ...updated[routeIndex],
          distance: args.distance,
          duration: args.duration
        };
        return updated;
      });
    }
  };

  const handleNextRoute = () => {
    if (routeIndex < routes.length - 1) {
      const nextIndex = routeIndex + 1;
      setRouteIndex(nextIndex);
      updateCurrentRouteData(allRoutesData[nextIndex]);
    }
  };

  const handlePrevRoute = () => {
    if (routeIndex > 0) {
      const prevIndex = routeIndex - 1;
      setRouteIndex(prevIndex);
      updateCurrentRouteData(allRoutesData[prevIndex]);
    }
  };

  const handleEditRoute = () => {
    // router.push({
    //   pathname: 'screens/owner/addRegisterDriverBusScreen1.1',
    //   params: { busData: JSON.stringify(parsedData) },
    // });
    router.back();
  };

  const handleSaveAllRoutes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Save each route to Firestore
      for (const route of allRoutesData) {
        const routeData = {
          routeNum: route.routeNum,
          busRoute: route.busRoute,
          licencePlateNum: plateNum,
          ownerPhoneNumber: ownerPhoneNumber,
          origin: {
            name: route.passingCities[0],
            latitude: route.coordinates[0].latitude,
            longitude: route.coordinates[0].longitude
          },
          destination: {
            name: route.passingCities[route.passingCities.length - 1],
            latitude: route.coordinates[route.coordinates.length - 1].latitude,
            longitude: route.coordinates[route.coordinates.length - 1].longitude
          },
          // passingCities: route.coordinates.slice(1, -1).map((coord, index) => ({
          //   name: route.passingCities[index + 1],
          //   latitude: coord.latitude,
          //   longitude: coord.longitude
          // })),
          coordinates: route.coordinates,
          distance: route.distance,
          duration: route.duration,
          createdAt: new Date().toISOString()
        };

        // Save to both collections for easier querying
        const routeRef = doc(db, 'routes', `${plateNum}-${route.busRoute}`);
        await setDoc(routeRef, routeData);

        // Also save under the owner's collection
        // if (ownerPhoneNumber) {
        //   const ownerRouteRef = doc(
        //     db, 
        //     `privateOwners/${ownerPhoneNumber}/routes`,
        //     `${plateNum}-${route.busRoute}`
        //   );
        //   await setDoc(ownerRouteRef, routeData);
        // }
      }

      Alert.alert("Success", "All routes saved successfully!");
      router.push({
        pathname: 'screens/owner/addRegisterDriverBusScreen3',
        params: { plateNum: JSON.stringify(plateNum) }
      });
    } catch (error) {
      console.error("Error saving routes:", error);
      Alert.alert("Error", "Failed to save routes");
    }
  };
  const handleSaveButtonPress = () => {
    // Show confirmation alert
    Alert.alert(
      "Confirm Save",
      "Are you sure you want to save all routes? Once you proceed to the next step, you won't be able to return to this page. You can still make changes later from the edit page.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Save All", 
          onPress: handleSaveAllRoutes  // Call your existing save function if confirmed
        }
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading route data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditRoute}
        >
          <Text style={styles.editButtonText}>Edit Route</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>
        Route {currentRoute.routeNum}: {currentRoute.busRoute}
      </Text>
      <Text style={styles.subHeaderText}>Plate: {plateNum}</Text>
      <Text style={styles.routeCounter}>
        Route {routeIndex + 1} of {routes.length}
      </Text>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_POSITION}
        onMapReady={() => coordinates.length > 0 && fitMapToCoordinates(coordinates)}
      >
        {coordinates.length > 0 && (
          <>
            <Marker 
              coordinate={coordinates[0]} 
              title="Origin" 
              description={coordinates[0].name}
            />
            
            <Marker 
              coordinate={coordinates[coordinates.length - 1]} 
              title="Destination" 
              description={coordinates[coordinates.length - 1].name}
            />
            
            {coordinates.slice(1, -1).map((point, index) => (
              <Marker
                key={`passing-${index}`}
                coordinate={point}
                pinColor="orange"
                title={`Stop ${index + 1}`}
                description={point.name}
              />
            ))}
            
            <MapViewDirections
              origin={coordinates[0]}
              destination={coordinates[coordinates.length - 1]}
              waypoints={coordinates.slice(1, -1)}
              apikey={GOOGLE_API_KEY}
              strokeColor="#6644ff"
              strokeWidth={4}
              onReady={traceRouteOnReady}
            />
          </>
        )}
      </MapView>

      <View style={styles.infoContainer}>
        {/* <View style={styles.routeInfo}>
          <Text style={styles.infoText}>Distance: {(distance / 1000).toFixed(2)} km</Text>
          <Text style={styles.infoText}>Duration: {Math.ceil(duration / 60)} min</Text>
        </View> */}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={handleEditRoute}
          >
            <Text style={styles.buttonText}>Edit Route</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={[styles.navButton, routeIndex === 0 && styles.disabledButton]}
            onPress={handlePrevRoute}
            disabled={routeIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          {routeIndex < routes.length - 1 ? (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNextRoute}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navButton, styles.saveButton]}
              onPress={handleSaveButtonPress}
            >
              <Text style={styles.navButtonText}>Save All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  editButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
    color: '#333',
  },
  subHeaderText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
    color: '#666',
  },
  routeCounter: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    color: '#666',
  },
  map: {
    width: '100%',
    height: '64%',
  },
  infoContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    // height: '20%',
  },
  routeInfo: {
    marginBottom: 15,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 15,
    // marginTop: 80,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonText: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: "#007bff",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  navButtonText: {
    color: "#fff",
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
});

export default AddRegisterDriverBusScreen2;