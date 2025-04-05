import { StyleSheet, View, ActivityIndicator, ScrollView, Alert, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Card, Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const ManageBusesScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busRoutes, setBusRoutes] = useState([]);

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
              setBusRoutes(busRoutes.filter(item => item.routeDocId !== routeDocId));
              
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Your Registered Buses</Text>

      {busRoutes.length > 0 ? (
        busRoutes.map(item => (
          <Card key={item.routeDocId} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.busNumber} numberOfLines={1}>Bus No: {item.plateNumber}</Text>
                <Text style={styles.busRoute} numberOfLines={2}>Bus Route: {item.route}</Text>
              </View>
              <View style={styles.actionButtons}>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => handleEdit(item.plateNumber, item.route, item.routeDocId)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDelete(item.plateNumber, item.routeDocId)}
                />
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Text style={styles.noDataText}>No buses with routes found.</Text>
      )}
    </ScrollView>
  );
};

export default ManageBusesScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    marginVertical: 8,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  busRoute: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexShrink: 0,
    width: 80,
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 40,
  },
});