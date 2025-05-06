import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, IconButton, HelperText, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
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
        isExistingUser: false,
        registeredForBus: false,
        emailChecked: false,
        errors: {
            phoneNum: '',
            email: '',
            password: '',
            confirmPassword: '',
            conductorPhone: ''
        }
    }]);
    
    const [showPassword, setShowPassword] = useState([false]);
    const [showConfirmPassword, setShowConfirmPassword] = useState([false]);
    const [loading, setLoading] = useState(false);

    // Initialize password visibility states
    useEffect(() => {
        const initialPasswordStates = drivers.map(() => false);
        setShowPassword(initialPasswordStates);
        setShowConfirmPassword(initialPasswordStates);
    }, []);

    const addDriver = () => {
        setDrivers([...drivers, { 
            phoneNum: '', 
            email: '',
            password: '', 
            confirmPassword: '',
            conductorPhone: '',
            isExistingUser: false,
            registeredForBus: false,
            emailChecked: false,
            errors: {
                phoneNum: '',
                email: '',
                password: '',
                confirmPassword: '',
                conductorPhone: ''
            }
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

    const validatePhoneNumber = (phoneNum) => {
        // Basic phone validation - adjust according to your country's format
        return /^\d{10,15}$/.test(phoneNum) ? '' : 'Please enter a valid phone number';
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address';
    };

    const validatePassword = (password) => {
        // Minimum 6 characters, at least one letter and one number
        return password.length >= 6 ? '' : 'Password must be at least 6 characters';
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        return password === confirmPassword ? '' : 'Passwords do not match';
    };

    const validateDriverInput = (driver, index) => {
        const updatedDrivers = [...drivers];
        const errors = {
            phoneNum: validatePhoneNumber(driver.phoneNum),
            email: validateEmail(driver.email),
            password: validatePassword(driver.password),
            confirmPassword: !driver.isExistingUser ? validateConfirmPassword(driver.password, driver.confirmPassword) : '',
            conductorPhone: driver.conductorPhone ? validatePhoneNumber(driver.conductorPhone) : ''
        };
        
        updatedDrivers[index].errors = errors;
        setDrivers(updatedDrivers);
        
        // Return true if there are no errors
        return !Object.values(errors).some(error => error !== '');
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
                        ? 'Existing account found - enter password to register for this bus' 
                        : 'New account will be created'
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
    
        // Validate email format first
        const emailError = validateEmail(email);
        if (emailError) {
            const updatedDrivers = [...drivers];
            updatedDrivers[index].errors.email = emailError;
            setDrivers(updatedDrivers);
            return;
        }

        try {
            setLoading(true);
            const { emailExists, registeredForBus, message } = await checkExistingUser(email);
            
            const updatedDrivers = [...drivers];
            updatedDrivers[index].isExistingUser = emailExists;
            updatedDrivers[index].registeredForBus = registeredForBus;
            updatedDrivers[index].emailChecked = true;
            updatedDrivers[index].errors.email = '';
            setDrivers(updatedDrivers);
            
            if (registeredForBus) {
                Alert.alert("Already Registered", message);
                // Clear the email field if already registered for this bus
                updatedDrivers[index].email = '';
                updatedDrivers[index].emailChecked = false;
                setDrivers(updatedDrivers);
            } else if (emailExists) {
                // Don't alert, just show visually in the UI
                console.log("Existing user found:", message);
            }
        } catch (error) {
            console.error("Email check error:", error);
            Alert.alert("Error", "Could not verify email status");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validate all inputs first
        let allValid = true;
        
        for (let i = 0; i < drivers.length; i++) {
            const isDriverValid = validateDriverInput(drivers[i], i);
            if (!isDriverValid) {
                allValid = false;
            }
            
            // Also check if driver is already registered for this bus
            if (drivers[i].registeredForBus) {
                Alert.alert("Error", `Driver ${drivers[i].email} is already registered for bus ${parsedPlateNum}`);
                return;
            }
        }
        
        if (!allValid) {
            Alert.alert("Validation Error", "Please correct the errors before submitting");
            return;
        }
        
        setLoading(true);
        try {
            for (const [index, driver] of drivers.entries()) {
                // Check if document already exists (double check)
                const driverDocRef = doc(db, 'driverDetails', `${parsedPlateNum}-${driver.email}`);
                const docSnapshot = await getDoc(driverDocRef);
                
                if (docSnapshot.exists()) {
                    Alert.alert("Error", `Driver ${driver.email} is already registered for bus ${parsedPlateNum}`);
                    setLoading(false);
                    return;
                }

                // Always attempt to sign in first, regardless of isExistingUser flag
                // This handles the case where the email exists but we didn't detect it
                try {
                    await signInWithEmailAndPassword(auth, driver.email, driver.password);
                    console.log("Successfully authenticated user");
                } catch (signInError) {
                    // If sign in fails, user might not exist or password is wrong
                    if (driver.isExistingUser) {
                        // If we know it's an existing user but sign-in failed, it's a password error
                        Alert.alert("Authentication Error", "Incorrect password for existing user. Please enter the correct password.");
                        setLoading(false);
                        return;
                    } else {
                        // If we thought it was a new user and sign-in failed, try to create the account
                        try {
                            await createUserWithEmailAndPassword(auth, driver.email, driver.password);
                            console.log("Successfully created new user");
                        } catch (createError) {
                            let errorMessage = "Failed to create user account";
                            
                            if (createError.code === 'auth/email-already-in-use') {
                                errorMessage = "This email already exists. Please enter the correct password for the existing account.";
                                
                                // Update the driver's state to reflect they are an existing user
                                const updatedDrivers = [...drivers];
                                updatedDrivers[index].isExistingUser = true;
                                setDrivers(updatedDrivers);
                            } else if (createError.code === 'auth/weak-password') {
                                errorMessage = "Password is too weak. Please use a stronger password.";
                            }
                            
                            Alert.alert("Registration Error", errorMessage);
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Create document in Firestore
                await setDoc(driverDocRef, {
                    licencePlateNum: parsedPlateNum,
                    driverEmail: driver.email,
                    driverPhone: driver.phoneNum,
                    conductorPhone: driver.conductorPhone || '',
                    createdAt: new Date().toISOString()
                });
                
                console.log(`Successfully registered driver ${driver.email} for bus ${parsedPlateNum}`);
            }

            Alert.alert(
                "Success", 
                "All drivers registered successfully!",
                [
                    { 
                        text: "OK", 
                        onPress: () => {
                            router.dismissAll();
                            router.replace('screens/owner/ownerHome');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Registration error:", error);
            Alert.alert("Error", "An error occurred during registration. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateDriverField = (index, field, value) => {
        const updatedDrivers = [...drivers];
        updatedDrivers[index][field] = value;
        
        // Clear error when typing
        if (updatedDrivers[index].errors[field]) {
            updatedDrivers[index].errors[field] = '';
        }
        
        // If email is changed, reset the isExistingUser flag
        if (field === 'email') {
            updatedDrivers[index].isExistingUser = false;
            updatedDrivers[index].registeredForBus = false;
            updatedDrivers[index].emailChecked = false;
        }
        
        setDrivers(updatedDrivers);
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
                            <View key={index} style={styles.driverContainer}>
                                <Text style={styles.driverTitle}>Driver {index + 1}</Text>
                                
                                <TextInput
                                    style={styles.input}
                                    label="Driver Phone Number*"
                                    value={driver.phoneNum}
                                    keyboardType='phone-pad'
                                    onChangeText={text => updateDriverField(index, 'phoneNum', text)}
                                    mode="outlined"
                                    error={!!driver.errors.phoneNum}
                                />
                                {!!driver.errors.phoneNum && (
                                    <HelperText type="error" visible={!!driver.errors.phoneNum}>
                                        {driver.errors.phoneNum}
                                    </HelperText>
                                )}

                                <View style={styles.emailContainer}>
                                    <TextInput
                                        style={[styles.input, styles.emailInput]}
                                        label="Driver Email*"
                                        value={driver.email}
                                        keyboardType='email-address'
                                        autoCapitalize='none'
                                        onChangeText={text => updateDriverField(index, 'email', text)}
                                        onBlur={() => handleEmailBlur(index)}
                                        mode="outlined"
                                        error={!!driver.errors.email}
                                    />
                                    {driver.emailChecked && driver.isExistingUser && (
                                        <Chip 
                                            style={styles.existingUserChip}
                                            mode="outlined"
                                            icon="account"
                                        >
                                            Existing Account
                                        </Chip>
                                    )}
                                </View>
                                
                                {!!driver.errors.email && (
                                    <HelperText type="error" visible={!!driver.errors.email}>
                                        {driver.errors.email}
                                    </HelperText>
                                )}
                                
                                {driver.emailChecked && driver.isExistingUser && (
                                    <HelperText type="info">
                                        This driver already has an account. Enter their password to register them to this bus.
                                    </HelperText>
                                )}

                                <TextInput
                                    style={styles.input}
                                    label={driver.isExistingUser ? "Driver's Existing Password*" : "Password*"}
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
                                    onChangeText={text => updateDriverField(index, 'password', text)}
                                    mode="outlined"
                                    error={!!driver.errors.password}
                                />
                                {!!driver.errors.password && (
                                    <HelperText type="error" visible={!!driver.errors.password}>
                                        {driver.errors.password}
                                    </HelperText>
                                )}

                                {!driver.isExistingUser && (
                                    <>
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
                                            onChangeText={text => updateDriverField(index, 'confirmPassword', text)}
                                            mode="outlined"
                                            error={!!driver.errors.confirmPassword}
                                        />
                                        {!!driver.errors.confirmPassword && (
                                            <HelperText type="error" visible={!!driver.errors.confirmPassword}>
                                                {driver.errors.confirmPassword}
                                            </HelperText>
                                        )}
                                    </>
                                )}

                                <TextInput
                                    style={styles.input}
                                    label="Conductor Phone Number (Optional)"
                                    value={driver.conductorPhone}
                                    keyboardType='phone-pad'
                                    onChangeText={text => updateDriverField(index, 'conductorPhone', text)}
                                    mode="outlined"
                                    error={!!driver.errors.conductorPhone}
                                />
                                {!!driver.errors.conductorPhone && (
                                    <HelperText type="error" visible={!!driver.errors.conductorPhone}>
                                        {driver.errors.conductorPhone}
                                    </HelperText>
                                )}
                                
                                {index < drivers.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}

                        <View style={styles.buttonRow}>
                            <Button
                                mode="contained"
                                style={[styles.actionButton, styles.addButton]}
                                onPress={addDriver}
                                disabled={loading}
                                icon="account-plus"
                            >
                                Add Driver
                            </Button>

                            <Button
                                mode="contained"
                                style={[styles.actionButton, styles.removeButton]}
                                onPress={removeLastDriver}
                                disabled={drivers.length === 1 || loading}
                                icon="account-remove"
                            >
                                Remove
                            </Button>
                        </View>

                        <Button
                            mode="contained"
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading}
                            icon="content-save"
                        >
                            {loading ? 'Processing...' : 'Register Drivers'}
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
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 30,
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
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    driverContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    driverTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#555',
    },
    input: {
        marginBottom: 4,
        backgroundColor: '#fff',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    addButton: {
        backgroundColor: '#2196F3',
    },
    removeButton: {
        backgroundColor: '#D32F2F',
    },
    submitButton: {
        marginTop: 8,
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emailInput: {
        flex: 1,
    },
    existingUserChip: {
        marginLeft: 8,
        backgroundColor: '#E3F2FD',
        height: 30,
    },
});

export default AddRegisterDriverBusScreen3;