import 'react-native-get-random-values'; // Ensure this is the first line
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  GooglePlacesAutocomplete,
} from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import { useRef, useState } from "react";
import MapViewDirections from "react-native-maps-directions";
import { router, useLocalSearchParams } from 'expo-router';

const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your actual API key

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const INITIAL_POSITION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

function InputAutocomplete({ placeholder, onPlaceSelected, onFocus }) {
  return (
    <GooglePlacesAutocomplete
      styles={{ textInput: styles.input }}
      placeholder={placeholder || ""}
      fetchDetails
      onPress={(data, details = null) => {
        onPlaceSelected(details);
      }}
      onFocus={onFocus}
      query={{
        key: GOOGLE_API_KEY,
        language: "en",
      }}
    />
  );
}

const AddRegisterDriverBusScreen2 = () => {
  const { busData } = useLocalSearchParams(); // Get routes passed from previous screen
  const parasedRoutes= busData ? JSON.parse(busData).routes : []; // Parse the routes if available
  const [routeIndex, setRouteIndex] = useState(0);
  const currentRoute = parasedRoutes.length > 0 ? parasedRoutes[routeIndex] : {}; // Get the current route if available
 // Log parsedRoutes and currentRoute for debugging
  console.log("Parsed Routes:", parasedRoutes);
  console.log("Current Route:", currentRoute); 
  const plateNum = busData ? JSON.parse(busData).licencePlateNum : ''; // Get the license plate number
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [passing1, setPassing1] = useState(null);
  const [passing2, setPassing2] = useState(null);
  const [passing3, setPassing3] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOtherInputs, setShowOtherInputs] = useState(false);
  const mapRef = useRef(null);

  const moveTo = async (position) => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      camera.center = position;
      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
  };

  const edgePaddingValue = 70;
  const edgePadding = {
    top: edgePaddingValue,
    right: edgePaddingValue,
    bottom: edgePaddingValue,
    left: edgePaddingValue,
  };

  const traceRouteOnReady = (args) => {
    if (args) {
      setDistance(args.distance);
      setDuration(args.duration);
    }
  };

  const checkRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      mapRef.current.fitToCoordinates(
        [origin, passing1, passing2, passing3, destination].filter(Boolean),
        { edgePadding }
      );
      setShowOtherInputs(false);
    }
  };

  const saveRoute = () => {
    // Save coordinates and move to the next route if available
    console.log("Route saved:", { origin, destination, passing1, passing2, passing3 });
    if (routeIndex < parasedRoutes.length - 1) {
      setRouteIndex(routeIndex + 1);
      resetCoordinates();
    } else {
      console.log("All routes completed.");
      router.push({
        pathname:'screens/owner/addRegisterDriverBusScreen3',
        params: { plateNum:JSON.stringify(plateNum)},
      });
    }
  };

  const resetCoordinates = () => {
    setOrigin(null);
    setDestination(null);
    setPassing1(null);
    setPassing2(null);
    setPassing3(null);
    setShowDirections(false);
    setDistance(0);
    setDuration(0);
  };

  const onPlaceSelected = (details, flag) => {
    const position = {
      latitude: details?.geometry.location.lat || 0,
      longitude: details?.geometry.location.lng || 0,
    };
    if (flag === "origin") {
      setOrigin(position);
      setShowOtherInputs(true);
    } else if (flag === "destination") {
      setDestination(position);
    } else if (flag === "passing1") {
      setPassing1(position);
    } else if (flag === "passing2") {
      setPassing2(position);
    } else if (flag === "passing3") {
      setPassing3(position);
    }
    moveTo(position);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>
        Enter the origin and destination for Route number {currentRoute.routeNum} - {currentRoute.busRoute}
      </Text>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_POSITION}
      >
        {origin && <Marker coordinate={origin} />}
        {destination && <Marker coordinate={destination} />}
        {passing1 && <Marker coordinate={passing1} pinColor="orange" />}
        {passing2 && <Marker coordinate={passing2} pinColor="orange" />}
        {passing3 && <Marker coordinate={passing3} pinColor="orange" />}
        {showDirections && origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            waypoints={[passing1, passing2, passing3].filter(Boolean)}
            apikey={GOOGLE_API_KEY}
            strokeColor="#6644ff"
            strokeWidth={4}
            onReady={traceRouteOnReady}
          />
        )}
      </MapView>
      <View style={styles.searchContainer}>
        <InputAutocomplete
          placeholder="Origin (Click and Select to Show Other Inputs)"
          onPlaceSelected={(details) => onPlaceSelected(details, "origin")}
          onFocus={() => setShowOtherInputs(true)}
        />
        {showOtherInputs && (
          <>
            <InputAutocomplete
              placeholder="Passing 1 (Optional)"
              onPlaceSelected={(details) => onPlaceSelected(details, "passing1")}
            />
            <InputAutocomplete
              placeholder="Passing 2 (Optional)"
              onPlaceSelected={(details) => onPlaceSelected(details, "passing2")}
            />
            <InputAutocomplete
              placeholder="Passing 3 (Optional)"
              onPlaceSelected={(details) => onPlaceSelected(details, "passing3")}
            />
            <InputAutocomplete
              placeholder="Destination"
              onPlaceSelected={(details) => onPlaceSelected(details, "destination")}
            />
          </>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={checkRoute}>
            <Text style={styles.buttonText}>Check Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={saveRoute}>
            <Text style={styles.buttonText}>Save Route</Text>
          </TouchableOpacity>
        </View>
        {distance && duration ? (
          <View>
            <Text>Distance: {distance.toFixed(2)} km</Text>
            <Text>Duration: {Math.ceil(duration)} min</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default AddRegisterDriverBusScreen2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: "absolute",
    width: "90%",
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    padding: 8,
    borderRadius: 5,
    bottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    width: 100,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10,
  },
});
