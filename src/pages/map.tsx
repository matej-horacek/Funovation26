/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// 1. IMPORT THE HOOK
import { useTranslation } from 'react-i18next';


interface Route{
    routeId: number;
    waipoints: Waypoint[];
}

interface WaypointPlan{
    route: Route[];
    stats: {
        "teamA_km": "1.96",
        "teamB_km": "1.87"
    }

}

interface Waypoint{
    "id": number,
    "lat": number,
    "lon": number,
    "name": string,
    "locationType": string,
    "order": number
}

enum QuestType{
    Input,
    MultipleSelect,
    SingleSelect,
}

interface WaypointQuest{
    timeLimit: number;
    message:string;
    questType: QuestType;
    correctAnswers:string[];
    answerOptions:string[];
}

interface RouteWaypointQuest{
    routeId: number;
    routeWaypointQuests : WaypointQuests[];
}

interface WaypointQuests{
    waypoinId: number;
    waypointQuests : WaypointQuest[];
}

// Import your new components
import MobileFooter, { TabType } from '../components/MobileFooter';

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
  // 2. INITIALIZE THE TRANSLATION FUNCTION
  const { t } = useTranslation();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('map');

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

  useEffect(() => {
    initGeolocation();
  }, [initGeolocation]);

  useEffect(() => {
    if (location && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([location.lat, location.lon], 13);
      L.tileLayer(`https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${MAPY_CZ_API_KEY}`, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.seznam.cz/">Seznam.cz, a.s.</a>'
      }).addTo(map);

      const marker = L.marker([location.lat, location.lon]).addTo(map);
      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else if (location && mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([location.lat, location.lon]);
      markerRef.current.setLatLng([location.lat, location.lon]);
    }
  }, [location]);

  return (
    <div className="flex flex-col h-screen w-full absolute inset-0 bg-background text-foreground transition-colors duration-300 overflow-hidden z-50">
      
      <main className="flex-1 relative">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-background flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              {/* 3. REPLACE HARDCODED TEXT WITH t() */}
              <p className="text-muted-foreground font-medium animate-pulse">
                {t('map.loading')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </main>

      {/* Logic for Dark Mode and Overlays is now inside here */}
      <MobileFooter activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}