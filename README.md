# OutRun Hackathon Funovation 26 Project

## Overview
Application whose main purpose is to enrich the travel experience of you and your friends, colleagues or familly. You divide yourself into team, set where you wish to begin, end and how long do you want your hike to be and leave the rest to us. Our website will create unique trip between you and your destinations and will take you throught various turistic spots while you compete with the other teams, sabotage each other and explore your suroundings!

## Features
* **Real-time Geolocation:** Automatically requests and displays the user's current location upon loading. 
* **Interactive Map:** Utilizes Leaflet.js with Mapy.cz REST API map tiles for rendering.
* **Smart Search (Suggest API):** Features a search bar with autocomplete suggestions powered by the Mapy.cz Suggest API.
* **Trip Planner:** * Allows users to select a target walking distance (from 2 km to 30 km).
  * Queries the Overpass API (OpenStreetMap) to find interesting POIs (museums, viewpoints, castles, monuments) at the approximate requested distance.
  * Calculates a pedestrian route (`routeType: 'foot_hiking'`) using the Mapy.cz Routing API and plots it on the map.
  * Displays estimated route distance and walking time.
* **Responsive UI:** Modern, clean interface styled with Tailwind CSS, featuring smooth animations powered by `motion/react`.

## Tech Stack
* **Framework:** React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (v4)
* **Map Library:** Leaflet (v1.9.4)
* **Icons:** Lucide React
* **Animations:** Motion (Framer Motion)

## External APIs Used
1. **Mapy.cz REST API:**
   * **Map Tiles:** Fetches the basic map layer (`/v1/maptiles/basic/256/{z}/{x}/{y}`).
   * **Routing:** Calculates the hiking route geometry, distance, and duration (`/v1/routing/route`).
   * **Suggest:** Powers the search bar autocomplete (`/v1/suggest`).
2. **Overpass API (OpenStreetMap):**
   * **POI Fetching:** Finds tourist attractions (`tourism~"viewpoint|museum|attraction"`, `historic~"castle|monument"`) near the user's location within a calculated radius.

## Project Structure
* `src/App.tsx`: The main application component containing all the logic for state management, API calls, and map rendering.
* `src/main.tsx`: The entry point of the React application.
* `src/lib/utils.ts`: Contains utility functions, primarily the `cn` function for merging Tailwind classes safely.
* `vite.config.ts`: Vite configuration, including Tailwind integration and environment variable setup.
* `index.html`: The HTML template.

## How It Works

### 1. Map Initialization
The app uses an effect hook to check for the browser's Geolocation API. Once coordinates are retrieved (or defaults to Prague if denied), it initializes a Leaflet map attached to a container.

### 2. Search Functionality
Typing in the search bar triggers a debounced call (300ms) to the Mapy.cz Suggest API. Selecting a suggestion parses the coordinates from the response, updates the app's state, and recenters the map to the newly selected location.

### 3. Trip Planner Routing Logic
When the "Vytvořit trasu" (Generate Route) button is clicked:
1. **Radius Calculation:** The app calculates an appropriate search radius for the Overpass API based on the user's selected target distance.
2. **POI Search:** It sends a query to the Overpass API to find relevant tourist spots. If the API fails or returns no results, it generates a dummy "fallback" point.
3. **Route Calculation:** It sends the start coordinates (user location) and end coordinates (found POI) to the Mapy.cz Routing API, requesting GeoJSON output.
4. **Rendering:** The app parses the nested GeoJSON coordinate arrays, converts them to Leaflet's format, and draws a polyline on the map. It also places a custom marker at the destination.

## Setup and Installation

1. **Install Dependencies:**
   ```bash
   npm install
