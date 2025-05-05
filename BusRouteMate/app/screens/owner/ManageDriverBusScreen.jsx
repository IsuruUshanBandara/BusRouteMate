import { StyleSheet, View, ActivityIndicator, ScrollView, Alert, Dimensions, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Card, Text, IconButton, Searchbar, Surface, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ManageBusesScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busRoutes, setBusRoutes] = useState([]);
  const [filteredBusRoutes, setFilteredBusRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBusData = async () => {
      try {
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
          return;
        }
      
        const { role, phoneNumber } = ownerSnap.data();
        const ownerCollection = role === 'privateOwners' ? 'privateOwners' : 'sltbAuthority';
      
        // Step 2: Get all bus plate numbers owned by this owner
        const busesRef = collection(db, ownerCollection, phoneNumber, 'buses');
        const busesSnap = await getDocs(busesRef);
        
        if (busesSnap.empty) {
          console.log("No buses found");
          setBusRoutes([]);
          setFilteredBusRoutes([]);
          setLoading(false);
          return;
        }
        
        const ownerBusPlates = busesSnap.docs.map(doc => doc.id);
        console.log("Owner's buses:", ownerBusPlates);
        
        // Step 3: Get all routes from routes collection
        const routesRef = collection(db, 'routes');
        const routesSnap = await getDocs(routesRef);
        
        // Step 4: Filter routes that belong to owner's buses and parse route information
        const busRoutesData = [];
        
        routesSnap.docs.forEach(routeDoc => {
          const docId = routeDoc.id;
          const parts = docId.split('-');
          
          // First part is the plate number
          const plateNumber = parts[0];
          
          // Remaining parts form the route (join with hyphen as routes might contain hyphens)
          const routeName = parts.slice(1).join('-');
          
          // Check if this route belongs to one of the owner's buses
          if (ownerBusPlates.includes(plateNumber) && routeName) {
            busRoutesData.push({
              plateNumber: plateNumber,
              route: routeName,
              routeDocId: docId,
              ...routeDoc.data()
            });
          }
        });
        
        console.log(`Found ${busRoutesData.length} routes for owner's buses`);
        setBusRoutes(busRoutesData);
        setFilteredBusRoutes(busRoutesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bus data:', error);
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchBusData();
      } else {
        router.push('screens/owner/privateSignIn');
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Filter buses based on search query
    if (searchQuery.trim() === '') {
      setFilteredBusRoutes(busRoutes);
    } else {
      const filtered = busRoutes.filter(item => 
        item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBusRoutes(filtered);
    }
  }, [searchQuery, busRoutes]);

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
              // Delete the route document
              await deleteDoc(doc(db, 'routes', routeDocId));
              
              // Update state to remove deleted route
              const updatedRoutes = busRoutes.filter(item => item.routeDocId !== routeDocId);
              setBusRoutes(updatedRoutes);
              setFilteredBusRoutes(
                updatedRoutes.filter(item => 
                  item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
                )
              );
              
              Alert.alert("Success", "Bus route deleted successfully");
            } catch (error) {
              console.error('Error deleting bus route:', error);
              Alert.alert("Error", "Failed to delete bus route. Please try again.");
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

  const onChangeSearch = query => setSearchQuery(query);

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
        />
      </View>

      <Divider style={styles.divider} />

      <ScrollView contentContainerStyle={styles.container}>
        {filteredBusRoutes.length > 0 ? (
          filteredBusRoutes.map(item => (
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
          ))
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
});