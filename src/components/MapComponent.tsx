/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location } from '../types';
import MapHeader, { SuggestItem } from '../components/Header'; // ZDE UPRAV CESTU PODLE POTŘEBY

interface MapComponentProps {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  location: Location | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  initGeolocation: () => void;
  setShowSuggestions: (show: boolean) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  mapContainerRef,
  location,
  loading,
  error,
  setError,
  initGeolocation,
  setShowSuggestions
}) => {
  return (
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
  );
};
