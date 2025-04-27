import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../db/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';

const ViewSuggestionsScreen = () => {
  const router = useRouter();
  const { busPlate } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestion, setSuggestions] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [noMoreData, setNoMoreData] = useState(false);
  
  // Page sizes
  const PAGE_SIZE = 5;

  // Helper to format the date
  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'N/A';
      
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Date error';
    }
  };

  // Helper to get star emoji based on rating
  const getRatingStars = (rating) => {
    let stars = '';
    for (let i = 0; i < rating; i++) {
      stars += '★';
    }
    for (let i = rating; i < 5; i++) {
      stars += '☆';
    }
    return stars;
  };

  // Helper to get rating color
  const getRatingColor = (rating) => {
    if (rating <= 2) return '#FF6B6B'; // Red for low ratings
    if (rating === 3) return '#FFD166'; // Yellow for medium ratings
    return '#06D6A0'; // Green for high ratings
  };

  // Initial data fetch
  useEffect(() => {
    fetchInitialSuggestions();
  }, [busPlate]);

  const fetchInitialSuggestions = async () => {
    try {
      setLoading(true);
      
      // Create the base query
      const feedbackRef = collection(db, 'passengerFeedback');
      let mainQuery = query(
        feedbackRef,
        where('busPlate', '==', busPlate),
        orderBy('timestamp', 'desc'),
        limit(PAGE_SIZE)
      );
      
      const querySnapshot = await getDocs(mainQuery);
      
      if (querySnapshot.empty) {
        setSuggestions([]);
        setNoMoreData(true);
      } else {
        // Process the results to extract suggestions
        const suggestionData = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          
          if (data.satisfactionSuggestions && 
              data.satisfactionSuggestions.suggestion && 
              data.satisfactionSuggestions.suggestion.trim() !== '') {
            suggestionData.push({
              id: doc.id,
              suggestion: data.satisfactionSuggestions.suggestion,
              rating: data.satisfactionSuggestions.satisfactionRating || 0,
              timestamp: data.satisfactionSuggestions.timestamp || data.timestamp
            });
          }
        });

        setSuggestions(suggestionData);
        
        // Set the last document for pagination
        if (suggestionData.length < PAGE_SIZE) {
          setNoMoreData(true);
        } else {
          const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
          setLastVisible(lastDoc);
        }
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load more data
  const loadMoreSuggestions = async () => {
    if (loadingMore || noMoreData) return;
    
    try {
      setLoadingMore(true);
      
      // Create the next query with the last document
      const feedbackRef = collection(db, 'passengerFeedback');
      let nextQuery = query(
        feedbackRef,
        where('busPlate', '==', busPlate),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
      
      const querySnapshot = await getDocs(nextQuery);
      
      if (querySnapshot.empty) {
        setNoMoreData(true);
      } else {
        // Process the results to extract suggestions
        const suggestionData = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          
          if (data.satisfactionSuggestions && 
              data.satisfactionSuggestions.suggestion && 
              data.satisfactionSuggestions.suggestion.trim() !== '') {
            suggestionData.push({
              id: doc.id,
              suggestion: data.satisfactionSuggestions.suggestion,
              rating: data.satisfactionSuggestions.satisfactionRating || 0,
              timestamp: data.satisfactionSuggestions.timestamp || data.timestamp
            });
          }
        });

        // Append the new data to existing suggestions
        setSuggestions(prevSuggestions => [...prevSuggestions, ...suggestionData]);
        
        // Set the last document for next pagination
        if (suggestionData.length < PAGE_SIZE) {
          setNoMoreData(true);
        } else {
          const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
          setLastVisible(lastDoc);
        }
      }
    } catch (error) {
      console.error("Error loading more suggestions:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Back button handler
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Passenger Suggestions</Text>
        <Text style={styles.subtitle}>Bus: {busPlate}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {suggestion.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No suggestions found for this bus.</Text>
          </View>
        ) : (
          <>
            {suggestion.map((item, index) => (
              <View key={item.id || index} style={styles.card}>
                <View style={styles.cardHeader}>
                  {item.rating > 0 && (
                    <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
                      <Text style={styles.ratingBadgeText}>{item.rating}/5</Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                </View>
                {item.rating > 0 && (
                  <Text style={styles.ratingStars}>{getRatingStars(item.rating)}</Text>
                )}
                <View style={styles.suggestionContainer}>
                  <Text style={styles.suggestionTitle}>Passenger Suggestion:</Text>
                  <Text style={styles.suggestionText}>{item.suggestion}</Text>
                </View>
              </View>
            ))}

            {!noMoreData && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreSuggestions}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loadMoreButtonText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}

            {noMoreData && suggestion.length > 0 && (
              <Text style={styles.noMoreText}>No more suggestions to load</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ViewSuggestionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 1,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  ratingStars: {
    fontSize: 24,
    marginBottom: 12,
    letterSpacing: 3,
  },
  suggestionContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#444',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  loadMoreButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  loadMoreButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noMoreText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});