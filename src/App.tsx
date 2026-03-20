/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, LocateFixed, Loader2, AlertCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Mapy.cz API Key provided by user
const MAPY_CZ_API_KEY = 'AbZ0brnIi8jPKiCNZvqfJlhNd3dpMI4q-9oooZ6irDk';

// Fix for default Leaflet icon paths
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SuggestItem {
  name: string;
  label: string;
  position?: {
    lat: number;
    lon: number;
  };
  location?: {
    lat: number;
    lon: number;
  };
  type: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: any;
}

export default function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const poiMarkersRef = useRef<L.Marker[]>([]);
  
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Route generation states
  const [targetDistance, setTargetDistance] = useState(5); // km
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Initialize Geolocation
  const initGeolocation = useCallback(() => {
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setLocation(newLoc);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Geolocation error:", err);
          let msg = "Nepodařilo se získat polohu.";
          if (err.code === 1) msg = "Přístup k poloze byl zamítnut. Povolte prosím polohu v prohlížeči.";
          if (err.code === 3) msg = "Vypršel čas pro získání polohy.";
          
          setError(msg);
          // Default to Prague if we don't have any location yet
          if (!location) {
            setLocation({ lat: 50.0755, lon: 14.4378 });
          }
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Váš prohlížeč nepodporuje geolokaci.");
      setLocation({ lat: 50.0755, lon: 14.4378 });
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    initGeolocation();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (location && mapContainerRef.current && !mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current).setView([location.lat, location.lon], 13);
      
      // Add Mapy.cz REST Tiles
      L.tileLayer(`https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${MAPY_CZ_API_KEY}`, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.seznam.cz/">Seznam.cz, a.s.</a>'
      }).addTo(map);

      // Add marker
      const marker = L.marker([location.lat, location.lon]).addTo(map);
      
      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else if (location && mapInstanceRef.current && markerRef.current) {
      // Update map and marker if location changes (only if not in a route)
      if (!routeInfo) {
        mapInstanceRef.current.setView([location.lat, location.lon]);
        markerRef.current.setLatLng([location.lat, location.lon]);
      }
    }
  }, [location, routeInfo]);

  // Generate Tourist Route
  const generateTouristRoute = async () => {
    if (!location || !mapInstanceRef.current) return;
    
    setIsGeneratingRoute(true);
    setError(null);
    
    // Clear previous route and markers
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    poiMarkersRef.current.forEach(m => mapInstanceRef.current?.removeLayer(m));
    poiMarkersRef.current = [];
    setRouteInfo(null);

    try {
      // 1. Získání POI přes bezplatné Overpass API (OpenStreetMap)
      const searchRadius = Math.round((targetDistance * 1000) / 2.5); 
      const overpassQuery = `[out:json][timeout:5];
(
  node["tourism"~"viewpoint|museum|attraction"](around:${searchRadius},${location.lat},${location.lon});
  node["historic"~"castle|monument"](around:${searchRadius},${location.lat},${location.lon});
);
out 3;`;
      
      let selectedPois: any[] = [];

      try {
        const searchResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `data=${encodeURIComponent(overpassQuery)}`
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          selectedPois = searchData.elements || [];
        } else {
          console.warn("Overpass API vrátilo chybu:", searchResponse.status);
        }
      } catch (osmErr) {
        console.warn("Chyba spojení s OSM (pravděpodobně výpadek serveru nebo blokace):", osmErr);
      }

      // 2. ZÁLOŽNÍ PLÁN: Pokud je Overpass API přetížené nebo nic nenajde
      if (selectedPois.length === 0) {
        console.log("OSM nedostupné, používám vygenerovaný záložní bod pro ukázku trasy.");
        const offset = (targetDistance / 2) / 111; 
        selectedPois = [{
          lat: location.lat + offset,
          lon: location.lon + offset,
          tags: { name: "Cíl výletu (Záložní bod)" }
        }];
      }
      
    // 3. Spočítáme trasu přes spolehlivé Mapy.cz Routing API
      const targetDestination = selectedPois[0];

      const routeUrl = new URL('https://api.mapy.cz/v1/routing/route');
      routeUrl.searchParams.set('apikey', MAPY_CZ_API_KEY);
      routeUrl.searchParams.set('lang', 'cs');
      
      // KLÍČOVÁ OPRAVA: Musíme Mapy.cz donutit vrátit data jako GeoJSON objekt!
      routeUrl.searchParams.set('format', 'geojson'); 
      
      routeUrl.searchParams.set('start', `${location.lon},${location.lat}`);
      routeUrl.searchParams.set('end', `${targetDestination.lon},${targetDestination.lat}`);
      routeUrl.searchParams.set('routeType', 'foot_hiking'); 
      
      const routeResponse = await fetch(routeUrl.toString());
      if (!routeResponse.ok) {
        const errorText = await routeResponse.text();
        throw new Error(`Mapy API odmítlo trasu (Status: ${routeResponse.status}): ${errorText}`);
      }
      
      const routeData = await routeResponse.json();
      
      if (routeData.geometry) {
        // CHYTRÝ PÁTRAČ (Rekurzivní funkce), který najde souřadnice ať jsou zabalené jakkoliv
        const findCoordinates = (obj: any): any[] => {
          if (!obj) return [];
          
          if (Array.isArray(obj)) {
            if (obj.length === 0) return [];
            // Je to samotný bod?
            if (typeof obj[0] === 'number') return [obj];
            // Máme seznam bodů [lon, lat]?
            if (Array.isArray(obj[0]) && typeof obj[0][0] === 'number') return obj;
            
            // Pro případ rozdělených úseků (MultiLineString)
            let coords: any[] = [];
            obj.forEach((item: any) => { coords = coords.concat(findCoordinates(item)); });
            return coords;
          }
          
          // Prohledávání zanořených objektů (Feature, Geometry, GeometryCollection atd.)
          let coords: any[] = [];
          if (obj.geometry) coords = coords.concat(findCoordinates(obj.geometry));
          if (obj.coordinates) coords = coords.concat(findCoordinates(obj.coordinates));
          if (obj.features) coords = coords.concat(findCoordinates(obj.features));
          if (obj.geometries) coords = coords.concat(findCoordinates(obj.geometries));
          
          return coords;
        };

        const coordinates = findCoordinates(routeData.geometry);

        // Pokud to nenajde nic, vypíše přesnou strukturu do konzole F12
        if (coordinates.length === 0) {
          console.error("Záhadná struktura z Mapy.cz:", routeData);
          throw new Error("Nepodařilo se najít souřadnice. Otevřete konzoli prohlížeče (F12) pro detaily.");
        }

        // Dekódování geometrie pro Leaflet (GeoJSON vrací [lon, lat], Leaflet potřebuje [lat, lon])
        const latLngs = coordinates.map((c: any) => [c[1], c[0]]);
        
        // Vykreslení trasy na mapě
        const polyline = L.polyline(latLngs, { color: '#059669', weight: 6, opacity: 0.8 }).addTo(mapInstanceRef.current);
        routeLayerRef.current = polyline;
        
        // Vykreslení cílového bodu
        const m = L.marker([targetDestination.lat, targetDestination.lon], {
          icon: L.divIcon({
            className: 'bg-emerald-600 w-4 h-4 rounded-full border-2 border-white shadow-lg',
            iconSize: [16, 16]
          })
        }).addTo(mapInstanceRef.current!);
        
        const poiName = targetDestination.tags?.name || "Cíl výletu";
        m.bindPopup(`<b>${poiName}</b>`);
        poiMarkersRef.current.push(m);

        // Přiblížení na trasu
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        
        setRouteInfo({
          distance: routeData.length / 1000,
          duration: routeData.duration / 60,
          geometry: routeData.geometry
        });
      }
    } catch (err) {
      console.error("Route generation error:", err);
      setError("Nepodařilo se vygenerovat trasu. Zkontrolujte připojení k internetu.");
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const clearRoute = () => {
    if (mapInstanceRef.current) {
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      poiMarkersRef.current.forEach(m => mapInstanceRef.current?.removeLayer(m));
      poiMarkersRef.current = [];
      
      if (location) {
        mapInstanceRef.current.setView([location.lat, location.lon], 13);
      }
    }
    setRouteInfo(null);
  };

  // Handle Search Suggestions via REST API
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const url = `https://api.mapy.cz/v1/suggest?query=${encodeURIComponent(searchQuery)}&apikey=${MAPY_CZ_API_KEY}&lang=cs&limit=5`;
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.items || []);
        } else {
          console.error("Suggest API error response:", response.status);
        }
      } catch (err) {
        console.error("Suggest API fetch error:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: SuggestItem) => {
    let lat = item.position?.lat;
    let lon = item.position?.lon;

    if (lat === undefined || lon === undefined) {
      lat = item.location?.lat;
      lon = item.location?.lon;
    }

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      console.error("Vybraná položka z našeptávače neobsahuje platné souřadnice:", item);
      return;
    }

    const newLoc = { lat, lon };
    setLocation(newLoc);
    setSearchQuery(item.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && location) {
      mapInstanceRef.current.setView([location.lat, location.lon], 15);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans text-stone-900 overflow-hidden">
      {/* Header */}
      <header className="z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold tracking-tight">Mapy.cz REST</h1>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-widest">Moderní Mapy</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-1 max-w-md mx-4 relative">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
            <input 
              type="text"
              placeholder="Hledat místo..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100 border-none rounded-2xl py-3 pl-11 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-stone-500" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-none flex flex-col"
                  >
                    <span className="font-semibold text-sm text-stone-900">{item.name}</span>
                    <span className="text-xs text-stone-500 truncate">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={handleRecenter}
          disabled={!location}
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
        >
          <LocateFixed className="w-4 h-4" />
          <span className="hidden md:inline">Moje poloha</span>
        </button>
      </header>

      {/* Route Controls Overlay */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3 w-64">
        <div className="bg-white/90 backdrop-blur-md border border-stone-200 p-4 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            Plánovač výletu
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-stone-400 block mb-2">Cílová vzdálenost: {targetDistance} km</label>
              <input 
                type="range" 
                min="2" 
                max="30" 
                step="1"
                value={targetDistance}
                onChange={(e) => setTargetDistance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>2 km</span>
                <span>30 km</span>
              </div>
            </div>

            <button 
              onClick={generateTouristRoute}
              disabled={isGeneratingRoute || !location}
              className="w-full bg-emerald-600 text-white py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50"
            >
              {isGeneratingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Plánuji...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Vytvořit trasu
                </>
              )}
            </button>

            {routeInfo && (
              <button 
                onClick={clearRoute}
                className="w-full text-stone-500 text-xs font-medium hover:text-stone-700 transition-colors"
              >
                Zrušit trasu
              </button>
            )}
          </div>
        </div>

        {routeInfo && (
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-emerald-600 text-white p-4 rounded-3xl shadow-xl"
          >
            <p className="text-[10px] uppercase font-bold opacity-70 mb-2">Detaily trasy</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs block opacity-80">Délka</span>
                <span className="text-lg font-bold">{(routeInfo.distance || 0).toFixed(1)} km</span>
              </div>
              <div>
                <span className="text-xs block opacity-80">Čas (pěšky)</span>
                <span className="text-lg font-bold">{Math.round(routeInfo.duration)} min</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 relative" onClick={() => setShowSuggestions(false)}>
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-stone-50 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-stone-500 font-medium animate-pulse">Načítání mapy...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-xl"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-900 font-semibold text-sm">Upozornění</h3>
                <p className="text-amber-700 text-sm mt-1">{error}</p>
                <button 
                  onClick={initGeolocation}
                  className="mt-3 text-xs font-bold text-amber-800 underline hover:text-amber-900"
                >
                  Zkusit znovu získat polohu
                </button>
              </div>
              <button onClick={() => setError(null)} className="p-1 hover:bg-amber-100 rounded-full">
                <X className="w-4 h-4 text-amber-600" />
              </button>
            </motion.div>
          </div>
        )}

        {/* Leaflet Map Container */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full z-0"
        />

        {/* Location Info Card */}
        {location && !loading && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-2xl flex items-center gap-5">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-stone-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Aktuální poloha</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Zem. šířka</span>
                    <span className="font-mono text-sm font-medium">{(location.lat || 0).toFixed(6)}°</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Zem. délka</span>
                    <span className="font-mono text-sm font-medium">{(location.lon || 0).toFixed(6)}°</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer / Attribution */}
      <footer className="bg-stone-100 px-6 py-2 border-t border-stone-200 flex justify-between items-center">
        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tighter">
          Využívá REST API Mapy.cz & Leaflet
        </p>
        <div className="flex gap-4">
           <span className="text-[10px] text-stone-400 font-medium uppercase tracking-tighter">© Seznam.cz, a.s.</span>
        </div>
      </footer>
    </div>
  );
}