import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {db} from'../../db/firebaseConfig';
import { collection,doc,addDoc } from 'firebase/firestore';

const AddRegisterDriverBusScreen1 = () => {
    const router = useRouter();
    const [licencePlateNum, setLicencePlateNum] = useState('');
    const [routes, setRoutes] = useState([{ routeNum: '', busRoute: '' }]); // Array to store route number and bus route pairs
    
//    const db = firebase.firestore();

    // Handler to add a new route input
    const addRoute = () => {
        setRoutes([...routes, { routeNum: '', busRoute: '' }]);
    };

    // Handler to remove the last route input
    const removeLastRoute = () => {
        if (routes.length > 1) {
            setRoutes(routes.slice(0, -1)); // Remove the last route pair
        }
    };

    // Handler to save details and navigate to the next screen with the data
    const handleSubmit = async () => {
        try{
        // saveBusData(licencePlateNum, routes);
        // const busData = {
        //     routes,
        //     licencePlateNum
        // };
        // console.log(busData);
        // router.push({
        //     pathname: 'screens/owner/addRegisterDriverBusScreen2', // Adjust this path to the actual path of your next screen
        //     params: { busData: JSON.stringify(busData) },
        // });
         // Reference to the specific bus's route collection in Firestore
        const busRef = doc(db, `privateOwners/0712663115/buses/${licencePlateNum}`);
        const routesCollectionRef = collection(busRef, 'route');

        // Save each route to Firestore with an auto-generated document ID
        for (const route of routes) {
            await addDoc(routesCollectionRef, {
                routeNum: route.routeNum,
                busRoute: route.busRoute,
            });
        }

        console.log("Data saved successfully to Firestore and locally:", busData);

        // Navigate to the next screen and pass the bus data as a parameter
        // router.push({
        //     pathname: 'screens/owner/addRegisterDriverBusScreen2', // Adjust this path as needed
        //     params: { busData: JSON.stringify(busData) },
        // });
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
                            label="License Plate Number"
                            value={licencePlateNum}
                            onChangeText={text => setLicencePlateNum(text)}
                            mode="outlined"
                        />

                        {routes.map((route, index) => (
                            <View key={index}>
                                <TextInput 
                                    style={styles.input}
                                    label={`Route Number ${index + 1}`}
                                    value={route.routeNum}
                                    onChangeText={text => {
                                        const updatedRoutes = [...routes];
                                        updatedRoutes[index].routeNum = text;
                                        setRoutes(updatedRoutes);
                                    }}
                                    mode="outlined"
                                />
                                <TextInput 
                                    style={styles.input}
                                    label={`Bus Route ${index + 1} (e.g., Kegalle - Avissawella)`}
                                    value={route.busRoute}
                                    onChangeText={text => {
                                        const updatedRoutes = [...routes];
                                        updatedRoutes[index].busRoute = text;
                                        setRoutes(updatedRoutes);
                                    }}
                                    mode="outlined"
                                />
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
        marginVertical: 10,
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
});
