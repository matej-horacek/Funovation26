/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X, Navigation, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SuggestItem, Location } from '../types';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions: SuggestItem[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  handleSelectSuggestion: (item: SuggestItem) => void;
  clearSearch: () => void;
  handleRecenter: () => void;
  location: Location | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  handleSelectSuggestion,
  clearSearch,
  handleRecenter,
  location
}) => {
  return (
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
  );
};
