# Projekt OutRun - Hackathon Funovation 26
english version at the end of the page
## Přehled
Aplikace, jejímž hlavním cílem je obohatit cestovatelské zážitky vás a vašich přátel, kolegů nebo rodiny. Rozdělíte se do týmů, nastavíte, kde chcete začít a skončit a jak dlouhá má vaše trasa být – a zbytek necháte na nás. Naše webová stránka pro vás vytvoří unikátní výlet mezi vašimi cíli a provede vás různými turistickými místy, zatímco budete soutěžit s ostatními týmy, navzájem se sabotovat a objevovat své okolí!

## Funkce
* **Geolokace v reálném čase:** Při načtení automaticky vyžádá a zobrazí aktuální polohu uživatele.
* **Interaktivní mapa:** K vykreslování využívá knihovnu Leaflet.js a mapové podklady z Mapy.cz REST API.
* **Chytré vyhledávání (Suggest API):** Obsahuje vyhledávací pole s našeptávačem, který využívá Mapy.cz Suggest API.
* **Plánovač výletů:** * Umožňuje uživatelům zvolit cílovou vzdálenost chůze (od 2 km do 30 km).
  * Dotazuje se Overpass API (OpenStreetMap) pro vyhledání zajímavých bodů zájmu (POI - muzea, vyhlídky, hrady, památky) v přibližné požadované vzdálenosti.
  * Vypočítá pěší trasu (`routeType: 'foot_hiking'`) pomocí Mapy.cz Routing API a vykreslí ji do mapy.
  * Zobrazuje odhadovanou délku trasy a dobu chůze.
* **Responzivní UI:** Moderní, čisté rozhraní stylované pomocí Tailwind CSS, obsahující plynulé animace poháněné knihovnou `motion/react`.

## Technologie
* **Framework:** React 19
* **Sestavovací nástroj:** Vite
* **Stylování:** Tailwind CSS (v4)
* **Mapová knihovna:** Leaflet (v1.9.4)
* **Ikony:** Lucide React
* **Animace:** Motion (Framer Motion)

## Použitá externí API
1. **Mapy.cz REST API:**
   * **Mapové podklady:** Stahuje základní mapovou vrstvu (`/v1/maptiles/basic/256/{z}/{x}/{y}`).
   * **Navigace (Routing):** Vypočítává geometrii, vzdálenost a dobu trvání turistické trasy (`/v1/routing/route`).
   * **Našeptávač (Suggest):** Pohání automatické doplňování ve vyhledávací liště (`/v1/suggest`).
2. **Overpass API (OpenStreetMap):**
   * **Získávání bodů zájmu (POI):** Hledá turistické atrakce (`tourism~"viewpoint|museum|attraction"`, `historic~"castle|monument"`) poblíž uživatelovy polohy ve vypočítaném okruhu.

## Struktura projektu
* `src/App.tsx`: Hlavní komponenta aplikace obsahující veškerou logiku pro správu stavu, API volání a vykreslování mapy.
* `src/main.tsx`: Vstupní bod React aplikace.
* `src/lib/utils.ts`: Obsahuje pomocné funkce, především funkci `cn` pro bezpečné slučování Tailwind tříd.
* `vite.config.ts`: Konfigurace Vite, včetně integrace Tailwindu a nastavení proměnných prostředí.
* `index.html`: HTML šablona.

## Jak to funguje

### 1. Inicializace mapy
Aplikace používá effect hook ke kontrole Geolocation API v prohlížeči. Jakmile jsou souřadnice získány (nebo je výchozí poloha nastavena na Prahu v případě zamítnutí), inicializuje mapu Leaflet připojenou ke kontejneru.

### 2. Funkce vyhledávání
Psaní do vyhledávacího pole spouští zpožděné volání (debounce 300 ms) na Mapy.cz Suggest API. Výběr z našeptávače zpracuje souřadnice z odpovědi, aktualizuje stav aplikace a vycentruje mapu na nově vybranou lokaci.

### 3. Logika plánovače výletů
Po kliknutí na tlačítko "Vytvořit trasu":
1. **Výpočet poloměru:** Aplikace vypočítá vhodný poloměr vyhledávání pro Overpass API na základě cílové vzdálenosti zvolené uživatelem.
2. **Hledání bodů zájmu (POI):** Odešle dotaz na Overpass API za účelem nalezení relevantních turistických míst. Pokud API selže nebo nevrátí žádné výsledky, vygeneruje náhradní "fallback" bod.
3. **Výpočet trasy:** Odešle počáteční souřadnice (poloha uživatele) a koncové souřadnice (nalezené POI) do Mapy.cz Routing API s požadavkem na výstup ve formátu GeoJSON.
4. **Vykreslení:** Aplikace analyzuje vnořená pole souřadnic z GeoJSON, převede je do formátu Leafletu a nakreslí lomenou čáru (polyline) do mapy. Na místo určení také umístí vlastní značku (marker).







# OutRun Hackathon Funovation 26 Project

## Overview
Application whose main purpose is to enrich the travel experience of you and your friends, colleagues or familly. You divide yourself into team, set where you wish to begin, end and how long do you want your hike to be and leave the rest to us. Our website will create unique trip between you and your destinations and will take you throught various turistic spots while you compete with the other teams, sabotage each other and explore your suroundings!

## Features
* **Real-time Geolocation:** Automatically requests and displays the user's current location upon loading. 
* **Interactive Map:** Utilizes Leaflet.js with Mapy.cz REST API map tiles for rendering.
* **Smart Search (Suggest API):** Features a search bar with autocomplete suggestions powered by the Mapy.cz Suggest API.
* **Trip Planner:** * Allows users to select a target walking distance (from 2 km to 30 km).
  * Queries the Overpass API (OpenStreetMap) to find interesting POIs (museums, viewpoints, castles, monuments) at the approximate requested distance.
  * Calculates a pedestrian route (`routeType: 'foot_hiking'`) using the Mapy.cz Routing API and plots it on the map.
  * Displays estimated route distance and walking time.
* **Responsive UI:** Modern, clean interface styled with Tailwind CSS, featuring smooth animations powered by `motion/react`.

## Tech Stack
* **Framework:** React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (v4)
* **Map Library:** Leaflet (v1.9.4)
* **Icons:** Lucide React
* **Animations:** Motion (Framer Motion)

## External APIs Used
1. **Mapy.cz REST API:**
   * **Map Tiles:** Fetches the basic map layer (`/v1/maptiles/basic/256/{z}/{x}/{y}`).
   * **Routing:** Calculates the hiking route geometry, distance, and duration (`/v1/routing/route`).
   * **Suggest:** Powers the search bar autocomplete (`/v1/suggest`).
2. **Overpass API (OpenStreetMap):**
   * **POI Fetching:** Finds tourist attractions (`tourism~"viewpoint|museum|attraction"`, `historic~"castle|monument"`) near the user's location within a calculated radius.

## Project Structure
* `src/App.tsx`: The main application component containing all the logic for state management, API calls, and map rendering.
* `src/main.tsx`: The entry point of the React application.
* `src/lib/utils.ts`: Contains utility functions, primarily the `cn` function for merging Tailwind classes safely.
* `vite.config.ts`: Vite configuration, including Tailwind integration and environment variable setup.
* `index.html`: The HTML template.

## How It Works

### 1. Map Initialization
The app uses an effect hook to check for the browser's Geolocation API. Once coordinates are retrieved (or defaults to Prague if denied), it initializes a Leaflet map attached to a container.

### 2. Search Functionality
Typing in the search bar triggers a debounced call (300ms) to the Mapy.cz Suggest API. Selecting a suggestion parses the coordinates from the response, updates the app's state, and recenters the map to the newly selected location.

### 3. Trip Planner Routing Logic
When the "Vytvořit trasu" (Generate Route) button is clicked:
1. **Radius Calculation:** The app calculates an appropriate search radius for the Overpass API based on the user's selected target distance.
2. **POI Search:** It sends a query to the Overpass API to find relevant tourist spots. If the API fails or returns no results, it generates a dummy "fallback" point.
3. **Route Calculation:** It sends the start coordinates (user location) and end coordinates (found POI) to the Mapy.cz Routing API, requesting GeoJSON output.
4. **Rendering:** The app parses the nested GeoJSON coordinate arrays, converts them to Leaflet's format, and draws a polyline on the map. It also places a custom marker at the destination.


