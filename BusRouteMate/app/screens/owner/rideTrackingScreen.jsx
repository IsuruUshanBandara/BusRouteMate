import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { realtimeDb } from '../../db/firebaseConfig';
import { ref, onValue, off } from 'firebase/database';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../db/firebaseConfig'; // Make sure to import Firestore db
import { doc, getDoc } from 'firebase/firestore';

const LocationTrackingScreen = () => {
  // Get the parameters passed from the previous screen using useLocalSearchParams
  const { busPlate, routeId } = useLocalSearchParams();
  
  const [busLocation, setBusLocation] = useState(null);
  const [busStatus, setBusStatus] = useState('offline');
  const [routeInfo, setRouteInfo] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const mapRef = useRef(null);
  
  // Fetch route coordinates from Firestore
  useEffect(() => {
    const fetchRouteData = async () => {
      if (!busPlate || !routeId) {
        console.log("Missing busPlate or routeId");
        setIsLoading(false);
        return;
      }
      
      try {
        // Format the document ID as busPlate-routeId
        const formattedRouteId = `${routeId.replace(/\s+/g, '')}`;
        console.log("Fetching route data with ID:", formattedRouteId);
        
        // Get the route document from Firestore
        const routeDocRef = doc(db, "busRoute", formattedRouteId);
        const routeDoc = await getDoc(routeDocRef);
        
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          console.log("Route data retrieved:", routeData);
          
          // Extract coordinates array for the route
          if (routeData.coordinates && routeData.coordinates.length > 0) {
            // Transform coordinates for use with MapView
            const coords = routeData.coordinates.map(point => ({
              latitude: point.latitude,
              longitude: point.longitude,
              name: point.name || ''
            }));
            
            console.log("Processed route coordinates:", coords);
            setRouteCoordinates(coords);
            
            // Set origin and destination markers
            if (coords.length > 0) {
              setOriginMarker(coords[0]);
              setDestinationMarker(coords[coords.length - 1]);
              
              // Calculate region for the entire route
              const region = calculateRegionForCoordinates(coords);
              setInitialRegion(region);
              
              // If map is already rendered, animate to this region
              if (mapRef.current) {
                setTimeout(() => {
                  mapRef.current.animateToRegion(region, 1000);
                }, 500);
              }
            }
          } else {
            console.log("No coordinates found in route data");
          }
        } else {
          console.log("No route document found with ID:", formattedRouteId);
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRouteData();
  }, [busPlate, routeId]);
  
  // Function to calculate the region that includes all coordinates
  const calculateRegionForCoordinates = (coordinates) => {
    // Safety check for empty coordinates
    if (!coordinates || coordinates.length === 0) {
      return {
        latitude: 7.0, // Default to a location in Sri Lanka
        longitude: 80.0,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5
      };
    }
    
    // Initialize with the first coordinate
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;
    
    // Find min and max for each dimension
    coordinates.forEach(coordinate => {
      minLat = Math.min(minLat, coordinate.latitude);
      maxLat = Math.max(maxLat, coordinate.latitude);
      minLng = Math.min(minLng, coordinate.longitude);
      maxLng = Math.max(maxLng, coordinate.longitude);
    });
    
    // Calculate center point
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    
    // Add padding to the region (make it a bit larger than just the points)
    const latDelta = (maxLat - minLat) * 1.5 + 0.02;
    const lngDelta = (maxLng - minLng) * 1.5 + 0.02;
    
    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta
    };
  };
  
  // Subscribe to location updates using the routeId directly
  useEffect(() => {
    if (!routeId) {
      console.log("No route ID provided");
      setIsLoading(false);
      return;
    }
    
    console.log("Tracking location for route:", routeId);
    
    // Direct path to the route's location data
    const locationRef = ref(realtimeDb, `locations/${routeId}`);
    
    // Set up listener for location changes
    const locationListener = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Location data received:", data);
      
      if (data) {
        // Update status
        setBusStatus(data.status || 'offline');
        
        // Update route if available
        if (data.selectedRoute) {
          setRouteInfo(data.selectedRoute);
        }
        
        // Update timestamp
        if (data.timestamp) {
          const date = new Date(data.timestamp);
          setLastUpdate(date.toLocaleTimeString());
        }
        
        // Check if the trip is active based on status field
        const isActive = data.status === 'Started';
        
        // Only set location if latitude and longitude exists and trip is active
        if (data.latitude && data.longitude && isActive) {
          const newLocation = {
            latitude: data.latitude,
            longitude: data.longitude
          };
          setBusLocation(newLocation);
          
          // If no route coordinates yet, animate to bus location
          if ((!routeCoordinates || routeCoordinates.length === 0) && mapRef.current) {
            mapRef.current.animateToRegion({
              ...newLocation,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 1000);
          }
        } else {
          // No location data or trip not active
          setBusLocation(null);
        }
      } else {
        // No data found
        setBusStatus('offline');
        setBusLocation(null);
      }
    }, (error) => {
      console.error("Error fetching location data:", error);
      setBusStatus('offline');
    });
    
    // Clean up listener on unmount
    return () => {
      off(locationRef, 'value', locationListener);
    };
  }, [routeId]);

  const getStatusColor = () => {
    switch (busStatus) {
      case 'Started': return '#4CAF50'; // Green
      case 'canceled': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey for offline
    }
  };

  const getStatusText = () => {
    switch (busStatus) {
      case 'Started': return 'Bus Active';
      case 'canceled': return 'Trip Canceled';
      default: return 'Bus Offline';
    }
  };

  // Show a loading indicator while initially fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading route and bus location...</Text>
      </View>
    );
  }

  // Show a message instead of the map when trip is canceled or bus is offline
  const renderContent = () => {
    // If we have route coordinates, always show the map
    const shouldShowMap = routeCoordinates.length > 0 || (busLocation && busStatus === 'Started');

    if (busStatus === 'canceled' && !shouldShowMap) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.canceledText}>Trip Canceled</Text>
          <Text style={styles.subText}>
            This trip has been canceled.
          </Text>
        </View>
      );
    } else if (!shouldShowMap) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.waitingText}>Waiting for bus to start the trip...</Text>
          <Text style={styles.subText}>Route ID: {routeId}</Text>
          <Text style={styles.subText}>Bus: {busPlate}</Text>
        </View>
      );
    } else {
      // We have route coordinates or active bus, show the map
      return (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion || {
            latitude: busLocation?.latitude || 7.0,
            longitude: busLocation?.longitude || 80.0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Debug overlay to show if coordinates are loaded */}
          {/*<View style={styles.debugOverlay}>
            <Text>Route coordinates: {routeCoordinates.length}</Text>
          </View>*/}
          
          {/* Display the route as a polyline */}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={5}
              strokeColor="#3F51B5"
              lineDashPattern={[0]}
              geodesic={true}
            />
          )}
          
          {/* Display origin marker */}
          {originMarker && (
            <Marker
              coordinate={{
                latitude: originMarker.latitude,
                longitude: originMarker.longitude
              }}
              title="Origin"
              description={originMarker.name}
              pinColor="#00796B"
            />
          )}
          
          {/* Display destination marker */}
          {destinationMarker && (
            <Marker
              coordinate={{
                latitude: destinationMarker.latitude,
                longitude: destinationMarker.longitude
              }}
              title="Destination"
              description={destinationMarker.name}
              pinColor="#D32F2F"
            />
          )}
          
          {/* Display passing cities markers */}
          {routeCoordinates.length > 2 && routeCoordinates.slice(1, -1).map((point, index) => (
            <Marker
              key={`city-${index}`}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude
              }}
              title={point.name || `Stop ${index + 1}`}
              pinColor="#FF9800"
              opacity={0.8}
            />
          ))}
          
          {/* Display the current bus location */}
          {busLocation && busStatus === 'Started' && (
            <Marker
              coordinate={{
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
              }}
              title={`Bus ${busPlate || 'Unknown'}`}
              description={routeInfo || routeId}
            >
              <View style={styles.busMarker}>
                <Text style={styles.busMarkerText}>🚌</Text>
              </View>
            </Marker>
          )}
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
        {busPlate && (
          <Text style={styles.routeText}>
            Bus: {busPlate}
          </Text>
        )}
        {busLocation && busStatus === 'Started' && (
          <Text style={styles.locationText}>
            Location: {busLocation.latitude.toFixed(6)}, {busLocation.longitude.toFixed(6)}
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
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#555',
  },
  waitingText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
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
    marginTop: 5,
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
  },
  busMarker: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  busMarkerText: {
    fontSize: 20,
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 5,
    zIndex: 1000
  }
});

export default LocationTrackingScreen;