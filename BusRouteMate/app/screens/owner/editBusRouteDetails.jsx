import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@env';

const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

function InputAutocomplete({ placeholder, value, onPlaceSelected, index = null, zIndexValue = 1 }) {
  const ref = useRef();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value === '' && ref.current) {
      ref.current.clear();
    }
  }, [value]);

  return (
    <View style={{ 
      zIndex: zIndexValue,
      elevation: zIndexValue,
      marginVertical: 10,
      position: 'relative',
    }}>
      <GooglePlacesAutocomplete
        ref={ref}
        styles={{
          container: { flex: 0 },
          textInput: styles.input,
          listView: {
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            zIndex: 9999,
            elevation: 9999,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 5,
          },
          row: { padding: 13, height: 44, flexDirection: 'row' },
          separator: { height: 0.5, backgroundColor: '#c8c7cc' },
        }}
        placeholder={placeholder || ""}
        fetchDetails
        onPress={(data, details = null) => {
          const cityName = details?.name || data.description;
          onPlaceSelected(cityName, index);
          setIsFocused(false);
        }}
        query={{ key: GOOGLE_API_KEY, language: "en" }}
        textInputProps={{
          defaultValue: value,
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed={isFocused}
        disableScroll={true}
      />
    </View>
  );
}

const EditBusRouteDetails = () => {
  const { plateNumber, currentRoute, routeDocId } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [passingCities, setPassingCities] = useState(['']);
  const [formElements, setFormElements] = useState([]);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const routeRef = doc(db, 'routes', routeDocId);
        const routeSnap = await getDoc(routeRef);
        
        if (routeSnap.exists()) {
          const data = routeSnap.data();
          setRouteData(data);
          
          // Extract origin (first city) and destination (last city)
          if (data.passingCities && data.passingCities.length > 0) {
            setOrigin(data.passingCities[0].name || '');
            setDestination(data.passingCities[data.passingCities.length - 1].name || '');
            
            // Extract passing cities (middle cities)
            if (data.passingCities.length > 2) {
              setPassingCities(data.passingCities.slice(1, -1).map(city => city.name));
            } else {
              setPassingCities(['']);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchRouteData();
      } else {
        router.push('../../(auth)/owner/privateSignIn');
      }
    });

    return unsubscribe;
  }, [routeDocId]);

  useEffect(() => {
    if (!routeData) return;

    const elements = [];
    
    elements.push({
      type: 'header',
      id: 'header',
      routeNum: routeData.routeNum || ''
    });
    
    elements.push({
      type: 'origin',
      id: 'origin',
      value: origin
    });
    
    passingCities.forEach((city, index) => {
      elements.push({
        type: 'passingCity',
        id: `passingCity-${index}`,
        value: city,
        index: index
      });
    });
    
    elements.push({
      type: 'destination',
      id: 'destination',
      value: destination
    });
    
    elements.push({
      type: 'buttons',
      id: 'buttons'
    });
    
    setFormElements(elements);
  }, [routeData, origin, destination, passingCities]);

  const addPassingCity = () => {
    setPassingCities([...passingCities, '']);
  };

  const updatePassingCity = (text, index) => {
    const updatedCities = [...passingCities];
    updatedCities[index] = text;
    setPassingCities(updatedCities);
  };

  const removePassingCity = (index) => {
    if (index > 0) {
      setPassingCities(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      const updatedPassingCities = [origin, ...passingCities, destination];
      
      // Prepare updated route data
      const updatedData = {
        ...routeData,
        origin: {
          name: origin,
          // Keep existing coordinates if available
          latitude: routeData.origin?.latitude || null,
          longitude: routeData.origin?.longitude || null
        },
        destination: {
          name: destination,
          latitude: routeData.destination?.latitude || null,
          longitude: routeData.destination?.longitude || null
        },
        passingCities: updatedPassingCities.map((city, index) => ({
          name: city,
          // Keep existing coordinates if available
          latitude: routeData.passingCities?.[index]?.latitude || null,
          longitude: routeData.passingCities?.[index]?.longitude || null
        }))
      };

      // Update in Firestore
      const routeRef = doc(db, 'routes', routeDocId);
      await updateDoc(routeRef, updatedData);

      Alert.alert("Success", "Route updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating route:", error);
      Alert.alert("Error", "Failed to update route");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.subHeadingContainer}>
            <Text style={styles.subHeading}>
              Edit Route {item.routeNum} for Bus {plateNumber}
            </Text>
          </View>
        );
      case 'origin':
        return (
          <InputAutocomplete
            placeholder="Origin"
            value={item.value}
            onPlaceSelected={(text) => setOrigin(text)}
            zIndexValue={3000}
          />
        );
      case 'passingCity':
        return (
          <View style={styles.cityContainer}>
            <View style={{ flex: 1 }}>
              <InputAutocomplete
                placeholder={`In-Between City ${item.index + 1}`}
                value={item.value}
                onPlaceSelected={(text) => updatePassingCity(text, item.index)}
                index={item.index}
                zIndexValue={2000 - (item.index * 10)}
              />
            </View>
            {item.index > 0 && (
              <IconButton
                icon="delete"
                size={20}
                onPress={() => removePassingCity(item.index)}
                style={styles.deleteIcon}
              />
            )}
          </View>
        );
      case 'destination':
        return (
          <InputAutocomplete
            placeholder="Destination"
            value={item.value}
            onPlaceSelected={(text) => setDestination(text)}
            zIndexValue={1000}
          />
        );
      case 'buttons':
        return (
          <View style={styles.buttonContainer}>
            <Button mode="contained" style={styles.addButton} onPress={addPassingCity}>
              Add In-Between City
            </Button>
            <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
              Save Changes
            </Button>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          data={formElements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: '5%',
    paddingTop: '5%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  subHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  deleteIcon: {
    marginLeft: 5,
  },
  buttonContainer: {
    zIndex: 1,
    marginTop: 20,
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 6,
    width: '100%',
    alignSelf: 'center',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 6,
    width: '100%',
    alignSelf: 'center',
  },
});

export default EditBusRouteDetails;