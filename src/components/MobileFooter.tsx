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

export interface TeamScore {
  id: string | number;
  name: string;
  score: number;
}

const mockTeams: TeamScore[] = [
  { id: 1, name: 'Team Alpha', score: 2500 },
  { id: 2, name: 'Team Beta', score: 2150 },
  { id: 3, name: 'Team Gamma', score: 1800 },
  { id: 4, name: 'Team Delta', score: 1450 },
];

interface MobileFooterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  userTeamId?: string | number; 
}

export default function MobileFooter({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  userTeamId = 2 // Defaulting to 2 ("Team Beta") for the mock demonstration
}: MobileFooterProps) {
  
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'cs';

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [teams, setTeams] = useState<TeamScore[]>([]);

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

  useEffect(() => {
    if (activeTab === 'score') {
      const fetchLeaderboard = async () => {
        try {
          // TODO: Replace this empty block with your actual backend call
          /*
          const response = await fetch('/api/v1/teams/leaderboard');
          if (!response.ok) throw new Error('Failed to fetch leaderboard');
          const data = await response.json();
          setTeams(data);
          return;
          */
          
          throw new Error("Backend endpoint not implemented yet.");
        } catch (error) {
          console.error("Failed to load team leaderboard, using mock data.", error);
          setTeams(mockTeams);
        }
      };

      fetchLeaderboard();
    }
  }, [activeTab]);

  // --- Added Empty Backend Call for Adding Score ---
  const handleAddScore = async (teamId: string | number, points: number) => {
    try {
      // TODO: Replace this with your actual backend call
      /*
      const response = await fetch('/api/v1/teams/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, points }),
      });
      if (!response.ok) throw new Error('Failed to add score');
      */
      
      // Mock log to show it's working
      console.log(`[Mock Backend] Added ${points} points to team ${teamId}!`);
    } catch (error) {
      console.error("Failed to update score on the backend.", error);
    }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: TabType, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => onTabChange(isActive ? 'map' : tab)}
        className={`flex flex-col items-center justify-center w-full py-4 gap-1 transition-all duration-300 ${
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
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-xl p-4 flex flex-col justify-end pb-28"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground shadow-[0_-20px_60px_rgba(0,0,0,0.3)] rounded-[2.5rem] border border-border p-6 sm:p-8 flex flex-col max-w-lg mx-auto w-full h-fit max-h-[85vh]"
            >
              {/* --- Quests Tab --- */}
              {activeTab === 'quests' && (
                <div className="h-[65vh] sm:h-[70vh] w-full">
                  <QuestCard 
                    quest={mockQuest} 
                    onFinished={async (win) => {
                      console.log(win ? t('quests.won') : t('quests.lost'));
                      
                      // --- Call the score update method if the player wins ---
                      if (win) {
                        // Assuming a successful quest gives 150 points. Change this as needed!
                        await handleAddScore(userTeamId, 150);
                      }

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
                    {teams.map((team, index) => {
                        const isUserTeam = team.id === userTeamId;
                        
                        return (
                          <div 
                            key={team.id} 
                            className={`flex justify-between items-center p-5 rounded-2xl border font-bold transition-all ${
                              isUserTeam 
                                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] scale-[1.02]' 
                                : 'bg-secondary/50 border-border'
                            }`}
                          >
                              <span className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isUserTeam ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                                  }`}>
                                    #{index + 1}
                                  </span>
                                  {team.name}
                                  {isUserTeam && (
                                    <span className="text-[10px] uppercase tracking-wider opacity-70 ml-1">
                                      {t('leaderboard.you', '(You)')}
                                    </span>
                                  )}
                              </span>
                              <span className={`${isUserTeam ? 'font-black' : 'text-primary font-black'}`}>
                                {team.score} {t('leaderboard.points')}
                              </span>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}

              {/* --- Settings Tab --- */}
              {activeTab === 'settings' && (
                <div className="overflow-y-auto pr-2 space-y-8 w-full">
                  <h2 className="text-3xl font-black flex items-center gap-3">
                    <SettingsIcon className="text-primary w-8 h-8" /> {t('settings.title')}
                  </h2>
                  
                  <div className="flex flex-col gap-3">
                    
                    {/* --- Language Selection --- */}
                    <div className="flex flex-col gap-4 p-5 bg-secondary/50 rounded-2xl border border-border">
                        <div className="flex items-center gap-3 font-bold">
                            <Globe className="w-5 h-5 text-primary" />
                            {t('settings.language')}
                        </div>
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={() => i18n.changeLanguage('cs')}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all active:scale-95 ${
                                    currentLang === 'cs' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                CZ
                            </button>
                            <button 
                                onClick={() => i18n.changeLanguage('en')}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all active:scale-95 ${
                                    currentLang === 'en' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => i18n.changeLanguage('ua')}
                                className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all active:scale-95 ${
                                    currentLang === 'ua' 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'bg-background hover:bg-muted border border-border text-muted-foreground'
                                }`}
                            >
                                UA
                            </button>
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-5 bg-secondary/50 rounded-2xl border border-border">
                        <div className="flex items-center gap-3 font-bold">
                            {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                            {t('settings.darkMode')}
                        </div>
                        <button 
                            onClick={() => setIsDark(!isDark)}
                            className={`relative h-7 w-12 rounded-full transition-all duration-300 ${isDark ? 'bg-primary' : 'bg-stone-300'}`}
                        >
                            <span className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-all duration-300 ${isDark ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button 
                      className="w-full flex items-center justify-between p-5 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 font-black active:scale-95 transition-all group hover:bg-destructive/20"
                      onClick={onLogout} 
                      >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                        {t('settings.logout')}
                      </div>
                      <span className="text-[10px] opacity-50 uppercase tracking-widest">Exit Game</span>
                  </button> 
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer Navigation --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border flex justify-around items-center pb-[env(safe-area-inset-bottom)] z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <NavButton tab="map" icon={MapIcon} label={t('navigation.map')} />
        <NavButton tab="quests" icon={Swords} label={t('navigation.quests')} />
        <NavButton tab="score" icon={Trophy} label={t('navigation.score')} />
        <NavButton tab="settings" icon={SettingsIcon} label={t('navigation.settings')} />
      </footer>
    </>
  );
}