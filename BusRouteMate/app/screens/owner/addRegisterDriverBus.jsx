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

const GOOGLE_API_KEY = "AIzaSyDnrq4UQIcaMGaHVhRKpoOXGbAxuC5Cgqg";

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
        language: "en", // Change to your preferred language
      }}
    />
  );
}

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [passing1, setPassing1] = useState(null);
  const [passing2, setPassing2] = useState(null);
  const [passing3, setPassing3] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOtherInputs, setShowOtherInputs] = useState(false); // State to control other autocomplete visibility
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
      console.log("Route coordinates:", args.coordinates);
    }
  };

  const checkRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      mapRef.current.fitToCoordinates(
        [origin, passing1, passing2, passing3, destination].filter(Boolean), // Only include defined coordinates
        { edgePadding }
      );
      setShowOtherInputs(false); // Hide other inputs after checking the route
    }
  };

  const saveRoute = () => {
    // Here you can implement the logic to save the route
    console.log("Route saved:", { origin, destination, passing1, passing2, passing3 });
  };

  const onPlaceSelected = (details, flag) => {
    const position = {
      latitude: details?.geometry.location.lat || 0,
      longitude: details?.geometry.location.lng || 0,
    };
    if (flag === "origin") {
      setOrigin(position);
      setShowOtherInputs(true); // Show other inputs when origin is selected
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
            waypoints={[passing1, passing2, passing3].filter(Boolean)} // Only include defined waypoints
            apikey={GOOGLE_API_KEY}
            strokeColor="#6644ff"
            strokeWidth={4}
            onReady={traceRouteOnReady}
          />
        )}
      </MapView>
      <View style={styles.searchContainer}>
        <InputAutocomplete
          placeholder="Origin Click and Select to Show Other Inputs"
          onPlaceSelected={(details) => onPlaceSelected(details, "origin")}
          onFocus={() => setShowOtherInputs(true)} // Show other inputs when origin is focused
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 8,
    top: Constants.statusBarHeight,
  },
  input: {
    borderColor: "#888",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    backgroundColor: "#bbb",
    paddingVertical: 12,
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  buttonText: {
    textAlign: "center",
  },
});
