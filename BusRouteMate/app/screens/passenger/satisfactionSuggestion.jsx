import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text, Title, Subheading, TextInput, Button } from 'react-native-paper';

const StarRating = ({ maxStars = 5, rating, setRating }) => {
  return (
    <View style={styles.starContainer}>
      {Array.from({ length: maxStars }).map((_, index) => (
        <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
          <Text style={[styles.star, rating > index ? styles.selectedStar : styles.unselectedStar]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SatisfactionSuggestions = () => {
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  return (
    <ScrollView contentContainerStyle={styles.container}>
        {/* Main Heading */}
        <Title style={styles.heading}>Customer satisfaction and suggestions</Title>

        {/* Message */}
        <Text style={styles.message}>
        Please provide honest and straightforward feedback. Your feedback and rating will remain anonymous, and your identity will not be disclosed to the owner unless threats are involved. 
        </Text>

        {/* Subheading */}
        <Subheading style={styles.subheading}>How satisfied are you with our service</Subheading>

        {/* Star Rating Component */}
        <StarRating rating={satisfactionRating} setRating={setSatisfactionRating} />

        {/* Subheading */}
        <Subheading style={styles.subheading}>Please suggest any improvement that must be done to improve our service</Subheading>

        {/* Multiline Input Field */}
        <TextInput
            mode="outlined"
            label="Conductor need to be more friendly with passengers"
            value={suggestion}
            onChangeText={(text) => setSuggestion(text)}
            multiline
            numberOfLines={4}
            style={styles.input}
        />
        
        {/* Subheading */}
        <Subheading style={styles.subheading}>Please enter the Bus Number plates number (Required)</Subheading>

        {/* Normal Input Field */}
        <TextInput
            mode="outlined"
            label="KL1055"
            value={numberPlate}
            onChangeText={(text) => setNumberPlate(text)}
            style={styles.input}
        />

        {/* Submit Button */}
        <Button mode="contained" style={styles.button} onPress={() => alert('Feedback submitted!')}>
            Submit Feedback
        </Button>
    </ScrollView>
  );
};

export default SatisfactionSuggestions;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    // backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#555',
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  topic: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#007BFF',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: '6%',
  },
  star: {
    fontSize: 32,
    marginHorizontal: 4,
  },
  selectedStar: {
    color: 'gold',
  },
  unselectedStar: {
    color: 'lightgray',
  },
  input: {
    marginBottom: '6%',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
  },
});
