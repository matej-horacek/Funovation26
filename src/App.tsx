import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapPage from './pages/map'; 
// 1. Import your title screen component (adjust the path if needed)
import TitleScreen from './pages/titleScreen'; 

export default function App() {
  // 2. Add state to toggle the title screen
  const [showTitleScreen, setShowTitleScreen] = useState(true); 
  const [showMap, setShowMap] = useState(false);
  
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // 3. Conditionally render the title screen
  if (showTitleScreen) {
    // Pass a prop to the TitleScreen so it knows how to close itself
    return <TitleScreen onStart={() => setShowTitleScreen(false)} />;
  }

  // 4. Your main app content (renders after the title screen is closed)
  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
        <button onClick={() => changeLanguage('cs')} style={{ marginRight: '10px' }}>
          🇨🇿 Čeština
        </button>
        <button onClick={() => changeLanguage('en')} style={{ marginRight: '10px' }}>
          🇬🇧 English
        </button>
         <button onClick={() => changeLanguage('ua')}>
          🇺🇦 Ukrainian
        </button>
      </div>

      <h1>{t('home.main_title')}</h1>
      <button onClick={() => setShowMap(true)}>
        {t('home.open_map_button')}
      </button>

      {showMap && (
        <MapPage onBack={() => setShowMap(false)} />
      )}
    </div>
  );
}