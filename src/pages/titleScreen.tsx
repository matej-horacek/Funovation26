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
  // CHANGED: We now store the translation KEY instead of the hardcoded English phrase
  const [statusKey, setStatusKey] = useState('not_connected'); 
  
  // --- Form State ---
  const [playerName, setPlayerName] = useState('');
  const [lobbyName, setLobbyName] = useState('');
  const [lobbyColor, setLobbyColor] = useState('#FFFFFF');
  const [password, setPassword] = useState('');
  const [lobbyId, setLobbyId] = useState('');

  // --- App State ---
  const [roomId, setRoomId] = useState('');
  const [teams, setTeams] = useState<Teams>({});
  const [teamInfos, setTeamInfos] = useState<TeamInfos>({});
  
  // --- Mapy State ---
  const [startPos, setStartPos] = useState('');
  const [endPos, setEndPos] = useState('');

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

    const getCoordinates = async (query: string) => {
      const url = `https://api.mapy.cz/v1/geocode?query=${encodeURIComponent(query)}&apikey=${MAPY_API_KEY}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return { lon: data.items[0].position.lon, lat: data.items[0].position.lat };
        }
      } catch (err) { console.error(err); }
      return null;
    };

    const [startCoords, endCoords] = await Promise.all([getCoordinates(startPos), getCoordinates(endPos)]);

    if (startCoords && endCoords) {
      const routeUrl = `https://api.mapy.cz/v1/routing/route?start=${startCoords.lon},${startCoords.lat}&end=${endCoords.lon},${endCoords.lat}&routeType=car_fast&apikey=${MAPY_API_KEY}`;
      try {
        const response = await fetch(routeUrl);
        const routeData = await response.json();
        const distanceKm = (routeData.length / 1000).toFixed(2);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            Mtype: "routeFound",
            Message: `Found route: ${distanceKm}km`,
            Args: [startPos, endPos, distanceKm]
          }));
        }
      } catch (error) { console.error(error); }
    }
  };

  // ==========================================
  // RENDER (STYLED)
  // ==========================================
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans transition-colors duration-300">
      
      {/* --- Header & Language Bar --- */}
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/50 p-3 rounded-lg border border-border mb-6">
          <div className="flex gap-2">
            <button onClick={() => changeLanguage('cs')} className="px-3 py-1 rounded hover:bg-white/10 transition-colors">🇨🇿 CS</button>
            <button onClick={() => changeLanguage('en')} className="px-3 py-1 rounded hover:bg-white/10 transition-colors">🇬🇧 EN</button>
            <button onClick={() => changeLanguage('ua')} className="px-3 py-1 rounded hover:bg-white/10 transition-colors">🇺🇦 UA</button>
          </div>
          <div className="flex items-center gap-3">
             <span className={`w-3 h-3 rounded-full ${statusKey === 'connected' ? 'bg-primary' : 'bg-destructive'}`}></span>
             {/* Render the status dynamically */}
             <span className="text-sm font-medium uppercase tracking-wider opacity-70">
                {t(`status.${statusKey}`)}
             </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tight text-primary uppercase italic">
            {t('home.main_title')}
          </h1>
          <button 
            onClick={() => setShowMap(true)}
            className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-radius shadow-lg hover:brightness-110 active:scale-95 transition-all"
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

      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Lobby Form Card --- */}
        <section className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-2 uppercase tracking-tighter italic">
            {t('lobby.title')}
          </h2>
          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.player_name')}</label>
                <input className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.lobby_name')}</label>
                <input className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.lobby_color')}</label>
                <input className="h-10 w-full rounded-md border border-border bg-background cursor-pointer" type="color" value={lobbyColor} onChange={e => setLobbyColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.password')}</label>
                <input className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('lobby.join_id')}</label>
                <input className="w-full p-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all" type="text" value={lobbyId} onChange={e => setLobbyId(e.target.value)} placeholder={t('lobby.join_placeholder')} />
              </div>
              
              <div className="flex gap-3 pt-5">
                <button type="button" onClick={() => connect('create')} className="flex-1 bg-primary text-primary-foreground py-2 rounded-radius font-bold hover:opacity-90 active:scale-95 transition-all">{t('lobby.create_btn')}</button>
                <button type="button" onClick={() => connect('join')} className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-radius border border-border font-bold hover:bg-muted active:scale-95 transition-all">{t('lobby.join_btn')}</button>
              </div>
            </div>
          </form>
        </section>

        {/* --- Room & Team Status --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('lobby.live_teams')}</h2>
              {roomId && <span className="text-[10px] font-mono bg-muted px-2 py-1 rounded border border-border">ID: {roomId}</span>}
            </div>
            <button onClick={fetchData} className="text-xs text-primary font-bold hover:underline">{t('lobby.refresh_data')}</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(teamInfos).map(teamId => {
              const info = teamInfos[teamId];
              const players = teams[teamId] || [];
              return (
                <div key={teamId} className="bg-card rounded-xl border-l-4 overflow-hidden shadow-sm" style={{ borderLeftColor: info?.Color || 'var(--color-primary)' }}>
                  <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                    <h3 className="font-black text-lg uppercase tracking-tight">{info?.Name || `${t('lobby.team_default')} ${teamId}`}</h3>
                    <span className="text-[10px] opacity-50 font-bold">{players.length} {t('lobby.players_count')}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    {players.length > 0 ? (
                      players.map((player, idx) => (
                        <div key={idx} className="flex items-center gap-2 py-1 px-2 bg-background rounded border border-border/50">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info?.Color }}></div>
                          <span className="font-medium text-sm">{player}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-4">{t('lobby.waiting_players')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- Routing Section --- */}
        <section className="bg-card p-6 rounded-xl border border-border shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <h2 className="text-lg font-bold mb-4 uppercase italic">{t('routing.title')}</h2>
          <div className="grid grid-cols-1 md:flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-60 ml-1">{t('routing.start_point')}</label>
              <AutocompleteInput value={startPos} onChange={setStartPos} placeholder={t('routing.start_placeholder')} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-60 ml-1">{t('routing.destination')}</label>
              <AutocompleteInput value={endPos} onChange={setEndPos} placeholder={t('routing.end_placeholder')} />
            </div>
            <button 
              onClick={handleSearch} 
              className="px-6 py-2 h-[42px] bg-foreground text-background rounded-radius font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              {t('routing.calculate_btn')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}