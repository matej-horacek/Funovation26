import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Swords, 
  Trophy, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  LogOut,
  Globe
} from 'lucide-react';
import QuestCard, { QuestType, WaypointQuest } from './QuestDisplay';

// 1. Import the translation hook
import { useTranslation } from 'react-i18next';

export type TabType = 'map' | 'quests' | 'score' | 'settings';

const mockQuest: WaypointQuest = {
  timeLimit: 15,
  message: "Jaká je oblíbená Daň Daniela Danitele z Daňovic pod Daní?",
  questType: QuestType.SingleSelect,
  answerOptions: ["Daň", "Daň z Danění", "ZaDání", "Daněk"],
  correctAnswers: ["Daň z Danění"]
};

interface MobileFooterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}
export default function MobileFooter({ activeTab, onTabChange, onLogout }: MobileFooterProps) {
  // 2. Initialize translations and get access to the current language
  const { t, i18n } = useTranslation();
  
  // Get the active language so we can highlight the correct button ('cs', 'en', or 'uk')
  // i18n uses 'cs' for Czech, so we check against that.
  const currentLang = i18n.language || 'cs';

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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
        type="button"
        onClick={() => onTabChange(isActive ? 'map' : tab)}
        className={`flex cursor-pointer flex-col items-center justify-center w-full py-4 gap-1 transition-all duration-300 touch-manipulation ${
          isActive ? 'text-primary scale-110 font-black' : 'text-muted-foreground active:scale-95'
        }`}
      >
        <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold">{label}</span>
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
            onClick={() => onTabChange('map')}
            className="fixed inset-0 z-[2100] bg-background/60 backdrop-blur-xl p-4 flex flex-col justify-end pb-28"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-card text-card-foreground shadow-[0_-20px_60px_rgba(0,0,0,0.3)] rounded-[2.5rem] border border-border p-6 sm:p-8 flex flex-col max-w-lg mx-auto w-full h-fit max-h-[85vh]"
            >
              {/* --- Quests Tab --- */}
              {activeTab === 'quests' && (
                <div className="h-[65vh] sm:h-[70vh] w-full">
                  <QuestCard 
                    quest={mockQuest} 
                    onFinished={(win) => {
                      // Translated the console logs just in case!
                      console.log(win ? t('quests.won') : t('quests.lost'));
                      onTabChange('map');
                    }} 
                  />
                </div>
              )}

              {/* --- Score Tab --- */}
              {activeTab === 'score' && (
                <div className="overflow-y-auto pr-2 space-y-6 w-full">
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <Trophy className="text-primary w-8 h-8" /> {t('leaderboard.title')}
                  </h2>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between items-center p-5 bg-secondary/50 rounded-2xl border border-border font-bold">
                            <span className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">#{i}</span>
                                {t('leaderboard.player')} {i}
                            </span>
                            <span className="text-primary font-black">{2500 - (i * 350)} {t('leaderboard.points')}</span>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- Settings Tab --- */}
              {activeTab === 'settings' && (
                <div className="w-full space-y-6 overflow-y-auto pr-1 sm:pr-2">
                  <h2 className="flex items-center gap-3 text-2xl font-black sm:text-3xl">
                    <SettingsIcon className="h-7 w-7 text-primary sm:h-8 sm:w-8" /> {t('settings.title')}
                  </h2>
                  
                  <div className="flex flex-col gap-3">
                    
                    {/* --- Language Selection --- */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/50 p-4 sm:p-5">
                        <div className="flex items-center gap-3 font-bold">
                            <Globe className="w-5 h-5 text-primary" />
                            {t('settings.language')}
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                            {/* We use i18n.changeLanguage() directly now */}
                            <button 
                                type="button"
                                onClick={() => i18n.changeLanguage('cs')}
                                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                                    currentLang === 'cs' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                {t('language.cs')}
                            </button>
                            <button 
                                type="button"
                                onClick={() => i18n.changeLanguage('en')}
                                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                                    currentLang === 'en' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                {t('language.en')}
                            </button>
                            <button 
                                type="button"
                                onClick={() => i18n.changeLanguage('ua')}
                                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                                    currentLang === 'ua' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                {t('language.ua')}
                            </button>
                            <button 
                                type="button"
                                onClick={() => i18n.changeLanguage('emoji')}
                                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
                                    currentLang === 'emoji' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                {t('language.emoji')}
                            </button>
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/50 p-4 sm:p-5">
                        <div className="flex items-center gap-3 font-bold">
                            {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                            {t('settings.darkMode')}
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsDark(!isDark)}
                            className={`relative h-7 w-12 rounded-full transition-all duration-300 ${isDark ? 'bg-primary' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-all duration-300 ${isDark ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button 
                      type="button"
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 font-black text-destructive transition-all active:scale-95 hover:bg-destructive/20 sm:p-5"
                      onClick={onLogout} // <--- Call the prop here
                      >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                        {t('settings.logout')}
                      </div>
                      <span className="text-right text-[10px] uppercase tracking-widest opacity-50">Exit Game</span>
                  </button> 
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer Navigation --- */}
      <footer className="fixed bottom-0 left-0 right-0 z-[2200] flex justify-around items-center border-t border-border bg-background/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] backdrop-blur-lg pointer-events-auto touch-manipulation">
        <NavButton tab="map" icon={MapIcon} label={t('navigation.map')} />
        <NavButton tab="quests" icon={Swords} label={t('navigation.quests')} />
        <NavButton tab="score" icon={Trophy} label={t('navigation.score')} />
        <NavButton tab="settings" icon={SettingsIcon} label={t('navigation.settings')} />
      </footer>
    </>
  );
}
