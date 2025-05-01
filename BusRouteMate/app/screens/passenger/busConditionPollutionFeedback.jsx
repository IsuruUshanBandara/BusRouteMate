import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Text, Title, Subheading, TextInput, Button, Checkbox, RadioButton, Surface, IconButton, ProgressBar } from 'react-native-paper';
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

const BusConditionPollutionFeedback = () => {
  const [conditionRating, setConditionRating] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const router = useRouter();
  
  const [checkboxState, setCheckboxState] = useState({
    excessiveSmoke: false,
    loudNoise: false,
    excessiveHorn: false,
    none: false,
  });
  
  const [pollutionIssues, setPollutionIssues] = useState({
    excessiveSmoke: '',
    loudNoise: '',
    excessiveHorn: '',
  });

  // Calculate form progress with integer math to avoid precision errors
  useEffect(() => {
    let progressSteps = 0;
    
    // Base requirements
    if (conditionRating > 0) progressSteps += 1;
    if (ratingReason.trim()) progressSteps += 1;
    if (numberPlate.trim()) progressSteps += 1;
    
    // Checkbox tracking
    if (checkboxState.none || 
        checkboxState.excessiveSmoke || 
        checkboxState.loudNoise || 
        checkboxState.excessiveHorn) {
      progressSteps += 1;
    }
    
    // Radio button tracking
    let severityCount = 0;
    let requiredSeverities = 0;
    
    if (checkboxState.excessiveSmoke) {
      requiredSeverities++;
      if (pollutionIssues.excessiveSmoke) severityCount++;
    }
    
    if (checkboxState.loudNoise) {
      requiredSeverities++;
      if (pollutionIssues.loudNoise) severityCount++;
    }
    
    if (checkboxState.excessiveHorn) {
      requiredSeverities++;
      if (pollutionIssues.excessiveHorn) severityCount++;
    }
    
    if (requiredSeverities > 0 && severityCount === requiredSeverities) {
      progressSteps += 1;
    }
    
    // Calculate final progress
    const totalSteps = checkboxState.none ? 4 : (checkboxState.excessiveSmoke || 
                                                checkboxState.loudNoise || 
                                                checkboxState.excessiveHorn ? 5 : 4);
    
    setFormProgress(progressSteps / totalSteps);
  }, [conditionRating, ratingReason, numberPlate, checkboxState, pollutionIssues]);

  const handleCheckboxPress = (key) => {
    if (key === 'none') {
      setCheckboxState({
        excessiveSmoke: false,
        loudNoise: false,
        excessiveHorn: false,
        none: !checkboxState.none,
      });
      
      // Reset pollution issues if none is selected
      if (!checkboxState.none) {
        setPollutionIssues({
          excessiveSmoke: '',
          loudNoise: '',
          excessiveHorn: '',
        });
      }
    } else {
      setCheckboxState(prev => ({
        ...prev,
        none: false,
        [key]: !prev[key],
      }));
      
      // Reset the specific pollution issue if unchecking
      if (checkboxState[key]) {
        setPollutionIssues(prev => ({
          ...prev,
          [key]: '',
        }));
      }
    }
  };

  const handleSubmit = async () => {
    // Validate input
    if (!numberPlate.trim()) {
      Alert.alert("Missing Information", "Please enter the bus number plate.");
      return;
    }

    if (conditionRating === 0) {
      Alert.alert("Rating Required", "Please provide a rating for the bus condition.");
      return;
    }

    // Check if severities are selected for checked issues
    let missingData = false;
    if (checkboxState.excessiveSmoke && !pollutionIssues.excessiveSmoke) missingData = true;
    if (checkboxState.loudNoise && !pollutionIssues.loudNoise) missingData = true;
    if (checkboxState.excessiveHorn && !pollutionIssues.excessiveHorn) missingData = true;

    if (missingData) {
      Alert.alert("Missing Information", "Please select severity levels for all checked issues.");
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
        busConditionPollution: {
          conditionRating,
          ratingReason,
          pollutionIssues: {
            excessiveSmoke: checkboxState.excessiveSmoke ? (pollutionIssues.excessiveSmoke || "None") : "None",
            loudSilencer: checkboxState.loudNoise ? (pollutionIssues.loudNoise || "None") : "None",
            excessiveHorn: checkboxState.excessiveHorn ? (pollutionIssues.excessiveHorn || "None") : "None",
          },
        },
        timestamp: new Date().toISOString(),
      };

      // Only add busPlate if it's not already present
      if (!busPlateExists) {
        feedbackData.busPlate = numberPlate;
      }

      if (docSnap.exists()) {
        await setDoc(docRef, feedbackData, { merge: true });
      } else {
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
          <Title style={styles.heading}>Bus Condition Feedback</Title>
          <Text style={styles.message}>
            Help improve service quality by reporting condition and pollution issues. Your feedback remains anonymous.
          </Text>
        </Surface>

        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="car-seat" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Bus Interior Condition</Subheading>
          </View>
          
          <StarRating 
            rating={conditionRating} 
            setRating={setConditionRating}
            label="How was the bus interior condition?" 
          />
          
          <TextInput
            mode="outlined"
            label="Provide feedback about the bus condition"
            placeholder="Cleanliness, seat condition, broken parts..."
            value={ratingReason}
            onChangeText={(text) => setRatingReason(text)}
            multiline
            numberOfLines={3}
            style={styles.input}
            outlineColor="#bdc3c7"
            activeOutlineColor="#4a90e2"
          />
        </Surface>
        
        <Surface style={styles.feedbackCard}>
          <View style={styles.sectionHeader}>
            <IconButton icon="alert-circle-outline" size={24} color="#4a90e2" />
            <Subheading style={styles.subheading}>Pollution Issues</Subheading>
          </View>
          
          <Text style={styles.instructionText}>
            Please select any pollution issues you noticed:
          </Text>
          
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label="Excessive smoke from the bus"
              status={checkboxState.excessiveSmoke ? 'checked' : 'unchecked'}
              onPress={() => handleCheckboxPress('excessiveSmoke')}
              style={styles.checkbox}
              labelStyle={styles.checkboxLabel}
              color="#4a90e2"
            />
            <Checkbox.Item
              label="Loud silencer noise"
              status={checkboxState.loudNoise ? 'checked' : 'unchecked'}
              onPress={() => handleCheckboxPress('loudNoise')}
              style={styles.checkbox}
              labelStyle={styles.checkboxLabel}
              color="#4a90e2"
            />
            <Checkbox.Item
              label="Excessive horn noise"
              status={checkboxState.excessiveHorn ? 'checked' : 'unchecked'}
              onPress={() => handleCheckboxPress('excessiveHorn')}
              style={styles.checkbox}
              labelStyle={styles.checkboxLabel}
              color="#4a90e2"
            />
            <Checkbox.Item
              label="None of the above issues"
              status={checkboxState.none ? 'checked' : 'unchecked'}
              onPress={() => handleCheckboxPress('none')}
              style={styles.checkbox}
              labelStyle={styles.checkboxLabel}
              color="#4a90e2"
            />
          </View>
        </Surface>

        {/* Severity Selection for Issues */}
        {(checkboxState.excessiveSmoke || checkboxState.loudNoise || checkboxState.excessiveHorn) && (
          <Surface style={styles.feedbackCard}>
            <View style={styles.sectionHeader}>
              <IconButton icon="speedometer" size={24} color="#4a90e2" />
              <Subheading style={styles.subheading}>Severity Levels</Subheading>
            </View>
            
            <Text style={styles.instructionText}>
              Please rate the severity for each selected issue:
            </Text>
       
            {checkboxState.excessiveSmoke && (
              <View>
                <Subheading style={styles.subheading}>Severity level for excessive smoke from the bus:</Subheading>
                <RadioButton.Group
                  onValueChange={(value) => setPollutionIssues((prev) => ({ ...prev, excessiveSmoke: value }))}
                  value={pollutionIssues.excessiveSmoke}
                >
                  <RadioButton.Item 
                    label="Low" 
                    value="low"
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="Medium" 
                    value="medium"
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="High" 
                    value="high"
                    color="#4a90e2" 
                  />
                </RadioButton.Group>
              </View>
            )}

            {checkboxState.loudNoise && (
              <View>
                <Subheading style={styles.subheading}>Severity level for loud silencer noise:</Subheading>
                <RadioButton.Group
                  onValueChange={(value) => setPollutionIssues((prev) => ({ ...prev, loudNoise: value }))}
                  value={pollutionIssues.loudNoise}
                >
                  <RadioButton.Item 
                    label="Low" 
                    value="low" 
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="Medium" 
                    value="medium"
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="High" 
                    value="high"
                    color="#4a90e2"
                  />
                </RadioButton.Group>
              </View>
            )}

            {checkboxState.excessiveHorn && (
              <View>
                <Subheading style={styles.subheading}>Severity level for Excessive horn noise:</Subheading>
                <RadioButton.Group
                  onValueChange={(value) => setPollutionIssues((prev) => ({ ...prev, excessiveHorn: value }))}
                  value={pollutionIssues.excessiveHorn}
                >
                  <RadioButton.Item 
                    label="Low" 
                    value="low" 
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="Medium" 
                    value="medium"
                    color="#4a90e2"
                  />
                  <RadioButton.Item 
                    label="High" 
                    value="high"
                    color="#4a90e2"
                  />
                </RadioButton.Group>
              </View>
            )}
          </Surface>
        )}
        
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
          disabled={isSubmitting || formProgress < 0.6}
        >
          Submit Feedback
        </Button>
      </ScrollView>
    </View>
  );
};

export default BusConditionPollutionFeedback;

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
    marginVertical: 8,
    color: '#2c3e50',
  },
  instructionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginVertical: 8,
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
  checkboxContainer: {
    backgroundColor: '#f8f9fa', 
    borderRadius: 8,
    overflow: 'hidden',
  },
  checkbox: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  radioSection: {
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 12,
    marginVertical: 8,
    color: '#34495e',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  radioButton: {
    flex: 1,
    maxWidth: '33%',
  },
  radioButtonLabel: {
    fontSize: 14,
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