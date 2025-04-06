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
import { doc, getDoc, updateDoc, setDoc,deleteDoc, writeBatch } from 'firebase/firestore';
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
  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if(user){
        // setLoading(false);
        // console.log('User is signed in');
        
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
          // setLoading(false);
        } else {
          router.push('screens/owner/privateSignIn');
          setIsLoading(false);
        }
      });
    return unsubscribe;
  },[]);

  // if(loading){
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#6200ee" />
  //     </View>
  //   );
  // }
  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        setIsLoading(true);
        const routeDocRef = doc(db, 'routes', routeDocId);
        const routeDocSnap = await getDoc(routeDocRef);
        
        if (routeDocSnap.exists()) {
          const data = routeDocSnap.data();
          const parsedData = {
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
            })) || [],
            coordinates: data.coordinates || [],
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
    
    // Add route info (name and number)
    elements.push({
      type: 'routeInfo',
      id: 'routeInfo',
    });
    
    // Add origin
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
    
    // Add destination - add this ONLY when no field is being edited
    if (editingField === null || 
        (editingField !== 'origin' && 
         editingField !== 'destination' && 
         !editingField?.startsWith('city-'))) {
      elements.push({
        type: 'destination',
        id: 'destination',
      });
    }
    
    // Add save buttons
    elements.push({
      type: 'saveButtons',
      id: 'saveButtons',
    });
    
    setFormElements(elements);
  }, [routeData, isLoading, editingField]);

  // Function to get coordinates for a place using Google Maps API
  const getCoordinatesForPlace = async (placeName) => {
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
    try {
      console.log("--- BEFORE UPDATE ---");
      console.log("Original Route Num:", originalRouteData.routeNum); 
      console.log("New Route Num:", routeData.routeNum);
      setIsLoading(true);
      
      // Prepare coordinates array
      const coordinates = [];
      
      // Add origin coordinates
      const originCoords = await getCoordinatesForPlace(routeData.origin.name);
      if (originCoords) {
        coordinates.push({
          name: routeData.origin.name,
          latitude: originCoords.latitude,
          longitude: originCoords.longitude
        });
      } else {
        coordinates.push({
          name: routeData.origin.name,
          latitude: 0,
          longitude: 0
        });
      }
      
      // Add passing cities coordinates
      for (const city of routeData.passingCities) {
        const cityCoords = await getCoordinatesForPlace(city.name);
        if (cityCoords) {
          coordinates.push({
            name: city.name,
            latitude: cityCoords.latitude,
            longitude: cityCoords.longitude
          });
        } else {
          coordinates.push({
            name: city.name,
            latitude: 0,
            longitude: 0
          });
        }
      }
      
      // Add destination coordinates
      const destCoords = await getCoordinatesForPlace(routeData.destination.name);
      if (destCoords) {
        coordinates.push({
          name: routeData.destination.name,
          latitude: destCoords.latitude,
          longitude: destCoords.longitude
        });
      } else {
        coordinates.push({
          name: routeData.destination.name,
          latitude: 0,
          longitude: 0
        });
      }
      
      
      const updateData = {
        routeName: routeData.routeName,
        busRoute: routeData.routeName,
        routeNum: routeData.routeNum,
        origin: {
          name: routeData.origin.name,
          // placeId: routeData.origin.placeId
        },
        destination: {
          name: routeData.destination.name,
          // placeId: routeData.destination.placeId
        },
        passingCities: routeData.passingCities
          .filter(city => city.name)
          .map(city => ({
            name: city.name,
            // placeId: city.placeId
          })),
        coordinates: coordinates,
        updatedAt: new Date().toISOString(),
        ownerPhoneNumber: ownerPhoneNumber,
        licencePlateNum: routeData.licencePlateNum,
        createdAt: routeData.createdAt
      };
      console.log("Final update payload:", updateData); // Verify this shows correct routeNum

      // Check if route name has changed (which requires new document ID)
      const nameChanged = originalRouteData.routeName !== routeData.routeName;
      
      // Check if only route number or other fields changed (which can use same document)
      // const routeNumChanged = originalRouteData.routeNum !== routeData.routeNum;

      if (nameChanged) {
        const newDocId = `${plateNumber}-${routeData.routeName.replace(/\s+/g, '-')}`;
        console.log(`Name changed. Creating new document ${newDocId}`);
  
        // 3. Transaction for atomic delete+create
        const batch = writeBatch(db);
        
        // Delete old document
        batch.delete(doc(db, 'routes', routeDocId));
        
        // Create new document
        batch.set(doc(db, 'routes', newDocId), updateData);
        
        await batch.commit();
        
        console.log("Document replaced successfully");
        
        // 4. Navigate with new document ID
        router.push({
          pathname: 'screens/owner/editBusRouteMap',
          params: {
            plateNumber,
            routeDocId: newDocId,
            routeName: routeData.routeName,
            busRoute: routeData.routeName,
            routeNum: routeData.routeNum,
            origin: {
              name: routeData.origin.name,
              // placeId: routeData.origin.placeId
            },
            destination: {
              name: routeData.destination.name,
              // placeId: routeData.destination.placeId
            },
            passingCities: routeData.passingCities
              .filter(city => city.name)
              .map(city => ({
                name: city.name,
                // placeId: city.placeId
              })),
            coordinates: coordinates,
            updatedAt: new Date().toISOString(),
            ownerPhoneNumber: ownerPhoneNumber,
            licencePlateNum: routeData.licencePlateNum,
            createdAt: routeData.createdAt
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
            routeName: routeData.routeName,
            routeNum: routeData.routeNum,
            origin: routeData.origin.name,
            originPlaceId: routeData.origin.placeId,
            destination: routeData.destination.name,
            destinationPlaceId: routeData.destination.placeId,
            passingCities: JSON.stringify(routeData.passingCities),
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
    setRouteData(prev => ({
      ...prev,
      passingCities: [...prev.passingCities, { name: '', placeId: '' }]
    }));
    // Set the new city as the editing field
    setTimeout(() => {
      setEditingField(`city-${routeData.passingCities.length}`);
      setFieldInputText('');
    }, 100);
  };

  const handleRemovePassingCity = (index) => {
    if (editingField === `city-${index}`) {
      setEditingField(null);
      setSuggestions([]);
    }
    
    setRouteData(prev => ({
      ...prev,
      passingCities: prev.passingCities.filter((_, i) => i !== index)
    }));
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
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only fetch place suggestions for location fields
    const isLocationField = 
      editingField === 'origin' || 
      editingField === 'destination' || 
      editingField?.startsWith('city-');
    
    if (isLocationField && text.length > 1) {
      // Set new timeout for API call
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
    // Extract just the city name (first part before comma)
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
    
    // Clear suggestions first then clear editing state
    setSuggestions([]);
    setTimeout(() => {
      setEditingField(null);
    }, 100);
  };

  const handleConfirmTextEdit = () => {
    if(editingField === 'routeNum') {
      const updated = {...routeData, routeNum: fieldInputText};
      setRouteData(updated);
      setOriginalRouteData(updated);
    }
    setEditingField(null);
  };

  const handleBlurField = () => {
    // Small delay to allow for suggestion selection
    setTimeout(() => {
      setSuggestions([]);
      
      if (editingField?.startsWith('city-') && fieldInputText.trim() === '') {
        // If they left the input empty, remove the city
        const cityIndex = parseInt(editingField.split('-')[1]);
        handleRemovePassingCity(cityIndex);
      } else if (editingField === 'origin' || editingField === 'destination') {
        if (fieldInputText.trim() === '') {
          // Don't update if empty
          setEditingField(null);
        } else {
          // If they typed something but didn't select a suggestion, keep their text
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
        // If they typed something but didn't select a suggestion, keep their text
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
    // Enable map button if origin and destination are set
    setShowSaveButton(
      (routeData.origin.name && routeData.destination.name) &&
      routeData.routeName && routeData.routeNum
    );
  }, [routeData]);

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
            {/* <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            /> */}
            <Text style={styles.heading}>Edit Route Details</Text>
          </View>
        );
      case 'busInfo':
        return (
          <View style={styles.busInfoContainer}>
            <Text style={styles.busInfoText}>Bus: {plateNumber}</Text>
            <Text style={styles.displayText} numberOfLines={1} ellipsizeMode="tail">
                  Route Name: {routeData.routeName || 'Route name'}
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
                      // Immediately update the routeData state
                      setRouteData(prev => ({...prev, routeNum: text}));
                    }}
                    placeholder="Enter route number (e.g. 1544)"
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
            <Text style={styles.label}>Origin</Text>
            
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
        
        // Calculate dynamic z-index to ensure proper stacking
        const zIndexValue = editingField === `city-${index}` ? 900 - index : (800 - index);
        
        return (
          <View key={`city-${index}`} style={[styles.inputContainer, { zIndex: zIndexValue }]}>
            <View style={styles.passingCityRow}>
              <View style={styles.passingCityLabelContainer}>
                <Text style={styles.passingCityLabel}>City {index + 1}</Text>
              </View>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleStartEditField(`city-${index}`, city.name)}
                style={styles.editIcon}
              />
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
            <Text style={styles.label}>Destination</Text>
            
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
            // Add destination at the bottom if a field is being edited
            (editingField === 'origin' || editingField?.startsWith('city-')) ? (
              <View style={[styles.inputContainer, { zIndex: 1, marginTop: 200 }]}>
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
    paddingBottom: 100,
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
  readOnlyField: {  // Add this new style
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
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
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 8,
    borderColor: '#f44336',
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
});

export default EditBusRouteDetails;