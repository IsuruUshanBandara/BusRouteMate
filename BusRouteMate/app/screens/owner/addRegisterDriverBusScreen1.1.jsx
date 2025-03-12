import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_API_KEY } from '@env';

const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

// Custom Autocomplete Input Component - modified to not use scrollable lists
function InputAutocomplete({ placeholder, value, onPlaceSelected, index = null }) {
  const ref = useRef();

  // Clear input when value changes to empty string
  useEffect(() => {
    if (value === '' && ref.current) {
      ref.current.clear();
    }
  }, [value]);

  return (
    <GooglePlacesAutocomplete
      ref={ref}
      styles={{
        container: {
          flex: 0,
          marginVertical: 10,
        },
        textInput: styles.input,
        listView: {
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          elevation: 3,
        },
      }}
      placeholder={placeholder || ""}
      fetchDetails
      onPress={(data, details = null) => {
        const cityName = details?.name || data.description;
        onPlaceSelected(cityName, index);
      }}
      query={{
        key: GOOGLE_API_KEY,
        language: "en",
      }}
      textInputProps={{
        defaultValue: value,
      }}
      enablePoweredByContainer={false}
      keyboardShouldPersistTaps="handled"
      listViewDisplayed={false} // Only show when typing
    />
  );
}

const AddRegisterDriverBusScreen1 = () => {
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
    
    // Parse bus data only once when `busData` is available
    useEffect(() => {
        if (busData) {
            const data = JSON.parse(busData);
            setParsedBusData(data.routes || []);
            setPlateNum(data.licencePlateNum || '');
        }
    }, [busData]);

    useEffect(() => {
        if (parsedBusData.length > 0) {
            const initialRoute = parsedBusData[0];

            // Prevent unnecessary state updates
            setOrigin((prev) => (prev !== initialRoute.origin ? initialRoute.origin || '' : prev));
            setDestination((prev) => (prev !== initialRoute.destination ? initialRoute.destination || '' : prev));
            setPassingCities((prev) =>
                JSON.stringify(prev) !== JSON.stringify(initialRoute.passingCities) ? initialRoute.passingCities || [''] : prev
            );
        }
    }, [parsedBusData]);

    // Authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if(user) {
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
              setLoading(false);
            } else {
                router.push('../../(auth)/owner/privateSignIn');
                setLoading(false);
            }
          });
        return unsubscribe;
    }, []);
        
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

    const handleNext = () => {
        const updatedPassingCities = [origin, ...passingCities, destination];
        const updatedRoutes = [...routeData, {
            routeNum: parsedBusData[currentRouteIndex].routeNum,
            origin,
            passingCities: updatedPassingCities,
            destination,
            busRoute: parsedBusData[currentRouteIndex].busRoute,
        }];
        setRouteData(updatedRoutes);

        if (currentRouteIndex + 1 < parsedBusData.length) {
            const nextRoute = parsedBusData[currentRouteIndex + 1];
            setOrigin(nextRoute.origin || '');
            setDestination(nextRoute.destination || '');
            setPassingCities(nextRoute.passingCities && nextRoute.passingCities.length > 0 ? [...nextRoute.passingCities] : ['']);
            setCurrentRouteIndex(currentRouteIndex + 1);
        }
        console.log('Route Data 1.1:', updatedRoutes);
    };

    const handleSubmit = async () => {
        try {
            // Create a reference to the routes collection in Firestore
            const routesCollectionRef = collection(db, `privateOwners/${ownerPhoneNumber}/routes`);
            
            const finalRoutes = [...routeData, {
                routeNum: parsedBusData[currentRouteIndex].routeNum,
                origin,
                passingCities: [origin, ...passingCities, destination],
                destination,
                busRoute: parsedBusData[currentRouteIndex].busRoute,
            }];

            // Save each route to Firestore
            for (const route of finalRoutes) {
                const routeDocRef = doc(routesCollectionRef, `${plateNum}-${route.busRoute}`);
    
                // Check if the document exists to either create it (setDoc) or update it (updateDoc)
                const docSnapshot = await getDoc(routeDocRef);
                if (docSnapshot.exists()) {
                    // Update the document with new fields (does not overwrite)
                    await updateDoc(routeDocRef, {
                        origin: route.origin,
                        destination: route.destination,
                        passingCities: route.passingCities, // This is an array
                    });
                } else {
                    // If the document does not exist, create it
                    await setDoc(routeDocRef, {
                        routeNum: route.routeNum,
                        routeName: route.busRoute,
                        origin: route.origin,
                        destination: route.destination,
                        passingCities: route.passingCities, // This is an array
                    });
                }
            }

            console.log("Data saved successfully to Firestore:");
            
            router.push({
                pathname: 'screens/owner/addRegisterDriverBusScreen2',
                params: { busData: JSON.stringify({ licencePlateNum: plateNum, routes: finalRoutes }) },
            });
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* ScrollView removed, using a regular View with padding instead */}
                <View style={styles.contentContainer}>
                    <View style={styles.centeredContent}>
                        <View style={styles.subHeadingContainer}>
                            <Text style={styles.subHeading}>
                                Passing Cities for Route {parsedBusData[currentRouteIndex]?.routeNum || ''}
                            </Text>
                        </View>

                        <InputAutocomplete
                            placeholder="Origin"
                            value={origin}
                            onPlaceSelected={(text) => setOrigin(text)}
                        />

                        {passingCities.map((city, index) => (
                            <View key={index} style={styles.cityContainer}>
                                <View style={{ flex: 1 }}>
                                    <InputAutocomplete
                                        placeholder={`In-Between City ${index + 1}`}
                                        value={city}
                                        onPlaceSelected={(text) => updatePassingCity(text, index)}
                                        index={index}
                                    />
                                </View>
                                {index > 0 && (
                                    <IconButton
                                        icon="delete"
                                        size={20}
                                        onPress={() => removePassingCity(index)}
                                        style={styles.deleteIcon}
                                    />
                                )}
                            </View>
                        ))}

                        <InputAutocomplete
                            placeholder="Destination"
                            value={destination}
                            onPlaceSelected={(text) => setDestination(text)}
                        />

                        <Button mode="contained" style={styles.addButton} onPress={addPassingCity}>
                            Add In-Between City
                        </Button>

                        {currentRouteIndex < parsedBusData.length - 1 ? (
                            <Button mode="contained" style={styles.nextButton} onPress={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
                                Save
                            </Button>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddRegisterDriverBusScreen1;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: '5%',
        paddingTop: '5%',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
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
        zIndex: 1000, // Ensure autocomplete dropdown appears above other elements
    },
    deleteIcon: {
        marginLeft: 5,
    },
    addButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
    nextButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#1976D2',
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
});