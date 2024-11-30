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

const DriverConductorRatingFeedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback1, setFeedback1] = useState('');
  const [feedback2, setFeedback2] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Main Heading */}
      <Title style={styles.heading}>Driver and Conductor Feedback</Title>

      {/* Message */}
      <Text style={styles.message}>
        Please provide your feedback to help us improve the service quality.
      </Text>

      {/* Subheading */}
      <Subheading style={styles.subheading}>Rate the Service</Subheading>

      {/* Star Rating Component */}
      <StarRating rating={rating} setRating={setRating} />

      {/* Subheading */}
      <Subheading style={styles.subheading}>Your Feedback</Subheading>

      {/* Multiline Input Field */}
      <TextInput
        mode="outlined"
        label="Describe your experience"
        value={feedback1}
        onChangeText={(text) => setFeedback1(text)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      {/* Topic */}
      <Subheading style={styles.topic}>Suggestions for Improvement</Subheading>

      {/* Multiline Input Field */}
      <TextInput
        mode="outlined"
        label="Share your suggestions"
        value={feedback2}
        onChangeText={(text) => setFeedback2(text)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      {/* Subheading */}
      <Subheading style={styles.subheading}>Additional Notes</Subheading>

      {/* Normal Input Field */}
      <TextInput
        mode="outlined"
        label="Add any additional notes"
        value={additionalNotes}
        onChangeText={(text) => setAdditionalNotes(text)}
        style={styles.input}
      />

      {/* Submit Button */}
      <Button mode="contained" style={styles.button} onPress={() => alert('Feedback submitted!')}>
        Submit Feedback
      </Button>
    </ScrollView>
  );
};

export default DriverConductorRatingFeedback;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 16,
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
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
  },
});
