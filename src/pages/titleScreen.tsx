import React, { useState, useRef } from 'react';
import AutocompleteInput from '../components/AutocompleteInput';
import '../index.css';
import { useTranslation } from 'react-i18next';
import MapPage from './map'; 

// ==========================================
// CONSTANTS & TYPES
// ==========================================
const BACKEND_URL = "ws://localhost:8080";
export const MAPY_API_KEY = 'AbZ0brnIi8jPKiCNZvqfJlhNd3dpMI4q-9oooZ6irDk';
import { Route, RouteWaypointQuest } from '../components/TripMaker';

type TeamInfo = { Name: string; Color: string } | any;
type Teams = Record<string, string[]>;
type TeamInfos = Record<string, TeamInfo>;
type WsMessage = { Mtype: string; Message: string; Args: string[]; id?: string; teams?: any; players?: any };

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const { t, i18n } = useTranslation();
  
  // --- UI State ---
  const [showMap, setShowMap] = useState(false);
  const [statusKey, setStatusKey] = useState('not_connected'); 
  
  // --- Form State ---
  const [playerName, setPlayerName] = useState('');
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyColor, setLobbyColor] = useState('#4F46E5'); // Changed default to a nice indigo
  const [password, setPassword] = useState('');
  const [lobbyId, setLobbyId] = useState('');

  // --- App State ---
  const [roomId, setRoomId] = useState('');
  const [teams, setTeams] = useState<Teams>({});
  const [teamInfos, setTeamInfos] = useState<TeamInfos>({});
  
  // --- Trip State ---
  const [tripRoutes, setTripRoutes] = useState<any[]>([]); 
  const [tripQuests, setTripQuests] = useState<any[]>([]);
  
  // --- Mapy State ---
  const [startPos, setStartPos] = useState('');
  const [endPos, setEndPos] = useState('');
  const [numWaypoints, setNumWaypoints] = useState<number>(3);

  // --- Refs ---
  const socketRef = useRef<WebSocket | null>(null);

  // ==========================================
  // LOGIC FUNCTIONS
  // ==========================================
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const connect = (action: 'create' | 'join') => {
    let params = `?name=${encodeURIComponent(playerName)}&lname=${encodeURIComponent(lobbyName)}&lcolor=${encodeURIComponent(lobbyColor)}&password=${encodeURIComponent(password)}`;
    let url = action === "create" ? `${BACKEND_URL}/create${params}` : `${BACKEND_URL}/join/${lobbyId}?name=${encodeURIComponent(playerName)}`;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setStatusKey('connected');
    socket.onmessage = (event) => {
      const data: WsMessage = JSON.parse(event.data);
      if (data.id) setRoomId(data.id);

      switch (data.Mtype) {
        case "teams":
          data.Args.forEach(id => {
            socket.send(JSON.stringify({ Mtype: "getTeam", Args: [id] }));
            socket.send(JSON.stringify({ Mtype: "getPeople", Args: [id] }));
          });
          break;
        case "teamInfo":
          setTeamInfos(prev => ({ ...prev, [data.Message]: data.Args[0] }));
          break;
        case "contestants":
          setTeams(prev => ({ ...prev, [data.Message]: data.Args }));
          break;
        case "playerJoin":
          setTeams(prev => {
            const teamId = data.Args[1];
            const pName = data.Args[0];
            return { ...prev, [teamId]: [...(prev[teamId] || []), pName] };
          });
          break;
        case "playerLeave":
          setTeams(prev => {
            const teamId = data.Args[1];
            const pName = data.Args[0];
            return { ...prev, [teamId]: (prev[teamId] || []).filter(e => e !== pName) };
          });
          break;
        case "disconnect":
          socket.close();
          socketRef.current = null;
          setStatusKey('disconnected');
          break;
        case "newTeam":
          const newTeamId = data.Args[1];
          setTeams(prev => ({ ...prev, [newTeamId]: [] }));
          setTeamInfos(prev => ({
            ...prev,
            [newTeamId]: { Name: data.Message, Color: data.Args[0] }
          }));
          break;
      }
      if (data.teams) setTeams(data.teams);
    };

    socket.onclose = () => setStatusKey('disconnected');
  };

  const fetchData = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ Mtype: "getTeams" }));
    }
  };

  const handleSearch = async () => {
    if (!startPos || !endPos) return;

    try {
      console.log(`Asking backend to generate trip from ${startPos} to ${endPos} with ${numWaypoints} waypoints...`);
      const url = `http://localhost:8080/api/generateRoute?start=${encodeURIComponent(startPos)}&end=${encodeURIComponent(endPos)}&numberOfWaypoints=${numWaypoints}`;
      
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      const fetchedRoutes: Route[] = []; 
      const fetchedQuests: RouteWaypointQuest[] = []; 

      setTripRoutes(fetchedRoutes);
      setTripQuests(fetchedQuests);
      setShowMap(true);

    } catch (error) {
      console.error("Failed to fetch trip from backend:", error);
    }
  };

  // ==========================================
  // RENDER (STYLED)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-4 md:p-8 font-sans transition-colors duration-300">
      
      {/* --- Header & Language Bar --- */}
      <header className="max-w-4xl mx-auto mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-3 rounded-xl border border-border shadow-sm mb-6">
          <div className="flex gap-2">
            <button onClick={() => changeLanguage('cs')} className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">🇨🇿 CS</button>
            <button onClick={() => changeLanguage('en')} className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">🇬🇧 EN</button>
            <button onClick={() => changeLanguage('ua')} className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">🇺🇦 UA</button>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-1.5 rounded-full border border-border/50">
             <span className={`w-3 h-3 rounded-full animate-pulse ${statusKey === 'connected' ? 'bg-green-500' : 'bg-destructive'}`}></span>
             <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t(`status.${statusKey}`)}
             </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 uppercase italic drop-shadow-sm">
            {t('home.main_title')}
          </h1>
          <button 
            onClick={() => setShowMap(true)}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
          >
            {t('home.open_map_button')}
          </button>
        </div>
      </header>

      {showMap && (
        <div className="fixed inset-0 z-50 bg-background overflow-hidden">
          <MapPage onBack={() => setShowMap(false)} />
        </div>
      )}

      <main className="max-w-4xl mx-auto space-y-10">
        
        {/* --- Lobby Form Card --- */}
        <section className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-md">
          <h2 className="text-2xl font-black mb-6 border-b border-border pb-3 text-foreground uppercase tracking-tighter italic">
            {t('lobby.title')}
          </h2>
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.player_name')}</label>
                <input className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.lobby_name')}</label>
                <input className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.team_color')}</label>
                <div className="p-1.5 rounded-lg border border-border bg-background shadow-sm">
                  <input className="h-10 w-full rounded cursor-pointer bg-transparent" type="color" value={lobbyColor} onChange={e => setLobbyColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.password')}</label>
                  <input className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.join_id')}</label>
                  <input className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-sm" type="text" value={lobbyId} onChange={e => setLobbyId(e.target.value)} placeholder={t('lobby.join_placeholder')} />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 mt-auto">
                <button type="button" onClick={() => connect('create')} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all">{t('lobby.create_btn')}</button>
                <button type="button" onClick={() => connect('join')} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl font-bold border border-border shadow-sm hover:bg-muted active:scale-95 transition-all">{t('lobby.join_btn')}</button>
              </div>
            </div>
          </form>
        </section>

        {/* --- Room & Team Status --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t('lobby.live_teams')}</h2>
              {roomId && <span className="text-xs font-mono bg-card px-2.5 py-1 rounded-md border border-border shadow-sm text-primary">ID: {roomId}</span>}
            </div>
            <button onClick={fetchData} className="text-sm text-primary font-bold hover:underline opacity-80 hover:opacity-100">{t('lobby.refresh_data')}</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Object.keys(teamInfos).map(teamId => {
              const info = teamInfos[teamId];
              const players = teams[teamId] || [];
              return (
                <div key={teamId} className="bg-card rounded-2xl border-l-8 overflow-hidden shadow-md transition-all hover:shadow-lg" style={{ borderLeftColor: info?.Color || 'var(--color-primary)' }}>
                  <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center">
                    <h3 className="font-black text-lg uppercase tracking-tight text-foreground">{info?.Name || `${t('lobby.team_default')} ${teamId}`}</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">{players.length} {t('lobby.players_count')}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {players.length > 0 ? (
                      players.map((player, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 px-3 bg-background rounded-lg border border-border/50 shadow-sm">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: info?.Color }}></div>
                          <span className="font-semibold text-sm text-foreground">{player}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-6">{t('lobby.waiting_players')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- Routing Section --- */}
        <section className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-md relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none transform rotate-12">
             <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          
          <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">{t('routing.title')}</h2>
          
          <div className="grid grid-cols-1 md:flex flex-col gap-6 relative z-10">
            
            {/* Top row: Start and End locations */}
            <div className="flex flex-col md:flex-row items-end gap-5 w-full">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('routing.start_point')}</label>
                <div className="shadow-sm rounded-lg">
                  <AutocompleteInput value={startPos} onChange={setStartPos} placeholder={t('routing.start_placeholder')} />
                </div>
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t('routing.destination')}</label>
                <div className="shadow-sm rounded-lg">
                  <AutocompleteInput value={endPos} onChange={setEndPos} placeholder={t('routing.end_placeholder')} />
                </div>
              </div>
            </div>

            {/* Bottom row: Waypoints Slider and Calculate Button */}
            <div className="flex flex-col md:flex-row items-end gap-8 w-full">
              
              {/* Waypoints Slider */}
              <div className="flex-1 space-y-2 w-full bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    {t('routing.waypoints', 'Waypoints')}
                  </label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                    {numWaypoints}
                  </span>
                </div>
                <div className="relative pt-2 pb-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="9" 
                    value={numWaypoints} 
                    onChange={(e) => setNumWaypoints(Number(e.target.value))}
                    className="w-full h-3 bg-muted border border-border rounded-lg appearance-none cursor-pointer accent-primary shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground/50 px-1 pt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>9</span>
                </div>
              </div>

              {/* Calculate Button */}
              <button 
                onClick={handleSearch} 
                className="px-8 py-4 h-[72px] bg-foreground text-background rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all w-full md:w-auto shrink-0 uppercase tracking-wide"
              >
                {t('routing.calculate_btn')}
              </button>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}