import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
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

  // Updated vibrant color scheme for star ratings
  const starColors = {
    1: '#FF3B30', // Bright red for 1 star
    2: '#FF9500', // Bright orange for 2 stars
    3: '#FFCC00', // Bright yellow for 3 stars
    4: '#34C759', // Bright green for 4 stars
    5: '#007AFF'  // Bright blue for 5 stars
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

  // Navigation functions
  const navigateToSuggestions = () => {
    router.push({
      pathname: "screens/owner/viewSuggestionsScreen",
      params: { busPlate }
    });
  };

  const navigateToReasons = (type) => {
    router.push({
      pathname: "screens/owner/viewRatingReasonScreen",
      params: { busPlate, reasonType: type }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!feedbackData || feedbackData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No feedback available for this bus.</Text>
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

  // Count suggestions
  const suggestionCount = feedbackData.filter(
    feedback => feedback.satisfactionSuggestions && 
    feedback.satisfactionSuggestions.suggestion && 
    feedback.satisfactionSuggestions.suggestion.trim() !== ''
  ).length;

  const busConditionRatings = feedbackData
    .filter(feedback => feedback.busConditionPollution && feedback.busConditionPollution.conditionRating)
    .map(feedback => feedback.busConditionPollution.conditionRating);

  // Improved function to calculate star distribution with more details
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
        // Add percentage sign to the display text
        text: `${percentage.toFixed(1)}%`,
        // Include more comprehensive data for use in custom rendering
        count: count,
        percentage: percentage,
        // Focused display for when a slice is selected
        focused: false
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

  // Pollution issues chart data with detailed severity breakdown
  const pollutionCounts = {
    excessiveHorn: 0,
    excessiveSmoke: 0,
    loudSilencer: 0
  };
  
  // Detailed breakdown by severity level - Fixed to properly handle case sensitivity
  const pollutionDetails = {
    excessiveHorn: { High: 0, Medium: 0, Low: 0 },
    excessiveSmoke: { High: 0, Medium: 0, Low: 0 },
    loudSilencer: { High: 0, Medium: 0, Low: 0 }
  };

  // Safely count pollution issues with fixed severity breakdown
  feedbackData.forEach(feedback => {
    if (feedback.busConditionPollution && feedback.busConditionPollution.pollutionIssues) {
      const issues = feedback.busConditionPollution.pollutionIssues;
      
      // Process excessiveHorn - FIX: Handle case sensitivity
      if (issues.excessiveHorn && issues.excessiveHorn !== 'None') {
        pollutionCounts.excessiveHorn++;
        
        // Normalize case to match property names
        const severity = issues.excessiveHorn.charAt(0).toUpperCase() + issues.excessiveHorn.slice(1).toLowerCase();
        
        // Increment the appropriate severity counter
        if (severity === 'High' || severity === 'Medium' || severity === 'Low') {
          pollutionDetails.excessiveHorn[severity]++;
        }
      }
      
      // Process excessiveSmoke - FIX: Handle case sensitivity
      if (issues.excessiveSmoke && issues.excessiveSmoke !== 'None') {
        pollutionCounts.excessiveSmoke++;
        
        // Normalize case to match property names
        const severity = issues.excessiveSmoke.charAt(0).toUpperCase() + issues.excessiveSmoke.slice(1).toLowerCase();
        
        // Increment the appropriate severity counter
        if (severity === 'High' || severity === 'Medium' || severity === 'Low') {
          pollutionDetails.excessiveSmoke[severity]++;
        }
      }
      
      // Process loudSilencer - FIX: Handle case sensitivity
      if (issues.loudSilencer && issues.loudSilencer !== 'None') {
        pollutionCounts.loudSilencer++;
        
        // Normalize case to match property names
        const severity = issues.loudSilencer.charAt(0).toUpperCase() + issues.loudSilencer.slice(1).toLowerCase();
        
        // Increment the appropriate severity counter
        if (severity === 'High' || severity === 'Medium' || severity === 'Low') {
          pollutionDetails.loudSilencer[severity]++;
        }
      }
    }
  });

  // Create proper data format for BarChart with updated vibrant colors
  const pollutionBarData = [
    { value: pollutionCounts.excessiveHorn, label: 'Horn', frontColor: '#FF9500' },
    { value: pollutionCounts.excessiveSmoke, label: 'Smoke', frontColor: '#5856D6' },
    { value: pollutionCounts.loudSilencer, label: 'Silencer', frontColor: '#FF2D55' }
  ];

  // Helper function to format ratings for display
  const formatRating = (rating) => {
    return rating.toFixed(1);
  };

  // Component for displaying star rating legend with more details
  const RatingLegend = ({ distribution, totalRatings }) => (
    <View style={styles.legendContainer}>
      {distribution.map(item => (
        <View key={item.star} style={styles.legendItem}>
          <View style={[styles.legendColor, {backgroundColor: item.color}]} />
          <Text style={styles.legendText}>
            {item.star} ★: {item.count} votes ({item.percentage.toFixed(1)}%)
          </Text>
        </View>
      ))}
      <Text style={styles.totalVotes}>Total votes: {totalRatings}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bus Feedback: {busPlate}</Text>

      {/* Driver and Conductor Ratings (Pie Charts) */}
      <Text style={styles.subtitle}>Driver and Conductor Ratings</Text>
      
      {conductorRatings.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Conductor Rating Distribution</Text>
          <Text style={styles.chartSubtitle}>
            Average: <Text style={styles.ratingValue}>{formatRating(averageConductorRating)}/5</Text> 
            • {conductorRatings.length} ratings
          </Text>
          <PieChart
            data={conductorDistribution}
            width={300}
            height={220}
            showText
            textColor="white"
            textSize={14}
            focusOnPress
            radius={90}
            innerRadius={30}
            innerCircleColor="#f8f9fa"
          />
          {/* Legend placed right after each chart */}
          <RatingLegend 
            distribution={conductorDistribution} 
            totalRatings={conductorRatings.length} 
          />
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigateToReasons('conductor')}
          >
            <Text style={styles.linkButtonText}>View Conductor Rating Reasons</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {driverRatings.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Driver Rating Distribution</Text>
          <Text style={styles.chartSubtitle}>
            Average: <Text style={styles.ratingValue}>{formatRating(averageDriverRating)}/5</Text> 
            • {driverRatings.length} ratings
          </Text>
          <PieChart
            data={driverDistribution}
            width={300}
            height={220}
            showText
            textColor="white"
            textSize={14}
            focusOnPress
            radius={90}
            innerRadius={30}
            innerCircleColor="#f8f9fa"
          />
          {/* Legend placed right after each chart */}
          <RatingLegend 
            distribution={driverDistribution} 
            totalRatings={driverRatings.length} 
          />
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigateToReasons('driver')}
          >
            <Text style={styles.linkButtonText}>View Driver Rating Reasons</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customer Satisfaction */}
      {satisfactionRatings.length > 0 && (
        <>
          <Text style={styles.subtitle}>Customer Satisfaction</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Satisfaction Rating Distribution</Text>
            <Text style={styles.chartSubtitle}>
              Average: <Text style={styles.ratingValue}>{formatRating(averageSatisfactionRating)}/5</Text> 
              • {satisfactionRatings.length} ratings
            </Text>
            <PieChart
              data={satisfactionDistribution}
              width={300}
              height={220}
              showText
              textColor="white"
              textSize={14}
              focusOnPress
              radius={90}
              innerRadius={30}
              innerCircleColor="#f8f9fa"
            />
            {/* Legend placed right after each chart */}
            <RatingLegend 
              distribution={satisfactionDistribution} 
              totalRatings={satisfactionRatings.length} 
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
            <Text style={styles.chartSubtitle}>
              Average: <Text style={styles.ratingValue}>{formatRating(averageBusConditionRating)}/5</Text> 
              • {busConditionRatings.length} ratings
            </Text>
            <PieChart
              data={busConditionDistribution}
              width={300}
              height={220}
              showText
              textColor="white"
              textSize={14}
              focusOnPress
              radius={90}
              innerRadius={30}
              innerCircleColor="#f8f9fa"
            />
            {/* Legend placed right after each chart */}
            <RatingLegend 
              distribution={busConditionDistribution} 
              totalRatings={busConditionRatings.length} 
            />
            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => navigateToReasons('busCondition')}
            >
              <Text style={styles.linkButtonText}>View Bus Condition Reasons</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Pollution Issues - Fixed to stay inside container */}
      {(pollutionCounts.excessiveHorn > 0 || 
        pollutionCounts.excessiveSmoke > 0 || 
        pollutionCounts.loudSilencer > 0) && (
        <>
          <Text style={styles.subtitle}>Bus Pollution Issues</Text>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Number of Reported Issues</Text>
            <View style={styles.barChartContainer}>
              <BarChart
                data={pollutionBarData}
                width={260}
                height={200}
                barWidth={30}
                showValuesOnTopOfBars
                spacing={40}
                hideRules
                noOfSections={5}
                maxValue={Math.max(...Object.values(pollutionCounts)) + 1}
              />
            </View>
            
            {/* Overall summary of issues */}
            <View style={styles.pollutionLegendContainer}>
              <Text style={styles.pollutionSectionTitle}>Issue Summary</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#FF9500'}]} />
                <Text style={styles.legendText}>
                  Excessive Horn: {pollutionCounts.excessiveHorn} reports
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#5856D6'}]} />
                <Text style={styles.legendText}>
                  Excessive Smoke: {pollutionCounts.excessiveSmoke} reports
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, {backgroundColor: '#FF2D55'}]} />
                <Text style={styles.legendText}>
                  Loud Silencer: {pollutionCounts.loudSilencer} reports
                </Text>
              </View>
            </View>
            
            {/* Detailed breakdown by severity */}
            <View style={styles.pollutionDetailsContainer}>
              <Text style={styles.pollutionSectionTitle}>Severity Breakdown</Text>
              
              {/* Excessive Horn breakdown */}
              {pollutionCounts.excessiveHorn > 0 && (
                <View style={styles.severitySection}>
                  <Text style={styles.severitySectionTitle}>
                    Excessive Horn:
                  </Text>
                  <View style={styles.severityBreakdown}>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF3B30'}]} />
                      <Text>High: {pollutionDetails.excessiveHorn.High}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF9500'}]} />
                      <Text>Medium: {pollutionDetails.excessiveHorn.Medium}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FFCC00'}]} />
                      <Text>Low: {pollutionDetails.excessiveHorn.Low}</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Excessive Smoke breakdown */}
              {pollutionCounts.excessiveSmoke > 0 && (
                <View style={styles.severitySection}>
                  <Text style={styles.severitySectionTitle}>
                    Excessive Smoke:
                  </Text>
                  <View style={styles.severityBreakdown}>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF3B30'}]} />
                      <Text>High: {pollutionDetails.excessiveSmoke.High}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF9500'}]} />
                      <Text>Medium: {pollutionDetails.excessiveSmoke.Medium}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FFCC00'}]} />
                      <Text>Low: {pollutionDetails.excessiveSmoke.Low}</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Loud Silencer breakdown */}
              {pollutionCounts.loudSilencer > 0 && (
                <View style={styles.severitySection}>
                  <Text style={styles.severitySectionTitle}>
                    Loud Silencer:
                  </Text>
                  <View style={styles.severityBreakdown}>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF3B30'}]} />
                      <Text>High: {pollutionDetails.loudSilencer.High}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FF9500'}]} />
                      <Text>Medium: {pollutionDetails.loudSilencer.Medium}</Text>
                    </View>
                    <View style={styles.severityItem}>
                      <View style={[styles.severityIndicator, {backgroundColor: '#FFCC00'}]} />
                      <Text>Low: {pollutionDetails.loudSilencer.Low}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Overall Suggestions Section */}
      <View style={styles.suggestionContainer}>
        <Text style={styles.subtitle}>Passenger Suggestions</Text>
        <Text style={styles.suggestionCount}>
          {suggestionCount} {suggestionCount === 1 ? 'passenger has' : 'passengers have'} provided suggestions
        </Text>
        <TouchableOpacity 
          style={styles.viewSuggestionsButton} 
          onPress={navigateToSuggestions}
        >
          <Text style={styles.viewSuggestionsButtonText}>View All Suggestions</Text>
        </TouchableOpacity>
      </View>
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
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1c1c1e',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1c1c1e',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  ratingValue: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalVotes: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#666',
  },
  // Bar chart container to ensure proper containment
  barChartContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pollutionLegendContainer: {
    width: '100%',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  // Pollution details section
  pollutionDetailsContainer: {
    width: '100%',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  pollutionSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  severitySection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  severitySectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  severityBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginVertical: 3,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  // View Reason Button Styles
  linkButton: {
    marginTop: 15,
    padding: 8,
  },
  linkButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  // Suggestion Section Styles
  suggestionContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#e3f2fd', // Lighter blue background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  suggestionCount: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    color: '#333',
  },
  viewSuggestionsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    elevation: 2,
  },
  viewSuggestionsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
});