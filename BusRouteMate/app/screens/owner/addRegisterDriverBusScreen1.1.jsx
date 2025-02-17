import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform,ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import {auth,db} from'../../db/firebaseConfig';
import { collection,doc,setDoc,getDoc,updateDoc} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
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
                  setLoading(false);
                } else {
                    router.push('../../(auth)/owner/privateSignIn');
                    setLoading(false);
                }
              });
            return unsubscribe;
          },[]);
        
    if(loading){
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
            passingCities:updatedPassingCities,
            destination
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
        try{
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
        } catch (error){
            console.error("Error saving data:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.centeredContent}>
                        <View style={styles.subHeadingContainer}>
                            <Text style={styles.subHeading}>
                                Passing Cities for Route {parsedBusData[currentRouteIndex]?.routeNum || ''}
                            </Text>
                        </View>

                        <TextInput
                            style={styles.input}
                            label="Origin"
                            value={origin}
                            onChangeText={setOrigin}
                            mode="outlined"
                        />
                        {passingCities.length > 0 && (
                            <>
                                {passingCities.map((city, index) => (
                                    <View key={index} style={styles.cityContainer}>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            label={`In-Between City ${index + 1}`}
                                            value={city}
                                            onChangeText={(text) => updatePassingCity(text, index)}
                                            mode="outlined"
                                        />
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
                            </>
                        )}
                        <TextInput
                            style={styles.input}
                            label="Destination"
                            value={destination}
                            onChangeText={setDestination}
                            mode="outlined"
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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddRegisterDriverBusScreen1;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: '5%',
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
        marginVertical: 10,
    },
    cityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
});
