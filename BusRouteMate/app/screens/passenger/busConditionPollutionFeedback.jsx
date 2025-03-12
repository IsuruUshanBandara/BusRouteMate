import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Text, Title, Subheading, TextInput, Button, Checkbox, RadioButton } from 'react-native-paper';

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
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [checkboxState, setCheckboxState] = useState({
    excessiveSmoke: false,
    loudNoise: false,
    excessiveHorn: false,
    none: false,
  });
  const [severity, setSeverity] = useState({
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
        <StarRating rating={satisfactionRating} setRating={setSatisfactionRating} />

        {/* Subheading */}
        <Subheading style={styles.subheading}>Reason for the above rating</Subheading>

        {/* Multiline Input Field */}
        <TextInput
            mode="outlined"
            label="Provide your feedback"
            value={suggestion}
            onChangeText={(text) => setSuggestion(text)}
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
                onValueChange={(value) => setSeverity((prev) => ({ ...prev, excessiveSmoke: value }))}
                value={severity.excessiveSmoke}
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
                onValueChange={(value) => setSeverity((prev) => ({ ...prev, loudNoise: value }))}
                value={severity.loudNoise}
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
                onValueChange={(value) => setSeverity((prev) => ({ ...prev, excessiveHorn: value }))}
                value={severity.excessiveHorn}
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
            onPress={() => alert(`Feedback submitted with severity: ${JSON.stringify(severity)}`)}
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
