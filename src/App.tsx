import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, RefreshCw, Info, Compass, Map as MapIcon, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';

// --- CONFIGURATION ---
// If you are exporting this app to run locally, paste your Google Maps API Key here.
// In AI Studio, it is recommended to use the Secrets panel (GOOGLE_MAPS_PLATFORM_KEY).
const EXPORT_API_KEY = 'AIzaSyAxoD1FwSnMcV-9WnpLzUitRtntUvH4NDA'; 

const API_KEY = EXPORT_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== '';

// --- Components ---

function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-stone-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-stone-200">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-2xl">
            <MapIcon className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-2">Google Maps API Key Required</h2>
        <p className="text-stone-600 text-center mb-8">To start weaving your hikes, you'll need to connect your Google Maps API key.</p>
        
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500">1</div>
            <div className="text-stone-700">
              <p>Get an API Key from the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-emerald-600 hover:underline font-medium">Google Cloud Console</a>.</p>
              <p className="mt-2 text-xs text-stone-500 font-medium uppercase tracking-wider">Required APIs to Enable:</p>
              <ul className="list-disc list-inside text-xs text-stone-500 mt-1">
                <li>Maps JavaScript API</li>
                <li>Places API (New)</li>
                <li>Routes API</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500">2</div>
            <div className="text-stone-700">
              <p className="mb-2">Add your key as a secret in AI Studio:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-stone-500">
                <li>Open <strong>Settings</strong> (⚙️ gear icon)</li>
                <li>Select <strong>Secrets</strong></li>
                <li>Name: <code className="bg-stone-100 px-1 rounded text-stone-900">GOOGLE_MAPS_PLATFORM_KEY</code></li>
                <li>Value: Paste your key</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h4 className="text-xs font-bold text-amber-800 uppercase mb-1">Seeing "ApiNotActivatedMapError"?</h4>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            This means your API key is working, but the <strong>Maps JavaScript API</strong> isn't enabled yet. 
            Go to the <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" rel="noopener" className="underline font-bold">API Library</a> and click "Enable" for the three APIs listed above.
          </p>
        </div>
      </div>
    </div>
  );
}

function RouteDisplay({ origin, waypoints, onRouteCalculated }: { 
  origin: google.maps.LatLngLiteral, 
  waypoints: google.maps.LatLngLiteral[],
  onRouteCalculated: (distance: number, duration: number) => void
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || waypoints.length === 0) return;

    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));

    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(0, -1);

    (routesLib as any).Route.computeRoutes({
      origin: origin,
      destination: destination,
      intermediates: intermediateWaypoints.map(wp => ({ location: { latLng: wp } })),
      travelMode: 'WALKING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }: { routes: any[] }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach((p: any) => p.setMap(map));
        polylinesRef.current = newPolylines;
        
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport, 50);
        }
        
        onRouteCalculated(
          routes[0].distanceMeters / 1000, 
          Math.round(routes[0].durationMillis / 60000)
        );
      }
    }).catch(err => {
      console.error("Route calculation failed:", err);
      // Fallback: if intermediates fail, try a simple direct route
      if (intermediateWaypoints.length > 0) {
        (routesLib as any).Route.computeRoutes({
          origin: origin,
          destination: destination,
          travelMode: 'WALKING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        }).then(({ routes }: { routes: any[] }) => {
          if (routes?.[0]) {
            const newPolylines = routes[0].createPolylines();
            newPolylines.forEach((p: any) => p.setMap(map));
            polylinesRef.current = newPolylines;
            onRouteCalculated(routes[0].distanceMeters / 1000, Math.round(routes[0].durationMillis / 60000));
          }
        });
      }
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, waypoints, onRouteCalculated]);

  return null;
}

function HikeWeaver() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationName, setLocationName] = useState<string>("Detecting location...");
  const [targetDistance, setTargetDistance] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [spots, setSpots] = useState<google.maps.places.Place[]>([]);
  const [hikeWaypoints, setHikeWaypoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [actualDistance, setActualDistance] = useState<number | null>(null);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<google.maps.places.Place | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Get user location
  const detectLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLocationName("Detecting...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setLocationName("Current Location");
          map?.panTo(loc);
          map?.setZoom(14);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationName("Location blocked. Please search below.");
        },
        { timeout: 10000 }
      );
    } else {
      setLocationName("Geolocation not supported.");
    }
  }, [map]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Initialize Autocomplete for manual location setting
  useEffect(() => {
    if (!placesLib || !autocompleteRef.current) return;
    
    // Clear existing
    autocompleteRef.current.innerHTML = '';
    
    const el = new (placesLib as any).PlaceAutocompleteElement();
    // Styling the web component via shadow DOM is hard, so we wrap it
    autocompleteRef.current.appendChild(el);

    el.addEventListener('gmp-select', async (e: any) => {
      const place = e.placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'location', 'formattedAddress'] });
      
      if (place.location) {
        const loc = {
          lat: place.location.lat(),
          lng: place.location.lng()
        };
        setUserLocation(loc);
        setLocationName(place.displayName || "Selected Location");
        map?.panTo(loc);
        map?.setZoom(14);
      }
    });

    return () => {
      if (autocompleteRef.current) autocompleteRef.current.innerHTML = '';
    };
  }, [placesLib, map]);

  const generateHike = useCallback(async () => {
    if (!placesLib || !userLocation) return;
    
    setIsGenerating(true);
    setActualDistance(null);
    setActualDuration(null);
    setHikeWaypoints([]);
    
    try {
      const searchRadius = (targetDistance * 1000) / 1.5; 
      
      const { places } = await placesLib.Place.searchNearby({
        locationRestriction: { center: userLocation, radius: Math.min(searchRadius, 50000) },
        includedPrimaryTypes: ['tourist_attraction', 'park', 'museum', 'hiking_area', 'national_park', 'historical_landmark'],
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'photos', 'types'],
        maxResultCount: 20,
      });

      if (!places || places.length === 0) {
        alert("No interesting spots found nearby. Try a different location or distance.");
        setIsGenerating(false);
        return;
      }

      const shuffled = [...places].sort(() => 0.5 - Math.random());
      const numSpots = Math.min(shuffled.length, 4);
      const selectedSpots = shuffled.slice(0, numSpots);
      
      setSpots(selectedSpots);
      setHikeWaypoints(selectedSpots.map(s => {
        const loc = s.location as any;
        return { lat: loc.lat(), lng: loc.lng() };
      }));
      
    } catch (error) {
      console.error("Hike generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [placesLib, userLocation, targetDistance]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-stone-200 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Hike Weaver</h1>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Starting Point
                </label>
                <button 
                  onClick={detectLocation}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  Locate Me
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600 flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", userLocation ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                  <span className="truncate flex-1">{locationName}</span>
                </div>
                
                <div className="relative">
                  <div ref={autocompleteRef} className="gmp-autocomplete-container" />
                  <p className="text-[10px] text-stone-400 mt-1 italic">Search for a place if location is blocked.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Desired Distance (km)
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="0.5"
                  value={targetDistance}
                  onChange={(e) => setTargetDistance(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="text-lg font-mono font-bold text-stone-900 w-12 text-right">
                  {targetDistance}
                </span>
              </div>
            </div>

            <button
              onClick={generateHike}
              disabled={isGenerating || !userLocation}
              className={cn(
                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                isGenerating || !userLocation
                  ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              )}
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              {isGenerating ? "Weaving..." : "Generate Hike"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actualDistance !== null && (
            <div className="bg-stone-900 text-white p-5 rounded-3xl shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Total Distance</p>
                  <p className="text-2xl font-mono font-bold">{actualDistance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Est. Duration</p>
                  <p className="text-2xl font-mono font-bold">{actualDuration} min</p>
                </div>
              </div>
            </div>
          )}

          {spots.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Stops on your hike</h3>
              {spots.map((spot, idx) => (
                <button
                  key={spot.id}
                  onClick={() => {
                    setSelectedSpot(spot);
                    if (spot.location) map?.panTo(spot.location);
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 group",
                    selectedSpot?.id === spot.id
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-stone-100 hover:border-stone-200"
                  )}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
                      {spot.displayName}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{spot.formattedAddress}</p>
                    {spot.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-[10px] font-bold text-stone-400">{spot.rating}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 mt-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <Compass className="w-12 h-12 mb-4 text-stone-300" />
              <p className="text-sm text-stone-500 italic">Set your distance and click generate to weave a new adventure.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          defaultCenter={{ lat: 37.42, lng: -122.08 }}
          defaultZoom={13}
          mapId="HIKE_WEAVER_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="You are here">
              <div className="relative">
                <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-pulse" />
                <div className="w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {spots.map((spot, idx) => (
            <AdvancedMarker
              key={spot.id}
              position={spot.location}
              onClick={() => setSelectedSpot(spot)}
            >
              <div className="relative group">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-xl transition-all",
                  selectedSpot?.id === spot.id ? "bg-emerald-600 scale-125 z-20" : "bg-stone-900 group-hover:scale-110"
                )}>
                  <span className="text-white text-xs font-bold">{idx + 1}</span>
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedSpot && selectedSpot.location && (
            <InfoWindow
              position={selectedSpot.location}
              onCloseClick={() => setSelectedSpot(null)}
              headerDisabled
            >
              <div className="p-1 max-w-[200px]">
                {selectedSpot.photos?.[0] && (
                  <img 
                    src={selectedSpot.photos[0].getURI({ maxWidth: 200 })} 
                    alt={selectedSpot.displayName}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                    referrerPolicy="no-referrer"
                  />
                )}
                <h4 className="font-bold text-stone-900 text-sm leading-tight mb-1">{selectedSpot.displayName}</h4>
                <p className="text-[10px] text-stone-500 leading-snug mb-2">{selectedSpot.formattedAddress}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSpot.types?.slice(0, 2).map(type => (
                    <span key={type} className="text-[8px] px-1.5 py-0.5 bg-stone-100 rounded-full text-stone-500 uppercase tracking-wider font-bold">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </InfoWindow>
          )}

          {userLocation && hikeWaypoints.length > 0 && (
            <RouteDisplay 
              origin={userLocation} 
              waypoints={hikeWaypoints} 
              onRouteCalculated={(dist, dur) => {
                setActualDistance(dist);
                setActualDuration(dur);
              }}
            />
          )}
        </Map>
      </div>
    </div>
  );
}

export default function App() {
  if (!hasValidKey) {
    return <SplashScreen />;
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <HikeWeaver />
    </APIProvider>
  );
}