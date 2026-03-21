import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapPage from './pages/map'; 

export default function App() {
  const [showMap, setShowMap] = useState(false);
  
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
        <button onClick={() => changeLanguage('cs')} style={{ marginRight: '10px' }}>
          🇨🇿 Čeština
        </button>
        <button onClick={() => changeLanguage('en')}>
          🇬🇧 English
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