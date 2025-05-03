import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { collection, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../db/firebaseConfig'; // Adjust this import according to your Firebase config file

const BusTrackingScreen = () => {
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
            <View 
              key={index} 
              style={styles.resultItem}
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
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  inputContainer: {
    marginBottom: 16,
    zIndex: Platform.OS === 'ios' ? 2000 - 500 : undefined,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500'
  },
  autocompleteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: Platform.OS === 'ios' ? 1 : undefined,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
    height: 48
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
    marginLeft: 8
  },
  clearButtonText: {
    color: '#4b5563',
    fontWeight: 'bold'
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center'
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  resultsContainer: {
    flex: 1
  },
  resultItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb'
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  routeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  busNumberTag: {
    backgroundColor: '#3b82f6',
    color: 'white',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500'
  },
  resultText: {
    marginBottom: 6,
    color: '#4b5563'
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
  updatedText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic'
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 32
  }
});

export default BusTrackingScreen;