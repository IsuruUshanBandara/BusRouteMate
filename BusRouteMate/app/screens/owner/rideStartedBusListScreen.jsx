import { StyleSheet, View, ActivityIndicator, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const ViewActiveRoutesScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeBusRoutes, setActiveBusRoutes] = useState([]);
  
  useEffect(() => {
    const fetchActiveRouteData = async () => {
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
          setLoading(false);
          return;
        }
      
        const { role, phoneNumber } = ownerSnap.data();
        const ownerCollection = role === 'privateOwners' ? 'privateOwners' : 'sltbAuthority';
      
        // Step 2: Get all bus plate numbers for this owner
        const busesRef = collection(db, ownerCollection, phoneNumber, 'buses');
        
        try {
          const busesSnap = await getDocs(busesRef);
          if (busesSnap.empty) {
            console.error("No buses found for this owner");
            setLoading(false);
            return;
          }
        
          const busPlateNumbers = busesSnap.docs.map(doc => doc.id);
          console.log("Total buses found for owner:", busesSnap.size);
          console.log('Bus Plate Numbers:', busPlateNumbers);
          
          // Step 3: Create a list to hold buses with active routes
          const busRoutesWithActiveStatus = [];
          
          // Step 4: Check each bus for active routes
          for (const plateNumber of busPlateNumbers) {
            // Get all routes for this bus
            const routesRef = collection(db, 'routes');
            const routesSnap = await getDocs(routesRef);
            
            // Check each route document to see if it starts with the bus's plate number
            // and has status: true
            for (const routeDoc of routesSnap.docs) {
              // Check if document ID starts with the bus plate number
              if (routeDoc.id.startsWith(`${plateNumber}-`)) {
                const routeData = routeDoc.data();
                
                // Check if this route has status: true
                if (routeData.status === true) {
                  // Extract the full route name by removing plateNumber- prefix
                  const routeFullName = routeDoc.id.substring(plateNumber.length + 1);
                  
                  // Add this bus route to our list
                  busRoutesWithActiveStatus.push({
                    plateNumber: plateNumber,
                    fullRouteId: routeDoc.id,
                    routeName: routeFullName || 'Unknown', 
                  });
                  
                  // We've found at least one active route for this bus, so we can move on
                  break;
                }
              }
            }
          }
          
          console.log('Buses with active routes:', busRoutesWithActiveStatus);
          
          setActiveBusRoutes(busRoutesWithActiveStatus);
          setLoading(false);
        } catch (busError) {
          console.error("Error fetching buses or routes:", busError);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetch process:', error);
        setLoading(false);
      }
    };
  
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchActiveRouteData();
      } else {
        router.push('screens/owner/privateSignIn');
      }
    });
  
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Buses with Active Routes</Text>

      {activeBusRoutes.length > 0 ? (
        activeBusRoutes.map(busRoute => (
          <Card 
            key={busRoute.fullRouteId} 
            style={styles.card} 
            onPress={() => router.push({
              pathname: `screens/owner/rideTrackingScreen`,
              params: { 
                busPlate: busRoute.plateNumber,
                routeId: busRoute.fullRouteId // Pass the full route ID
              }
            })}
          >
            <Card.Title 
                titleStyle={styles.title} 
                title={`Bus: ${busRoute.plateNumber}`} 
                subtitle={`Route: ${busRoute.routeName}`} 
                subtitleStyle={styles.subtitle} />
          </Card>
        ))
      ) : (
        <Text style={styles.noRoutesText}>No buses with active routes available.</Text>
      )}
    </ScrollView>
  );
};

export default ViewActiveRoutesScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  card: {
    width: '90%',
    marginVertical: 10,
    elevation: 4,
    borderRadius: 10,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#4CAF50',
  },
  noRoutesText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
});