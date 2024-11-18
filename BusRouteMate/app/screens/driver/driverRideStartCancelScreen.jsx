import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable,ScrollView } from 'react-native';
import { Menu, Provider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const DriverRideStartCancel = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');

  const toggleMenuVisibility = () => {
    setMenuVisible(!menuVisible);
  };


  const routes = [
    "Kegalle-Avissawella",
    "Kegalle-Colombo",
    "Kegalle-Kandy",
    "Petta-kandy",
    "Avisawella-Kotiyakubura",
   
];
  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        {/* Screen Title */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centeredContent}>
            <Text style={styles.heading}>Select Route from Below</Text>

            {/* Dropdown */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                  <Pressable onPress={toggleMenuVisibility} style={styles.input}>
                      <TextInput
                          label="Select your route"
                          value={selectedRoute || ""}
                          placeholder={!selectedRoute ? "Select a security question" : ""}
                          mode="outlined"
                          editable={false}
                          right={
                              <TextInput.Icon 
                                  icon={menuVisible ? 'chevron-up' : 'chevron-down'} 
                                  onPress={toggleMenuVisibility} 
                              />
                          }
                      />
                  </Pressable>
              }
              contentStyle={[styles.menuContent, { width: '100%' }]} // Sets menu width to TextInput width
            >
              <ScrollView style={{ maxHeight: 150 }}>
                  {routes.map((question, index) => (
                      <Menu.Item
                          key={index}
                          onPress={() => {
                              setSelectedRoute(question);
                              setMenuVisible(false);
                          }}
                          title={question}
                          style={styles.menuItem}
                      />
                  ))}
              </ScrollView>
            </Menu>
            {/* Start Ride Section */}
            <Text style={styles.heading}>Click the Below Button to Start the Ride</Text>
            <Pressable style={[styles.circleButton, styles.startButton]}>
              <Text style={styles.buttonText}>Start</Text>
            </Pressable>

            {/* Cancel Ride Section */}
            <Text style={styles.heading}>Click Below Button to Cancel the Ride</Text>
            <Text style={styles.warning}>
              You are not allowed to cancel the ride unless the bus faces any 
              (accidents, tire puncture, or technical failure) that causes the bus not to move.
            </Text>
            <Pressable style={[styles.circleButton, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
};

export default DriverRideStartCancel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 20,
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
  input: {
    marginVertical: 10,
    width: '100%',
  },
menuContent: {
    maxwidth: '100%',
    paddingHorizontal: 10,
  },
menuItem: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  warning: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  circleButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    alignSelf: 'center',
  },
  startButton: {
    backgroundColor: '#4caf50', // Green
  },
  cancelButton: {
    backgroundColor: '#f44336', // Red
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
