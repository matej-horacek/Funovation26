import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Timer } from 'lucide-react';

// 1. Přidáme import pro překlady
import { useTranslation } from 'react-i18next';

export enum QuestType {
  Input = 0,
  MultipleSelect = 1,
  SingleSelect = 2,
}

export interface WaypointQuest {
  timeLimit: number;
  message: string;
  questType: QuestType;
  correctAnswers: string[];
  answerOptions: string[];
}

interface QuestComponentProps {
  quest: WaypointQuest;
  onFinished: (isCorrect: boolean, score: number) => void; 
}

export default function QuestDisplay({ quest, onFinished }: QuestComponentProps) {
  // 2. Inicializujeme hook 't'
  const { t } = useTranslation();

  const [timeLeft, setTimeLeft] = useState(quest.timeLimit);
  const [selected, setSelected] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const [earnedScore, setEarnedScore] = useState<number>(0);

  const colors = [
    'bg-red-500 hover:bg-red-600', 
    'bg-blue-500 hover:bg-blue-600', 
    'bg-amber-500 hover:bg-amber-600', 
    'bg-emerald-500 hover:bg-emerald-600'
  ];

  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted) {
      handleFinalResult(false);
    }
  }, [timeLeft, isSubmitted]);

  const calculateScore = (correct: boolean, timeRemaining: number) => {
    if (!correct) return 0;
    
    const BASE_SCORE = 500;
    const MAX_TIME_BONUS = 500;
    
    const timeRatio = timeRemaining / quest.timeLimit;
    
    return BASE_SCORE + Math.round(MAX_TIME_BONUS * timeRatio);
  };

  const handleFinalResult = (correct: boolean) => {
    const finalScore = calculateScore(correct, timeLeft);
    
    setEarnedScore(finalScore);
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    setTimeout(() => onFinished(correct, finalScore), 2500); 
  };

  const handleToggleOption = (option: string) => {
    if (isSubmitted) return;

    if (quest.questType === QuestType.SingleSelect) {
      setSelected([option]);
      const correct = quest.correctAnswers.includes(option);
      handleFinalResult(correct);
    } else {
      setSelected((prev) => 
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    }
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    let correct = false;
    if (quest.questType === QuestType.Input) {
      correct = quest.correctAnswers.some(
        (a) => a.toLowerCase() === inputValue.toLowerCase().trim()
      );
    } else if (quest.questType === QuestType.MultipleSelect) {
      correct = 
        selected.length === quest.correctAnswers.length && 
        selected.every((val) => quest.correctAnswers.includes(val));
    }

    handleFinalResult(correct);
  };

  return (
    <>
      <div className="flex flex-col h-full w-full gap-4 sm:gap-6 relative">
        
        {/* --- Top Bar --- */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-white text-sm ${
            timeLeft < 5 ? 'bg-destructive animate-pulse' : 'bg-primary'
          }`}>
            <Timer className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
            {/* Překlad enumu! (Vezme např. 'SingleSelect' a najde to v JSONu) */}
            {t(`quest_types.${QuestType[quest.questType]}`)}
          </span>
        </div>

        {/* --- Question Area --- */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
          {/* Note: quest.message is dynamic data from your API/Mock, so we don't translate it here unless your API sends translation keys! */}
          <h3 className="text-xl sm:text-3xl font-black leading-tight text-center text-foreground tracking-tighter line-clamp-4 px-2">
            {quest.message}
          </h3>
        </div>

        {/* --- Answer Area --- */}
        <div className="flex-[2] flex flex-col min-h-0 w-full gap-3">
          {quest.questType === QuestType.Input ? (
            <div className="flex flex-col h-full justify-center gap-4">
              <input 
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSubmitted}
                className="w-full p-4 text-lg font-bold bg-secondary rounded-2xl border-4 border-transparent focus:border-primary outline-none"
                placeholder={t('quests.answer_placeholder')}
              />
              <button onClick={handleSubmit} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all">
                {t('quests.submit_input')}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-4 flex-1 min-h-0 w-full">
                {/* Note: quest.answerOptions are also dynamic data from your backend! */}
                {quest.answerOptions.map((opt, i) => {
                  const isSelected = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleToggleOption(opt)}
                      disabled={isSubmitted}
                      className={`
                        relative w-full h-full p-3 sm:p-6 flex items-center justify-center text-center rounded-2xl transition-all active:scale-95 overflow-hidden
                        ${isSelected ? 'ring-2 sm:ring-4 ring-foreground shadow-xl z-10 scale-[0.98]' : 'opacity-95 shadow-md hover:scale-[1.02]'}
                        ${colors[i % colors.length]}
                      `}
                    >
                      <span className="text-white font-black text-sm sm:text-xl relative z-10 drop-shadow-md break-words line-clamp-3">
                        {opt}
                      </span>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-white/90 drop-shadow-md">
                          <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {quest.questType === QuestType.MultipleSelect && selected.length > 0 && (
                <button 
                  onClick={handleSubmit} 
                  className="flex-shrink-0 w-full py-3 sm:py-4 bg-foreground text-background rounded-xl font-black text-sm sm:text-lg shadow-lg active:scale-95 transition-all"
                >
                  {t('quests.submit_selection')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- Fullscreen Feedback Overlay --- */}
      <AnimatePresence>
        {isSubmitted && isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-white backdrop-blur-md ${
              isCorrect ? 'bg-emerald-500/95' : 'bg-red-500/95'
            }`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="bg-white/20 p-8 rounded-full mb-8 shadow-2xl"
            >
              {isCorrect ? (
                <CheckCircle2 className="w-24 h-24 sm:w-32 sm:h-32 text-white drop-shadow-lg" />
              ) : (
                <XCircle className="w-24 h-24 sm:w-32 sm:h-32 text-white drop-shadow-lg" />
              )}
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-7xl font-black tracking-tighter drop-shadow-xl text-center"
            >
              {isCorrect ? t('quests.correct') : t('quests.incorrect')}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-xl sm:text-2xl font-bold opacity-90 tracking-wide text-center"
            >
              {isCorrect ? t('quests.good_job') : t('quests.better_luck')}
            </motion.p>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.5 }}
              className="mt-8 bg-black/20 px-8 py-4 rounded-3xl backdrop-blur-sm border border-white/20 shadow-inner"
            >
              <p className="text-4xl sm:text-6xl font-black tracking-widest text-center text-white drop-shadow-md flex items-baseline gap-2">
                {isCorrect ? `+${earnedScore}` : '0'} 
                <span className="text-xl sm:text-3xl opacity-80">pts</span>
              </p>
            </motion.div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}