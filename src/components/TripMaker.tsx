/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { RouteInfo, Location } from '../types';

interface TripMakerProps {
  targetDistance: number;
  setTargetDistance: (distance: number) => void;
  generateTouristRoute: () => void;
  isGeneratingRoute: boolean;
  location: Location | null;
  routeInfo: RouteInfo | null;
  clearRoute: () => void;
}

export const TripMaker: React.FC<TripMakerProps> = ({
  targetDistance,
  setTargetDistance,
  generateTouristRoute,
  isGeneratingRoute,
  location,
  routeInfo,
  clearRoute
}) => {
  return (
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
  );
};
