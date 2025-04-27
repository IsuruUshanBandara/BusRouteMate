import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, IconButton, Card, Avatar, Divider, Portal, Dialog, Provider as PaperProvider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { collection, doc, getDocs, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator } from 'react-native';

const EditDriverConductorDetails = () => {
  const { plateNumber } = useLocalSearchParams();
  const router = useRouter();
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [newDriver, setNewDriver] = useState({
    phoneNum: '',
    email: '',
    conductorPhone: '',
    password: '',
    confirmPassword: '',
    isNew: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addingNewDriver, setAddingNewDriver] = useState(false);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const driversQuery = await getDocs(collection(db, 'driverDetails'));
        const busDrivers = [];
        
        driversQuery.forEach(doc => {
          const driverData = doc.data();
          if (driverData.licencePlateNum === plateNumber) {
            busDrivers.push({
              id: doc.id,
              originalEmail: driverData.driverEmail, // Store original email for comparison
              phoneNum: driverData.driverPhone || '',
              email: driverData.driverEmail || '',
              conductorPhone: driverData.conductorPhone || '',
              createdAt: driverData.createdAt || new Date().toISOString(),
              licencePlateNum: driverData.licencePlateNum,
              isNew: false
            });
          }
        });

        if (busDrivers.length > 0) {
          setDrivers(busDrivers);
        } else {
          Alert.alert(
            "No Drivers Found", 
            "No drivers are currently registered for this bus. Would you like to add a driver?",
            [
              {text: "Cancel", onPress: () => router.back(), style: "cancel"},
              {text: "Add Driver", onPress: () => setAddingNewDriver(true)}
            ]
          );
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
        Alert.alert("Error", "Failed to load driver data");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchDriverData();
      } else {
        router.push('../../(auth)/owner/privateSignIn');
      }
    });

    return unsubscribe;
  }, [plateNumber]);

  const handleEditDriver = (driver, index) => {
    setCurrentDriver({...driver});
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const updateDriverField = (field, value) => {
    setCurrentDriver({...currentDriver, [field]: value});
  };

  const updateNewDriverField = (field, value) => {
    setNewDriver({...newDriver, [field]: value});
  };

  const handleAddNewDriver = () => {
    setAddingNewDriver(true);
  };

  const handleDeleteDriver = async (driver) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to remove this driver (${driver.email})?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              // Delete driver document
              await deleteDoc(doc(db, 'driverDetails', driver.id));
              
              // Update state
              const updatedDrivers = drivers.filter(d => d.id !== driver.id);
              setDrivers(updatedDrivers);
              
              Alert.alert("Success", "Driver removed successfully");
            } catch (error) {
              console.error("Error deleting driver:", error);
              Alert.alert("Error", "Failed to delete driver");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveDriver = async () => {
    if (!currentDriver.phoneNum || !currentDriver.email) {
      Alert.alert("Error", "Driver phone number and email are required");
      return;
    }

    setLoading(true);
    try {
      const emailChanged = currentDriver.email !== currentDriver.originalEmail;
      
      if (emailChanged) {
        // Create new document with updated email
        const newDocId = `${plateNumber}-${currentDriver.email}`;
        
        // Prepare the document data, ensuring all fields are present
        const driverData = {
          driverPhone: currentDriver.phoneNum,
          driverEmail: currentDriver.email,
          conductorPhone: currentDriver.conductorPhone || '',
          licencePlateNum: plateNumber,
          // Use current timestamp if createdAt doesn't exist
          createdAt: currentDriver.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // First create the new document
        await setDoc(doc(db, 'driverDetails', newDocId), driverData);
        
        // Then delete the old document
        await deleteDoc(doc(db, 'driverDetails', currentDriver.id));
        
        // Update local state
        const updatedDrivers = [...drivers];
        updatedDrivers[currentIndex] = {
          ...currentDriver,
          id: newDocId,
          originalEmail: currentDriver.email
        };
        setDrivers(updatedDrivers);
      } else {
        // Just update existing document
        await updateDoc(doc(db, 'driverDetails', currentDriver.id), {
          driverPhone: currentDriver.phoneNum,
          conductorPhone: currentDriver.conductorPhone || '',
          updatedAt: new Date().toISOString()
        });
        
        // Update local state
        const updatedDrivers = [...drivers];
        updatedDrivers[currentIndex] = currentDriver;
        setDrivers(updatedDrivers);
      }
      
      Alert.alert("Success", "Driver details updated successfully");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating driver:", error);
      Alert.alert("Error", `Failed to update driver details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewDriver = async () => {
    // Validate inputs
    if (!newDriver.phoneNum || !newDriver.email || !newDriver.password) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (newDriver.password !== newDriver.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Check if email is already used
      const emailExists = drivers.some(driver => 
        driver.email.toLowerCase() === newDriver.email.toLowerCase()
      );
      
      if (emailExists) {
        Alert.alert("Error", "This email is already associated with a driver");
        setLoading(false);
        return;
      }
      
      // Create new driver document
      const newDocId = `${plateNumber}-${newDriver.email}`;
      const timestamp = new Date().toISOString();
      
      await setDoc(doc(db, 'driverDetails', newDocId), {
        driverPhone: newDriver.phoneNum,
        driverEmail: newDriver.email,
        conductorPhone: newDriver.conductorPhone || '',
        licencePlateNum: plateNumber,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      
      // Add to local state
      const newDriverWithId = {
        ...newDriver,
        id: newDocId,
        originalEmail: newDriver.email,
        licencePlateNum: plateNumber,
        createdAt: timestamp,
        updatedAt: timestamp,
        isNew: false
      };
      setDrivers([...drivers, newDriverWithId]);
      
      // Reset form
      setNewDriver({
        phoneNum: '',
        email: '',
        conductorPhone: '',
        password: '',
        confirmPassword: '',
        isNew: true
      });
      
      setAddingNewDriver(false);
      Alert.alert("Success", "New driver added successfully");
    } catch (error) {
      console.error("Error adding new driver:", error);
      Alert.alert("Error", `Failed to add new driver: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelNewDriver = () => {
    setAddingNewDriver(false);
    setNewDriver({
      phoneNum: '',
      email: '',
      conductorPhone: '',
      password: '',
      confirmPassword: '',
      isNew: true
    });
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

            {/* Driver List */}
            {drivers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Current Drivers</Text>
                {drivers.map((driver, index) => (
                  <Card key={index} style={styles.driverCard}>
                    <Card.Title
                      title={`Driver ${index + 1}`}
                      left={(props) => <Avatar.Icon {...props} icon="account" />}
                    />
                    <Card.Content>
                      <Text style={styles.fieldLabel}>Email:</Text>
                      <Text style={styles.fieldValue}>{driver.email}</Text>
                      
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
                        onPress={() => handleEditDriver(driver, index)}
                        mode="outlined"
                      >
                        Edit
                      </Button>
                      <Button 
                        onPress={() => handleDeleteDriver(driver)}
                        mode="outlined"
                        textColor="#D32F2F"
                      >
                        Delete
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </>
            )}

            {/* Add New Driver Form */}
            {addingNewDriver ? (
              <Card style={styles.newDriverCard}>
                <Card.Title
                  title="Add New Driver"
                  left={(props) => <Avatar.Icon {...props} icon="account-plus" />}
                />
                <Card.Content>
                  <TextInput
                    style={styles.input}
                    label="Driver Phone Number*"
                    value={newDriver.phoneNum}
                    keyboardType='phone-pad'
                    onChangeText={text => updateNewDriverField('phoneNum', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Driver Email*"
                    value={newDriver.email}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    onChangeText={text => updateNewDriverField('email', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Password*"
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    value={newDriver.password}
                    onChangeText={text => updateNewDriverField('password', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Confirm Password*"
                    secureTextEntry={!showConfirmPassword}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                    value={newDriver.confirmPassword}
                    onChangeText={text => updateNewDriverField('confirmPassword', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Conductor Phone Number"
                    value={newDriver.conductorPhone}
                    keyboardType='phone-pad'
                    onChangeText={text => updateNewDriverField('conductorPhone', text)}
                    mode="outlined"
                  />
                </Card.Content>
                <Card.Actions>
                  <Button 
                    onPress={cancelNewDriver}
                    mode="outlined"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onPress={handleSaveNewDriver}
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </Card.Actions>
              </Card>
            ) : (
              <Button
                mode="contained"
                icon="account-plus"
                style={styles.addButton}
                onPress={handleAddNewDriver}
              >
                Add New Driver
              </Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Edit Driver Modal */}
        <Portal>
          <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
            <Dialog.Title>Edit Driver</Dialog.Title>
            <Dialog.Content>
              {currentDriver && (
                <>
                  <TextInput
                    style={styles.input}
                    label="Driver Phone Number*"
                    value={currentDriver.phoneNum}
                    keyboardType='phone-pad'
                    onChangeText={text => updateDriverField('phoneNum', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Driver Email*"
                    value={currentDriver.email}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    onChangeText={text => updateDriverField('email', text)}
                    mode="outlined"
                  />

                  <TextInput
                    style={styles.input}
                    label="Conductor Phone Number"
                    value={currentDriver.conductorPhone}
                    keyboardType='phone-pad'
                    onChangeText={text => updateDriverField('conductorPhone', text)}
                    mode="outlined"
                  />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
              <Button onPress={handleSaveDriver} loading={loading} disabled={loading}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
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
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginVertical: 24,
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
  driverCard: {
    marginBottom: 16,
    elevation: 2,
  },
  newDriverCard: {
    marginTop: 24,
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#f8f8ff',
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
  addButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
  },
});

export default EditDriverConductorDetails;