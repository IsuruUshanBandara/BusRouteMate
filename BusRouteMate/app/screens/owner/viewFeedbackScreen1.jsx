import { StyleSheet, View, ActivityIndicator, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../../db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

const ViewFeedbackScreen1 = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbackBuses, setFeedbackBuses] = useState([]);

  useEffect(() => {
    const fetchFeedbackData = async () => {
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
        
            // Step 2: Get all bus plate numbers
            const testBusDoc = await getDoc(doc(db, ownerCollection, phoneNumber, 'buses', 'KC112'));
            console.log("KC112 Exists:", testBusDoc.exists());
            const busesRef = collection(db, ownerCollection, phoneNumber, 'buses');
        
            try {
              const busesSnap = await getDocs(busesRef);
              if (busesSnap.empty) {
                console.error("No buses found in Firestore!");
              }
        
              const busPlateNumbers = busesSnap.docs.map(doc => doc.id);
              console.log("Total buses found in collection:", busesSnap.size);
              console.log('Bus Plate Numbers from Buses Collection:', busPlateNumbers);
        
              // DEBUG: Check what documents are retrieved
              busesSnap.docs.forEach(doc => console.log(`Retrieved Bus: ${doc.id}`, doc.data()));
        
              // Step 3: Get feedback documents
              const feedbackRef = collection(db, 'passengerFeedback');
              const feedbackSnap = await getDocs(feedbackRef);
        
              // Step 4: Extract unique bus plate numbers from feedback
              const feedbackBusPlates = new Set(
                feedbackSnap.docs.map(doc => doc.id.split('-')[0]) // Extract bus plate number
              );
        
              console.log('Bus Plates from Passenger Feedback:', Array.from(feedbackBusPlates));
        
              // Step 5: Filter feedback for relevant buses
              const filteredBuses = busPlateNumbers.filter(busPlate => feedbackBusPlates.has(busPlate));
        
              console.log('Final Filtered Buses:', filteredBuses);
        
              setFeedbackBuses(filteredBuses);
              setLoading(false);
            } catch (busError) {
              console.error("Error fetching buses:", busError);
            }
          } catch (error) {
            console.error('Error fetching feedback:', error);
            setLoading(false);
          }
        };
  
      const unsubscribe = onAuthStateChanged(auth, user => {
        if (user) {
          fetchFeedbackData();
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
      <Text style={styles.heading}>Feedback Available Buses</Text>

      {feedbackBuses.length > 0 ? (
        feedbackBuses.map(busPlate => (
          <Card key={busPlate} style={styles.card} onPress={() => router.push({pathname:`screens/owner/viewFeedbackScreen2`,params: {busPlate:busPlate}})}>
            <Card.Title titleStyle={styles.title} subtitleStyle={styles.subtitle} title={`Bus: ${busPlate}`} />
          </Card>
        ))
      ) : (
        <Text style={styles.noFeedbackText}>No feedback available.</Text>
      )}
    </ScrollView>
  );
};

export default ViewFeedbackScreen1;

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
  },
  noFeedbackText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
});
