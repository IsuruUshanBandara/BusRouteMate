import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Alert, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, IconButton, Card, Avatar, Chip, Divider, Provider as PaperProvider, HelperText, Portal, Dialog } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, getDocs, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, deleteUser, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { ActivityIndicator } from 'react-native';

const EditDriverConductorDetails = () => {
  const { plateNumber } = useLocalSearchParams();
  const router = useRouter();
  
  // Owner credentials for session restoration
  const [ownerCredentials, setOwnerCredentials] = useState({
    email: '',
    password: '',
    isVerified: false
  });
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDriverIndex, setEditingDriverIndex] = useState(null);
  const [isPerformingCriticalOperation, setIsPerformingCriticalOperation] = useState(false);
  // State for new driver registration
  const [newDriver, setNewDriver] = useState({
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
  });
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [addingNewDriver, setAddingNewDriver] = useState(false);
  const [deletePasswordPrompt, setDeletePasswordPrompt] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [showOwnerVerificationDialog, setShowOwnerVerificationDialog] = useState(false);
  const [verificationPurpose, setVerificationPurpose] = useState(null); // 'add' or 'delete'

  // Get owner email when component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (isPerformingCriticalOperation) {
        console.log("Ignoring auth state change during critical operation");
        return;
      }
  
      if (user) {
        setOwnerCredentials(prev => ({
          ...prev,
          email: user.email
        }));
        fetchDriverData();
      } else {
        console.log("No user detected, navigating to login");
        router.push('../../(auth)/owner/privateSignIn');
      }
    });
  
    return unsubscribe;
  }, [plateNumber, isPerformingCriticalOperation]);

  const fetchDriverData = async () => {
    try {
      const driversQuery = await getDocs(collection(db, 'driverDetails'));
      const busDrivers = [];
      
      driversQuery.forEach(doc => {
        const driverData = doc.data();
        if (driverData.licencePlateNum === plateNumber) {
          busDrivers.push({
            id: doc.id,
            originalEmail: driverData.driverEmail,
            phoneNum: driverData.driverPhone || '',
            email: driverData.driverEmail || '',
            conductorPhone: driverData.conductorPhone || '',
            createdAt: driverData.createdAt || new Date().toISOString(),
            licencePlateNum: driverData.licencePlateNum,
            isEditing: false,
            errors: {
              phoneNum: '',
              conductorPhone: ''
            }
          });
        }
      });

      setDrivers(busDrivers);
    } catch (error) {
      console.error("Error fetching driver data:", error);
      Alert.alert("Error", "Failed to load driver data");
    } finally {
      setLoading(false);
    }
  };

  // Verify owner password function
  const verifyOwnerPassword = async () => {
    setLoading(true);
    
    try {
      // Validate that password is entered
      if (!ownerCredentials.password) {
        Alert.alert("Error", "Please enter your password");
        setLoading(false);
        return;
      }
      
      // Verify the owner's password by trying to sign in
      await signInWithEmailAndPassword(auth, ownerCredentials.email, ownerCredentials.password);
      
      // If sign-in successful, mark as verified
      setOwnerCredentials(prev => ({
        ...prev,
        isVerified: true
      }));
      
      setShowOwnerVerificationDialog(false);
      
      // Continue with the original purpose after verification
      if (verificationPurpose === 'add') {
        setAddingNewDriver(true);
      } else if (verificationPurpose === 'delete' && driverToDelete) {
        // Proceed with delete flow after verification
        setDeletePasswordPrompt(true);
      }
    } catch (error) {
      console.error("Password verification error:", error);
      let errorMessage = "Incorrect password. Please try again.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else {
        errorMessage = "Authentication error. Please try again.";
      }
      
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle edit mode for a driver
  const handleEditDriver = (index) => {
    const updatedDrivers = [...drivers];
    
    // Close any currently editing driver card
    if (editingDriverIndex !== null) {
      updatedDrivers[editingDriverIndex].isEditing = false;
    }
    
    // Set the selected driver to editing mode
    updatedDrivers[index].isEditing = true;
    setDrivers(updatedDrivers);
    setEditingDriverIndex(index);
  };

  // Update fields for existing driver
  const updateDriverField = (index, field, value) => {
    const updatedDrivers = [...drivers];
    
    // Don't allow updating email field
    if (field !== 'email') {
      updatedDrivers[index][field] = value;
      
      // Clear error when typing
      if (updatedDrivers[index].errors && updatedDrivers[index].errors[field]) {
        updatedDrivers[index].errors[field] = '';
      }
    }
    
    setDrivers(updatedDrivers);
  };

  // Update fields for new driver
  const updateNewDriverField = (field, value) => {
    setNewDriver(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear error when typing
      if (updated.errors[field]) {
        updated.errors[field] = '';
      }
      
      // If email is changed, reset the isExistingUser flag
      if (field === 'email') {
        updated.isExistingUser = false;
        updated.registeredForBus = false;
        updated.emailChecked = false;
      }
      
      return updated;
    });
  };

  // Validation functions
  const validatePhoneNumber = (phoneNum) => {
    return /^\d{10,15}$/.test(phoneNum) ? '' : 'Please enter a valid phone number';
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address';
  };

  const validatePassword = (password) => {
    return password.length >= 6 ? '' : 'Password must be at least 6 characters';
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    return password === confirmPassword ? '' : 'Passwords do not match';
  };

  // Validate driver input
  const validateDriverInput = (newDriver) => {
    const errors = {
      phoneNum: validatePhoneNumber(newDriver.phoneNum),
      email: validateEmail(newDriver.email),
      password: validatePassword(newDriver.password),
      confirmPassword: !newDriver.isExistingUser ? validateConfirmPassword(newDriver.password, newDriver.confirmPassword) : '',
      conductorPhone: newDriver.conductorPhone ? validatePhoneNumber(newDriver.conductorPhone) : ''
    };
    
    // Return errors object and a boolean indicating if there are no errors
    return { 
      errors, 
      isValid: !Object.values(errors).some(error => error !== '') 
    };
  };

  // Check if email exists and if driver is already registered for this bus
  const checkExistingUser = async (email) => {
    try {
      // First check if email exists in auth system
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const emailExists = methods.length > 0;
  
      // Then check if already registered for this specific bus
      const docRef = doc(db, 'driverDetails', `${plateNumber}-${email}`);
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

  // Handle email check when field loses focus
  const handleEmailBlur = async () => {
    const email = newDriver.email.trim();
    if (!email) return;
  
    // Validate email format first
    const emailError = validateEmail(email);
    if (emailError) {
      setNewDriver(prev => ({
        ...prev,
        errors: { ...prev.errors, email: emailError }
      }));
      return;
    }
  
    // Check for duplicate emails with existing drivers
    const isDuplicate = drivers.some(driver => 
      driver.email.toLowerCase() === email.toLowerCase()
    );
    
    if (isDuplicate) {
      setNewDriver(prev => ({
        ...prev,
        errors: { ...prev.errors, email: 'This email is already used for another driver' }
      }));
      return;
    }
  
    try {
      setLoading(true);
      const { emailExists, registeredForBus, message } = await checkExistingUser(email);
      
      setNewDriver(prev => ({
        ...prev,
        isExistingUser: emailExists,
        registeredForBus: registeredForBus,
        emailChecked: true,
        errors: { ...prev.errors, email: '' }
      }));
      
      if (registeredForBus) {
        Alert.alert("Already Registered", message);
        // Clear the email field if already registered for this bus
        setNewDriver(prev => ({
          ...prev,
          email: '',
          emailChecked: false
        }));
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

  // Handle saving updated driver
  const handleSaveDriver = async (index) => {
    const driver = drivers[index];
    
    // Validate phone numbers
    const phoneError = validatePhoneNumber(driver.phoneNum);
    const conductorPhoneError = driver.conductorPhone ? validatePhoneNumber(driver.conductorPhone) : '';
    
    // Update errors in state
    if (phoneError || conductorPhoneError) {
      const updatedDrivers = [...drivers];
      updatedDrivers[index].errors = {
        phoneNum: phoneError,
        conductorPhone: conductorPhoneError
      };
      setDrivers(updatedDrivers);
      return;
    }

    setLoading(true);
    try {
      // Update Firestore document
      await updateDoc(doc(db, 'driverDetails', driver.id), {
        driverPhone: driver.phoneNum,
        conductorPhone: driver.conductorPhone || '',
        updatedAt: new Date().toISOString()
      });
      
      // Update local state - turn off editing mode
      const updatedDrivers = [...drivers];
      updatedDrivers[index].isEditing = false;
      setDrivers(updatedDrivers);
      setEditingDriverIndex(null);
      
      Alert.alert("Success", "Driver details updated successfully");
    } catch (error) {
      console.error("Error updating driver:", error);
      Alert.alert("Error", `Failed to update driver details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing driver
  const cancelEditDriver = (index) => {
    const updatedDrivers = [...drivers];
    updatedDrivers[index].isEditing = false;
    setDrivers(updatedDrivers);
    setEditingDriverIndex(null);
    
    // Reload the original data to discard changes
    fetchDriverData();
  };

  // Toggle add new driver mode
  const handleAddNewDriver = () => {
    // Show verification dialog if not already verified
    if (!ownerCredentials.isVerified) {
      setVerificationPurpose('add');
      setShowOwnerVerificationDialog(true);
    } else {
      setAddingNewDriver(true);
    }
  };

  // Cancel adding new driver
  const cancelNewDriver = () => {
    setAddingNewDriver(false);
    setNewDriver({
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
    });
  };

  // Set up to delete a driver
  const handleDeleteDriver = async (driver) => {
    // Store the driver to delete
    setDriverToDelete(driver);

    // Show verification dialog if owner not verified
    if (!ownerCredentials.isVerified) {
      setVerificationPurpose('delete');
      setShowOwnerVerificationDialog(true);
      return;
    }

    // If owner is already verified, proceed with delete confirmation
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove this driver (${driver.email})? This will delete both the driver record and their authentication account.`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            setDeletePasswordPrompt(true);
          }
        }
      ]
    );
  };

  const confirmDeleteDriverWithAuth = async () => {
    if (!deletePassword || !driverToDelete) {
      Alert.alert("Error", "Password is required to delete the driver account");
      return;
    }
  
    setLoading(true);
    setIsPerformingCriticalOperation(true); // Block auth state changes
    
    try {
      const auth = getAuth();
      const ownerEmail = ownerCredentials.email;
      const ownerPassword = ownerCredentials.password;
  
      // 1. First ensure we have the owner's current credentials
      console.log("Signing in as owner before deletion");
      const ownerCreds = await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      const ownerIdToken = await ownerCreds.user.getIdToken();
      console.log("Owner signed in successfully");
  
      // 2. Temporarily sign in as the driver
      console.log("Signing in as driver for deletion");
      const driverCreds = await signInWithEmailAndPassword(
        auth,
        driverToDelete.email,
        deletePassword
      );
      console.log("Driver signed in successfully");
      
      // 3. Delete the driver's auth account
      console.log("Deleting driver auth account");
      await deleteUser(driverCreds.user);
      console.log("Driver auth account deleted");
      
      // 4. Delete the driver's Firestore record
      const driverDocId = `${plateNumber}-${driverToDelete.email}`;
      console.log("Deleting driver Firestore record");
      await deleteDoc(doc(db, "driverDetails", driverDocId));
      console.log("Driver Firestore record deleted");
      
      // 5. Restore owner session using the fresh token
      console.log("Restoring owner session");
      await auth.signOut(); // Clear current session
      
      // Use the original owner credentials to sign back in
      const restoredOwner = await signInWithEmailAndPassword(
        auth,
        ownerEmail,
        ownerPassword
      );
      
      console.log("Owner session restored successfully:", restoredOwner.user.email);
  
      // 6. Update local state
      setDrivers(drivers.filter(driver => driver.email !== driverToDelete.email));
      setDeletePasswordPrompt(false);
      setDeletePassword('');
      setDriverToDelete(null);
      
      Alert.alert("Success", "Driver deleted successfully");
    } catch (error) {
      console.error("Error deleting driver:", error);
      
      // Try to restore owner session
      try {
        console.log("Attempting to restore owner session after error");
        await signInWithEmailAndPassword(
          auth,
          ownerCredentials.email,
          ownerCredentials.password
        );
        console.log("Owner session restored after error");
      } catch (signInError) {
        console.error("Failed to restore owner session:", signInError);
        // Only navigate to login if this wasn't an expected error
        if (signInError.code !== 'auth/requires-recent-login') {
          router.push('../../(auth)/owner/privateSignIn');
        }
        return;
      }
  
      // Enhanced error handling
      let errorMessage = "Failed to delete driver";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect driver password";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Session expired. Please verify your owner password again.";
      } else if (error.code === 'auth/missing-password') {
        errorMessage = "Owner session lost. Please log in again.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsPerformingCriticalOperation(false); // Re-enable auth state changes
      setLoading(false);
    }
  };

  // Save new driver with proper session management
  const handleSaveNewDriver = async () => {
    // Validate inputs
    const { errors, isValid } = validateDriverInput(newDriver);
    
    if (!isValid) {
      setNewDriver(prev => ({
        ...prev,
        errors: errors
      }));
      Alert.alert("Validation Error", "Please correct the errors before submitting");
      return;
    }

    // Check for duplicate emails
    const isDuplicate = drivers.some(driver => 
      driver.email.toLowerCase() === newDriver.email.toLowerCase()
    );
    
    if (isDuplicate) {
      setNewDriver(prev => ({
        ...prev,
        errors: { ...prev.errors, email: 'This email is already used for another driver' }
      }));
      Alert.alert("Error", "This email is already associated with a driver");
      return;
    }

    setLoading(true);
    try {
      // Save owner credentials to restore session later
      const ownerEmail = ownerCredentials.email;
      const ownerPassword = ownerCredentials.password;
      
      // Always attempt to sign in first, regardless of isExistingUser flag
      try {
        await signInWithEmailAndPassword(auth, newDriver.email, newDriver.password);
        console.log("Successfully authenticated existing user");
      } catch (signInError) {
        // If sign in fails, user might not exist or password is wrong
        if (newDriver.isExistingUser) {
          // If we know it's an existing user but sign-in failed, it's a password error
          Alert.alert("Authentication Error", "Incorrect password for existing user");
          
          // Sign the owner back in
          await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
          setLoading(false);
          return;
        } else {
          // If we thought it was a new user and sign-in failed, try to create the account
          try {
            await createUserWithEmailAndPassword(auth, newDriver.email, newDriver.password);
            console.log("Successfully created new user");
          } catch (createError) {
            let errorMessage = "Failed to create user account";
            
            if (createError.code === 'auth/email-already-in-use') {
              errorMessage = "This email already exists. Please enter the correct password for the existing account.";
              
              // Update the driver's state to reflect they are an existing user
              setNewDriver(prev => ({
                ...prev,
                isExistingUser: true
              }));
            } else if (createError.code === 'auth/weak-password') {
              errorMessage = "Password is too weak. Please use a stronger password.";
            }
            
            Alert.alert("Registration Error", errorMessage);
            
            // Sign the owner back in
            await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
            setLoading(false);
            return;
          }
        }
      }

      // Create document in Firestore
      const newDocId = `${plateNumber}-${newDriver.email}`;
      const timestamp = new Date().toISOString();
      
      await setDoc(doc(db, 'driverDetails', newDocId), {
        licencePlateNum: plateNumber,
        driverEmail: newDriver.email,
        driverPhone: newDriver.phoneNum,
        conductorPhone: newDriver.conductorPhone || '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
      
      // Sign the owner back in to restore their session
      await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      
      // Add to local state
      const newDriverWithId = {
        id: newDocId,
        originalEmail: newDriver.email,
        email: newDriver.email,
        phoneNum: newDriver.phoneNum,
        conductorPhone: newDriver.conductorPhone || '',
        licencePlateNum: plateNumber,
        createdAt: timestamp,
        isEditing: false,
        errors: {
          phoneNum: '',
          conductorPhone: ''
        }
      };
      setDrivers([...drivers, newDriverWithId]);
      
      // Reset form
      cancelNewDriver();
      Alert.alert("Success", "New driver added successfully!");
    } catch (error) {
      console.error("Error adding new driver:", error);
      
      // Try to sign the owner back in if there was an error
      try {
        await signInWithEmailAndPassword(auth, ownerCredentials.email, ownerCredentials.password);
      } catch (signInError) {
        console.error("Failed to restore owner session:", signInError);
      }
      
      Alert.alert("Error", `Failed to add new driver: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && drivers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : null}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Manage Drivers</Text>
              <Text style={styles.headerSubtitle}>Bus License: {plateNumber}</Text>
            </View>
            
            {/* Add New Driver Button at the top */}
            <View style={styles.topButtonContainer}>
              <Button
                mode="contained"
                icon="account-plus"
                style={styles.addButton}
                onPress={handleAddNewDriver}
                disabled={loading}
              >
                Add New Driver
              </Button>
            </View>
            
            {/* Driver List */}
            <View style={styles.driverListContainer}>
              <Text style={styles.sectionTitle}>
                {drivers.length > 0 ? 'Current Drivers' : 'No Drivers Registered'}
              </Text>
              
              {drivers.map((driver, index) => (
                <Card key={index} style={styles.driverCard}>
                  {/* Non-editing view */}
                  {!driver.isEditing ? (
                    <>
                      <Card.Title
                        title={driver.email}
                        subtitle={`Driver for ${plateNumber}`}
                        left={(props) => <Avatar.Icon {...props} icon="account" />}
                      />
                      <Card.Content>
                        <Text style={styles.fieldLabel}>Phone:</Text>
                        <Text style={styles.fieldValue}>{driver.phoneNum}</Text>
                        
                        {driver.conductorPhone && (
                          <>
                            <Text style={styles.fieldLabel}>Conductor Phone:</Text>
                            <Text style={styles.fieldValue}>{driver.conductorPhone}</Text>
                          </>
                        )}
                      </Card.Content>
                      <Card.Actions>
                        <Button 
                          onPress={() => handleEditDriver(index)}
                          mode="outlined"
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button 
                          onPress={() => handleDeleteDriver(driver)}
                          mode="outlined"
                          textColor="#D32F2F"
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </Card.Actions>
                    </>
                  ) : (
                    /* Editing view */
                    <>
                      <Card.Title
                        title={`Edit ${driver.email}`}
                        left={(props) => <Avatar.Icon {...props} icon="account-edit" />}
                      />
                      <Card.Content>
                        <TextInput
                          style={styles.input}
                          label="Driver Phone Number*"
                          value={driver.phoneNum}
                          keyboardType='phone-pad'
                          onChangeText={text => updateDriverField(index, 'phoneNum', text)}
                          mode="outlined"
                          error={!!driver.errors.phoneNum}
                          disabled={loading}
                        />
                        {!!driver.errors.phoneNum && (
                          <HelperText type="error" visible={!!driver.errors.phoneNum}>
                            {driver.errors.phoneNum}
                          </HelperText>
                        )}
                        
                        <TextInput
                          style={[styles.input, styles.disabledInput]}
                          label="Driver Email (Cannot be changed)"
                          value={driver.email}
                          disabled={true}
                          mode="outlined"
                        />
                        
                        <TextInput
                          style={styles.input}
                          label="Conductor Phone Number"
                          value={driver.conductorPhone}
                          keyboardType='phone-pad'
                          onChangeText={text => updateDriverField(index, 'conductorPhone', text)}
                          mode="outlined"
                          error={!!driver.errors.conductorPhone}
                          disabled={loading}
                        />
                        {!!driver.errors.conductorPhone && (
                          <HelperText type="error" visible={!!driver.errors.conductorPhone}>
                            {driver.errors.conductorPhone}
                          </HelperText>
                        )}
                      </Card.Content>
                      <Card.Actions>
                        <Button 
                          onPress={() => cancelEditDriver(index)}
                          mode="outlined"
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onPress={() => handleSaveDriver(index)}
                          mode="contained"
                          loading={loading}
                          disabled={loading}
                        >
                          Save
                        </Button>
                      </Card.Actions>
                    </>
                  )}
                </Card>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
  
        {/* Owner Verification Modal */}
        <Modal
          visible={showOwnerVerificationDialog}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOwnerVerificationDialog(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Card style={styles.modalCard}>
                <Card.Title
                  title="Verify Owner Account"
                  left={(props) => <Avatar.Icon {...props} icon="shield-account" />}
                />
                <Card.Content>
                  <Text style={styles.modalText}>
                    Before performing this action, please verify your owner account.
                  </Text>
                  
                  <View style={styles.ownerEmailContainer}>
                    <Text style={styles.ownerEmailLabel}>Owner Email:</Text>
                    <Text style={styles.ownerEmail}>{ownerCredentials.email}</Text>
                  </View>
                  
                  <TextInput
                    style={styles.modalInput}
                    label="Owner Password*"
                    secureTextEntry={!showOwnerPassword}
                    right={
                      <TextInput.Icon
                        icon={showOwnerPassword ? "eye-off" : "eye"}
                        onPress={() => setShowOwnerPassword(!showOwnerPassword)}
                      />
                    }
                    value={ownerCredentials.password}
                    onChangeText={text => setOwnerCredentials(prev => ({...prev, password: text}))}
                    mode="outlined"
                    disabled={loading}
                    autoFocus={true}
                  />
                </Card.Content>
                <Card.Actions>
                  <Button
                    onPress={() => setShowOwnerVerificationDialog(false)}
                    mode="outlined"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={verifyOwnerPassword}
                    loading={loading}
                    disabled={loading || !ownerCredentials.password}
                    icon="account-check"
                  >
                    Verify Password
                  </Button>
                </Card.Actions>
              </Card>
            </View>
          </View>
        </Modal>

        {/* New Driver Registration Modal */}
        <Modal
          visible={addingNewDriver}
          transparent={true}
          animationType="slide"
          onRequestClose={cancelNewDriver}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.largeModalContent]}>
              <Card style={styles.modalCard}>
                <Card.Title
                  title="Register New Driver"
                  left={(props) => <Avatar.Icon {...props} icon="account-plus" />}
                />
                <ScrollView style={styles.modalScrollContent}>
                  <Card.Content>
                    <TextInput
                      style={styles.modalInput}
                      label="Driver Phone Number*"
                      value={newDriver.phoneNum}
                      keyboardType='phone-pad'
                      onChangeText={text => updateNewDriverField('phoneNum', text)}
                      mode="outlined"
                      error={!!newDriver.errors.phoneNum}
                      disabled={loading}
                    />
                    {!!newDriver.errors.phoneNum && (
                      <HelperText type="error" visible={!!newDriver.errors.phoneNum}>
                        {newDriver.errors.phoneNum}
                      </HelperText>
                    )}

                    <View style={styles.emailContainer}>
                      <TextInput
                        style={styles.modalInput}
                        label="Driver Email*"
                        value={newDriver.email}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        onChangeText={text => updateNewDriverField('email', text)}
                        onBlur={() => handleEmailBlur()}
                        mode="outlined"
                        error={!!newDriver.errors.email}
                        disabled={loading}
                      />
                      {newDriver.emailChecked && newDriver.isExistingUser && (
                        <Chip 
                          style={styles.existingUserChip}
                          mode="outlined"
                          icon="account"
                        >
                          Existing Account
                        </Chip>
                      )}
                    </View>
                    {!!newDriver.errors.email && (
                      <HelperText type="error" visible={!!newDriver.errors.email}>
                        {newDriver.errors.email}
                      </HelperText>
                    )}
                    
                    {newDriver.emailChecked && newDriver.isExistingUser && (
                      <HelperText type="info">
                        This driver already has an account. Enter their password to register them to this bus.
                      </HelperText>
                    )}

                    <TextInput
                      style={styles.modalInput}
                      label={newDriver.isExistingUser ? "Driver's Existing Password*" : "Password*"}
                      secureTextEntry={!showPassword}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          onPress={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        />
                      }
                      value={newDriver.password}
                      onChangeText={text => updateNewDriverField('password', text)}
                      mode="outlined"
                      error={!!newDriver.errors.password}
                      disabled={loading}
                    />
                    {!!newDriver.errors.password && (
                      <HelperText type="error" visible={!!newDriver.errors.password}>
                        {newDriver.errors.password}
                      </HelperText>
                    )}

                    {!newDriver.isExistingUser && (
                      <>
                        <TextInput
                          style={styles.modalInput}
                          label="Confirm Password*"
                          secureTextEntry={!showConfirmPassword}
                          right={
                            <TextInput.Icon
                              icon={showConfirmPassword ? "eye-off" : "eye"}
                              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={loading}
                            />
                          }
                          value={newDriver.confirmPassword}
                          onChangeText={text => updateNewDriverField('confirmPassword', text)}
                          mode="outlined"
                          error={!!newDriver.errors.confirmPassword}
                          disabled={loading}
                        />
                        {!!newDriver.errors.confirmPassword && (
                          <HelperText type="error" visible={!!newDriver.errors.confirmPassword}>
                            {newDriver.errors.confirmPassword}
                          </HelperText>
                        )}
                      </>
                    )}

                    <TextInput
                      style={styles.modalInput}
                      label="Conductor Phone Number"
                      value={newDriver.conductorPhone}
                      keyboardType='phone-pad'
                      onChangeText={text => updateNewDriverField('conductorPhone', text)}
                      mode="outlined"
                      error={!!newDriver.errors.conductorPhone}
                      disabled={loading}
                    />
                    {!!newDriver.errors.conductorPhone && (
                      <HelperText type="error" visible={!!newDriver.errors.conductorPhone}>
                        {newDriver.errors.conductorPhone}
                      </HelperText>
                    )}
                  </Card.Content>
                </ScrollView>
                <Card.Actions style={styles.modalActions}>
                  <Button 
                    onPress={cancelNewDriver}
                    mode="outlined"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onPress={handleSaveNewDriver}
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                  >
                    Register Driver
                  </Button>
                </Card.Actions>
              </Card>
            </View>
          </View>
        </Modal>

        {/* Delete Password Modal */}
        <Modal
          visible={deletePasswordPrompt}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setDeletePasswordPrompt(false);
            setDeletePassword('');
            setDriverToDelete(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Card style={styles.modalCard}>
                <Card.Title
                  title="Enter Driver Password"
                  left={(props) => <Avatar.Icon {...props} icon="shield-key" />}
                />
                <Card.Content>
                  <Text style={styles.modalText}>
                    To delete the driver and their authentication account, please enter the driver's password:
                  </Text>
                  <Text style={[styles.modalText, { fontWeight: 'bold', marginBottom: 16 }]}>
                    {driverToDelete?.email}
                  </Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    label="Driver Password*"
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    mode="outlined"
                    autoFocus={true}
                  />
                </Card.Content>
                <Card.Actions>
                  <Button
                    onPress={() => {
                      setDeletePasswordPrompt(false);
                      setDeletePassword('');
                      setDriverToDelete(null);
                    }}
                    mode="outlined"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={confirmDeleteDriverWithAuth}
                    mode="contained"
                    loading={loading}
                    disabled={loading || !deletePassword}
                    textColor="#D32F2F"
                  >
                    Delete
                  </Button>
                </Card.Actions>
              </Card>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
  },
  largeModalContent: {
    maxHeight: '80%',
    width: '95%',
    maxWidth: 500,
  },
  modalScrollContent: {
    maxHeight: '80%',
  },
  modalCard: {
    elevation: 5,
    backgroundColor: '#fff',
  },
  modalActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalText: {
    marginBottom: 8,
    color: '#555',
    fontSize: 16,
  },
  modalInput: {
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    color: '#333',
  },
  driverListContainer: {
    marginBottom: 16,
  },
  driverCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  fieldValue: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    paddingVertical: 8,
  },
  topButtonContainer: {
    marginBottom: 16,
  },
  emailContainer: {
    position: 'relative',
  },
  existingUserChip: {
    position: 'absolute',
    right: 0,
    top: 8,
    backgroundColor: '#e3f2fd',
  },
  ownerEmailContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ownerEmailLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#333',
  },
  ownerEmail: {
    color: '#333',
  }
});

export default EditDriverConductorDetails;