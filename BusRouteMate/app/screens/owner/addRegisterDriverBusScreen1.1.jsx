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

const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

// Improved Autocomplete Input Component
function InputAutocomplete({ placeholder, value, onPlaceSelected, index = null, zIndexValue = 1 }) {
  const ref = useRef();
  const [isFocused, setIsFocused] = useState(false);

  // Clear input when value changes to empty string
  useEffect(() => {
    if (value === '' && ref.current) {
      ref.current.clear();
    }
  }, [value]);

  return (
    <View style={{ 
      zIndex: zIndexValue,
      elevation: zIndexValue, // For Android
      marginVertical: 10,
      position: 'relative',
    }}>
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
          setIsFocused(false);
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: "en",
        }}
        textInputProps={{
          defaultValue: value,
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed={isFocused}
        disableScroll={true} // Important: Disable internal scrolling
      />
    </View>
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
    const [formElements, setFormElements] = useState([]);
    
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
        
    // Prepare form elements data for FlatList
    useEffect(() => {
        const elements = [];
        
        // Add header
        elements.push({
            type: 'header',
            id: 'header',
            routeNum: parsedBusData[currentRouteIndex]?.routeNum || ''
        });
        
        // Add origin
        elements.push({
            type: 'origin',
            id: 'origin',
            value: origin
        });
        
        // Add passing cities
        passingCities.forEach((city, index) => {
            elements.push({
                type: 'passingCity',
                id: `passingCity-${index}`,
                value: city,
                index: index
            });
        });
        
        // Add destination
        elements.push({
            type: 'destination',
            id: 'destination',
            value: destination
        });
        
        // Add buttons
        elements.push({
            type: 'buttons',
            id: 'buttons',
            isLastRoute: currentRouteIndex >= parsedBusData.length - 1
        });
        
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
            // const routesCollectionRef = collection(db, `privateOwners/${ownerPhoneNumber}/routes`);
            const routesCollectionRef = collection(db, `routes`);
            const finalRoutes = [...routeData, {
                routeNum: parsedBusData[currentRouteIndex].routeNum,
                origin,
                passingCities: [origin, ...passingCities, destination],
                destination,
                busRoute: parsedBusData[currentRouteIndex].busRoute,
            }];

            // // Save each route to Firestore
            // for (const route of finalRoutes) {
            //     const routeDocRef = doc(routesCollectionRef, `${plateNum}-${route.busRoute}`);
    
            //     // Check if the document exists to either create it (setDoc) or update it (updateDoc)
            //     const docSnapshot = await getDoc(routeDocRef);
            //     if (docSnapshot.exists()) {
            //         // Update the document with new fields (does not overwrite)
            //         await updateDoc(routeDocRef, {
            //             origin: route.origin,
            //             destination: route.destination,
            //             passingCities: route.passingCities, // This is an array
            //         });
            //     } else {
            //         // If the document does not exist, create it
            //         await setDoc(routeDocRef, {
            //             routeNum: route.routeNum,
            //             routeName: route.busRoute,
            //             origin: route.origin,
            //             destination: route.destination,
            //             passingCities: route.passingCities, // This is an array
            //         });
            //     }
            // }

            // console.log("Data saved successfully to Firestore:");
            
            router.push({
                pathname: 'screens/owner/addRegisterDriverBusScreen2',
                params: { busData: JSON.stringify({ licencePlateNum: plateNum, routes: finalRoutes }) },
            });
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    // Render different types of items for the FlatList
    const renderItem = ({ item }) => {
        switch (item.type) {
            case 'header':
                return (
                    <View style={styles.subHeadingContainer}>
                        <Text style={styles.subHeading}>
                            Passing Cities for Route {item.routeNum}
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
                        {!item.isLastRoute ? (
                            <Button mode="contained" style={styles.nextButton} onPress={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
                                Save
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
                    removeClippedSubviews={false} // Important for autocomplete
                    ListFooterComponent={<View style={{ height: 100 }} />} // Add padding at the bottom
                />
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