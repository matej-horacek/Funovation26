import { useState } from 'react';
import { LocateFixed, Search, X, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Tento interface používáme pro našeptávač a exportujeme ho, aby ho mohl použít i hlavní soubor s mapou
export interface SuggestItem {
  name: string;
  label: string;
  position?: { lat: number; lon: number; };
  type: string;
}

interface MapHeaderProps {
  onBack?: () => void;
  hasLocation: boolean;
  handleRecenter: () => void;
  
  // Stavy pro první vyhledávač (Start)
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Stavy pro našeptávač
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  suggestions: SuggestItem[];
  handleSelectSuggestion: (item: SuggestItem) => void;
  
  // Stavy pro plánovač (Vzdálenost)
  targetDistance: number;
  setTargetDistance: (distance: number) => void;
}

export default function MapHeader({
  onBack,
  hasLocation,
  handleRecenter,
  searchQuery,
  setSearchQuery,
  clearSearch,
  showSuggestions,
  setShowSuggestions,
  suggestions,
  handleSelectSuggestion,
  targetDistance,
  setTargetDistance
}: MapHeaderProps) {
  // Lokální stavy pouze pro tuto hlavičku (zda je otevřená a text pro cíl)
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');

  return (
    <header className="z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm w-full shrink-0">
      
      {/* 1. TOP BAR - Vždy viditelný (obsahuje jen tlačítka) */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Tlačítko Domů */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-4 py-2 text-stone-700 bg-stone-100 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-medium shadow-sm active:scale-95"
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:block">Domů</span>
        </button>

        {/* Pravá část s ovládáním */}
        <div className="flex items-center gap-3">
          {/* Tlačítko pro aktuální pozici */}
          <button 
            onClick={handleRecenter}
            disabled={!hasLocation}
            className="p-2.5 bg-stone-100 text-stone-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
            title="Aktuální pozice"
          >
            <LocateFixed className="w-5 h-5" />
          </button>

          {/* Tlačítko pro rozbalení/skrytí panelu s vyhledávači */}
          <button 
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all text-sm font-medium shadow-md active:scale-95"
          >
            {isHeaderExpanded ? 'Skrýt hledání' : 'Hledat trasu'}
            {isHeaderExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. ROZBALOVACÍ ČÁST - (Zobrazí se jen po kliknutí na "Hledat trasu") */}
      <AnimatePresence>
        {isHeaderExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-stone-50/80 border-t border-stone-100"
          >
            <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* --- SEARCHBAR 1 (START) --- */}
              <div className="relative w-full group flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-500 mb-1.5 ml-1">Start / Aktuální místo</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                  <input 
                    type="text"
                    placeholder="Odkud vyrazíme?"
                    value={searchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-11 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-full transition-colors">
                      <X className="w-3 h-3 text-stone-500" />
                    </button>
                  )}
                </div>

                {/* Našeptávač pro Start */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-[72px] left-0 right-0 bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
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

              {/* --- SEARCHBAR 2 (CÍL) --- */}
              <div className="relative w-full group flex flex-col">
                <label className="text-[10px] uppercase font-bold text-stone-500 mb-1.5 ml-1">Cíl</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                  <input 
                    type="text"
                    placeholder="Kam to bude?"
                    value={destinationQuery}
                    onChange={(e) => setDestinationQuery(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-11 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                  />
                  {destinationQuery && (
                    <button onClick={() => setDestinationQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-full transition-colors">
                      <X className="w-3 h-3 text-stone-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* --- SLIDER (VZDÁLENOST) --- */}
              <div className="w-full bg-white px-5 py-3.5 border border-stone-200 rounded-2xl shadow-sm h-[46px] mt-[22px] flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500">Počet kilometrů</label>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 rounded-md">{targetDistance} km</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="30" 
                  step="1"
                  value={targetDistance}
                  onChange={(e) => setTargetDistance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}