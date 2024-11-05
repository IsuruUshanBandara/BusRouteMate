import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import React, { useState } from 'react';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

const AddRegisterDriverBusScreen2 = () => {
    const router = useRouter();
    const [licencePlateNum, setLicencePlateNum] = useState('');
    const [routeNum, setRouteNum] = useState('');
    const [busRoute, setBusRoute] = useState('');
    const handleSignIn = () => {
        console.log(busRoute);
        console.log(licencePlateNum);
        console.log(routeNum);
       
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
                            <Text style={styles.subHeading}>Forgot Password</Text>
                        </View>

                       

                        <TextInput 
                            style={styles.input}
                            label="License plate number"
                            value={licencePlateNum}
                            onChangeText={text => setLicencePlateNum(text)}
                            mode="outlined"
                            
                        />

                        <TextInput 
                            style={styles.input}
                            label="Route number"
                            value={routeNum}
                            onChangeText={text => setRouteNum(text)}
                            mode="outlined"
                        />

                        <TextInput 
                            style={styles.input}
                            label="Bus Route (Kegalle - Avissawella)"
                            value={busRoute}
                            onChangeText={text => setBusRoute(text)}
                            mode="outlined"  
                        />

                        

                        <Button 
                            mode="contained" 
                            style={styles.signInButton} 
                            onPress={handleSignIn}
                        >
                            Sign In
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddRegisterDriverBusScreen2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: '5%',
        paddingBottom: '5%', // Extra padding to accommodate keyboard on smaller screens
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center', // Center the input fields vertically on the screen
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
    signInButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});
