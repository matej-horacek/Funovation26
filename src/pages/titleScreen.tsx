import React, { useState, useRef } from 'react';
import AutocompleteInput from '../components/AutocompleteInput';
import '../index.css';
import { useTranslation } from 'react-i18next';
import MapPage from './map'; 
import { Globe, MapPinned, RefreshCw, Route, Shield, Users } from 'lucide-react';

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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(233,186,53,0.24),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(31,111,235,0.18),_transparent_24%),linear-gradient(180deg,_rgba(255,252,244,0.96),_rgba(246,240,224,0.98))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),transparent)]" />

      {/* --- Header & Language Bar --- */}
      <header className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-8 pt-4 md:px-8 md:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-black/8 bg-white/70 px-4 py-3 shadow-[0_20px_60px_-34px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-white shadow-sm">
              <Globe className="h-4 w-4" />
            </div>
            <button onClick={() => changeLanguage('cs')} className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5 hover:bg-stone-50">{t('language.cs')}</button>
            <button onClick={() => changeLanguage('en')} className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5 hover:bg-stone-50">{t('language.en')}</button>
            <button onClick={() => changeLanguage('ua')} className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-stone-900 transition hover:-translate-y-0.5 hover:bg-stone-50">{t('language.ua')}</button>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-black/8 bg-stone-950 px-4 py-2 text-white">
             <span className={`h-2.5 w-2.5 rounded-full ${statusKey === 'connected' ? 'bg-lime-400' : 'bg-rose-400'}`}></span>
             <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                {t(`status.${statusKey}`)}
             </span>
          </div>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.2fr)_380px]">
          <section className="rounded-[34px] border border-black/8 bg-white/74 p-6 shadow-[0_30px_90px_-42px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-stone-800">
              <MapPinned className="h-3.5 w-3.5" />
              {t('title_screen.hero_badge')}
            </div>
            <div className="max-w-2xl">
              <h1 className="text-4xl font-semibold uppercase leading-none tracking-[-0.07em] text-stone-950 sm:text-5xl lg:text-6xl">
                {t('home.main_title')}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-stone-700 sm:text-base">
                {t('title_screen.hero_description')}
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-black/8 bg-[#f6efdc] p-4">
                <Users className="mb-3 h-5 w-5 text-stone-800" />
                <p className="text-sm font-bold text-stone-950">{t('lobby.title')}</p>
                <p className="mt-1 text-xs leading-5 text-stone-700">{t('title_screen.lobby_card')}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white p-4">
                <Route className="mb-3 h-5 w-5 text-stone-800" />
                <p className="text-sm font-bold text-stone-950">{t('routing.title')}</p>
                <p className="mt-1 text-xs leading-5 text-stone-700">{t('title_screen.routing_card')}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-stone-950 p-4 text-white">
                <Shield className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">{t('status.connected')}</p>
                <p className="mt-1 text-xs leading-5 text-white/70">{t('title_screen.status_card')}</p>
              </div>
            </div>
          </section>

          <aside className="flex flex-col justify-between rounded-[34px] border border-black/8 bg-stone-950 p-6 text-white shadow-[0_30px_90px_-42px_rgba(0,0,0,0.55)]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">{t('title_screen.primary_action_label')}</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em]">
                {t('title_screen.primary_action_title')}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {t('title_screen.primary_action_description')}
              </p>
            </div>
            <button 
              onClick={() => setShowMap(true)}
              className="mt-8 inline-flex items-center justify-center rounded-[22px] bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
            >
              {t('home.open_map_button')}
            </button>
          </aside>
        </div>
      </header>

      {showMap && (
        <div className="fixed inset-0 z-50 bg-background overflow-hidden">
          <MapPage onBack={() => setShowMap(false)} />
        </div>
      )}

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 md:px-8">
        
        {/* --- Lobby Form Card --- */}
        <section className="rounded-[34px] border border-black/8 bg-white/78 p-6 shadow-[0_24px_80px_-42px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-stone-500">{t('title_screen.lobby_label')}</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-stone-950">
                {t('lobby.title')}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-stone-600">
              {t('title_screen.lobby_description')}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{t('lobby.player_name')}</label>
                <input className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none" type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{t('lobby.lobby_name')}</label>
                <input className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none" type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{t('lobby.lobby_color')}</label>
                <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
                  <input className="h-11 w-16 cursor-pointer rounded-xl border border-black/10 bg-transparent" type="color" value={lobbyColor} onChange={e => setLobbyColor(e.target.value)} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{t('title_screen.color_selected')}</p>
                    <p className="mt-1 text-sm font-bold text-stone-900">{lobbyColor}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{t('lobby.password')}</label>
                <input className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{t('lobby.join_id')}</label>
                <input className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none" type="text" value={lobbyId} onChange={e => setLobbyId(e.target.value)} placeholder={t('lobby.join_placeholder')} />
              </div>
              
              <div className="flex gap-3 pt-5">
                <button type="button" onClick={() => connect('create')} className="flex-1 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-stone-800 active:translate-y-0">{t('lobby.create_btn')}</button>
                <button type="button" onClick={() => connect('join')} className="flex-1 rounded-2xl border border-black/10 bg-[#f3ead2] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-stone-900 transition hover:-translate-y-0.5 hover:bg-[#efe3c1] active:translate-y-0">{t('lobby.join_btn')}</button>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-[#f7f3ea] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">{t('title_screen.quick_summary')}</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{t('lobby.player_name')}</p>
                  <p className="mt-1 truncate text-sm font-bold text-stone-950">{playerName || '...'}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{t('lobby.lobby_name')}</p>
                  <p className="mt-1 truncate text-sm font-bold text-stone-950">{lobbyName || '...'}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{t('lobby.join_id')}</p>
                  <p className="mt-1 truncate text-sm font-bold text-stone-950">{lobbyId || '...'}</p>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* --- Room & Team Status --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black uppercase tracking-[-0.05em] text-stone-950">{t('lobby.live_teams')}</h2>
              {roomId && <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-stone-600 shadow-sm">ID: {roomId}</span>}
            </div>
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-50">
              <RefreshCw className="h-3.5 w-3.5" />
              {t('lobby.refresh_data')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Object.keys(teamInfos).map(teamId => {
              const info = teamInfos[teamId];
              const players = teams[teamId] || [];
              return (
                <div key={teamId} className="overflow-hidden rounded-[26px] border border-black/8 bg-white/82 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.45)]" style={{ boxShadow: `inset 0 4px 0 ${info?.Color || 'var(--color-primary)'}` }}>
                  <div className="flex justify-between items-center border-b border-black/8 bg-stone-50/80 p-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-stone-950">{info?.Name || `${t('lobby.team_default')} ${teamId}`}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 shadow-sm">{players.length} {t('lobby.players_count')}</span>
                  </div>
                  <div className="space-y-2 p-4">
                    {players.length > 0 ? (
                      players.map((player, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-2xl border border-black/8 bg-stone-50 px-3 py-2.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info?.Color }}></div>
                          <span className="text-sm font-semibold text-stone-900">{player}</span>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs italic text-stone-500">{t('lobby.waiting_players')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- Routing Section --- */}
        <section className="relative overflow-hidden rounded-[34px] border border-black/8 bg-stone-950 p-6 text-white shadow-[0_24px_80px_-42px_rgba(0,0,0,0.55)] md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-5">
             <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/45">{t('title_screen.routing_label')}</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.05em]">{t('routing.title')}</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/65">
              {t('title_screen.routing_description')}
            </p>
          </div>
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_190px]">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">{t('routing.start_point')}</label>
              <AutocompleteInput value={startPos} onChange={setStartPos} placeholder={t('routing.start_placeholder')} />
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">{t('routing.destination')}</label>
              <AutocompleteInput value={endPos} onChange={setEndPos} placeholder={t('routing.end_placeholder')} />
            </div>
            <button 
              onClick={handleSearch} 
              className="h-[46px] rounded-2xl bg-primary px-6 py-2 text-sm font-black uppercase tracking-[0.16em] text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
            >
              {t('routing.calculate_btn')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
