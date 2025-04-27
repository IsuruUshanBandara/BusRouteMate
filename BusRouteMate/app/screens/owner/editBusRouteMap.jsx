import { StyleSheet, View, Alert, ActivityIndicator, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../db/firebaseConfig';
import { GOOGLE_MAPS_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const EditBusRouteMap = () => {
  const router = useRouter();
  const { plateNumber, routeDocId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [routeData, setRouteData] = useState({
    routeName: '',
    routeNum: '',
    origin: { name: '', coordinates: { latitude: 0, longitude: 0 } },
    destination: { name: '', coordinates: { latitude: 0, longitude: 0 } },
    passingCities: [],
    distance: 0,
    duration: 0
  });
  const [mapPoints, setMapPoints] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        setIsLoading(true);
        const routeDocRef = doc(db, 'routes', routeDocId);
        const routeDocSnap = await getDoc(routeDocRef);
        
        if (routeDocSnap.exists()) {
          const data = routeDocSnap.data();
          
          // Prepare route data from Firestore using the coordinates array
          const routeData = {
            routeName: data.routeName || data.busRoute || '',
            routeNum: data.routeNum || '',
            origin: {
              name: data.origin?.name || (data.coordinates?.[0]?.name || ''),
              coordinates: data.origin?.coordinates || 
                (data.coordinates?.[0] ? { 
                  latitude: data.coordinates[0].latitude, 
                  longitude: data.coordinates[0].longitude 
                } : null)
            },
            destination: {
              name: data.destination?.name || 
                (data.coordinates?.length > 0 ? data.coordinates[data.coordinates.length - 1].name : ''),
              coordinates: data.destination?.coordinates || 
                (data.coordinates?.length > 0 ? { 
                  latitude: data.coordinates[data.coordinates.length - 1].latitude, 
                  longitude: data.coordinates[data.coordinates.length - 1].longitude 
                } : null)
            },
            // Passing cities are all coordinates except first and last
            passingCities: data.coordinates?.slice(1, -1).map(point => ({
              name: point.name,
              coordinates: {
                latitude: point.latitude,
                longitude: point.longitude
              }
            })) || [],
            distance: data.distance || 0,
            duration: data.duration || 0,
            coordinates: data.coordinates || [] // Keep the full coordinates array
          };
    
          setRouteData(routeData);
    
          // Prepare map points directly from coordinates array
          const points = data.coordinates?.map((point, index) => {
            let type = 'passing';
            if (index === 0) type = 'origin';
            if (index === data.coordinates.length - 1) type = 'destination';
            
            return {
              latitude: point.latitude,
              longitude: point.longitude,
              name: point.name,
              type: type
            };
          }) || [];
    
          setMapPoints(points);
    
          // Fit map to show all points
          if (mapRef.current && points.length > 0) {
            setTimeout(() => {
              mapRef.current.fitToCoordinates(points, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true
              });
            }, 500);
          }
        } else {
          Alert.alert('Error', 'Route not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
        Alert.alert('Error', 'Failed to load route data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouteData();
  }, [routeDocId]);

  const handleDirectionsReady = (result) => {
    if (result) {
      setRouteData(prev => ({
        ...prev,
        distance: result.distance,
        duration: result.duration
      }));
    }
  };

  const handleSaveRoute = async () => {
    try {
      setIsSaving(true);
      
      // Reconstruct the coordinates array from mapPoints
      const coordinates = mapPoints.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        name: point.name
      }));
  
      const updateData = {
        routeName: routeData.routeName,
        routeNum: routeData.routeNum,
        origin: {
          name: mapPoints[0]?.name || routeData.origin.name,
          coordinates: {
            latitude: mapPoints[0]?.latitude,
            longitude: mapPoints[0]?.longitude
          }
        },
        destination: {
          name: mapPoints[mapPoints.length - 1]?.name || routeData.destination.name,
          coordinates: {
            latitude: mapPoints[mapPoints.length - 1]?.latitude,
            longitude: mapPoints[mapPoints.length - 1]?.longitude
          }
        },
        // Passing cities are just names (maintaining the existing structure)
        passingCities: mapPoints.slice(1, -1).map(point => ({
          name: point.name
        })),
        coordinates: coordinates, // Save the full coordinates array
        distance: routeData.distance,
        duration: routeData.duration,
        updatedAt: new Date().toISOString()
      };
  
      await updateDoc(doc(db, 'routes', routeDocId), updateData);
      
      Alert.alert(
        'Success',
        'Route updated successfully',
        [{ text: 'OK', onPress: () => router.replace('/screens/owner/manageBuses') }]
      );
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'origin': return '#4CAF50'; // Green
      case 'destination': return '#F44336'; // Red
      default: return '#2196F3'; // Blue
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading route map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.heading}>Route Map Preview</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.busText}>Bus: {plateNumber}</Text>
        <Text style={styles.routeText}>{routeData.routeName} (Route {routeData.routeNum})</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Distance: {(routeData.distance / 1000).toFixed(1)} km</Text>
          <Text style={styles.statText}>Duration: {Math.ceil(routeData.duration / 60)} mins</Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: routeData.origin.coordinates?.latitude || 7.8731,
          longitude: routeData.origin.coordinates?.longitude || 80.7718,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        }}
      >
        {mapPoints.map((point, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={point}
            title={point.name}
            description={point.type}
            pinColor={getMarkerColor(point.type)}
          />
        ))}
        
        {mapPoints.length >= 2 && (
          <MapViewDirections
            origin={mapPoints[0]}
            destination={mapPoints[mapPoints.length - 1]}
            waypoints={mapPoints.slice(1, -1)}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#1976d2"
            onReady={handleDirectionsReady}
          />
        )}
      </MapView>

      <Button
        mode="contained"
        onPress={handleSaveRoute}
        style={styles.saveButton}
        loading={isSaving}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  busText: {
    fontSize: 16,
    color: '#666',
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 16,
    color: '#1976d2',
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  saveButton: {
    margin: 16,
    paddingVertical: 8,
    backgroundColor: '#1976d2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default EditBusRouteMap;