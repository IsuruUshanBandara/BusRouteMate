import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { collection, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../db/firebaseConfig';
import { useRouter } from 'expo-router'; // Import useRouter for navigation

const BusTrackingScreen = () => {
  const router = useRouter(); // Initialize router
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // References for the GooglePlacesAutocomplete
  const locationRef = useRef(null);
  const destinationRef = useRef(null);

  // Store active listeners to unsubscribe when needed
  const liveUpdateListeners = useRef([]);

  // Clean up listeners when component unmounts
  useEffect(() => {
    return () => {
      liveUpdateListeners.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const handleSearch = async () => {
    if (!location || !destination) {
      setError('Please enter both origin and destination');
      return;
    }

    setError(null);
    setLoading(true);
    setSearchResults([]); // Clear previous results immediately
    
    console.log('Searching for buses:', { location, destination });
    
    try {
      // Clear previous listeners
      liveUpdateListeners.current.forEach(unsubscribe => unsubscribe());
      liveUpdateListeners.current = [];
      
      // Get all documents from startedRoutes collection
      const querySnapshot = await getDocs(collection(db, 'startedRoutes'));
      const results = [];
      
      if (querySnapshot.empty) {
        setError('No active buses found at this time');
        setLoading(false);
        return;
      }
      
      querySnapshot.forEach(doc => {
        const routeData = doc.data();
        const coordinates = routeData.coordinates || [];
        
        // Step 1: Check if origin and destination exist in coordinates array
        const originIndex = coordinates.findIndex(coord => coord.name === location);
        const destinationIndex = coordinates.findIndex(coord => coord.name === destination);
        
        // Check if both cities are found in the route
        if (originIndex !== -1 && destinationIndex !== -1) {
          // Step 2: Check if destination is ahead of origin in the route
          if (destinationIndex > originIndex) {
            const currentCityIndex = coordinates.findIndex(coord => coord.name === routeData.currentCity);
            
            // Step 3: Check if current city is before or at origin
            if (currentCityIndex !== -1 && currentCityIndex <= originIndex) {
              // Step 4: Extract relevant data
              const resultItem = {
                id: doc.id,
                route: `${routeData.origin} - ${routeData.destination}`,
                busNo: routeData.routeNum,
                rideStartTime: formatTimeOnly(routeData.updatedAt),
                currentCity: routeData.currentCity,
                licencePlate: routeData.licencePlateNum,
                updatedAt: new Date(routeData.lastUpdated).toLocaleString(),
                routeName: routeData.routeName || routeData.busRoute, // Get route name for navigation
              };
              
              results.push(resultItem);
              
              // Set up real-time listener for this specific document
              const unsubscribe = onSnapshot(doc.ref, (updatedDoc) => {
                // Check if document still exists (not deleted)
                if (updatedDoc.exists()) {
                  const updatedData = updatedDoc.data();
                  
                  setSearchResults(prevResults => {
                    return prevResults.map(result => {
                      if (result.id === doc.id) {
                        return {
                          ...result,
                          currentCity: updatedData.currentCity,
                          updatedAt: updatedData.lastUpdated,
                        };
                      }
                      return result;
                    });
                  });
                } else {
                  // Document was deleted (driver canceled the ride)
                  setSearchResults(prevResults => 
                    prevResults.filter(result => result.id !== doc.id)
                  );
                  
                  // Notify user that a ride was canceled
                  Alert.alert(
                    "Ride Canceled",
                    "A bus in your search results is no longer available.",
                    [{ text: "OK" }]
                  );
                }
              }, (error) => {
                console.error("Error listening to document:", error);
              });
              
              liveUpdateListeners.current.push(unsubscribe);
            }
          }
        }
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No buses found for this route');
      }
    } catch (err) {
      console.error('Error searching for buses:', err);
      setError('Failed to search for buses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearLocations = () => {
    if (locationRef.current) locationRef.current.clear();
    if (destinationRef.current) destinationRef.current.clear();
    setLocation('');
    setDestination('');
    setSearchResults([]);
    setError(null);
    
    // Clean up any active listeners
    liveUpdateListeners.current.forEach(unsubscribe => unsubscribe());
    liveUpdateListeners.current = [];
  };

  const formatTimeOnly = (isoDateString) => {
    try {
      const date = new Date(isoDateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }
      // Format to show only hours and minutes (12-hour format with am/pm)
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "Invalid time";
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Recently updated";
      }
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Recently updated";
    }
  };

  // Navigate to map view when a bus card is pressed
  const handleBusCardPress = (result) => {
    router.push({
      pathname: '/screens/passenger/busRouteMapView',
      params: {
        licencePlate: result.licencePlate,
        routeName: result.routeName,
        location: location // Pass the user's selected origin location
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check and Track Bus</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location</Text>
        <GooglePlacesAutocomplete
          ref={locationRef}
          placeholder="Please enter city name"
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            types: '(cities)'
          }}
          fetchDetails={true}
          onPress={(data, details = null) => {
            const cityName = details?.address_components?.find(
              component => component.types.includes('locality')
            )?.long_name || data.description;
            
            setLocation(cityName);
            console.log('Selected origin city:', cityName);
          }}
          styles={{
            textInput: styles.autocompleteInput,
            container: {
              flex: 0,
            },
            listView: {
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              position: 'absolute',
              top: 50,
              left: 0,
              right: 0,
              zIndex: 1000,
            }
          }}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Destination</Text>
        <GooglePlacesAutocomplete
          ref={destinationRef}
          placeholder="Please enter city name"
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            types: '(cities)'
          }}
          fetchDetails={true}
          onPress={(data, details = null) => {
            const cityName = details?.address_components?.find(
              component => component.types.includes('locality')
            )?.long_name || data.description;
            
            setDestination(cityName);
            console.log('Selected destination city:', cityName);
          }}
          styles={{
            textInput: styles.autocompleteInput,
            container: {
              flex: 0,
            },
            listView: {
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              position: 'absolute',
              top: 50,
              left: 0,
              right: 0,
              zIndex: 500,
            }
          }}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearLocations}
          disabled={loading}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <Text style={styles.resultsTitle}>
        Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
      </Text>
      
      <ScrollView style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          searchResults.map((result, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.resultItem}
              onPress={() => handleBusCardPress(result)}
              activeOpacity={0.7}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.routeText}>{result.route}</Text>
                <Text style={styles.busNumberTag}>Route Number: {result.busNo}</Text>
              </View>
              
              <Text style={styles.resultText}>
                License Plate: {result.licencePlate}
              </Text>
              
              <Text style={styles.resultText}>
                Ride Started: {result.rideStartTime}
              </Text>
              
              <View style={styles.currentLocationContainer}>
                <Text style={styles.currentLocationLabel}>Current Location:</Text>
                <Text style={styles.currentLocationText}>{result.currentCity}</Text>
              </View>
              
              <Text style={styles.updatedText}>
                Last updated: {formatDate(result.updatedAt)}
              </Text>
              
              <View style={styles.viewMapButton}>
                <Text style={styles.viewMapButtonText}>View on Map</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          !loading && !error && (
            <Text style={styles.noResultsText}>No buses found. Please search for a route.</Text>
          )
        )}
      </ScrollView>
    </View>
  );
};
export default BusTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f8ff' // Light blue background for the whole screen
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1976d2',
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 18,
    zIndex: Platform.OS === 'ios' ? 2000 - 500 : undefined,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
    color: '#333'
  },
  autocompleteInput: {
    borderWidth: 1,
    borderColor: '#bbd0ec',
    borderRadius: 10,
    padding: 12,
    height: 46,
    backgroundColor: 'white',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: Platform.OS === 'ios' ? 1 : undefined,
  },
  searchButton: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
    marginRight: 10,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  clearButton: {
    backgroundColor: '#e8f0fe',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c3d7f5',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16
  },
  errorText: {
    color: '#e53935',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f5',
    paddingBottom: 8
  },
  resultsContainer: {
    flex: 1
  },
  resultItem: {
    borderWidth: 1,
    borderColor: '#c3d7f5',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    backgroundColor: 'white',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8f5',
    paddingBottom: 10
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565c0',
    flex: 1
  },
  busNumberTag: {
    backgroundColor: '#1976d2',
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden'
  },
  resultText: {
    marginBottom: 8,
    color: '#424242',
    fontSize: 15
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8
  },
  currentLocationLabel: {
    fontWeight: '600',
    marginRight: 6,
    color: '#1976d2',
    fontSize: 15
  },
  currentLocationText: {
    fontWeight: 'bold',
    color: '#01579b',
    fontSize: 15
  },
  updatedText: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 6,
    marginBottom: 14,
    fontStyle: 'italic'
  },
  viewMapButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  noResultsText: {
    textAlign: 'center',
    color: '#78909c',
    marginTop: 40,
    fontSize: 16,
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 10
  }
});

