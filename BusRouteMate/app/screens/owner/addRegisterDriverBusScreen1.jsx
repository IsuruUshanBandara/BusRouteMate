import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Please fill in all required fields']);
const AddRegisterDriverBusScreen1 = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [licencePlateNum, setLicencePlateNum] = useState('');
    const [routes, setRoutes] = useState([{ routeNum: '', busRoute: '' }]); 
    const [loading, setLoading] = useState(true);
    const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);
    const [errors, setErrors] = useState({
        licencePlateNum: false,
        routeNum: Array(1).fill(false),
        busRoute: Array(1).fill(false)
    });
    
    // Load saved form data only once when component mounts
    useEffect(() => {
        const loadSavedData = async () => {
            try {
                // If we're returning with passed parameters
                if (params?.busData) {
                    const busData = JSON.parse(params.busData);
                    setLicencePlateNum(busData.licencePlateNum || '');
                    setRoutes(busData.routes || [{ routeNum: '', busRoute: '' }]);
                    // Initialize error arrays with the same length as routes
                    setErrors({
                        licencePlateNum: false,
                        routeNum: Array(busData.routes?.length || 1).fill(false),
                        busRoute: Array(busData.routes?.length || 1).fill(false)
                    });
                } else {
                    // Otherwise try to load from storage
                    const savedFormData = await AsyncStorage.getItem('busRegistrationFormData_step1');
                    if (savedFormData) {
                        const formData = JSON.parse(savedFormData);
                        setLicencePlateNum(formData.licencePlateNum || '');
                        setRoutes(formData.routes || [{ routeNum: '', busRoute: '' }]);
                        // Initialize error arrays with the same length as routes
                        setErrors({
                            licencePlateNum: false,
                            routeNum: Array(formData.routes?.length || 1).fill(false),
                            busRoute: Array(formData.routes?.length || 1).fill(false)
                        });
                    }
                }
                setDataLoaded(true);
            } catch (error) {
                console.error('Error loading saved form data:', error);
                setDataLoaded(true);
            }
        };

        if (!dataLoaded) {
            loadSavedData();
        }
    }, [params, dataLoaded]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
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
                router.push('screens/owner/privateSignIn');
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);
    
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    // Format bus route - Remove spaces and capitalize first letter and any letter after hyphen
    const formatBusRoute = (route) => {
        if (!route) return '';
        
        // Remove spaces
        let formatted = route.replace(/\s+/g, '');
        
        // Capitalize first letter and any letter after a hyphen
        formatted = formatted.replace(/(^|\-)([a-z])/g, (match) => match.toUpperCase());
        
        return formatted;
    };

    // Handler to add a new route input
    const addRoute = () => {
        const newRoutes = [...routes, { routeNum: '', busRoute: '' }];
        setRoutes(newRoutes);
        
        // Also update the error state arrays
        setErrors({
            ...errors,
            routeNum: [...errors.routeNum, false],
            busRoute: [...errors.busRoute, false]
        });
    };

    // Handler to remove the last route input
    const removeLastRoute = () => {
        if (routes.length > 1) {
            const newRoutes = routes.slice(0, -1);
            setRoutes(newRoutes);
            
            // Also update the error state arrays
            setErrors({
                ...errors,
                routeNum: errors.routeNum.slice(0, -1),
                busRoute: errors.busRoute.slice(0, -1)
            });
        }
    };

    // Validate all fields
    const validateFields = () => {
        let isValid = true;
        const newErrors = {
            licencePlateNum: false,
            routeNum: Array(routes.length).fill(false),
            busRoute: Array(routes.length).fill(false)
        };
        
        // Check license plate
        if (!licencePlateNum.trim()) {
            newErrors.licencePlateNum = true;
            isValid = false;
        }
        
        // Check each route's fields
        routes.forEach((route, index) => {
            if (!route.routeNum.trim()) {
                newErrors.routeNum[index] = true;
                isValid = false;
            }
            
            if (!route.busRoute.trim()) {
                newErrors.busRoute[index] = true;
                isValid = false;
            }
        });
        
        setErrors(newErrors);
        return isValid;
    };

    // Handler to save details and navigate to the next screen with the data
    const handleSubmit = async () => {
        try {
            // Validate all fields first
            if (!validateFields()) {
                console.error("Please fill in all required fields.");
                return;
            }
            
            const normalizedPlateNum = licencePlateNum.trim().toUpperCase();
            const normalizedPhoneNum = ownerPhoneNumber.trim();
            
            // Reference to the specific bus's route collection in Firestore
            const busRef = doc(db, `privateOwners/${normalizedPhoneNum}/buses/${normalizedPlateNum}`);
            // Create the bus document inside the buses collection with the license plate number
            await setDoc(busRef, { licencePlateNum: normalizedPlateNum }, { merge: true });

            const routesCollectionRef = collection(db, `routes`);
            
            // Format routes before saving
            const formattedRoutes = routes.map(route => ({
                routeNum: route.routeNum.trim(),
                busRoute: formatBusRoute(route.busRoute)
            }));
            
            // Save each route to Firestore with an auto-generated document ID
            for (const route of formattedRoutes) {
                const routeDocRef = doc(routesCollectionRef, `${normalizedPlateNum}-${route.busRoute}`);
                await setDoc(routeDocRef, {
                    routeNum: route.routeNum,
                    routeName: route.busRoute,
                });
            }

            console.log("Data saved successfully to Firestore and locally");
            
            // Prepare the data to be passed to the next screen
            const busData = {
                licencePlateNum: normalizedPlateNum,
                routes: formattedRoutes,
            };

            // Save the current form state before navigating
            await AsyncStorage.setItem('busRegistrationFormData_step1', JSON.stringify(busData));

            router.push({
                pathname: 'screens/owner/addRegisterDriverBusScreen1.1',
                params: { busData: JSON.stringify(busData) },
            });
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.centeredContent}>
                        <View style={styles.subHeadingContainer}>
                            <Text style={styles.subHeading}>Add and Register Bus</Text>
                        </View>

                        <TextInput 
                            style={styles.input}
                            label="License Plate Number *"
                            value={licencePlateNum}
                            onChangeText={text => {
                                setLicencePlateNum(text);
                                if (text.trim()) {
                                    setErrors({...errors, licencePlateNum: false});
                                }
                            }}
                            mode="outlined"
                            error={errors.licencePlateNum}
                        />
                        {errors.licencePlateNum && (
                            <HelperText type="error" visible={errors.licencePlateNum}>
                                License plate number is required
                            </HelperText>
                        )}

                        {routes.map((route, index) => (
                            <View key={index}>
                                <TextInput 
                                    style={styles.input}
                                    label={`Route Number ${index + 1} *`}
                                    value={route.routeNum}
                                    onChangeText={text => {
                                        const updatedRoutes = [...routes];
                                        updatedRoutes[index].routeNum = text;
                                        setRoutes(updatedRoutes);
                                        
                                        // Clear error when typing
                                        if (text.trim()) {
                                            const updatedErrors = {...errors};
                                            updatedErrors.routeNum[index] = false;
                                            setErrors(updatedErrors);
                                        }
                                    }}
                                    mode="outlined"
                                    error={errors.routeNum[index]}
                                />
                                {errors.routeNum[index] && (
                                    <HelperText type="error" visible={errors.routeNum[index]}>
                                        Route number is required
                                    </HelperText>
                                )}
                                
                                <TextInput 
                                    style={styles.input}
                                    label={`Bus Route ${index + 1} (e.g., Kegalle - Avissawella) *`}
                                    value={route.busRoute}
                                    onChangeText={text => {
                                        const updatedRoutes = [...routes];
                                        updatedRoutes[index].busRoute = text;
                                        setRoutes(updatedRoutes);
                                        
                                        // Clear error when typing
                                        if (text.trim()) {
                                            const updatedErrors = {...errors};
                                            updatedErrors.busRoute[index] = false;
                                            setErrors(updatedErrors);
                                        }
                                    }}
                                    mode="outlined"
                                    error={errors.busRoute[index]}
                                />
                                {errors.busRoute[index] && (
                                    <HelperText type="error" visible={errors.busRoute[index]}>
                                        Bus route is required
                                    </HelperText>
                                )}
                            </View>
                        ))}

                        <Button 
                            mode="contained" 
                            style={styles.addButton} 
                            onPress={addRoute}
                        >
                            Add More Route
                        </Button>

                        <Button 
                            mode="contained" 
                            style={styles.removeButton} 
                            onPress={removeLastRoute}
                            disabled={routes.length === 1} // Disable if only one route
                        >
                            Remove Last Route
                        </Button>

                        <Button 
                            mode="contained" 
                            style={styles.submitButton} 
                            onPress={handleSubmit}
                        >
                            Save
                        </Button>
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
        marginVertical: 5,
    },
    addButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
    removeButton: {
        marginTop: 10,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#D32F2F', // Optional: Different color for remove button
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