import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { db } from '../../db/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';

const ViewFeedbackScreen2 = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState(null);
  const { busPlate } = useLocalSearchParams();

  // Color scheme for star ratings
  const starColors = {
    1: '#FF6B6B', // Red for 1 star
    2: '#FFD166', // Orange-yellow for 2 stars
    3: '#06D6A0', // Green for 3 stars
    4: '#118AB2', // Blue for 4 stars
    5: '#073B4C'  // Dark blue for 5 stars
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const feedbackRef = collection(db, 'passengerFeedback');
        console.log("Bus Plate Number:", busPlate);
        const q = query(feedbackRef, where('busPlate', '==', busPlate));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No feedback found for this bus.");
          setFeedbackData(null);
        } else {
          const feedbackList = querySnapshot.docs.map(doc => doc.data());
          setFeedbackData(feedbackList);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
      setLoading(false);
    };

    fetchFeedback();
  }, [busPlate]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!feedbackData || feedbackData.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No feedback available for this bus.</Text>
      </View>
    );
  }

  // Extract data for the charts with proper null checking
  const conductorRatings = feedbackData
    .filter(feedback => feedback.driverConductor && feedback.driverConductor.conductorRating)
    .map(feedback => feedback.driverConductor.conductorRating);
  
  const driverRatings = feedbackData
    .filter(feedback => feedback.driverConductor && feedback.driverConductor.driverRating)
    .map(feedback => feedback.driverConductor.driverRating);

  // Check if satisfactionSuggestions exists before accessing satisfactionRating
  const satisfactionRatings = feedbackData
    .filter(feedback => feedback.satisfactionSuggestions && feedback.satisfactionSuggestions.satisfactionRating)
    .map(feedback => feedback.satisfactionSuggestions.satisfactionRating);

  const busConditionRatings = feedbackData
    .filter(feedback => feedback.busConditionPollution && feedback.busConditionPollution.conditionRating)
    .map(feedback => feedback.busConditionPollution.conditionRating);

  // Function to calculate star distribution
  const calculateStarDistribution = (ratings) => {
    if (!ratings || ratings.length === 0) return [];
    
    // Count occurrences of each star rating
    const counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    ratings.forEach(rating => {
      // Round to nearest integer to ensure it falls into one of our categories
      const roundedRating = Math.round(rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        counts[roundedRating]++;
      }
    });
    
    // Calculate percentages and format data for PieChart
    const total = ratings.length;
    return Object.keys(counts).map(star => {
      const count = counts[star];
      const percentage = (count / total) * 100;
      return {
        value: count,
        star: parseInt(star),
        color: starColors[star],
        label: `${star}★: ${percentage.toFixed(1)}%`,
        percentage: percentage
      };
    }).filter(item => item.value > 0); // Only include stars that have ratings
  };

  // Create distribution data for pie charts
  const conductorDistribution = calculateStarDistribution(conductorRatings);
  const driverDistribution = calculateStarDistribution(driverRatings);
  const satisfactionDistribution = calculateStarDistribution(satisfactionRatings);
  const busConditionDistribution = calculateStarDistribution(busConditionRatings);

  // Calculate average ratings safely (prevent division by zero)
  const averageConductorRating = conductorRatings.length > 0 
    ? conductorRatings.reduce((sum, rating) => sum + rating, 0) / conductorRatings.length 
    : 0;
  
  const averageDriverRating = driverRatings.length > 0 
    ? driverRatings.reduce((sum, rating) => sum + rating, 0) / driverRatings.length 
    : 0;
  
  const averageSatisfactionRating = satisfactionRatings.length > 0 
    ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length 
    : 0;
  
  const averageBusConditionRating = busConditionRatings.length > 0 
    ? busConditionRatings.reduce((sum, rating) => sum + rating, 0) / busConditionRatings.length 
    : 0;

  // Pollution issues chart data with null checking
  const pollutionCounts = {
    excessiveHorn: 0,
    excessiveSmoke: 0,
    loudSilencer: 0
  };

  // Safely count pollution issues
  feedbackData.forEach(feedback => {
    if (feedback.busConditionPollution && feedback.busConditionPollution.pollutionIssues) {
      const issues = feedback.busConditionPollution.pollutionIssues;
      if (issues.excessiveHorn && issues.excessiveHorn !== 'None') {
        pollutionCounts.excessiveHorn++;
      }
      if (issues.excessiveSmoke && issues.excessiveSmoke !== 'None') {
        pollutionCounts.excessiveSmoke++;
      }
      if (issues.loudSilencer && issues.loudSilencer !== 'None') {
        pollutionCounts.loudSilencer++;
      }
    }
  });

  // Create proper data format for BarChart
  const pollutionBarData = [
    { value: pollutionCounts.excessiveHorn, label: 'Horn', frontColor: '#FF8C00' },
    { value: pollutionCounts.excessiveSmoke, label: 'Smoke', frontColor: '#4682B4' },
    { value: pollutionCounts.loudSilencer, label: 'Silencer', frontColor: '#9370DB' }
  ];

  // Helper function to format ratings for display
  const formatRating = (rating) => {
    return rating.toFixed(1);
  };

  // Component for displaying star rating legend
  const RatingLegend = () => (
    <View style={styles.legendContainer}>
      {Object.keys(starColors).map(star => (
        <View key={star} style={styles.legendItem}>
          <View style={[styles.legendColor, {backgroundColor: starColors[star]}]} />
          <Text>{star} Star{parseInt(star) > 1 ? 's' : ''}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bus: {busPlate}</Text>

      {/* Driver and Conductor Ratings (Pie Charts) */}
      <Text style={styles.subtitle}>Driver and Conductor Ratings</Text>
      
      {conductorRatings.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Conductor Rating Distribution</Text>
          <Text style={styles.chartSubtitle}>Average: {formatRating(averageConductorRating)}/5</Text>
          <PieChart
            data={conductorDistribution}
            width={300}
            height={220}
            showText
            textColor="white"
            textSize={14}
            focusOnPress
          />
        </View>
      )}
      
      {driverRatings.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Driver Rating Distribution</Text>
          <Text style={styles.chartSubtitle}>Average: {formatRating(averageDriverRating)}/5</Text>
          <PieChart
            data={driverDistribution}
            width={300}
            height={220}
            showText
            textColor="white"
            textSize={14}
            focusOnPress
          />
        </View>
      )}
      
      <RatingLegend />

      {/* Customer Satisfaction */}
      {satisfactionRatings.length > 0 && (
        <>
          <Text style={styles.subtitle}>Customer Satisfaction</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Satisfaction Rating Distribution</Text>
            <Text style={styles.chartSubtitle}>Average: {formatRating(averageSatisfactionRating)}/5</Text>
            <PieChart
              data={satisfactionDistribution}
              width={300}
              height={220}
              showText
              textColor="white"
              textSize={14}
              focusOnPress
            />
          </View>
        </>
      )}

      {/* Bus Condition */}
      {busConditionRatings.length > 0 && (
        <>
          <Text style={styles.subtitle}>Bus Condition</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Bus Condition Rating Distribution</Text>
            <Text style={styles.chartSubtitle}>Average: {formatRating(averageBusConditionRating)}/5</Text>
            <PieChart
              data={busConditionDistribution}
              width={300}
              height={220}
              showText
              textColor="white"
              textSize={14}
              focusOnPress
            />
          </View>
        </>
      )}

      {/* Pollution Issues */}
      {(pollutionCounts.excessiveHorn > 0 || 
        pollutionCounts.excessiveSmoke > 0 || 
        pollutionCounts.loudSilencer > 0) && (
        <>
          <Text style={styles.subtitle}>Bus Pollution Issues</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Number of Reported Issues</Text>
            <BarChart
              data={pollutionBarData}
              width={300}
              height={200}
              barWidth={30}
              showValuesOnTopOfBars
              spacing={30}
            />
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#FF8C00'}]} />
                <Text>Excessive Horn</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#4682B4'}]} />
                <Text>Excessive Smoke</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#9370DB'}]} />
                <Text>Loud Silencer</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default ViewFeedbackScreen2;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 15,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
});