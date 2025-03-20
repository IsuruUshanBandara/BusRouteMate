import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text, Title, Subheading, TextInput, Button } from 'react-native-paper';
import {doc,setDoc,getDoc } from 'firebase/firestore';
import {auth,db} from'../../db/firebaseConfig';

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
  const [driverRating, setDriverRating] = useState(0);
  const [driverRatingReason, setDriverRatingReason] = useState('');
  const [conductorRatingReason, setConductorRatingReason] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [conductorRating,setConductorRating] = useState(0);

  const handleSubmit = async () => {
      const user = auth.currentUser;
  
    if (!user) {
      console.log("No authenticated user found.");
      return;
    }
  
    if (!numberPlate.trim()) {
      console.log("Number plate is required.");
      return;
    }
  
    const feedbackPath = `passengerFeedback/${numberPlate}-${user.email}`;
  
    const feedbackData = {
      driverConductor: {
        driverRating,
        driverRatingReason,
        conductorRating,
        conductorRatingReason,
      },
    };
  
    try {
      const docRef = doc(db, feedbackPath);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        // If the document exists, update it
        await setDoc(docRef, feedbackData, { merge: true });
        console.log("Feedback updated successfully.");
      } else {
        // If the document does not exist, create it
        await setDoc(docRef, feedbackData);
        console.log("Feedback submitted successfully.");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Main Heading */}
      <Title style={styles.heading}>Driver and Conductor Feedback</Title>

      {/* Message */}
      <Text style={styles.message}>
        Please provide honest and straightforward feedback. Your feedback and rating will remain anonymous, and your identity will not be disclosed to the owner unless threats are involved.
      </Text>

      {/* Subheading */}
      <Subheading style={styles.subheading}>How was the drivers driving and overall performance</Subheading>

      {/* Star Rating Component */}
      <StarRating rating={driverRating} setRating={setDriverRating} />

      {/* Subheading */}
      <Subheading style={styles.subheading}>Reason for the above rating.</Subheading>

      {/* Multiline Input Field */}
      <TextInput
        mode="outlined"
        label="Describe your experience"
        value={driverRatingReason}
        onChangeText={(text) => setDriverRatingReason(text)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />
      <Subheading style={styles.subheading}>How was the conductors overall performance </Subheading>

      {/* Star Rating Component */}
      <StarRating rating={conductorRating} setRating={setConductorRating} />

      {/* Topic */}
      <Subheading style={styles.subheading}>Reason for the above rating</Subheading>

      {/* Multiline Input Field */}
      <TextInput
        mode="outlined"
        label="Share your suggestions"
        value={conductorRatingReason}
        onChangeText={(text) => setConductorRatingReason(text)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      {/* Subheading */}
      <Subheading style={styles.subheading}>Please enter the Bus Number plates   number (Required)</Subheading>

      {/* Normal Input Field */}
      <TextInput
        mode="outlined"
        label="KL1055"
        value={numberPlate}
        onChangeText={(text) => setNumberPlate(text)}
        style={styles.input}
      />

      {/* Submit Button */}
      <Button mode="contained" style={styles.button} onPress={handleSubmit}>
        Submit Feedback
      </Button>
    </ScrollView>
  );
};

export default DriverConductorRatingFeedback;

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
