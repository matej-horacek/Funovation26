import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Swords, 
  Trophy, 
  Settings as SettingsIcon, 
  Sun, 
  Moon 
} from 'lucide-react';

export type TabType = 'map' | 'quests' | 'score' | 'settings';

interface MobileFooterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function MobileFooter({ activeTab, onTabChange }: MobileFooterProps) {
  // 1. Initialize state from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 2. The Logic: Watch for changes and toggle the CSS class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabType, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => onTabChange(isActive ? 'map' : tab)}
        className={`flex flex-col items-center justify-center w-full py-4 gap-1 transition-colors duration-200 z-50 ${
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
        <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
      </button>
    );
  };

  return (
    <>
      <AnimatePresence>
        {activeTab !== 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md p-4 flex flex-col justify-end pb-24"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card text-card-foreground shadow-2xl rounded-[2rem] border border-border p-8 overflow-y-auto max-w-lg mx-auto w-full h-fit max-h-[70vh]"
            >
              {activeTab === 'quests' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Swords className="text-primary" /> Quests</h2>
                  <p className="text-muted-foreground">Aktuálně nemáš žádné aktivní úkoly.</p>
                </div>
              )}

              {activeTab === 'score' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-3"><Trophy className="text-primary" /> Leaderboard</h2>
                  <p className="text-muted-foreground">Tvůj aktuální rank: #142</p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black flex items-center gap-3"><SettingsIcon className="text-primary" /> Nastavení</h2>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
                    <div className="flex items-center gap-3 font-bold">
                      {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      Dark Mode
                    </div>
                    <button 
                      onClick={() => setIsDark(!isDark)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${isDark ? 'bg-primary' : 'bg-stone-300'}`}
                    >
                      <span className={`h-5 w-5 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border flex justify-around items-center pb-[env(safe-area-inset-bottom)] z-[70] shadow-xl">
        <NavButton tab="map" icon={MapIcon} label="Mapa" />
        <NavButton tab="quests" icon={Swords} label="Quests" />
        <NavButton tab="score" icon={Trophy} label="Skóre" />
        <NavButton tab="settings" icon={SettingsIcon} label="Nastavení" />
      </footer>
    </>
  );
}