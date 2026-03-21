/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { RouteInfo, Location } from '../types';

export interface TripMakerProps {
  targetDistance: number;
  setTargetDistance: (distance: number) => void;
  generateTouristRoute: () => void;
  isGeneratingRoute: boolean;
  location: Location | null;
  routeInfo: RouteInfo | null;
  clearRoute: () => void;
}

export interface Route {
    routeId: number;
    waipoints: Waypoint[];
}

export interface Waypoint {
    id: number;
    lat: number;
    lon: number;
    name: string;
    locationType: string;
    order: number;
}

export interface RouteWaypointQuest {
    routeId: number;
    routeWaypointQuests: WaypointQuests[];
}

export interface WaypointQuests {
    waypoinId: number;
    waypointQuests: WaypointQuest[];
}

export interface WaypointQuest {
    timeLimit: number;
    message: string;
    questType: QuestType;
    correctAnswers: string[];
    answerOptions: string[];
}

export enum QuestType {
    Input,
    MultipleSelect,
    SingleSelect,
}

// Mocking the Route data (from Backend)
export const mockRoutes: Route[] = [
  {
    routeId: 1,
    waipoints: [
      { id: 101, lat: 50.0385, lon: 15.7766, name: "Zelená brána (Green Gate)", locationType: "Monument", order: 1 },
      { id: 102, lat: 50.0407, lon: 15.7772, name: "Pardubice Castle", locationType: "Castle", order: 2 },
      { id: 103, lat: 50.0401, lon: 15.7725, name: "Tyršovy sady", locationType: "Park", order: 3 }
    ]
  }
];

// Mocking the Quests associated with the Route (from Backend)
export const mockQuests: RouteWaypointQuest[] = [
  {
    routeId: 1,
    routeWaypointQuests: [
      {
        waypoinId: 101, 
        waypointQuests: [
          {
            timeLimit: 60,
            message: "What color is the iconic tower gate in Pardubice?",
            questType: QuestType.SingleSelect,
            correctAnswers: ["Green"],
            answerOptions: ["Red", "Blue", "Green", "Yellow"]
          }
        ]
      },
      {
        waypoinId: 102,
        waypointQuests: [
          {
            timeLimit: 120,
            message: "Which famous noble family is closely associated with this castle?",
            questType: QuestType.Input,
            correctAnswers: ["Pernštejn", "Pernstejn", "Pernštejnové"],
            answerOptions: []
          }
        ]
      }
    ]
  }
];

// --- TRIP MAKER COMPONENT ---
export const TripMaker: React.FC<TripMakerProps> = ({
  targetDistance,
  setTargetDistance,
  generateTouristRoute,
  isGeneratingRoute,
  location,
  routeInfo,
  clearRoute
}) => {

  // Empty function ready for your backend logic
  const LoadRoute = async () => {
    try {
      // TODO: Fetch Route[] and RouteWaypointQuest[] from your backend here
      // Example:
      // const response = await fetch('/api/your-endpoint');
      // const data = await response.json();
      
      console.log("Loading route from backend...");

    } catch (error) {
      console.error("Failed to load route:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Example button to trigger the LoadRoute function */}
      <button 
        onClick={LoadRoute}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow hover:bg-emerald-700 transition-colors"
      >
        Load Route from Backend
      </button>

      {/* Your other UI elements will go here */}
    </div>
  );
};

export default TripMaker;