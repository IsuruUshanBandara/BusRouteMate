import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { auth, db} from '../../db/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

const AddRegisterDriverBusScreen3 = () => {
    const { plateNum } = useLocalSearchParams();
    const router = useRouter();
    const parsedPlateNum = plateNum ? JSON.parse(plateNum) : '';
    
    const [drivers, setDrivers] = useState([{ 
        phoneNum: '', 
        email: '',
        password: '', 
        confirmPassword: '',
        conductorPhone: '',
        isExistingUser: false
    }]);
    
    const [showPassword, setShowPassword] = useState([]);
    const [showConfirmPassword, setShowConfirmPassword] = useState([]);
    const [loading, setLoading] = useState(false);

    const addDriver = () => {
        setDrivers([...drivers, { 
            phoneNum: '', 
            email: '',
            password: '', 
            confirmPassword: '',
            conductorPhone: '',
            isExistingUser: false
        }]);
        setShowPassword([...showPassword, false]);
        setShowConfirmPassword([...showConfirmPassword, false]);
    };

    const removeLastDriver = () => {
        if (drivers.length > 1) {
            setDrivers(drivers.slice(0, -1));
            setShowPassword(showPassword.slice(0, -1));
            setShowConfirmPassword(showConfirmPassword.slice(0, -1));
        }
    };

    const checkExistingUser = async (email) => {
        try {
            // First check if email exists in auth system
            const methods = await fetchSignInMethodsForEmail(auth, email);
            const emailExists = methods.length > 0;
    
            // Then check if already registered for this specific bus
            const docRef = doc(db, 'driverDetails', `${parsedPlateNum}-${email}`);
            const docSnap = await getDoc(docRef);
            const registeredForBus = docSnap.exists();
    
            return { 
                emailExists,
                registeredForBus,
                message: registeredForBus 
                    ? 'This driver is already registered for this bus' 
                    : emailExists
                        ? 'Email exists in system - enter password'
                        : 'Email available for registration'
            };
        } catch (error) {
            console.error("Error checking email:", error);
            return { 
                emailExists: false, 
                registeredForBus: false,
                message: 'Error checking email status' 
            };
        }
    };
    
    const handleEmailBlur = async (index) => {
        const email = drivers[index].email.trim();
        if (!email) return;
    
        try {
            const { emailExists, registeredForBus, message } = await checkExistingUser(email);
            const updatedDrivers = [...drivers];
            updatedDrivers[index].isExistingUser = emailExists;
            setDrivers(updatedDrivers);
            
            if (registeredForBus) {
                Alert.alert("Already Registered", message);
                // Clear the email field if already registered for this bus
                updatedDrivers[index].email = '';
                setDrivers(updatedDrivers);
            } else if (emailExists) {
                Alert.alert("Existing Account", message);
            }
            // Don't show alert for new emails
        } catch (error) {
            console.error("Email check error:", error);
            Alert.alert("Error", "Could not verify email status");
        }
    };
    const handleSubmit = async () => {
        setLoading(true);
        try {
            for (const [index, driver] of drivers.entries()) {
                // Validate inputs
                if (!driver.phoneNum || !driver.email || !driver.password) {
                    Alert.alert("Error", "Please fill all required fields");
                    setLoading(false);
                    return;
                }

                if (!driver.isExistingUser && driver.password !== driver.confirmPassword) {
                    Alert.alert("Error", "Passwords do not match");
                    setLoading(false);
                    return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) {
                    Alert.alert("Error", "Please enter a valid email address");
                    setLoading(false);
                    return;
                }

                // Check if document already exists
                const driverDocRef = doc(db, 'driverDetails', `${parsedPlateNum}-${driver.email}`);
                const docSnapshot = await getDoc(driverDocRef);
                
                if (docSnapshot.exists()) {
                    Alert.alert("Error", `Driver ${driver.email} is already registered for bus ${parsedPlateNum}`);
                    setLoading(false);
                    return;
                }

                if (driver.isExistingUser) {
                    // Verify existing user's password
                    try {
                        await signInWithEmailAndPassword(auth, driver.email, driver.password);
                    } catch (error) {
                        Alert.alert("Error", "Incorrect password for existing user. Please enter the correct password or use a different email.");
                        setLoading(false);
                        return;
                    }
                } else {
                    // Create new user
                    try {
                        await createUserWithEmailAndPassword(auth, driver.email, driver.password);
                    } catch (error) {
                        Alert.alert("Error", `Failed to create user: ${error.message}`);
                        setLoading(false);
                        return;
                    }
                }

                // Only create document if it doesn't exist
                await setDoc(driverDocRef, {
                    licencePlateNum: parsedPlateNum,
                    driverEmail: driver.email,
                    driverPhone: driver.phoneNum,
                    conductorPhone: driver.conductorPhone,
                    createdAt: new Date().toISOString()
                });
            }

            Alert.alert("Success", "All drivers registered successfully!");
            router.dismissAll();
            router.replace('screens/owner/ownerHome');
        } catch (error) {
            console.error("Registration error:", error);
            Alert.alert("Error", "An error occurred during registration");
        } finally {
            setLoading(false);
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
                            <Text style={styles.subHeading}>Register Driver & Conductor for Bus {parsedPlateNum}</Text>
                        </View>

                        {drivers.map((driver, index) => (
                            <View key={index}>
                                <TextInput
                                    style={styles.input}
                                    label={`Driver Phone Number ${index + 1}*`}
                                    value={driver.phoneNum}
                                    keyboardType='phone-pad'
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].phoneNum = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />

                                <TextInput
                                    style={styles.input}
                                    label={`Driver Email ${index + 1}*`}
                                    value={driver.email}
                                    keyboardType='email-address'
                                    autoCapitalize='none'
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].email = text;
                                        updatedDrivers[index].isExistingUser = false;
                                        setDrivers(updatedDrivers);
                                    }}
                                    onBlur={() => handleEmailBlur(index)}
                                    mode="outlined"
                                />

                                <TextInput
                                    style={styles.input}
                                    label="Password*"
                                    secureTextEntry={!showPassword[index]}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword[index] ? "eye-off" : "eye"}
                                            onPress={() => {
                                                const updatedShowPassword = [...showPassword];
                                                updatedShowPassword[index] = !updatedShowPassword[index];
                                                setShowPassword(updatedShowPassword);
                                            }}
                                        />
                                    }
                                    value={driver.password}
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].password = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />

                                {!driver.isExistingUser && (
                                    <TextInput
                                        style={styles.input}
                                        label="Confirm Password*"
                                        secureTextEntry={!showConfirmPassword[index]}
                                        right={
                                            <TextInput.Icon
                                                icon={showConfirmPassword[index] ? "eye-off" : "eye"}
                                                onPress={() => {
                                                    const updatedShowConfirmPassword = [...showConfirmPassword];
                                                    updatedShowConfirmPassword[index] = !updatedShowConfirmPassword[index];
                                                    setShowConfirmPassword(updatedShowConfirmPassword);
                                                }}
                                            />
                                        }
                                        value={driver.confirmPassword}
                                        onChangeText={text => {
                                            const updatedDrivers = [...drivers];
                                            updatedDrivers[index].confirmPassword = text;
                                            setDrivers(updatedDrivers);
                                        }}
                                        mode="outlined"
                                    />
                                )}

                                <TextInput
                                    style={styles.input}
                                    label={`Conductor Phone Number ${index + 1}`}
                                    value={driver.conductorPhone}
                                    keyboardType='phone-pad'
                                    onChangeText={text => {
                                        const updatedDrivers = [...drivers];
                                        updatedDrivers[index].conductorPhone = text;
                                        setDrivers(updatedDrivers);
                                    }}
                                    mode="outlined"
                                />
                            </View>
                        ))}

                        <Button
                            mode="contained"
                            style={styles.addButton}
                            onPress={addDriver}
                            disabled={loading}
                        >
                            Add More Driver
                        </Button>

                        <Button
                            mode="contained"
                            style={styles.removeButton}
                            onPress={removeLastDriver}
                            disabled={drivers.length === 1 || loading}
                        >
                            Remove Last Driver
                        </Button>

                        <Button
                            mode="contained"
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Save'}
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
        backgroundColor: '#D32F2F',
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 6,
        width: '100%',
        alignSelf: 'center',
    },
});

export default AddRegisterDriverBusScreen3;