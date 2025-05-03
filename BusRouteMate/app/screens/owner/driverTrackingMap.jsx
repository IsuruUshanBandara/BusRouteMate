import { StyleSheet, View, ActivityIndicator, Dimensions, Image, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, realtimeDb } from '../../db/firebaseConfig';
import { GOOGLE_MAPS_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const OwnerBusRouteMapView = () => {
  const router = useRouter();
  const { busPlate, routeId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [busData, setBusData] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [cityMarkers, setCityMarkers] = useState([]);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const mapRef = useRef(null);
  const busLocationRef = useRef(null);

  useEffect(() => {
    const fetchBusRouteData = async () => {
      try {
        setIsLoading(true);
        
        // Extract routeName from routeId (busPlate-routeName format)
        const routeName = routeId.substring(busPlate.length + 1);
        
        // First, check if there's a started route in Firestore
        const busRouteDocRef = doc(db, 'startedRoutes', routeId);
        const busRouteSnapshot = await getDoc(busRouteDocRef);
        
        if (busRouteSnapshot.exists()) {
          const data = busRouteSnapshot.data();
          setBusData(data);
          
          if (data.coordinates && data.coordinates.length > 0) {
            // Create markers for all cities in the route
            const points = data.coordinates.map((point, index) => ({
              latitude: point.latitude,
              longitude: point.longitude,
              name: point.name,
              type: index === 0 ? 'origin' : 
                   index === data.coordinates.length - 1 ? 'destination' : 'city'
            }));
            
            // Set city markers for all points
            setCityMarkers(points);
            
            // Set origin and destination for the route line
            const origin = points[0];
            const destination = points[points.length - 1];
            
            // Set main points (origin and destination)
            setMapPoints([origin, destination]);
            
            // Store all waypoints for the route line
            const waypoints = points.slice(1, -1).map(point => ({
              latitude: point.latitude,
              longitude: point.longitude
            }));
            
            setRouteWaypoints(waypoints);
            
            // Set up real-time bus location tracking
            setupBusLocationTracking(busPlate, routeName);
            
            // Fit map to show all points
            if (mapRef.current) {
              setTimeout(() => {
                mapRef.current.fitToCoordinates(points, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true
                });
              }, 500);
            }
          } else {
            setErrorMsg('Route details not available');
          }
        } else {
          setErrorMsg('Bus route not found');
        }
      } catch (error) {
        console.error('Error fetching bus route data:', error);
        setErrorMsg('Failed to load route data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusRouteData();

    // Cleanup function
    return () => {
      if (busLocationRef.current) {
        off(busLocationRef.current);
      }
    };
  }, [busPlate, routeId]);

  // Function to set up real-time tracking of bus location
  const setupBusLocationTracking = (busPlate, routeName) => {
    // Format the document ID for the realtime database reference
    const busId = `${busPlate}-${routeName}`;
    const busLocationDbRef = ref(realtimeDb, `locations/${busId}`);
    
    // Set up listener for real-time updates
    busLocationRef.current = busLocationDbRef;
    
    onValue(busLocationDbRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Check if the route is canceled
        if (data.status === "canceled") {
          // Show an alert and navigate back when OK is clicked
          Alert.alert(
            "Route Canceled",
            "Bus has faced some issue. The ride canceled. Sorry for the inconvenience.",
            [
              { 
                text: "OK", 
                onPress: () => router.back() // Navigate back to active routes screen
              }
            ]
          );
          return; // Stop further processing
        }
        
        // Process bus location data
        if (data.latitude && data.longitude) {
          const newBusLocation = {
            latitude: data.latitude,
            longitude: data.longitude,
            status: data.status || 'Started'
          };
          
          setBusLocation(newBusLocation);
          
          // If map is already loaded, include bus in the view
          if (mapRef.current && cityMarkers.length > 0) {
            const allCoordinates = [...cityMarkers, newBusLocation];
            mapRef.current.fitToCoordinates(allCoordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true
            });
          }
        }
      } else {
        console.log('No live location data available for this bus');
      }
    }, (error) => {
      console.error('Error getting bus location updates:', error);
    });
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'origin': return '#4CAF50'; // Green for origin
      case 'destination': return '#F44336'; // Red for destination
      case 'city': return '#2196F3'; // Blue for intermediate cities
      default: return '#2196F3';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading bus route map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.heading}>Bus Route Tracking</Text>
      </View> */}

      <View style={styles.infoContainer}>
        <Text style={styles.routeText}>
          {busData.routeName || `${busData.origin} - ${busData.destination}`}
        </Text>
        <Text style={styles.busText}>
          Bus: {busPlate} | Route Number: {busData.routeNum || 'N/A'}
        </Text>
        
        <View style={styles.currentLocationContainer}>
          <Text style={styles.currentLocationLabel}>Current Location:</Text>
          <Text style={styles.currentLocationText}>{busData.currentCity || 'En Route'}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            Distance: {(busData.distance / 1000).toFixed(1)} km
          </Text>
          <Text style={styles.statText}>
            Duration: {Math.ceil(busData.duration / 60)} mins
          </Text>
          <Text style={styles.updatedText}>
            Last updated: {new Date(busData.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: cityMarkers[0]?.latitude || 7.8731,
          longitude: cityMarkers[0]?.longitude || 80.7718,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        }}
      >
        {/* All City Markers */}
        {cityMarkers.map((point, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={point}
            title={point.name}
            description={
              point.type === 'origin' ? 'Starting Point' : 
              point.type === 'destination' ? 'Destination' : 
              'Stopping Point'
            }
            pinColor={getMarkerColor(point.type)}
          />
        ))}
        
        {/* Bus Location Marker */}
        {busLocation && (
          <Marker
            key="bus-marker"
            coordinate={busLocation}
            title={`Bus ${busPlate}`}
            description="Current Bus Location"
          >
            <View style={styles.busMarkerContainer}>
              <View style={styles.busMarker}>
                <Text style={styles.busMarkerText}>🚌</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Route Direction Line with all waypoints */}
        {mapPoints.length >= 2 && (
          <MapViewDirections
            origin={mapPoints[0]}
            destination={mapPoints[1]}
            waypoints={routeWaypoints}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#3b82f6"
          />
        )}
      </MapView>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Origin</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Destination</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>City</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.busMarkerLegend}>
            <Text style={styles.busMarkerLegendText}>🚌</Text>
          </View>
          <Text style={styles.legendText}>Bus</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#1f2937'
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937'
  },
  busText: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 8
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6
  },
  currentLocationLabel: {
    fontWeight: '500',
    marginRight: 4,
    color: '#4b5563'
  },
  currentLocationText: {
    fontWeight: 'bold',
    color: '#059669'
  },
  statsContainer: {
    marginTop: 8
  },
  statText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 2
  },
  updatedText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic'
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#e5e7eb'
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563'
  },
  busMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  busMarker: {
    backgroundColor: '#FFC107',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: '#FFA000',
  },
  busMarkerText: {
    fontSize: 20,
  },
  busMarkerLegend: {
    marginRight: 4,
  },
  busMarkerLegendText: {
    fontSize: 16,
  }
});

export default OwnerBusRouteMapView;