import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, Title, Subheading, TextInput, Button, Surface, ProgressBar, IconButton } from 'react-native-paper';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../db/firebaseConfig';
import { useRouter } from 'expo-router';
// Remove LinearGradient import as it might cause precision issues
// import { LinearGradient } from 'expo-linear-gradient';

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

const DriverConductorRatingFeedback = () => {
  const [driverRating, setDriverRating] = useState(0);
  const [driverRatingReason, setDriverRatingReason] = useState('');
  const [conductorRating, setConductorRating] = useState(0);
  const [conductorRatingReason, setConductorRatingReason] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const router = useRouter();

  // Calculate form progress with integer math to avoid precision errors
  React.useEffect(() => {
    let progressSteps = 0;
    if (driverRating > 0) progressSteps += 1;
    if (driverRatingReason.trim()) progressSteps += 1;
    if (conductorRating > 0) progressSteps += 1;
    if (conductorRatingReason.trim()) progressSteps += 1;
    if (numberPlate.trim()) progressSteps += 1;
    // Convert to decimal at the end to minimize floating point precision issues
    setFormProgress(progressSteps / 5);
  }, [driverRating, driverRatingReason, conductorRating, conductorRatingReason, numberPlate]);

  const handleSubmit = async () => {
    // Validate input
    if (!numberPlate.trim()) {
      Alert.alert("Missing Information", "Please enter the bus number plate.");
      return;
    }

    if (driverRating === 0 && conductorRating === 0) {
      Alert.alert("Rating Required", "Please provide at least one rating.");
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
        driverConductor: {
          driverRating,
          driverRatingReason,
          conductorRating,
          conductorRatingReason,
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
      {/* Removed LinearGradient to fix precision error */}
      
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
          <Title style={styles.heading}>Rate Your Journey</Title>
          <Text style={styles.message}>
            Your honest feedback helps improve service quality. All ratings remain anonymous unless threats are involved.
          </Text>
        </Surface>

        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="steering" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Driver Rating</Subheading>
          </View>
          
          <StarRating 
            rating={driverRating} 
            setRating={setDriverRating} 
            label="How was the driver's performance?" 
          />
          
          <TextInput
            mode="outlined"
            label="Share your experience with the driver"
            placeholder="Driving skills, safety, behavior..."
            value={driverRatingReason}
            onChangeText={(text) => setDriverRatingReason(text)}
            multiline
            numberOfLines={3}
            style={styles.input}
            outlineColor="#bdc3c7"
            activeOutlineColor="#4a90e2"
          />
        </Surface>
        
        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="account-tie" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Conductor Rating</Subheading>
          </View>
          
          <StarRating 
            rating={conductorRating} 
            setRating={setConductorRating} 
            label="How was the conductor's service?" 
          />
          
          <TextInput
            mode="outlined"
            label="Share your experience with the conductor"
            placeholder="Professionalism, helpfulness, ticket handling..."
            value={conductorRatingReason}
            onChangeText={(text) => setConductorRatingReason(text)}
            multiline
            numberOfLines={3}
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
          disabled={isSubmitting || formProgress < 0.39}
        >
          Submit Feedback
        </Button>
      </ScrollView>
    </View>
  );
};

export default DriverConductorRatingFeedback;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  // Gradient removed to fix precision errors
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