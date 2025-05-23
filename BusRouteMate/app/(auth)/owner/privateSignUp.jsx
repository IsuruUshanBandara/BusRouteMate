import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, Provider, Avatar, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';  
import { auth, db } from '../../db/firebaseConfig'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['auth/email-already-in-use']);

const PrivateBusSignUp = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [nationalIdentityNum, setNationalIdentityNum] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formContainerWidth, setFormContainerWidth] = useState(Dimensions.get('window').width - 40);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // Error states
    const [errors, setErrors] = useState({
        email: '',
        phoneNumber: '',
        nationalIdentityNum: '',
        password: '',
        confirmPassword: '',
        form: ''
    });

    // Update width on orientation change
    useEffect(() => {
        const updateWidth = () => {
            // Account for padding (20px on each side)
            setFormContainerWidth(Dimensions.get('window').width - 40);
        };
        
        const dimensionsListener = Dimensions.addEventListener('change', updateWidth);
        
        return () => {
            dimensionsListener.remove();
        };
    }, []);

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return 'Email is required';
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return '';
    };

    const validatePhoneNumber = (phone) => {
        if (!phone) return 'Phone number is required';
        
        // Check if phone starts with 0 or +
        if (!(phone.startsWith('0') || phone.startsWith('+'))) {
            return 'Phone number must start with 0 or +';
        }
        
        // Remove non-digit characters except for + at the beginning
        const digitsOnly = phone.replace(/^\+|\D/g, '$&').replace(/[^\d+]/g, '');
        
        // Check length (should be 10 digits excluding the + if present)
        const digitCount = digitsOnly.startsWith('+') ? digitsOnly.length - 1 : digitsOnly.length;
        if (digitCount !== 10) {
            return 'Phone number must be 10 digits long';
        }
        
        return '';
    };

    const validateNationalId = (id) => {
        if (!id) return 'National ID is required';
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        if (!confirmPassword) return 'Confirm password is required';
        if (password !== confirmPassword) return 'Passwords do not match';
        return '';
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            phoneNumber: validatePhoneNumber(phoneNumber),
            nationalIdentityNum: validateNationalId(nationalIdentityNum),
            password: validatePassword(password),
            confirmPassword: validateConfirmPassword(password, confirmPassword),
            form: ''
        };

        setErrors(newErrors);

        // Check if there are any validation errors
        return !Object.values(newErrors).some(error => error !== '');
    };

    // Check if user already exists in Firebase Authentication
    const checkIfUserExists = async (email) => {
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            return methods.length > 0;
        } catch (error) {
            console.error("Error checking if user exists:", error);
            return false;
        }
    };

    // Check if user details exist in Firestore
    const checkUserDetailsExist = async (email) => {
        try {
            const userDocRef = doc(db, "ownerDetails", email);
            const docSnapshot = await getDoc(userDocRef);
            return docSnapshot.exists();
        } catch (error) {
            console.error("Error checking user details:", error);
            return false;
        }
    };

    const handleSignUp = async () => {
        // Clear previous form errors
        setErrors(prev => ({...prev, form: ''}));
        
        // Validate all fields before submitting
        if (!validateForm()) {
            setErrors(prev => ({...prev, form: 'Please fix the errors before submitting'}));
            return;
        }

        setIsLoading(true);
        
        try {
            // First check if user already exists in Firebase Auth
            const userExists = await checkIfUserExists(email);
            
            if (userExists) {
                console.log("User exists in Auth, checking Firestore document");
                
                // Check if user details exist in Firestore
                const userDetailsExist = await checkUserDetailsExist(email);
                
                if (userDetailsExist) {
                    // Case 1: User exists in both Auth and Firestore
                    setErrors(prev => ({
                        ...prev, 
                        form: 'Account already exists. Please sign in instead.'
                    }));
                    setIsLoading(false);
                    return;
                } else {
                    // Case 2: User exists in Auth but not in Firestore
                    try {
                        console.log("User exists in Auth but not in Firestore. Attempting to sign in.");
                        
                        // Try to sign in first to verify credentials
                        await signInWithEmailAndPassword(auth, email, password);
                        console.log("Sign-in successful, creating Firestore document");
                        
                        // If sign-in is successful, create the missing Firestore document
                        const userDocRef = doc(db, "ownerDetails", email);
                        await setDoc(userDocRef, {
                            email,
                            phoneNumber,
                            nationalId: nationalIdentityNum,
                            role: "privateOwners",
                            createdAt: new Date(),
                        });
                        
                        console.log("Successfully created document in Firestore");
                        
                        // Navigate to sign-in page after successfully creating the document
                        router.push('owner/privateSignIn');
                    } catch (signInError) {
                        console.error("Sign-in verification error:", signInError.code, signInError.message);
                        
                        // If sign-in fails, it means the password is incorrect
                        if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
                            setErrors(prev => ({
                                ...prev, 
                                form: 'An account with this email already exists. Please use the correct password or reset it.'
                            }));
                        } else {
                            setErrors(prev => ({
                                ...prev, 
                                form: 'Failed to sign in: ' + (signInError.message || 'Unknown error')
                            }));
                        }
                    }
                }
            } else {
                // Case 3: User doesn't exist in Auth - This is a genuine new user
                console.log("Creating new user in Auth and Firestore");
                
                try {
                    // Create new user in Firebase Auth
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    console.log("Successfully created auth account");
                    
                    // Create user document in Firestore
                    const userDocRef = doc(db, "ownerDetails", email);
                    await setDoc(userDocRef, {
                        email,
                        phoneNumber,
                        nationalId: nationalIdentityNum,
                        role: "privateOwners",
                        createdAt: new Date(),
                    });

                    console.log("Successfully created owner document in Firestore");
                    router.push('owner/privateSignIn');
                } catch (createError) {
                    console.error("Create user error:", createError.code, createError.message);
                    
                    // This is where the race condition might be happening
                    if (createError.code === 'auth/email-already-in-use') {
                        // If we get here, it means our initial check missed it
                        // Let's double-check the Firestore document now
                        try {
                            const userDetailsExist = await checkUserDetailsExist(email);
                            
                            if (!userDetailsExist) {
                                // User exists in Auth but not in Firestore - try to sign in
                                console.log("Email exists in Auth but not in Firestore (detected during creation). Attempting sign in.");
                                
                                // Try to sign in with provided credentials
                                await signInWithEmailAndPassword(auth, email, password);
                                
                                // If sign-in works, create the document
                                const userDocRef = doc(db, "ownerDetails", email);
                                await setDoc(userDocRef, {
                                    email,
                                    phoneNumber,
                                    nationalId: nationalIdentityNum,
                                    role: "privateOwners",
                                    createdAt: new Date(),
                                });
                                
                                console.log("Successfully created document after sign in");
                                router.push('owner/privateSignIn');
                                return;
                            } else {
                                // Both exist
                                setErrors(prev => ({
                                    ...prev, 
                                    form: 'Account already exists. Please sign in instead.'
                                }));
                            }
                        } catch (secondaryError) {
                            console.error("Secondary error handling:", secondaryError);
                            setErrors(prev => ({
                                ...prev, 
                                form: 'An account with this email exists. Please try signing in or use a different email.'
                            }));
                        }
                    } else if (createError.code === 'auth/invalid-email') {
                        setErrors(prev => ({...prev, email: 'Invalid email format'}));
                    } else if (createError.code === 'auth/weak-password') {
                        setErrors(prev => ({
                            ...prev, 
                            password: 'Password is too weak. Use at least 6 characters.'
                        }));
                    } else {
                        setErrors(prev => ({
                            ...prev, 
                            form: createError.message || 'Failed to create account'
                        }));
                    }
                }
            }
        } catch (error) {
            console.error("General sign-up error:", error);
            setErrors(prev => ({
                ...prev, 
                form: 'An unexpected error occurred. Please try again.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Provider>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#1976d2', '#64b5f6', '#bbdefb']}
                    style={styles.gradient}
                >
                    <KeyboardAvoidingView 
                        style={styles.keyboardView} 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContainer}>
                            <View style={styles.centeredContent}>
                                <View style={styles.headerContainer}>
                                    <Avatar.Icon 
                                        size={80} 
                                        icon="bus" 
                                        style={styles.avatar} 
                                        color="#fff" 
                                        backgroundColor="#1976d2"
                                    />
                                    <Text style={styles.mainHeading}>Bus Route Mate</Text>
                                    <Text style={styles.subHeadingText}>Bus Owner Registration</Text>
                                </View>

                                <View 
                                    style={styles.formContainer}
                                    onLayout={(event) => {
                                        const { width } = event.nativeEvent.layout;
                                        setFormContainerWidth(width);
                                    }}
                                >
                                    <Text style={styles.formTitle}>Create Your Account</Text>

                                    {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label={`${t('email')} *`}
                                        value={email}
                                        onChangeText={text => {
                                            setEmail(text);
                                            setErrors(prev => ({...prev, email: validateEmail(text)}));
                                        }}
                                        mode="outlined"
                                        outlineColor={errors.email ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.email ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="email" color="#1976d2" />}
                                        error={!!errors.email}
                                    />
                                    {errors.email ? <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label="Phone Number *"
                                        value={phoneNumber}
                                        onChangeText={text => {
                                            setPhoneNumber(text);
                                            setErrors(prev => ({...prev, phoneNumber: validatePhoneNumber(text)}));
                                        }}
                                        mode="outlined"
                                        keyboardType="phone-pad"
                                        outlineColor={errors.phoneNumber ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.phoneNumber ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="phone" color="#1976d2" />}
                                        error={!!errors.phoneNumber}
                                    />
                                    {errors.phoneNumber ? <HelperText type="error" visible={!!errors.phoneNumber}>{errors.phoneNumber}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label="National Identity Card Number *"
                                        value={nationalIdentityNum}
                                        onChangeText={text => {
                                            setNationalIdentityNum(text);
                                            setErrors(prev => ({...prev, nationalIdentityNum: validateNationalId(text)}));
                                        }}
                                        mode="outlined"
                                        outlineColor={errors.nationalIdentityNum ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.nationalIdentityNum ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="card-account-details" color="#1976d2" />}
                                        error={!!errors.nationalIdentityNum}
                                    />
                                    {errors.nationalIdentityNum ? <HelperText type="error" visible={!!errors.nationalIdentityNum}>{errors.nationalIdentityNum}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label={`${t('Password')} *`}
                                        value={password}
                                        onChangeText={text => {
                                            setPassword(text);
                                            setErrors(prev => ({
                                                ...prev, 
                                                password: validatePassword(text),
                                                confirmPassword: validateConfirmPassword(text, confirmPassword)
                                            }));
                                        }}
                                        mode="outlined"
                                        secureTextEntry={!showPassword}
                                        outlineColor={errors.password ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.password ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="lock" color="#1976d2" />}
                                        right={
                                            <TextInput.Icon 
                                                icon={showPassword ? 'eye-off' : 'eye'} 
                                                color="#1976d2"
                                                onPress={() => setShowPassword(!showPassword)} 
                                            />
                                        }
                                        error={!!errors.password}
                                    />
                                    {errors.password ? <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText> : null}

                                    <TextInput 
                                        style={styles.input}
                                        label="Confirm Password *"
                                        value={confirmPassword}
                                        onChangeText={text => {
                                            setConfirmPassword(text);
                                            setErrors(prev => ({...prev, confirmPassword: validateConfirmPassword(password, text)}));
                                        }}
                                        mode="outlined"
                                        secureTextEntry={!showConfirmPassword}
                                        outlineColor={errors.confirmPassword ? '#ff5252' : '#1976d2'}
                                        activeOutlineColor={errors.confirmPassword ? '#ff5252' : '#1976d2'}
                                        theme={{ colors: { primary: '#1976d2' } }}
                                        left={<TextInput.Icon icon="lock-check" color="#1976d2" />}
                                        right={
                                            <TextInput.Icon 
                                                icon={showConfirmPassword ? 'eye-off' : 'eye'} 
                                                color="#1976d2"
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                                            />
                                        }
                                        error={!!errors.confirmPassword}
                                    />
                                    {errors.confirmPassword ? <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword}</HelperText> : null}

                                    <Button 
                                        mode="contained" 
                                        style={styles.signUpButton} 
                                        labelStyle={styles.buttonText}
                                        onPress={handleSignUp}
                                        buttonColor="#1976d2"
                                        icon="account-plus"
                                        loading={isLoading}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : 'Register Now'}
                                    </Button>
                                    
                                    <Button 
                                        mode="text" 
                                        onPress={() => router.push('owner/privateSignIn')}
                                        style={styles.backButton}
                                        labelStyle={styles.backButtonText}
                                        disabled={isLoading}
                                    >
                                        Already have an account? Sign In
                                    </Button>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </SafeAreaView>
        </Provider>
    );
};

export default PrivateBusSignUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        marginBottom: 10,
    },
    mainHeading: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    subHeadingText: {
        fontSize: 18,
        color: 'white',
        marginTop: 5,
    },
    formContainer: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1976d2',
    },
    input: {
        marginVertical: 6,
        width: '100%',
        backgroundColor: 'white',
    },
    signUpButton: {
        marginTop: 20,
        paddingVertical: 8,
        width: '100%',
        alignSelf: 'center',
        borderRadius: 10,
        elevation: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 15,
    },
    backButtonText: {
        color: '#1976d2',
    },
    errorText: {
        color: '#ff5252',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
});