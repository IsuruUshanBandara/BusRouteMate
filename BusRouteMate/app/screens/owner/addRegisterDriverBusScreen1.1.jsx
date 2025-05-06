import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, FlatList } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;
const STORAGE_KEY = 'busRegistrationFormData_step1Sub';

function InputAutocomplete({ placeholder, value, onPlaceSelected, index = null, zIndexValue = 1 }) {
  const ref = useRef();
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
    if (value === '' && ref.current) {
      ref.current.clear();
    }

    if (ref.current && value) {
        ref.current.setAddressText(value);
      }
  }, [value]);

  useEffect(() => {
    if (ref.current && value) {
      ref.current.setAddressText(value);
    }
  }, []);

  return (
    <View style={{ 
      zIndex: zIndexValue,
      elevation: zIndexValue,
      marginVertical: 10,
      position: 'relative',
    }}>
      {displayValue && (
        <Text style={styles.savedValueIndicator}>
          Saved: {displayValue}
        </Text>
      )}
      
      <GooglePlacesAutocomplete
        ref={ref}
        styles={{
          container: {
            flex: 0,
          },
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
          row: {
            padding: 13,
            height: 44,
            flexDirection: 'row',
          },
          separator: {
            height: 0.5,
            backgroundColor: '#c8c7cc',
          },
        }}
        placeholder={placeholder || ""}
        fetchDetails
        onPress={(data, details = null) => {
          const cityName = details?.name || data.description;
          onPlaceSelected(cityName, index);
          setDisplayValue(cityName);
          setIsFocused(false);
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: "en",
        }}
        textInputProps={{
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

const AddRegisterDriverBusScreen1Sub = () => {
    const { busData } = useLocalSearchParams();
    const router = useRouter();
    const [parsedBusData, setParsedBusData] = useState([]);
    const [plateNum, setPlateNum] = useState('');
    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [passingCities, setPassingCities] = useState(['']);
    const [routeData, setRouteData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
    const [formElements, setFormElements] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    
    useEffect(() => {
        const loadFormData = async () => {
            try {
                if (busData) {
                    const data = JSON.parse(busData);
                    setParsedBusData(data.routes || []);
                    setPlateNum(data.licencePlateNum || '');
                    
                    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
                    if (savedData) {
                        const parsedSavedData = JSON.parse(savedData);
                        
                        if (parsedSavedData.plateNum === data.licencePlateNum) {
                            setCurrentRouteIndex(parsedSavedData.currentRouteIndex || 0);
                            setOrigin(parsedSavedData.origin || '');
                            setDestination(parsedSavedData.destination || '');
                            setPassingCities(parsedSavedData.passingCities || ['']);
                            setRouteData(parsedSavedData.routeData || []);
                        }
                    }
                } else {
                    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
                    if (savedData) {
                        const parsedSavedData = JSON.parse(savedData);
                        
                        setParsedBusData(parsedSavedData.parsedBusData || []);
                        setPlateNum(parsedSavedData.plateNum || '');
                        setCurrentRouteIndex(parsedSavedData.currentRouteIndex || 0);
                        setOrigin(parsedSavedData.origin || '');
                        setDestination(parsedSavedData.destination || '');
                        setPassingCities(parsedSavedData.passingCities || ['']);
                        setRouteData(parsedSavedData.routeData || []);
                    }
                }
                setDataLoaded(true);
            } catch (error) {
                console.error('Error loading saved form data:', error);
                setDataLoaded(true);
            }
        };

        if (!dataLoaded) {
            loadFormData();
        }
    }, [busData, dataLoaded]);

    useEffect(() => {
        if (parsedBusData.length > 0 && dataLoaded) {
            const initialRoute = parsedBusData[currentRouteIndex] || parsedBusData[0];
            if (initialRoute) {
                const existingRouteData = routeData.find(route => 
                    route.routeNum === initialRoute.routeNum
                );

                if (!existingRouteData) {
                    if (origin === '') setOrigin(initialRoute.origin || '');
                    if (destination === '') setDestination(initialRoute.destination || '');
                    if (passingCities.length === 1 && passingCities[0] === '') {
                        setPassingCities(initialRoute.passingCities && initialRoute.passingCities.length > 0 
                            ? [...initialRoute.passingCities] 
                            : ['']);
                    }
                }
            }
        }
    }, [parsedBusData, dataLoaded, currentRouteIndex]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if(user) {
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
              setLoading(false);
            } else {
                router.push('../../(auth)/owner/privateSignIn');
                setLoading(false);
            }
          });
        return unsubscribe;
    }, []);
    
    useEffect(() => {
        const saveFormData = async () => {
            if (dataLoaded) {
                try {
                    const formData = {
                        parsedBusData,
                        plateNum,
                        currentRouteIndex,
                        origin,
                        destination,
                        passingCities,
                        routeData
                    };
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
                } catch (error) {
                    console.error('Error saving form data:', error);
                }
            }
        };
        
        const timeoutId = setTimeout(() => {
            saveFormData();
        }, 500);
        
        return () => clearTimeout(timeoutId);
    }, [dataLoaded, parsedBusData, plateNum, currentRouteIndex, origin, destination, passingCities, routeData]);
        
    useEffect(() => {
        const elements = [];
        
        if (parsedBusData.length > 0 && currentRouteIndex < parsedBusData.length) {
            elements.push({
                type: 'header',
                id: 'header',
                routeNum: parsedBusData[currentRouteIndex]?.routeNum || ''
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
                id: 'buttons',
                isLastRoute: currentRouteIndex >= parsedBusData.length - 1,
                isFirstRoute: currentRouteIndex === 0
            });
        }
        
        setFormElements(elements);
    }, [parsedBusData, currentRouteIndex, origin, destination, passingCities]);
    
    if(loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

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
            setPassingCities((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const saveCurrentRoute = () => {
        const updatedPassingCities = [origin, ...passingCities, destination];
        
        const existingRouteIndex = routeData.findIndex(route => 
            route.routeNum === parsedBusData[currentRouteIndex].routeNum
        );

        let updatedRoutes;
        if (existingRouteIndex >= 0) {
            updatedRoutes = [...routeData];
            updatedRoutes[existingRouteIndex] = {
                ...updatedRoutes[existingRouteIndex],
                origin,
                passingCities: updatedPassingCities,
                destination
            };
        } else {
            updatedRoutes = [...routeData, {
                routeNum: parsedBusData[currentRouteIndex].routeNum,
                origin,
                passingCities: updatedPassingCities,
                destination,
                busRoute: parsedBusData[currentRouteIndex].busRoute,
            }];
        }

        setRouteData(updatedRoutes);
        return updatedRoutes;
    };

    const handlePrevious = async () => {
        if (currentRouteIndex > 0) {
            // Save current route data first
            const updatedRoutes = saveCurrentRoute();
            
            try {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                    parsedBusData,
                    plateNum,
                    currentRouteIndex: currentRouteIndex - 1,
                    origin: '',
                    destination: '',
                    passingCities: [''],
                    routeData: updatedRoutes
                }));
            } catch (error) {
                console.error('Error saving form data:', error);
            }

            // Navigate to previous route
            const prevRoute = parsedBusData[currentRouteIndex - 1];
            const existingPrevRoute = updatedRoutes.find(route => 
                route.routeNum === prevRoute.routeNum
            );

            if (existingPrevRoute) {
                setOrigin(existingPrevRoute.origin || '');
                setDestination(existingPrevRoute.destination || '');
                setPassingCities(
                    existingPrevRoute.passingCities 
                        ? existingPrevRoute.passingCities.slice(1, -1)
                        : ['']
                );
            } else {
                setOrigin(prevRoute.origin || '');
                setDestination(prevRoute.destination || '');
                setPassingCities(prevRoute.passingCities && prevRoute.passingCities.length > 0 
                    ? [...prevRoute.passingCities] 
                    : ['']);
            }
            
            setCurrentRouteIndex(currentRouteIndex - 1);
        }
    };

    const handleNext = async () => {
        // Save current route data first
        const updatedRoutes = saveCurrentRoute();
        
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                parsedBusData,
                plateNum,
                currentRouteIndex: currentRouteIndex + 1,
                origin: '',
                destination: '',
                passingCities: [''],
                routeData: updatedRoutes
            }));
        } catch (error) {
            console.error('Error saving form data:', error);
        }

        if (currentRouteIndex + 1 < parsedBusData.length) {
            const nextRoute = parsedBusData[currentRouteIndex + 1];
            const existingNextRoute = updatedRoutes.find(route => 
                route.routeNum === nextRoute.routeNum
            );

            if (existingNextRoute) {
                setOrigin(existingNextRoute.origin || '');
                setDestination(existingNextRoute.destination || '');
                setPassingCities(
                    existingNextRoute.passingCities 
                        ? existingNextRoute.passingCities.slice(1, -1)
                        : ['']
                );
            } else {
                setOrigin(nextRoute.origin || '');
                setDestination(nextRoute.destination || '');
                setPassingCities(nextRoute.passingCities && nextRoute.passingCities.length > 0 
                    ? [...nextRoute.passingCities] 
                    : ['']);
            }
            
            setCurrentRouteIndex(currentRouteIndex + 1);
        }
    };

    const handleSubmit = async () => {
        try {
            // First update the current route data
            const updatedPassingCities = [origin, ...passingCities, destination];
            
            const existingRouteIndex = routeData.findIndex(route => 
                route.routeNum === parsedBusData[currentRouteIndex].routeNum
            );

            let finalRoutes;
            if (existingRouteIndex >= 0) {
                finalRoutes = [...routeData];
                finalRoutes[existingRouteIndex] = {
                    ...finalRoutes[existingRouteIndex],
                    origin,
                    passingCities: updatedPassingCities,
                    destination
                };
            } else {
                finalRoutes = [...routeData, {
                    routeNum: parsedBusData[currentRouteIndex].routeNum,
                    origin,
                    passingCities: updatedPassingCities,
                    destination,
                    busRoute: parsedBusData[currentRouteIndex].busRoute,
                }];
            }

            const busDataForNextScreen = { 
                licencePlateNum: plateNum, 
                routes: finalRoutes 
            };
            
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                parsedBusData,
                plateNum,
                currentRouteIndex,
                origin,
                destination,
                passingCities,
                routeData: finalRoutes
            }));

            await AsyncStorage.setItem('busRegistrationFormData_step2', JSON.stringify(busDataForNextScreen));
            
            router.push({
                pathname: 'screens/owner/addRegisterDriverBusScreen2',
                params: { busData: JSON.stringify(busDataForNextScreen) },
            });
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    const renderItem = ({ item }) => {
        switch (item.type) {
            case 'header':
                return (
                    <View style={styles.subHeadingContainer}>
                        <Text style={styles.subHeading}>
                            Route {item.routeNum} ({currentRouteIndex + 1}/{parsedBusData.length})
                        </Text>
                        {routeData.length > 0 && (
                            <Text style={{ textAlign: 'center', marginTop: 5, color: '#4CAF50' }}>
                                {routeData.length} route(s) completed
                            </Text>
                        )}
                    </View>
                );
            case 'origin':
                return (
                    <View>
                        <Text style={styles.fieldLabel}>Origin City:</Text>
                        <InputAutocomplete
                            placeholder="Origin"
                            value={item.value}
                            onPlaceSelected={(text) => setOrigin(text)}
                            zIndexValue={3000}
                        />
                    </View>
                );
            case 'passingCity':
                return (
                    <View style={styles.cityContainer}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Intermediate Stop {item.index + 1}:</Text>
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
                    <View>
                        <Text style={styles.fieldLabel}>Destination City:</Text>
                        <InputAutocomplete
                            placeholder="Destination"
                            value={item.value}
                            onPlaceSelected={(text) => setDestination(text)}
                            zIndexValue={1000}
                        />
                    </View>
                );
            case 'buttons':
                return (
                    <View style={styles.buttonContainer}>
                        <Button mode="contained" style={styles.addButton} onPress={addPassingCity}>
                            Add In-Between City
                        </Button>
                        
                        {/* <View style={styles.navigationButtons}> */}
                            {!item.isFirstRoute && (
                                <Button 
                                    mode="outlined" 
                                    style={styles.prevButton} 
                                    onPress={handlePrevious}
                                    icon="arrow-left"
                                >
                                    Previous
                                </Button>
                            )}
                            
                            {!item.isLastRoute ? (
                                <Button 
                                    mode="contained" 
                                    style={styles.nextButton} 
                                    onPress={handleNext}
                                    icon="arrow-right"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button 
                                    mode="contained" 
                                    style={styles.submitButton} 
                                    onPress={handleSubmit}
                                    icon="check"
                                >
                                    Save All Routes
                                </Button>
                            )}
                        {/* </View> */}
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
                {dataLoaded && formElements.length > 0 && (
                    <View style={styles.restorationBanner}>
                        <Text style={styles.restorationText}>
                            {routeData.length > 0 ? 
                                `Editing Route ${currentRouteIndex + 1} of ${parsedBusData.length}` : 
                                `Please enter cities for Route ${currentRouteIndex + 1} of ${parsedBusData.length}`}
                        </Text>
                    </View>
                )}
                
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

export default AddRegisterDriverBusScreen1Sub;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: '5%',
        paddingTop: '5%',
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
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    prevButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
    nextButton: {
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    savedValueIndicator: {
        color: '#1976D2',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 5,
        paddingHorizontal: 5,
    },
    restorationBanner: {
        backgroundColor: '#E3F2FD',
        padding: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#BBDEFB',
    },
    restorationText: {
        color: '#1565C0',
        fontWeight: 'bold',
    },
    fieldLabel: {
        marginLeft: 5,
        marginBottom: 2,
        fontSize: 14,
        fontWeight: '500',
        color: '#424242',
    },
});