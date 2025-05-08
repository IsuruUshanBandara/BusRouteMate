import { StyleSheet, View, ActivityIndicator, ScrollView, Alert, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, Text, IconButton, Searchbar, Surface, Divider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, deleteDoc, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

const ManageBusesScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busRoutes, setBusRoutes] = useState([]);
  const [filteredBusRoutes, setFilteredBusRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ownerBusPlates, setOwnerBusPlates] = useState([]);
  const [hasMoreRoutes, setHasMoreRoutes] = useState(true);
  const [lastDocSnapshot, setLastDocSnapshot] = useState(null);
  const [userDetails, setUserDetails] = useState({
    role: '',
    phoneNumber: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchUserDetails(user.email);
      } else {
        router.push('screens/owner/privateSignIn');
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserDetails = async (userEmail) => {
    try {
      setLoading(true);
      const ownerRef = doc(db, 'ownerDetails', userEmail);
      const ownerSnap = await getDoc(ownerRef);
    
      if (!ownerSnap.exists()) {
        console.error('Owner details not found');
        setLoading(false);
        return;
      }
    
      const { role, phoneNumber } = ownerSnap.data();
      setUserDetails({ role, phoneNumber });
      
      // Fetch bus plates owned by this user
      await fetchOwnerBusPlates(role, phoneNumber);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setLoading(false);
    }
  };

  const fetchOwnerBusPlates = async (role, phoneNumber) => {
    try {
      const ownerCollection = role === 'privateOwners' ? 'privateOwners' : 'sltbAuthority';
      const busesRef = collection(db, ownerCollection, phoneNumber, 'buses');
      const busesSnap = await getDocs(busesRef);
      
      if (busesSnap.empty) {
        console.log("No buses found");
        setBusRoutes([]);
        setFilteredBusRoutes([]);
        setLoading(false);
        return;
      }
      
      const plates = busesSnap.docs.map(doc => doc.id);
      setOwnerBusPlates(plates);
      
      // Initial fetch of routes
      await fetchBusRoutes(plates);
    } catch (error) {
      console.error('Error fetching bus plates:', error);
      setLoading(false);
    }
  };

  const fetchBusRoutes = async (plates, lastDoc = null) => {
    try {
      if (plates.length === 0) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      console.log(`Fetching routes for ${plates.length} buses, pagination: ${lastDoc ? 'yes' : 'no'}`);
      
      // Create a base query to get all routes
      let routesRef = collection(db, 'routes');
      let routesSnap;
      
      // For pagination, use a different approach since we need to filter by plate numbers
      if (lastDoc) {
        // When paginating, we get the next batch of routes
        routesSnap = await getDocs(
          query(
            routesRef,
            orderBy('__name__'),  // Order by document ID
            startAfter(lastDoc),
            limit(ITEMS_PER_PAGE * 3)  // Fetch more than needed to account for filtering
          )
        );
      } else {
        // For initial load, just get first batch
        routesSnap = await getDocs(
          query(
            routesRef,
            orderBy('__name__'),  // Order by document ID
            limit(ITEMS_PER_PAGE * 3)  // Fetch more than needed to account for filtering
          )
        );
      }
      
      if (routesSnap.empty) {
        console.log("No routes found in database");
        setHasMoreRoutes(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      // Filter routes that belong to owner's buses
      const busRoutesData = [];
      let routeCount = 0;
      let lastVisibleSet = false;
      let lastVisible = null;
      
      for (const routeDoc of routesSnap.docs) {
        const docId = routeDoc.id;
        const parts = docId.split('-');
        
        // First part is the plate number
        const plateNumber = parts[0];
        
        // Remaining parts form the route (join with hyphen as routes might contain hyphens)
        const routeName = parts.slice(1).join('-');
        
        // Check if this route belongs to one of the owner's buses
        if (plates.includes(plateNumber) && routeName) {
          busRoutesData.push({
            plateNumber: plateNumber,
            route: routeName,
            routeDocId: docId,
            ...routeDoc.data()
          });
          
          routeCount++;
          
          // Set last visible document after collecting 10 relevant routes
          if (routeCount === ITEMS_PER_PAGE && !lastVisibleSet) {
            lastVisible = routeDoc;
            lastVisibleSet = true;
          }
        }
        
        // Stop once we have enough routes for this page
        if (routeCount >= ITEMS_PER_PAGE && lastVisibleSet) {
          break;
        }
      }
      
      // Set last document for next pagination if we actually got the full page
      if (lastVisible && routeCount >= ITEMS_PER_PAGE) {
        setLastDocSnapshot(lastVisible);
        setHasMoreRoutes(true);
      } else {
        // If we got fewer than requested items, there are no more routes
        setHasMoreRoutes(false);
      }
      
      console.log(`Found ${busRoutesData.length} routes for this user's buses`);
      
      // Append new routes to existing ones when loading more
      if (lastDoc) {
        setBusRoutes(prevRoutes => [...prevRoutes, ...busRoutesData]);
        setFilteredBusRoutes(prevRoutes => [...prevRoutes, ...busRoutesData]);
      } else {
        setBusRoutes(busRoutesData);
        setFilteredBusRoutes(busRoutesData);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching bus routes:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMoreRoutes || loadingMore) return;
    
    setLoadingMore(true);
    fetchBusRoutes(ownerBusPlates, lastDocSnapshot);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      // Reset to current fetched routes
      setFilteredBusRoutes(busRoutes);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // First, search in already fetched routes
    const localResults = busRoutes.filter(item => 
      item.plateNumber.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredBusRoutes(localResults);
    
    // If query is longer than 2 characters, also search in database
    if (query.length > 2) {
      try {
        const searchQuery = query.toLowerCase();
        
        // Create a query to find routes that match the search term
        // We'll search for routes where the document ID starts with any of the user's bus plates
        // and contains the search query
        const routesRef = collection(db, 'routes');
        let routesSnap = await getDocs(routesRef);
        
        const searchResults = [];
        
        routesSnap.forEach(routeDoc => {
          const docId = routeDoc.id;
          const parts = docId.split('-');
          const plateNumber = parts[0];
          const routeName = parts.slice(1).join('-');
          
          // Check if this route belongs to one of the owner's buses
          // and if it matches the search query
          if (ownerBusPlates.includes(plateNumber) && 
              plateNumber.toLowerCase().includes(searchQuery) &&
              !busRoutes.some(route => route.routeDocId === docId) &&
              !localResults.some(route => route.routeDocId === docId)) {
            searchResults.push({
              plateNumber: plateNumber,
              route: routeName,
              routeDocId: docId,
              ...routeDoc.data()
            });
          }
        });
        
        console.log(`Database search found ${searchResults.length} additional results`);
        
        // Combine local results with database results
        const combinedResults = [...localResults, ...searchResults];
        
        setFilteredBusRoutes(combinedResults);
      } catch (error) {
        console.error('Error searching in database:', error);
      }
    }
    
    setIsSearching(false);
  };

  const handleDelete = (plateNumber, routeDocId) => {
    Alert.alert(
      "Delete Bus Route",
      `Are you sure you want to delete route for bus ${plateNumber}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              // Step 1: Check if there are multiple routes for this bus plate by examining document IDs
              console.log(`Checking for multiple routes with plate number: ${plateNumber}`);
              
              const allRoutesSnapshot = await getDocs(collection(db, 'routes'));
              let routeCount = 0;
              
              // Count documents where ID starts with plateNumber followed by hyphen
              allRoutesSnapshot.forEach(doc => {
                // Check if document ID starts with the plate number (e.g., "PFP1123-Kegalle-Avissawella")
                if (doc.id.startsWith(`${plateNumber}-`)) {
                  routeCount++;
                  console.log(`Found route with matching plate: ${doc.id}`);
                }
              });
              
              const hasMultipleRoutes = routeCount > 1;
              console.log(`Found ${routeCount} routes for bus plate ${plateNumber}`);
              
              // Step 2: Delete the specific route document
              await deleteDoc(doc(db, 'routes', routeDocId));
              console.log(`Deleted route document: ${routeDocId}`);
              
              // Update state to remove deleted route
              const updatedRoutes = busRoutes.filter(item => item.routeDocId !== routeDocId);
              setBusRoutes(updatedRoutes);
              
              // Update filtered routes as well
              setFilteredBusRoutes(
                filteredBusRoutes.filter(item => item.routeDocId !== routeDocId)
              );
              
              // After deletion, we need to check if there are still other routes for this bus
              // We subtract 1 from the original count because we just deleted one
              const remainingRoutes = routeCount - 1;
              
              // If there are no remaining routes for this bus plate, perform cascade deletes
              if (remainingRoutes === 0) {
                console.log(`This was the only route for bus ${plateNumber}. Performing cascade deletes.`);
                
                // Step 3: Delete all related passenger feedback
                try {
                  console.log(`Deleting passenger feedback for bus ${plateNumber}`);
                  const allFeedbackDocs = await getDocs(collection(db, 'passengerFeedback'));
                  const matchingFeedbackDocs = [];
                  
                  allFeedbackDocs.forEach(doc => {
                    if (doc.id.startsWith(`${plateNumber}-`)) {
                      matchingFeedbackDocs.push(doc.ref);
                      console.log(`Found matching feedback document: ${doc.id}`);
                    }
                  });
                  
                  for (const docRef of matchingFeedbackDocs) {
                    await deleteDoc(docRef);
                    console.log(`Deleted feedback document: ${docRef.path}`);
                  }
                } catch (feedbackDeleteError) {
                  console.error('Error deleting passenger feedback:', feedbackDeleteError);
                }
                
                // Step 4: Delete the driver details document
                try {
                  console.log(`Searching for driver documents with plate number: ${plateNumber}`);
                  
                  // Get all documents from driverDetails collection
                  const allDriverDocs = await getDocs(collection(db, 'driverDetails'));
                  const matchingDriverDocs = [];
                  
                  // Find all documents where ID starts with the plate number
                  allDriverDocs.forEach(doc => {
                    if (doc.id.startsWith(`${plateNumber}-`)) {
                      matchingDriverDocs.push(doc.ref);
                      console.log(`Found matching driver document: ${doc.id}`);
                    }
                  });
                  
                  // Delete all matching documents
                  for (const docRef of matchingDriverDocs) {
                    await deleteDoc(docRef);
                    console.log(`Deleted driver document: ${docRef.path}`);
                  }
                  
                  console.log(`Completed driver document deletion. Found and deleted ${matchingDriverDocs.length} documents`);
                } catch (driverDeleteError) {
                  console.error('Error deleting driver details:', driverDeleteError);
                }
                
                // Step 5: Delete the bus from the owner's buses subcollection
                try {
                  if (userDetails && userDetails.phoneNumber) {
                    const ownerBusRef = doc(
                      db, 
                      'privateOwners', 
                      userDetails.phoneNumber, 
                      'buses', 
                      plateNumber
                    );
                    await deleteDoc(ownerBusRef);
                    console.log(`Deleted bus ${plateNumber} from owner subcollection`);
                  }
                } catch (ownerBusDeleteError) {
                  console.error('Error deleting bus from owner collection:', ownerBusDeleteError);
                }
                
                Alert.alert("Success", "Bus route and all related data deleted successfully");
              } else {
                console.log(`Bus ${plateNumber} has ${remainingRoutes} other routes. Only deleting the specific route.`);
                Alert.alert("Success", "Bus route deleted successfully. Other routes for this bus remain active.");
              }
            } catch (error) {
              console.error('Error during delete operation:', error);
              Alert.alert("Error", "Failed to complete delete operation. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleEdit = (plateNumber, routeName, routeDocId) => {
    router.push({
      pathname: 'screens/owner/editDriverBusOptionSelectionScreen',
      params: { 
        plateNumber: plateNumber,
        currentRoute: routeName,
        routeDocId: routeDocId
      }
    });
  };

  // Debounce the search to prevent too many database queries
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
  }, [ownerBusPlates, busRoutes]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1976d2" />
      <Surface style={styles.header}>
        <Text style={styles.heading}>Manage Your Buses</Text>
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
        {filteredBusRoutes.length > 0 ? (
          <>
            {filteredBusRoutes.map(item => (
              <Card key={item.routeDocId} style={styles.card} elevation={3}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.busInfoContainer}>
                    <MaterialCommunityIcons name="bus" size={24} color="#1976d2" style={styles.busIcon} />
                    <View style={styles.textContainer}>
                      <Text style={styles.busNumber} numberOfLines={1}>
                        {item.plateNumber}
                      </Text>
                      <Text style={styles.busRoute} numberOfLines={2}>
                        {item.route}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="pencil"
                      iconColor="#1976d2"
                      size={24}
                      style={styles.editButton}
                      onPress={() => handleEdit(item.plateNumber, item.route, item.routeDocId)}
                    />
                    <IconButton
                      icon="delete"
                      iconColor="#ff5252"
                      size={24}
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item.plateNumber, item.routeDocId)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
            
            {hasMoreRoutes && searchQuery.trim() === '' && (
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
            <MaterialCommunityIcons name="bus-stop" size={64} color="#ccc" />
            <Text style={styles.noDataText}>
              {searchQuery.trim() !== '' 
                ? `No buses found matching "${searchQuery}"`
                : "No buses with routes found."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ManageBusesScreen;

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
    marginRight: 10,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
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