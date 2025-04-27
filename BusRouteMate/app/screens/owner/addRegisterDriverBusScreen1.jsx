import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import React,{useEffect, useState} from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {auth,db} from'../../db/firebaseConfig';
import { collection,doc,setDoc,getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
const AddRegisterDriverBusScreen1 = () => {
    const router = useRouter();
    const [licencePlateNum, setLicencePlateNum] = useState('');
    const [routes, setRoutes] = useState([{ routeNum: '', busRoute: '' }]); // Array to store route number and bus route pairs
    const [loading, setLoading] = useState(true);
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
              setLoading(false);
            } else {
              router.push('screens/owner/privateSignIn');
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
        const normalizedPlateNum = licencePlateNum.trim().toUpperCase();
        const normalizedPhoneNum = ownerPhoneNumber.trim();
        if (!normalizedPlateNum) {
            console.error("License Plate Number is required.");
            return;
        }
         // Reference to the specific bus's route collection in Firestore
        const busRef = doc(db, `privateOwners/${normalizedPhoneNum}/buses/${normalizedPlateNum}`);
        // Create the bus document inside the buses collection with the license plate number
        await setDoc(busRef, { licencePlateNum: normalizedPlateNum }, { merge: true });

        // const routesCollectionRef = collection(db, `privateOwners/${normalizedPhoneNum}/routes`);
        const routesCollectionRef = collection(db, `routes`);
        
        // Save each route to Firestore with an auto-generated document ID
        for (const route of routes) {
            const routeDocRef = doc(routesCollectionRef,`${normalizedPlateNum}-${route.busRoute}`);
            await setDoc(routeDocRef, {
                routeNum: route.routeNum,
                routeName: route.busRoute,
            });
        }

        console.log("Data saved successfully to Firestore and locally:");
          // Pass data to the next screen
          const busData = {
            licencePlateNum,
            routes,
        };

        router.push({
            pathname: 'screens/owner/addRegisterDriverBusScreen1.1', // Adjust this path as needed
            params: { busData: JSON.stringify(busData) }, // Serialize the object
        });

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
