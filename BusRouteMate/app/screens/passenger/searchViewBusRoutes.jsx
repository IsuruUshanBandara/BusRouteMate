import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const BusTrackingScreen = () => {
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [searchResults, setSearchResults] = useState([
    { route: 'Kegalla - Avissawella', busNo: '122', rideStartTime: '1:15 pm' },
    { route: 'Kegalla - Avissawella', busNo: '122', rideStartTime: '1:15 pm' },
    { route: 'Kegalla - Avissawella', busNo: '122', rideStartTime: '1:15 pm' }
  ]);

  const handleSearch = () => {
    // Implement search logic here
    // This would typically involve querying Firestore
    console.log('Searching for buses:', { location, destination });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check and Track Bus</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Please enter city name"
          value={location}
          onChangeText={setLocation}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Please enter city name"
          value={destination}
          onChangeText={setDestination}
        />
      </View>
      
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
      
      <Text style={styles.resultsTitle}>Search Results</Text>
      
      <ScrollView>
        {searchResults.map((result, index) => (
          <View 
            key={index} 
            style={styles.resultItem}
          >
            <Text style={styles.resultText}>
              Route: {result.route}
            </Text>
            <Text style={styles.resultText}>
              Bus No: {result.busNo}
            </Text>
            <Text style={styles.resultText}>
              Ride Started Time: {result.rideStartTime}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12
  },
  resultText: {
    marginBottom: 4
  }
});

export default BusTrackingScreen;