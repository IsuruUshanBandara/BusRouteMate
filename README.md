🚌 BusRouteMate
📋 Overview
BusRouteMate is an innovative mobile application designed to streamline the management of public transportation. The platform provides tailored interfaces for three distinct user groups—bus owners, drivers, and passengers—creating a cohesive ecosystem that enhances efficiency, transparency, and satisfaction in public transportation services.

✨ Features

🏢 For Bus Owners
Fleet Management: Add, edit, and delete buses with specific route information.
Driver Assignment: Register and manage drivers for different buses.
Route Configuration: Create and modify bus routes with detailed waypoints.
Analytics Dashboard: View passenger feedback, ratings, and route performance.
Suggestion Review System: Review and implement passenger improvement ideas.

🚗 For Drivers
Secure Authentication: Login with plate number and personal credentials.
Ride management: Start and Stop ride,

👥 For Passengers
Route Search: Find bus routes between locations.
Live Updates: View bus locations. 
Feedback Submission: Rate journeys and provide constructive feedback.
Multilingual Support: Use the app in English or Sinhala.

🛠️ Technology Stack

Frontend: React Native with Expo
Backend: Firebase (Firestore, Authentication)
Navigation: Expo Router
UI Components: React Native Paper
Maps Integration: Google Maps API
Internationalization: i18next for multilingual support
State Management: React Context API & useState/useEffect hooks

📁 Project Structure
BusRouteMate/
├── BusRouteMate/                # Main app directory
│   ├── app/                     # Root app code (Expo Router structure)
│   │   ├── _layout.jsx          # Root layout with i18n provider
│   │   ├── index.jsx            # Entry point (home screen)
│   │   ├── (auth)/              # Authentication group
│   │   │   ├── _layout.jsx      # Auth layout
│   │   │   ├── driver/          # Driver authentication screens
│   │   │   ├── owner/           # Owner authentication screens
│   │   │   └── organizationSelection.jsx
│   │   ├── screens/             # Main application screens
│   │   │   ├── _layout.jsx      # Screens layout with navigation
│   │   │   ├── owner/           # Bus owner specific screens
│   │   │   │   ├── ownerHome.jsx
│   │   │   │   ├── manageDriverBusScreen.jsx
│   │   │   │   ├── addRegisterDriverBusScreen1.jsx
│   │   │   │   ├── addRegisterDriverBusScreen1.1.jsx
│   │   │   │   ├── addRegisterDriverBusScreen2.jsx
│   │   │   │   ├── editBusRouteDetails.jsx
│   │   │   │   ├── editBusRouteMap.jsx
│   │   │   │   ├── viewSuggestionsScreen.jsx
│   │   │   │   ├── rideStartedBusListScreen.jsx
│   │   │   │   ├── driverTrackingMap.jsx
│   │   │   │   └── editDriverConductorDetails.jsx
│   │   │   ├── driver/          # Bus driver specific screens
│   │   │   │   └── driverRideStartCancelScreen.jsx
│   │   │   └── passenger/       # Passenger specific screens
│   │   │       ├── passengerHome.jsx
    │   │       ├── searchViewBusRoutes.jsx
    │   │       ├── busRouteMapView.jsx
    │   │       ├── satisfactionSuggestion.jsx
    │   │       ├── busConditionPollutionFeedback.jsx
    │   │       └── driverConductorRatingFeedback.jsx
│   │   ├── db/                  # Database configuration
│   │   │   └── firebaseConfig.js # Firebase setup
│   │   ├── i18n/                # Internationalization files
│   │   │   ├── en/              # English translations
│   │   │   └── si/              # Sinhala translations
│   │   ├── components/          # Reusable components
│   │   └── utils/               # Utility functions
│   ├── assets/                  # Static assets like images
│   └── app.json                 # Expo configuration
├── node_modules/                # Project dependencies
├── package.json                 # Project configuration
├── babel.config.js              # Babel configuration
└── README.md                    # Project documentation


🚀 Getting Started

Prerequisites

Node.js (v14 or later)
npm or yarn
Expo CLI
The .env file is needed, it is provided in the onedrive link given in the final year report.
