import { StyleSheet, View, ActivityIndicator, ScrollView, Dimensions, StatusBar, Alert } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Text, Searchbar, Surface, Divider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

const ViewFeedbackScreen1 = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedbackBuses, setFeedbackBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreBuses, setHasMoreBuses] = useState(true);
  const [lastDocSnapshot, setLastDocSnapshot] = useState(null);
  const [allBusPlates, setAllBusPlates] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchFeedbackData();
      } else {
        router.push('screens/owner/privateSignIn');
      }
    });

    return unsubscribe;
  }, []);

  const fetchFeedbackData = async (lastDoc = null) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        router.push('screens/owner/privateSignIn');
        return;
      }
  
      const userEmail = user.email;
  
      // Step 1: Get role and phone number
      const ownerRef = doc(db, 'ownerDetails', userEmail);
      const ownerSnap = await getDoc(ownerRef);
  
      if (!ownerSnap.exists()) {
        console.error('Owner details not found');
        setLoading(false);
        return;
      }
  
      const { role, phoneNumber } = ownerSnap.data();
      const ownerCollection = role === 'privateOwners' ? 'privateOwners' : 'sltbAuthority';
  
      // Step 2: Get bus plate numbers
      const busesRef = collection(db, ownerCollection, phoneNumber, 'buses');
      
      let busesSnap;
      
      if (lastDoc) {
        busesSnap = await getDocs(
          query(
            busesRef,
            orderBy('__name__'),
            startAfter(lastDoc),
            limit(ITEMS_PER_PAGE)
          )
        );
      } else {
        busesSnap = await getDocs(
          query(
            busesRef,
            orderBy('__name__'),
            limit(ITEMS_PER_PAGE)
          )
        );
      }
      
      if (busesSnap.empty && !lastDoc) {
        console.log("No buses found");
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      const busPlateNumbers = busesSnap.docs.map(doc => doc.id);
      
      // Set all bus plates for future reference
      if (!lastDoc) {
        setAllBusPlates(busPlateNumbers);
      } else {
        setAllBusPlates(prev => [...prev, ...busPlateNumbers]);
      }
      
      // Step 3: Get feedback documents
      const feedbackRef = collection(db, 'passengerFeedback');
      const feedbackSnap = await getDocs(feedbackRef);
      
      // Step 4: Extract unique bus plate numbers from feedback
      const feedbackBusPlates = new Set(
        feedbackSnap.docs.map(doc => doc.id.split('-')[0]) // Extract bus plate number
      );
      
      // Step 5: Filter feedback for relevant buses
      const filteredBusPlates = busPlateNumbers.filter(busPlate => feedbackBusPlates.has(busPlate));
      
      // Set last document for pagination
      if (busesSnap.docs.length === ITEMS_PER_PAGE) {
        setLastDocSnapshot(busesSnap.docs[busesSnap.docs.length - 1]);
        setHasMoreBuses(true);
      } else {
        setHasMoreBuses(false);
      }
      
      // Prepare bus data with additional information
      const busData = filteredBusPlates.map(plate => ({
        plateNumber: plate,
        feedbackCount: Array.from(feedbackSnap.docs)
          .filter(doc => doc.id.startsWith(plate + '-'))
          .length
      }));
      
      if (lastDoc) {
        setFeedbackBuses(prev => [...prev, ...busData]);
        setFilteredBuses(prev => [...prev, ...busData]);
      } else {
        setFeedbackBuses(busData);
        setFilteredBuses(busData);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMoreBuses || loadingMore) return;
    
    setLoadingMore(true);
    fetchFeedbackData(lastDocSnapshot);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      // Reset to current fetched buses
      setFilteredBuses(feedbackBuses);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Search in already fetched buses
    const searchResults = feedbackBuses.filter(bus => 
      bus.plateNumber.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredBuses(searchResults);
    setIsSearching(false);
  }, [feedbackBuses]);

  // Debounce the search
  const onChangeSearch = useCallback((query) => {
    setSearchQuery(query);
    
    // Clear any previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a new timeout to debounce the search
    window.searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 500); // Wait 500ms after typing stops
  }, [handleSearch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* <StatusBar backgroundColor="#1976d2" /> */}
      <Surface style={styles.header}>
        <Text style={styles.heading}>Feedback Available Buses</Text>
      </Surface>
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by plate number"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#1976d2"
          loading={isSearching}
        />
      </View>

      <Divider style={styles.divider} />

      <ScrollView contentContainerStyle={styles.container}>
        {filteredBuses.length > 0 ? (
          <>
            {filteredBuses.map(bus => (
              <Card 
                key={bus.plateNumber} 
                style={styles.card} 
                onPress={() => router.push({
                  pathname: 'screens/owner/viewFeedbackScreen2',
                  params: { busPlate: bus.plateNumber }
                })}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.busInfoContainer}>
                    <MaterialCommunityIcons name="bus" size={24} color="#1976d2" style={styles.busIcon} />
                    <View style={styles.textContainer}>
                      <Text style={styles.busNumber} numberOfLines={1}>
                        {bus.plateNumber}
                      </Text>
                      <Text style={styles.busRoute} numberOfLines={1}>
                        {bus.feedbackCount} {bus.feedbackCount === 1 ? 'feedback' : 'feedbacks'} available
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {hasMoreBuses && searchQuery.trim() === '' && (
              <Button 
                mode="contained" 
                onPress={handleLoadMore}
                style={styles.loadMoreButton}
                loading={loadingMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Show More'}
              </Button>
            )}
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <MaterialCommunityIcons name="message-text" size={64} color="#ccc" />
            <Text style={styles.noDataText}>
              {searchQuery.trim() !== '' 
                ? `No buses found matching "${searchQuery}"`
                : "No feedback available for your buses."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ViewFeedbackScreen1;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    textShadowColor: 'rgba(25, 118, 210, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  cardContent: {
    padding: 16,
  },
  busInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIcon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  busRoute: {
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 16,
  },
  loadMoreButton: {
    marginVertical: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
});