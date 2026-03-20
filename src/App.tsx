import { useState } from 'react';
import MapPage from './pages/map'; // Tvoje nová komponenta

export default function MainApp() {
  const [showMap, setShowMap] = useState(false);

  return (
    <div>
      {/* Tvoje hlavní obrazovka */}
      <h1>Tohle je hlavní obrazovka</h1>
      <button onClick={() => setShowMap(true)}>Otevřít mapu</button>

      {/* Vykreslení mapy jako samostatné vrstvy */}
      {showMap && (
        <MapPage onBack={() => setShowMap(false)} />
      )}
    </div>
  );
}