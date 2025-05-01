import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, Title, Subheading, TextInput, Button, Surface, ProgressBar, IconButton } from 'react-native-paper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../db/firebaseConfig';
import { useRouter } from 'expo-router';

const StarRating = ({ maxStars = 5, rating, setRating, label }) => {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starContainer}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => setRating(index + 1)}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.star, 
                rating > index ? styles.selectedStar : styles.unselectedStar
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating === 0 ? 'Tap to rate' : 
         rating === 1 ? 'Poor' :
         rating === 2 ? 'Fair' :
         rating === 3 ? 'Good' :
         rating === 4 ? 'Very Good' : 'Excellent'}
      </Text>
    </View>
  );
};

const SatisfactionSuggestions = () => {
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const router = useRouter();

  // Calculate form progress with integer math to avoid precision errors
  useEffect(() => {
    let progressSteps = 0;
    if (satisfactionRating > 0) progressSteps += 1;
    if (suggestion.trim()) progressSteps += 1;
    if (numberPlate.trim()) progressSteps += 1;
    
    // Use integer math for progress calculation to avoid floating point precision issues
    // Multiply by 100 first, then divide by 3 to get a whole number percentage
    const progressPercentage = Math.floor((progressSteps * 100) / 3);
    setFormProgress(progressPercentage / 100);
  }, [satisfactionRating, suggestion, numberPlate]);

  const handleSubmit = async () => {
    // Validate input
    if (!numberPlate.trim()) {
      Alert.alert("Missing Information", "Please enter the bus number plate.");
      return;
    }

    if (satisfactionRating === 0) {
      Alert.alert("Rating Required", "Please provide a satisfaction rating.");
      return;
    }

    setIsSubmitting(true);
    const user = auth.currentUser;
  
    if (!user) {
      Alert.alert("Authentication Error", "No authenticated user found. Please log in again.");
      setIsSubmitting(false);
      return;
    }
  
    const feedbackPath = `passengerFeedback/${numberPlate}-${user.email}`;
    const docRef = doc(db, feedbackPath);

    try {
      const docSnap = await getDoc(docRef);
      let existingData = docSnap.exists() ? docSnap.data() : {};

      // Check if busPlate exists in the document
      const busPlateExists = existingData.busPlate !== undefined;

      // Construct feedback data
      const feedbackData = {
        satisfactionSuggestions: {
          satisfactionRating,
          suggestion,
        },
        timestamp: new Date().toISOString(), // Adding timestamp
      };

      // Only add busPlate if it's not already present
      if (!busPlateExists) {
        feedbackData.busPlate = numberPlate;
      }

      if (docSnap.exists()) {
        // Update existing document
        await setDoc(docRef, feedbackData, { merge: true });
      } else {
        // Create new document
        await setDoc(docRef, feedbackData);
      }

      Alert.alert(
        "Success", 
        "Thank you for your valuable feedback!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Form completion: {Math.round(formProgress * 100)}%
        </Text>
        <ProgressBar 
          progress={formProgress} 
          color="#4a90e2" 
          style={styles.progressBar} 
        />
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.headerCard}>
          <Title style={styles.heading}>Customer Satisfaction & Suggestions</Title>
          <Text style={styles.message}>
            Please provide honest and straightforward feedback. Your feedback and rating will remain anonymous, and your identity will not be disclosed unless threats are involved.
          </Text>
        </Surface>

        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="star" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Service Satisfaction</Subheading>
          </View>
          
          <StarRating 
            rating={satisfactionRating} 
            setRating={setSatisfactionRating} 
            label="How satisfied are you with our service?" 
          />
        </Surface>
        
        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="message-text" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Improvement Suggestions</Subheading>
          </View>
          
          <TextInput
            mode="outlined"
            label="Share your suggestions for improvements"
            placeholder="What can we do to enhance your experience?"
            value={suggestion}
            onChangeText={(text) => setSuggestion(text)}
            multiline
            numberOfLines={4}
            style={styles.input}
            outlineColor="#bdc3c7"
            activeOutlineColor="#4a90e2"
          />
        </Surface>
        
        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="bus" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Bus Information</Subheading>
          </View>
          
          <TextInput
            mode="outlined"
            label="Bus Number Plate"
            placeholder="e.g., KL1055"
            value={numberPlate}
            onChangeText={(text) => setNumberPlate(text)}
            style={[styles.input, styles.plateInput]}
            outlineColor="#bdc3c7"
            activeOutlineColor="#4a90e2"
            autoCapitalize="characters"
          />
          <Text style={styles.requiredText}>* Required</Text>
        </Surface>

        <Button 
          mode="contained" 
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || formProgress < 0.5}
        >
          Submit Feedback
        </Button>
      </ScrollView>
    </View>
  );
};

export default SatisfactionSuggestions;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  headerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#2c3e50',
  },
  message: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    color: '#7f8c8d',
    lineHeight: 20,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  star: {
    fontSize: 36,
    marginHorizontal: 6,
  },
  selectedStar: {
    color: '#f1c40f',
  },
  unselectedStar: {
    color: '#dfe6e9',
  },
  ratingText: {
    marginTop: 4,
    color: '#7f8c8d',
    fontSize: 14,
  },
  input: {
    marginTop: 12,
    backgroundColor: '#fff',
  },
  plateInput: {
    marginBottom: 4,
  },
  requiredText: {
    color: '#e74c3c',
    fontSize: 12,
    marginLeft: 4,
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#4a90e2',
    elevation: 3,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});