import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../db/firebaseConfig';
import { GOOGLE_MAPS_API_KEY } from '@env';

const EditBusRouteDetails = () => {
  const router = useRouter();
  const { plateNumber, routeDocId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState({
    routeName: '',
    routeNum: '',
    origin: { name: '', placeId: '' },
    destination: { name: '', placeId: '' },
    passingCities: [],
  });
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [cityInputText, setCityInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const cityInputRefs = useRef([]);
  const timeoutRef = useRef(null);
  const [formElements, setFormElements] = useState([]);

  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        setIsLoading(true);
        const routeDocRef = doc(db, 'routes', routeDocId);
        const routeDocSnap = await getDoc(routeDocRef);
        
        if (routeDocSnap.exists()) {
          const data = routeDocSnap.data();
          setRouteData({
            routeName: data.routeName || data.busRoute || '',
            routeNum: data.routeNum || '',
            origin: {
              name: data.origin?.name || '',
              placeId: data.origin?.placeId || ''
            },
            destination: {
              name: data.destination?.name || '',
              placeId: data.destination?.placeId || ''
            },
            passingCities: data.passingCities?.map(city => ({
              name: city.name || '',
              placeId: city.placeId || ''
            })) || []
          });
        } else {
          Alert.alert('Error', 'Route not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching route details:', error);
        Alert.alert('Error', 'Failed to fetch route details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouteDetails();
  }, [routeDocId]);

  // Ensure refs array is updated when passingCities change
  useEffect(() => {
    cityInputRefs.current = Array(routeData.passingCities.length).fill(null);
  }, [routeData.passingCities.length]);

  // Prepare form elements for FlatList
  useEffect(() => {
    if (isLoading) return;
    
    const elements = [];
    
    // Add header
    elements.push({
      type: 'header',
      id: 'header',
    });
    
    // Add bus info
    elements.push({
      type: 'busInfo',
      id: 'busInfo',
    });
    
    // Add origin
    elements.push({
      type: 'origin',
      id: 'origin',
    });
    
    // Add passing cities
    routeData.passingCities.forEach((city, index) => {
      elements.push({
        type: 'passingCity',
        id: `passingCity-${index}`,
        index: index,
        city: city,
      });
    });
    
    // Add Add City button if no cities
    if (routeData.passingCities.length === 0) {
      elements.push({
        type: 'emptyCities',
        id: 'emptyCities',
      });
    }
    
    // Add destination - add this ONLY when no city is being edited
    if (editingCity === null) {
      elements.push({
        type: 'destination',
        id: 'destination',
      });
    }
    
    // Add save button
    if (showSaveButton) {
      elements.push({
        type: 'saveButton',
        id: 'saveButton',
      });
    }
    
    setFormElements(elements);
  }, [routeData, showSaveButton, isLoading, editingCity]);

  const handleSaveRoute = async () => {
    try {
      setIsLoading(true);
      
      const updateData = {
        passingCities: routeData.passingCities
          .filter(city => city.name)
          .map(city => ({
            name: city.name,
            placeId: city.placeId
          })),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'routes', routeDocId), updateData);
      
      router.push({
        pathname: 'screens/owner/editBusRouteMap',
        params: {
          plateNumber,
          routeDocId,
          routeName: routeData.routeName,
          routeNum: routeData.routeNum,
          origin: routeData.origin.name,
          originPlaceId: routeData.origin.placeId,
          destination: routeData.destination.name,
          destinationPlaceId: routeData.destination.placeId,
          passingCities: JSON.stringify(routeData.passingCities)
        }
      });
    } catch (error) {
      console.error('Error updating route:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoute = async () => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this route?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDoc(doc(db, 'routes', routeDocId));
              router.replace('/screens/owner/manageBuses');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'Failed to delete route');
    }
  };

  const handleAddPassingCity = () => {
    setRouteData(prev => ({
      ...prev,
      passingCities: [...prev.passingCities, { name: '', placeId: '' }]
    }));
    // Set the new city as the editing city
    setTimeout(() => {
      setEditingCity(routeData.passingCities.length);
      setCityInputText('');
    }, 100);
  };

  const handleRemovePassingCity = (index) => {
    if (editingCity === index) {
      setEditingCity(null);
      setSuggestions([]);
    }
    
    setRouteData(prev => ({
      ...prev,
      passingCities: prev.passingCities.filter((_, i) => i !== index)
    }));
  };

  const handleStartEditCity = (index) => {
    setEditingCity(index);
    setCityInputText(routeData.passingCities[index].name);
    setTimeout(() => {
      if (cityInputRefs.current[index]) {
        cityInputRefs.current[index].focus();
      }
    }, 100);
  };

  const handleCityInputChange = async (text) => {
    setCityInputText(text);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for API call
    timeoutRef.current = setTimeout(async () => {
      if (text.length > 1) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(cities)&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.predictions) {
            setSuggestions(data.predictions);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectCity = (suggestion) => {
    if (editingCity !== null) {
      const updatedCities = [...routeData.passingCities];
      updatedCities[editingCity] = {
        name: suggestion.description,
        placeId: suggestion.place_id
      };
      
      setRouteData(prev => ({ ...prev, passingCities: updatedCities }));
      
      // Clear suggestions first then clear editing state
      setSuggestions([]);
      setTimeout(() => {
        setEditingCity(null);
      }, 100);
    }
  };

  const handleBlurCityInput = () => {
    // Small delay to allow for suggestion selection
    setTimeout(() => {
      setSuggestions([]);
      if (editingCity !== null && cityInputText.trim() === '') {
        // If they left the input empty, remove the city
        handleRemovePassingCity(editingCity);
      } else if (editingCity !== null) {
        // If they typed something but didn't select a suggestion, keep their text
        const updatedCities = [...routeData.passingCities];
        if (cityInputText !== updatedCities[editingCity].name) {
          updatedCities[editingCity] = {
            name: cityInputText,
            placeId: updatedCities[editingCity].placeId || ''
          };
          setRouteData(prev => ({ ...prev, passingCities: updatedCities }));
        }
        setEditingCity(null);
      }
    }, 200);
  };

  useEffect(() => {
    setShowSaveButton(
      routeData.passingCities.length > 0 &&
      routeData.passingCities.every(city => city.name.trim() !== '')
    );
  }, [routeData.passingCities]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading route details...</Text>
      </View>
    );
  }

  // Render different types of items for the FlatList
  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.headerContainer}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
            <Text style={styles.heading}>Edit Passing Cities</Text>
            <IconButton
              icon="delete"
              size={24}
              color="#f44336"
              onPress={handleDeleteRoute}
            />
          </View>
        );
      case 'busInfo':
        return (
          <View style={styles.busInfoContainer}>
            <Text style={styles.busInfoText}>Bus: {plateNumber}</Text>
            <Text style={styles.busInfoText}>Route: {routeData.routeName} (Route {routeData.routeNum})</Text>
          </View>
        );
      case 'origin':
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Origin</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">{routeData.origin.name}</Text>
            </View>
          </View>
        );
      case 'passingCity':
        const index = item.index;
        const city = item.city;
        
        // Calculate dynamic z-index to ensure proper stacking
        const zIndexValue = editingCity === index ? 9999 : (1000 - index);
        
        return (
          <View key={`city-${index}`} style={[styles.inputContainer, { zIndex: zIndexValue }]}>
            <View style={styles.passingCityRow}>
              <View style={styles.passingCityLabelContainer}>
                <Text style={styles.passingCityLabel}>City {index + 1}</Text>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleStartEditCity(index)}
                style={styles.editIcon}
              />
              <IconButton
                icon="close"
                size={20}
                onPress={() => handleRemovePassingCity(index)}
                style={styles.deleteIcon}
              />
            </View>
            
            {editingCity === index ? (
              <View style={[styles.editingContainer, { zIndex: zIndexValue }]}>
                <TextInput
                  ref={ref => cityInputRefs.current[index] = ref}
                  style={styles.cityInput}
                  value={cityInputText}
                  onChangeText={handleCityInputChange}
                  placeholder="Enter city name"
                  autoFocus={true}
                  onBlur={handleBlurCityInput}
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectCity(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.displayField}
                onPress={() => handleStartEditCity(index)}
              >
                <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">{city.name}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'sectionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>In-Between Cities</Text>
            <TouchableOpacity onPress={handleAddPassingCity}>
              <Text style={styles.addButton}>+ Add City</Text>
            </TouchableOpacity>
          </View>
        );
      case 'emptyCities':
        return (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>In-Between Cities</Text>
              <TouchableOpacity onPress={handleAddPassingCity}>
                <Text style={styles.addButton}>+ Add City</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyCitiesContainer}>
              <Text style={styles.emptyCitiesText}>No passing cities added yet. Tap "+ Add City" to get started.</Text>
            </View>
          </>
        );
      case 'destination':
        return (
          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <Text style={styles.label}>Destination</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">{routeData.destination.name}</Text>
            </View>
          </View>
        );
      case 'saveButton':
        return (
          <Button
            mode="contained"
            onPress={handleSaveRoute}
            style={styles.saveButton}
            loading={isLoading}
          >
            Continue to Map
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={styles.container}
      >
        <FlatList
          data={formElements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          ListFooterComponent={
            // Add destination at the bottom if a city is being edited
            editingCity !== null ? (
              <View style={[styles.inputContainer, { zIndex: 1, marginTop: 150 }]}>
                <Text style={styles.label}>Destination</Text>
                <View style={styles.displayField}>
                  <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">{routeData.destination.name}</Text>
                </View>
              </View>
            ) : <View style={{ height: 100 }} />
          }
        />
        
        {routeData.passingCities.length > 0 && (
          <TouchableOpacity 
            style={styles.floatingAddButton} 
            onPress={handleAddPassingCity}
          >
            <Text style={styles.floatingAddButtonText}>+ Add City</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  busInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  busInfoText: {
    fontSize: 16,
    color: '#1976d2',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  displayField: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    color: '#1976d2',
    fontWeight: '500',
    fontSize: 16,
  },
  passingCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  passingCityLabelContainer: {
    flex: 1,
  },
  passingCityLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  editIcon: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  deleteIcon: {
    marginLeft: 0,
    marginRight: 0,
  },
  citiesList: {
    marginBottom: 16,
  },
  editingContainer: {
    position: 'relative',
  },
  cityInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 5, // For Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#1976d2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyCitiesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyCitiesText: {
    color: '#757575',
    textAlign: 'center',
    fontSize: 16,
  },
  floatingAddButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  floatingAddButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditBusRouteDetails;