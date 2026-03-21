import React, { useState, useEffect, useRef } from 'react';

// It's usually better to keep this in a config file, but keeping it here as per your snippet
const MAPY_API_KEY = 'AbZ0brnIi8jPKiCNZvqfJlhNd3dpMI4q-9oooZ6irDk';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export default function AutocompleteInput({ value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapy.cz/v1/suggest?query=${encodeURIComponent(value)}&apikey=${MAPY_API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.items || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Suggest error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative w-full group">
      {/* --- Text Input --- */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        placeholder={placeholder}
        className="w-full p-2.5 rounded-md border border-border bg-background text-foreground 
                   placeholder:text-muted-foreground focus:ring-2 focus:ring-primary 
                   focus:border-primary outline-none transition-all shadow-sm"
      />
      
      {/* --- Suggestions Dropdown --- */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1.5 z-[100] 
                        bg-card border border-border rounded-radius shadow-xl 
                        max-h-[240px] overflow-y-auto overflow-x-hidden
                        backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          
          {suggestions.map((item, index) => (
            <div
              key={index}
              className="px-4 py-3 cursor-pointer border-b border-border/50 last:border-0 
                         hover:bg-primary/10 hover:text-primary transition-colors flex flex-col gap-0.5"
              onClick={() => {
                onChange(item.name);
                setShowSuggestions(false);
              }}
            >
              <span className="font-bold text-sm tracking-tight truncate">
                {item.name}
              </span>
              {item.location && (
                <span className="text-[10px] uppercase font-medium opacity-60 truncate">
                  {item.location}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}