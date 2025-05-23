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
import { doc, getDoc, updateDoc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../db/firebaseConfig';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { onAuthStateChanged } from 'firebase/auth';

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
    coordinates: [],
  });
  const [originalRouteData, setOriginalRouteData] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [fieldInputText, setFieldInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const inputRefs = useRef({});
  const timeoutRef = useRef(null);
  const [formElements, setFormElements] = useState([]);
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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
        router.push('screens/owner/privateSignIn');
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        setIsLoading(true);
        const routeDocRef = doc(db, 'routes', routeDocId);
        const routeDocSnap = await getDoc(routeDocRef);
        
        if (routeDocSnap.exists()) {
          const data = routeDocSnap.data();
          
          // Extract origin, passing cities, and destination from coordinates array
          const coordinates = data.coordinates || [];
          const origin = coordinates[0] || { name: '', latitude: 0, longitude: 0 };
          const destination = coordinates[coordinates.length - 1] || { name: '', latitude: 0, longitude: 0 };
          const passingCities = coordinates.length > 2 ? 
            coordinates.slice(1, -1).map(city => ({ name: city.name || '', placeId: '' })) : [];
          
          const parsedData = {
            routeName: data.routeName || data.busRoute || '',
            routeNum: data.routeNum || '',
            origin: {
              name: origin.name || data.origin?.name || '',
              placeId: data.origin?.placeId || ''
            },
            destination: {
              name: destination.name || data.destination?.name || '',
              placeId: data.destination?.placeId || ''
            },
            passingCities: passingCities,
            coordinates: coordinates,
            createdAt: data.createdAt || new Date().toISOString(),
            ownerPhoneNumber: data.ownerPhoneNumber || '',
            licencePlateNum: data.licencePlateNum || plateNumber
          };
          
          setRouteData(parsedData);
          setOriginalRouteData(parsedData);
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

  useEffect(() => {
    inputRefs.current = {};
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const elements = [];
    
    // Add header with delete button
    elements.push({
      type: 'header',
      id: 'header',
    });
    
    // Add bus info with full route name display
    elements.push({
      type: 'busInfo',
      id: 'busInfo',
    });
    
    // Add route info (name and number)
    elements.push({
      type: 'routeInfo',
      id: 'routeInfo',
    });
    
    // Add origin (required)
    elements.push({
      type: 'origin',
      id: 'origin',
    });
    
    // Add passing cities section header
    elements.push({
      type: 'sectionHeader',
      id: 'sectionHeader',
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
    
    // Add destination (required)
    elements.push({
      type: 'destination',
      id: 'destination',
    });
    
    // Add save buttons
    elements.push({
      type: 'saveButtons',
      id: 'saveButtons',
    });
    
    setFormElements(elements);
  }, [routeData, isLoading, editingField]);

  const checkRouteExists = async (routeName) => {
    try {
      const routesRef = collection(db, 'routes');
      const q = query(routesRef, where('routeName', '==', routeName));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking route existence:', error);
      return false;
    }
  };

  const handleDeleteRoute = async () => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'routes', routeDocId));
      Alert.alert('Success', 'Route deleted successfully');
      router.back();
    } catch (error) {
      console.error('Error deleting route:', error);
      Alert.alert('Error', 'Failed to delete route');
    } finally {
      setIsLoading(false);
    }
  };

  const getCoordinatesForPlace = async (placeName) => {
    if (!placeName) return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  };

  const handleUpdateRoute = async () => {
    if (!routeData.origin.name || !routeData.destination.name) {
      Alert.alert('Error', 'Origin and destination cannot be blank');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if route already exists (only if name changed)
      if (originalRouteData.routeName !== routeData.routeName) {
        const routeExists = await checkRouteExists(routeData.routeName);
        if (routeExists) {
          Alert.alert('Error', 'A route with this name already exists');
          setIsLoading(false);
          return;
        }
      }

      // Prepare coordinates array
      const coordinates = [];
      
      // Add origin coordinates
      const originCoords = await getCoordinatesForPlace(routeData.origin.name);
      coordinates.push({
        name: routeData.origin.name,
        latitude: originCoords?.latitude || 0,
        longitude: originCoords?.longitude || 0
      });
      
      // Add passing cities coordinates
      for (const city of routeData.passingCities) {
        const cityCoords = await getCoordinatesForPlace(city.name);
        coordinates.push({
          name: city.name,
          latitude: cityCoords?.latitude || 0,
          longitude: cityCoords?.longitude || 0
        });
      }
      
      // Add destination coordinates
      const destCoords = await getCoordinatesForPlace(routeData.destination.name);
      coordinates.push({
        name: routeData.destination.name,
        latitude: destCoords?.latitude || 0,
        longitude: destCoords?.longitude || 0
      });
      
      const updateData = {
        routeName: routeData.routeName,
        busRoute: routeData.routeName,
        routeNum: routeData.routeNum,
        origin: {
          name: routeData.origin.name,
          placeId: routeData.origin.placeId
        },
        destination: {
          name: routeData.destination.name,
          placeId: routeData.destination.placeId
        },
        passingCities: routeData.passingCities.map(city => ({
          name: city.name,
          placeId: city.placeId
        })),
        coordinates: coordinates,
        updatedAt: new Date().toISOString(),
        ownerPhoneNumber: ownerPhoneNumber,
        licencePlateNum: routeData.licencePlateNum,
        createdAt: routeData.createdAt || new Date().toISOString()
      };

      // Check if route name has changed (which requires new document ID)
      const nameChanged = originalRouteData.routeName !== routeData.routeName;
      
      if (nameChanged) {
        const newDocId = `${plateNumber}-${routeData.routeName.replace(/\s+/g, '-')}`;
        
        // Transaction for atomic delete+create
        const batch = writeBatch(db);
        batch.delete(doc(db, 'routes', routeDocId));
        batch.set(doc(db, 'routes', newDocId), updateData);
        await batch.commit();
        
        router.push({
          pathname: 'screens/owner/editBusRouteMap',
          params: {
            plateNumber,
            routeDocId: newDocId,
            ...updateData,
            coordinates: JSON.stringify(coordinates)
          }
        });
      } else {
        // Update existing document
        await updateDoc(doc(db, 'routes', routeDocId), updateData);
        
        router.push({
          pathname: 'screens/owner/editBusRouteMap',
          params: {
            plateNumber,
            routeDocId,
            ...updateData,
            coordinates: JSON.stringify(coordinates)
          }
        });
      }
    } catch (error) {
      console.error('Error updating route:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPassingCity = () => {
    const newCity = { name: '', placeId: '' };
    setRouteData(prev => ({
      ...prev,
      passingCities: [...prev.passingCities, newCity]
    }));
    
    // Set focus on the new city input after a small delay
    setTimeout(() => {
      const newIndex = routeData.passingCities.length;
      setEditingField(`city-${newIndex}`);
      setFieldInputText('');
      if (inputRefs.current[`city-${newIndex}`]) {
        inputRefs.current[`city-${newIndex}`].focus();
      }
    }, 100);
  };

  const handleRemovePassingCity = (index) => {
    const updatedCities = [...routeData.passingCities];
    updatedCities.splice(index, 1);
    
    setRouteData(prev => ({
      ...prev,
      passingCities: updatedCities
    }));
    
    // Clear editing state if we're removing the currently edited city
    if (editingField === `city-${index}`) {
      setEditingField(null);
      setSuggestions([]);
    }
  };

  const handleStartEditField = (fieldId, initialValue = '') => {
    if (fieldId === 'routeName') return;
    setEditingField(fieldId);
    setFieldInputText(initialValue);
    setTimeout(() => {
      if (inputRefs.current[fieldId]) {
        inputRefs.current[fieldId].focus();
      }
    }, 100);
  };

  const handleFieldInputChange = async (text) => {
    setFieldInputText(text);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const isLocationField = 
      editingField === 'origin' || 
      editingField === 'destination' || 
      editingField?.startsWith('city-');
    
    if (isLocationField && text.length > 1) {
      timeoutRef.current = setTimeout(async () => {
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
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const cityOnly = suggestion.description.split(',')[0].trim();
    
    if (editingField === 'origin') {
      setRouteData(prev => ({
        ...prev,
        origin: {
          name: cityOnly,
          placeId: suggestion.place_id
        }
      }));
    } else if (editingField === 'destination') {
      setRouteData(prev => ({
        ...prev,
        destination: {
          name: cityOnly,
          placeId: suggestion.place_id
        }
      }));
    } else if (editingField?.startsWith('city-')) {
      const cityIndex = parseInt(editingField.split('-')[1]);
      const updatedCities = [...routeData.passingCities];
      updatedCities[cityIndex] = {
        name: cityOnly,
        placeId: suggestion.place_id
      };
      setRouteData(prev => ({ ...prev, passingCities: updatedCities }));
    }
    
    setSuggestions([]);
    setEditingField(null);
  };

  const handleConfirmTextEdit = () => {
    if (editingField === 'routeNum') {
      const updated = {...routeData, routeNum: fieldInputText};
      setRouteData(updated);
      setOriginalRouteData(updated);
    }
    setEditingField(null);
  };

  const handleBlurField = () => {
    setTimeout(() => {
      setSuggestions([]);
      
      if (editingField?.startsWith('city-') && fieldInputText.trim() === '') {
        const cityIndex = parseInt(editingField.split('-')[1]);
        handleRemovePassingCity(cityIndex);
      } else if (editingField === 'origin' || editingField === 'destination') {
        if (fieldInputText.trim() === '') {
          setEditingField(null);
        } else {
          if (editingField === 'origin') {
            setRouteData(prev => ({
              ...prev,
              origin: {
                name: fieldInputText,
                placeId: prev.origin.placeId
              }
            }));
          } else {
            setRouteData(prev => ({
              ...prev,
              destination: {
                name: fieldInputText,
                placeId: prev.destination.placeId
              }
            }));
          }
          setEditingField(null);
        }
      } else if (editingField?.startsWith('city-')) {
        const cityIndex = parseInt(editingField.split('-')[1]);
        const updatedCities = [...routeData.passingCities];
        
        if (fieldInputText !== updatedCities[cityIndex].name) {
          updatedCities[cityIndex] = {
            name: fieldInputText,
            placeId: updatedCities[cityIndex].placeId || ''
          };
          setRouteData(prev => ({ ...prev, passingCities: updatedCities }));
        }
        setEditingField(null);
      }
    }, 200);
  };

  useEffect(() => {
    setShowSaveButton(
      routeData.origin.name && 
      routeData.destination.name &&
      routeData.routeName && 
      routeData.routeNum
    );
  }, [routeData]);

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Edit Route Details</Text>
            {/* <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => setShowDeleteDialog(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Route</Text>
            </TouchableOpacity> */}
          </View>
        );
      case 'busInfo':
        return (
          <View style={styles.busInfoContainer}>
            <Text style={styles.busInfoText}>Bus: {plateNumber}</Text>
            <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">
              Route: {routeData.routeName || 'Not specified'}
            </Text>
          </View>
        );
      case 'routeInfo':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Route Number</Text>
              {editingField === 'routeNum' ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    ref={ref => inputRefs.current['routeNum'] = ref}
                    style={styles.textInput}
                    value={fieldInputText}
                    onChangeText={(text) => {
                      setFieldInputText(text);
                      setRouteData(prev => ({...prev, routeNum: text}));
                    }}
                    placeholder="Enter route number"
                    autoFocus={true}
                    onBlur={handleBlurField}
                    onSubmitEditing={handleConfirmTextEdit}
                    keyboardType="numeric"
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.displayField}
                  onPress={() => handleStartEditField('routeNum', routeData.routeNum)}
                >
                  <Text style={styles.displayText} numberOfLines={1} ellipsizeMode="tail">
                    {routeData.routeNum || 'Tap to edit route number'}
                  </Text>
                  <IconButton
                    icon="pencil"
                    size={20}
                    style={styles.inlineEditIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      case 'origin':
        return (
          <View style={[styles.inputContainer, { zIndex: 1000 }]}>
            <Text style={styles.label}>Origin (Required)</Text>
            {editingField === 'origin' ? (
              <View style={[styles.editingContainer, { zIndex: 1000 }]}>
                <TextInput
                  ref={ref => inputRefs.current['origin'] = ref}
                  style={styles.cityInput}
                  value={fieldInputText}
                  onChangeText={handleFieldInputChange}
                  placeholder="Enter origin city"
                  autoFocus={true}
                  onBlur={handleBlurField}
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(suggestion)}
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
                onPress={() => handleStartEditField('origin', routeData.origin.name)}
              >
                <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">
                  {routeData.origin.name || 'Tap to set origin'}
                </Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  style={styles.inlineEditIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'sectionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>In-Between Cities</Text>
            <TouchableOpacity 
              style={styles.addButtonContainer}
              onPress={handleAddPassingCity}
            >
              <Text style={styles.addButton}>+ Add City</Text>
            </TouchableOpacity>
          </View>
        );
      case 'passingCity':
        const index = item.index;
        const city = item.city;
        const zIndexValue = editingField === `city-${index}` ? 900 - index : (800 - index);
        
        return (
          <View key={`city-${index}`} style={[styles.inputContainer, { zIndex: zIndexValue }]}>
            <View style={styles.passingCityRow}>
              <View style={styles.passingCityLabelContainer}>
                <Text style={styles.passingCityLabel}>City {index + 1}</Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={() => handleRemovePassingCity(index)}
                style={styles.deleteIcon}
              />
            </View>
            
            {editingField === `city-${index}` ? (
              <View style={[styles.editingContainer, { zIndex: zIndexValue }]}>
                <TextInput
                  ref={ref => inputRefs.current[`city-${index}`] = ref}
                  style={styles.cityInput}
                  value={fieldInputText}
                  onChangeText={handleFieldInputChange}
                  placeholder="Enter city name"
                  autoFocus={true}
                  onBlur={handleBlurField}
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(suggestion)}
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
                onPress={() => handleStartEditField(`city-${index}`, city.name)}
              >
                <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">{city.name}</Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  style={styles.inlineEditIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'emptyCities':
        return (
          <View style={styles.emptyCitiesContainer}>
            <Text style={styles.emptyCitiesText}>No passing cities added yet. Tap "+ Add City" to add in-between cities.</Text>
          </View>
        );
      case 'destination':
        return (
          <View style={[styles.inputContainer, { zIndex: 700 }]}>
            <Text style={styles.label}>Destination (Required)</Text>
            {editingField === 'destination' ? (
              <View style={[styles.editingContainer, { zIndex: 700 }]}>
                <TextInput
                  ref={ref => inputRefs.current['destination'] = ref}
                  style={styles.cityInput}
                  value={fieldInputText}
                  onChangeText={handleFieldInputChange}
                  placeholder="Enter destination city"
                  autoFocus={true}
                  onBlur={handleBlurField}
                />
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(suggestion)}
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
                onPress={() => handleStartEditField('destination', routeData.destination.name)}
              >
                <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">
                  {routeData.destination.name || 'Tap to set destination'}
                </Text>
                <IconButton
                  icon="pencil"
                  size={20}
                  style={styles.inlineEditIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'saveButtons':
        return (
          <View style={styles.buttonContainer}>
            {showSaveButton && (
              <Button
                mode="contained"
                onPress={handleUpdateRoute}
                style={styles.saveButton}
                loading={isLoading}
                disabled={!showSaveButton}
              >
                Continue to Map
              </Button>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading route details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            (editingField === 'origin' || editingField?.startsWith('city-')) ? (
              <View style={[styles.inputContainer, { zIndex: 1, marginTop: 200 }]}>
                <Text style={styles.label}>Destination</Text>
                <View style={styles.displayField}>
                  <Text style={styles.displayText} numberOfLines={2} ellipsizeMode="tail">
                    {routeData.destination.name}
                  </Text>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Delete Route</Text>
            <Text style={styles.dialogMessage}>Are you sure you want to delete this route?</Text>
            <View style={styles.dialogButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteDialog(false)}
                style={styles.dialogButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDeleteRoute}
                style={[styles.dialogButton, styles.deleteDialogButton]}
                loading={isLoading}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      )}
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
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  busInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  busInfoText: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#424242',
  },
  displayField: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  displayText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  inlineEditIcon: {
    margin: 0,
    padding: 0,
  },
  textInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cityInput: {
    height: 56,
    borderWidth: 1, 
    borderColor: '#1976d2',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
    paddingLeft: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  addButtonContainer: {
    padding: 8,
  },
  addButton: {
    color: '#1976d2',
    fontWeight: '600',
  },
  passingCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  passingCityLabelContainer: {
    flex: 1,
  },
  passingCityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  editIcon: {
    margin: 0,
    padding: 0,
    marginRight: 8,
  },
  deleteIcon: {
    margin: 0,
    padding: 0,
  },
  editingContainer: {
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
  },
  emptyCitiesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyCitiesText: {
    color: '#757575',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  saveButton: {
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: '#1976d2',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
    color: '#424242',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    marginLeft: 10,
    minWidth: 80,
  },
  deleteDialogButton: {
    backgroundColor: '#d32f2f',
  },
});

export default EditBusRouteDetails;