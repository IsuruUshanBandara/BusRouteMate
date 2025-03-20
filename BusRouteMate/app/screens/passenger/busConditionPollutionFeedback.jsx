import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text, Title, Subheading, TextInput, Button, Checkbox, RadioButton } from 'react-native-paper';
// import { getAuth } from 'firebase/auth';
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

const BusConditionPollutionFeedback = () => {
  const [conditionRating, setConditionRating] = useState(0);
  const [ratingReason, setRatingReason] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [checkboxState, setCheckboxState] = useState({
    excessiveSmoke: false,
    loudNoise: false,
    excessiveHorn: false,
    none: false,
  });
  const [pollutionIssues, setPollutionIssues] = useState({
    excessiveSmoke: '',
    loudNoise: '',
    excessiveHorn:'',
  });

  const handleCheckboxPress = (key) => {
    if (key === 'none') {
      setCheckboxState({
        excessiveSmoke: false,
        loudNoise: false,
        excessiveHorn: false,
        none: !checkboxState.none,
      });
    } else {
      setCheckboxState((prev) => ({
        ...prev,
        none: false,
        [key]: !prev[key],
      }));
    }
  };

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
    busConditionPollution: {
      conditionRating,
      ratingReason,
      pollutionIssues: {
        excessiveSmoke: pollutionIssues.excessiveSmoke || "None",
        loudSilencer: pollutionIssues.loudNoise || "None",
        excessiveHorn: pollutionIssues.excessiveHorn || "None",
      },
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
        <Title style={styles.heading}>Bus Condition and Pollution Feedback</Title>

        {/* Message */}
        <Text style={styles.message}>
            Please provide honest and straightforward feedback. Your feedback and rating will remain
            anonymous, and your identity will not be disclosed to the owner unless threats are involved.
        </Text>

        {/* Subheading */}
        <Subheading style={styles.subheading}>How was the bus interior condition</Subheading>

        {/* Star Rating Component */}
        <StarRating rating={conditionRating} setRating={setConditionRating} />

        {/* Subheading */}
        <Subheading style={styles.subheading}>Reason for the above rating</Subheading>

        {/* Multiline Input Field */}
        <TextInput
            mode="outlined"
            label="Provide your feedback"
            value={ratingReason}
            onChangeText={(text) => setRatingReason(text)}
            multiline
            numberOfLines={4}
            style={styles.input}
        />

        {/* Add checkboxes starting from this line */}
        <Subheading style={styles.subheading}>Additional Issues Noticed</Subheading>
        <View style={styles.checkboxContainer}>
            <Checkbox.Item
            label="Excessive smoke from the bus"
            status={checkboxState.excessiveSmoke ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxPress('excessiveSmoke')}
            />
            <Checkbox.Item
            label="Loud silencer noise"
            status={checkboxState.loudNoise ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxPress('loudNoise')}
            />
            <Checkbox.Item
            label="Excessive horn noise"
            status={checkboxState.excessiveHorn ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxPress('excessiveHorn')}
            />
            <Checkbox.Item
            label="None"
            status={checkboxState.none ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxPress('none')}
            />
        </View>

        {/* Severity Selection for Issues */}
        {(checkboxState.excessiveSmoke || checkboxState.loudNoise || checkboxState.excessiveHorn) && (
            <Subheading style={styles.subheading}>
             For selected issue, please indicate the severity level from below:
            </Subheading>
        )}
       
        {checkboxState.excessiveSmoke && (
            <View>
            <Subheading style={styles.subheading}>Severity level for excessive smoke from the bus:</Subheading>
            <RadioButton.Group
                onValueChange={(value) => setPollutionIssues((prev) => ({ ...prev, excessiveSmoke: value }))}
                value={pollutionIssues.excessiveSmoke}
            >
                <RadioButton.Item label="Low" value="low" />
                <RadioButton.Item label="Medium" value="medium" />
                <RadioButton.Item label="High" value="high" />
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
                <RadioButton.Item label="Low" value="low" />
                <RadioButton.Item label="Medium" value="medium" />
                <RadioButton.Item label="High" value="high" />
            </RadioButton.Group>
            </View>
        )}

        {checkboxState.excessiveHorn && (
            <View>
            <Subheading style={styles.subheading}>Severity level for Exessive horn noise:</Subheading>
            <RadioButton.Group
                onValueChange={(value) => setPollutionIssues((prev) => ({ ...prev, excessiveHorn: value }))}
                value={pollutionIssues.excessiveHorn}
            >
                <RadioButton.Item label="Low" value="low" />
                <RadioButton.Item label="Medium" value="medium" />
                <RadioButton.Item label="High" value="high" />
            </RadioButton.Group>
            </View>
        )}

        {/* Subheading */}
        <Subheading style={styles.subheading}>Please enter the Bus Number plate (Required)</Subheading>

        {/* Normal Input Field */}
        <TextInput
            mode="outlined"
            label="KL1055"
            value={numberPlate}
            onChangeText={(text) => setNumberPlate(text)}
            style={styles.input}
        />

        {/* Submit Button */}
        <Button
            mode="contained"
            style={styles.button}
            onPress={handleSubmit}
        >
            Submit Feedback
        </Button>
    </ScrollView>
  );
};

export default BusConditionPollutionFeedback;

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  checkboxContainer: {
    marginVertical: 8,
  },
  button: {
    marginTop: 16,
  },
});
