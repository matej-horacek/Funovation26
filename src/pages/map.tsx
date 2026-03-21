/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useTranslation } from 'react-i18next';

// --- INTERFACES ---
interface Route {
    routeId: number;
    waipoints: Waypoint[];
}

interface WaypointPlan {
    route: Route[];
    stats: {
        "teamA_km": "1.96",
        "teamB_km": "1.87"
    }
}

interface Waypoint {
    "id": number,
    "lat": number,
    "lon": number,
    "name": string,
    "locationType": string,
    "order": number
}

enum QuestType {
    Input,
    MultipleSelect,
    SingleSelect,
}

interface WaypointQuest {
    timeLimit: number;
    message: string;
    questType: QuestType;
    correctAnswers: string[];
    answerOptions: string[];
}

interface RouteWaypointQuest {
    routeId: number;
    routeWaypointQuests: WaypointQuests[];
}

interface WaypointQuests {
    waypoinId: number;
    waypointQuests: WaypointQuest[];
}

// --- IMPORTS ---
import MobileFooter, { TabType } from '../components/MobileFooter';
import Tutorial from '../components/tutorial'; 
// Make sure this path is correct for where you placed the mock data!
import { mockRoutes } from '../components/TripMaker'; 

const MAPY_CZ_API_KEY = 'AbZ0brnIi8jPKiCNZvqfJlhNd3dpMI4q-9oooZ6irDk';

// Fix for Leaflet marker icons in React/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPageProps {
  onBack?: () => void;
}

export default function MapPage({ onBack }: MapPageProps) {
  const { t } = useTranslation();

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routeLayerGroupRef = useRef<L.FeatureGroup | null>(null);

  // State
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [showTutorial, setShowTutorial] = useState(true); 
  const [currentRoute, setCurrentRoute] = useState<Route | null>(mockRoutes[0]); 

  const handleLogout = () => {
    setActiveTab('map'); 
    if (onBack) onBack();            
  };

  const initGeolocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
          setLoading(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          if (!location) setLocation({ lat: 50.0755, lon: 14.4378 }); // Default to Prague
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocation({ lat: 50.0755, lon: 14.4378 });
      setLoading(false);
    }
  }, [location]);

  // Trigger Geolocation on mount
  useEffect(() => {
    initGeolocation();
  }, [initGeolocation]);

  // 1. Map Initialization & User Location Tracker
  useEffect(() => {
    if (location && mapContainerRef.current && !mapInstanceRef.current) {
      // Create the map
      const map = L.map(mapContainerRef.current).setView([location.lat, location.lon], 13);
      L.tileLayer(`https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${MAPY_CZ_API_KEY}`, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.seznam.cz/">Seznam.cz, a.s.</a>'
      }).addTo(map);

      // Add the user's location marker
      const marker = L.marker([location.lat, location.lon]).addTo(map);
      mapInstanceRef.current = map;
      markerRef.current = marker;

    } else if (location && mapInstanceRef.current && markerRef.current) {
      // Update the user's marker position if they move
      markerRef.current.setLatLng([location.lat, location.lon]);
      
      // ONLY snap the camera back to the user's location if there is no active route
      // This stops the map from aggressively panning away from the trip!
      if (!currentRoute) {
        mapInstanceRef.current.setView([location.lat, location.lon]);
      }
    }
  }, [location, currentRoute]); 

  // 2. Route Drawing Logic
  // 2. Route Drawing Logic
  useEffect(() => {
    // If map isn't ready or there's no route, do nothing
    if (!mapInstanceRef.current || !currentRoute) return;

    const map = mapInstanceRef.current;

    // Clear the previous route if it exists
    if (routeLayerGroupRef.current) {
      map.removeLayer(routeLayerGroupRef.current);
    }

    // Create a new group to hold our lines and markers
    const routeGroup = L.featureGroup().addTo(map);
    routeLayerGroupRef.current = routeGroup;

    // Extract LatLngs for the Polyline
    const latlngs: L.LatLngExpression[] = currentRoute.waipoints
      .sort((a, b) => a.order - b.order) 
      .map(wp => [wp.lat, wp.lon]);

    // Draw the line connecting the waypoints
    L.polyline(latlngs, { 
      color: '#ef4444', // Changed line to Tailwind red-500 to match markers! (optional)
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10' 
    }).addTo(routeGroup);

    // Place markers for each waypoint
    currentRoute.waipoints.forEach((wp) => {
      
      // CREATE A CUSTOM HTML ICON
      const customIcon = L.divIcon({
        className: 'bg-transparent border-none', // Removes default Leaflet square background
        html: `
          <div style="
            background-color: #ef4444; /* Tailwind red-500 */
            color: white; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: bold; 
            border: 2px solid white; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          ">
            ${wp.order}
          </div>
        `,
        iconSize: [32, 32], // Exact size of the div
        iconAnchor: [16, 16], // Centers the point of the marker exactly on the lat/lng
        popupAnchor: [0, -16] // Makes the popup open just above the circle
      });

      // Pass the custom icon into the marker
      const marker = L.marker([wp.lat, wp.lon], { icon: customIcon }).addTo(routeGroup);
      
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${wp.order}. ${wp.name}</strong><br/>
          <span style="font-size: 12px; color: gray;">${wp.locationType}</span>
        </div>
      `);
    });

    // Fit the map to show the whole route smoothly
    if (latlngs.length > 0) {
      map.fitBounds(routeGroup.getBounds(), { padding: [50, 50] });
    }

  }, [currentRoute, location]);

  return (
    <div className="flex flex-col h-screen w-full absolute inset-0 bg-background text-foreground transition-colors duration-300 overflow-hidden z-50">
      
      <main className="flex-1 relative">
        <AnimatePresence>
          {/* Loader Overlay */}
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-background flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">
                {t('map.loading', 'Loading map...')}
              </p>
            </motion.div>
          )}

          {/* Tutorial Overlay */}
          {showTutorial && (
            <Tutorial onClose={() => setShowTutorial(false)} />
          )}
        </AnimatePresence>

        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </main>

      <MobileFooter 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
    </div>
  );
}