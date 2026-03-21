/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Added 'Compass' for the welcome screen
import { X, MapPin, Map, Swords, Trophy, Settings, Compass } from 'lucide-react'; 
import { useTranslation } from 'react-i18next';

interface TutorialProps {
  onClose: () => void;
}

export default function Tutorial({ onClose }: TutorialProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  // Added the Welcome step at the very beginning
  const steps = [
    {
      id: 'welcome',
      icon: Compass, 
      iconColor: 'text-primary',
      title: t('tutorial.welcome.title', 'Welcome to the Game!'),
      description: t('tutorial.welcome.desc', 'Get ready to explore, find hidden waypoints, and complete quests. Let\'s take a quick tour of how things work.'),
    },
    {
      id: 'marker',
      icon: MapPin,
      iconColor: 'text-blue-500', 
      title: t('tutorial.marker.title', 'Your Location'),
      description: t('tutorial.marker.desc', 'This blue cursor shows your current location on the map. Move around to explore and reach your targets!'),
    },
    {
      id: 'map',
      icon: Map,
      iconColor: 'text-primary',
      title: t('tutorial.map.title', 'Map (Mapa)'),
      description: t('tutorial.map.desc', 'Tap this to return to the main map view at any time to see your surroundings and waypoints.'),
    },
    {
      id: 'quests',
      icon: Swords, 
      iconColor: 'text-primary',
      title: t('tutorial.quests.title', 'Quests (Úkoly)'),
      description: t('tutorial.quests.desc', 'Check your active tasks, answer questions, and complete challenges at specific locations.'),
    },
    {
      id: 'score',
      icon: Trophy,
      iconColor: 'text-primary',
      title: t('tutorial.score.title', 'Score (Skóre)'),
      description: t('tutorial.score.desc', 'Track your progress, view your accumulated points, and see how well you are doing.'),
    },
    {
      id: 'settings',
      icon: Settings,
      iconColor: 'text-primary',
      title: t('tutorial.settings.title', 'Settings (Nastavení)'),
      description: t('tutorial.settings.desc', 'Adjust your game preferences, change the language, or log out of the application.'),
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose(); // Close if it's the last step
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-card text-card-foreground border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col min-h-[320px]">
        
        {/* Skip / Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          aria-label="Skip tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Content with Animation */}
        <div className="flex-1 flex flex-col items-center text-center mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CurrentIcon className={`w-8 h-8 ${steps[currentStep].iconColor}`} />
              </div>
              
              <h2 className="text-xl font-bold mb-3">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: Progress Dots and Navigation Button */}
        <div className="mt-8 flex flex-col gap-4">
          
          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-6 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isLastStep && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
              >
                {t('tutorial.skip', 'Skip')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? t('tutorial.finish', 'Start Playing!') : t('tutorial.next', 'Next')}
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}