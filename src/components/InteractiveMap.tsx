import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Compass, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Locate, 
  Info,
  Smartphone,
  Navigation,
  Eye,
  Radio
} from 'lucide-react';
import { DeviceState } from '../types';

interface InteractiveMapProps {
  device: DeviceState;
  title?: string;
}

type MapMode = 'vector' | 'satellite' | 'terrain';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ device, title = "Realtime GPS Vector Map" }) => {
  const [zoom, setZoom] = useState<number>(1.5);
  const [mapMode, setMapMode] = useState<MapMode>('vector');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when the device or country changes to auto-center the target
  useEffect(() => {
    setZoom(1.8);
    setPanOffset({ x: 0, y: 0 });
    setSelectedLandmark(null);
  }, [device.ownerPhone]);

  // Adjust zoom handle
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1.0));
  const handleResetMap = () => {
    setZoom(1.8);
    setPanOffset({ x: 0, y: 0 });
    setSelectedLandmark(null);
  };

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch controls for mobile compatibility
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - panOffset.x, 
        y: e.touches[0].clientY - panOffset.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  // Generate detailed mockup streets & landmarks dynamically based on the device's main city/coordinates
  const getCityDetails = () => {
    const lat = device.currentLat;
    const isDelhi = lat > 25 && lat < 30;
    const isMumbai = lat > 15 && lat < 21;
    const isKolkata = lat > 21 && lat < 24;
    const isSFO = lat > 35 && lat < 39;
    const isNY = lat > 39 && lat < 42;

    if (isDelhi) {
      return {
        city: "New Delhi",
        region: "Delhi NCR Hub, IN",
        accuracy: "±4 meters",
        landmarks: [
          { id: 'l1', name: 'India Gate Parkway', x: -140, y: -90, type: 'public', desc: 'Historic memorial roundabout' },
          { id: 'l2', name: 'Connaught Place Central Ring', x: -20, y: -40, type: 'business', desc: 'Commercial outer circle' },
          { id: 'l3', name: 'Janpath Metro Station Gate-B', x: 80, y: 30, type: 'transit', desc: 'Critical underground corridor link' },
          { id: 'l4', name: 'Aarav\'s GPS Primary Target', x: 0, y: 0, type: 'device', desc: 'Actual target position' },
          { id: 'l5', name: 'Yamuna River Bypass Canal', x: 180, y: -150, type: 'water', desc: 'Water boundary channel' },
        ],
        streets: [
          { name: 'Janpath Marg', points: 'M -250 80 L 250 -20' },
          { name: 'Kasturba Gandhi Marg', points: 'M -180 -180 L 180 180' },
          { name: 'Sansad Marg (Parliament St)', points: 'M -100 200 L -100 -200' },
          { name: 'Barakhamba Bypass', points: 'M -200 -40 L 200 -40' }
        ],
        buildings: [
          { x: -90, y: -30, w: 60, h: 40, name: 'National Archives' },
          { x: 50, y: 70, w: 45, h: 50, name: 'Palika Palace Mall' },
          { x: -150, y: 110, w: 80, h: 35, name: 'Kerala House Gov Block' }
        ]
      };
    } else if (isMumbai) {
      return {
        city: "Mumbai",
        region: "Maharashtra Coastal Node, IN",
        accuracy: "±5 meters",
        landmarks: [
          { id: 'l1', name: 'Gateway of India Plaza', x: -160, y: 120, type: 'public', desc: 'Waterfront historical arch' },
          { id: 'l2', name: 'The Taj Mahal Palace Hotel', x: -130, y: 80, type: 'business', desc: 'Iconic heritage hotel tower' },
          { id: 'l3', name: 'Marine Drive Promenade', x: -180, y: -80, type: 'transit', desc: 'Arcing queen\'s necklace motorway' },
          { id: 'l4', name: 'Rohan\'s Reserve stand-by beacon', x: 0, y: 0, type: 'device', desc: 'BLE beacons active' },
          { id: 'l5', name: 'Colaba Causeway Bazaar', x: 120, y: -100, type: 'business', desc: 'Dense shopping market stalls' },
        ],
        streets: [
          { name: 'Colaba Causeway Rd', points: 'M -150 -250 L -150 250' },
          { name: 'Chatrapati Shivaji Marg', points: 'M -250 110 L 250 110' },
          { name: 'Ormiston Road Bypass', points: 'M -300 -60 L 300 40' }
        ],
        buildings: [
          { x: -100, y: -160, w: 70, h: 50, name: 'Regal Cinema Monument' },
          { x: 30, y: -20, w: 80, h: 60, name: 'Shanti Heights Tower' },
          { x: 90, y: 130, w: 50, h: 45, name: 'Mumbai Transit Base' }
        ]
      };
    } else if (isKolkata) {
      return {
        city: "Kolkata",
        region: "West Bengal Gateway, IN",
        accuracy: "±6 meters",
        landmarks: [
          { id: 'l1', name: 'Victoria Memorial Gardens', x: -130, y: -100, type: 'public', desc: 'White marble monument park' },
          { id: 'l2', name: 'Park Street Junction', x: 40, y: -60, type: 'business', desc: 'Culinary and nightlife street' },
          { id: 'l3', name: 'Maidan Sports Complex', x: -150, y: 20, type: 'public', desc: 'Vast urban open green space' },
          { id: 'l4', name: 'Priya\'s Residence Terminal', x: 0, y: 0, type: 'device', desc: 'Triangulating offline cell node' },
          { id: 'l5', name: 'Hooghly River Jetty Channel', x: -240, y: 150, type: 'water', desc: 'Navigable broad water highway' },
        ],
        streets: [
          { name: 'Park Street', points: 'M -250 -60 L 250 -60' },
          { name: 'Jawaharlal Nehru Road', points: 'M -110 -250 L -110 250' },
          { name: 'Shakespeare Sarani Bypass', points: 'M -220 90 L 220 95' }
        ],
        buildings: [
          { x: -50, y: -200, w: 60, h: 55, name: 'St. Paul\'s Cathedral' },
          { x: 100, y: 40, w: 50, h: 70, name: 'Tata Centre Highrise' },
          { x: 50, y: 130, w: 85, h: 40, name: 'Kolkata Tech Terminal 9' }
        ]
      };
    } else if (isSFO) {
      return {
        city: "San Francisco",
        region: "California Pacific Hub, US",
        accuracy: "±3 meters",
        landmarks: [
          { id: 'l1', name: 'Union Square Courtyard', x: -100, y: -110, type: 'public', desc: 'Central public plaza and shops' },
          { id: 'l2', name: 'Salesforce Transit Terminal', x: 150, y: -40, type: 'transit', desc: 'Elevated green park transit hub' },
          { id: 'l3', name: 'Market Street thoroughfare', x: -180, y: 80, type: 'transit', desc: 'Major downtown artery with cable cars' },
          { id: 'l4', name: 'Sarah\'s Pro Max Tracker Node', x: 0, y: 0, type: 'device', desc: 'Active smartphone transmission' },
          { id: 'l5', name: 'Yerba Buena Center Garden', x: 30, y: 140, type: 'public', desc: 'Modern arts gardens and museum' },
        ],
        streets: [
          { name: 'Market Street', points: 'M -250 150 L 250 -100' },
          { name: 'Powell Street cable line', points: 'M -100 -250 L -100 250' },
          { name: 'Mission Street Bypass', points: 'M -250 250 L 250 0' },
          { name: '4th Street Retail Ave', points: 'M 30 -250 L 30 250' }
        ],
        buildings: [
          { x: -50, y: -20, w: 65, h: 70, name: 'Westfield Mall Block' },
          { x: 90, y: -140, w: 80, h: 60, name: '455 Market St Corporate' },
          { x: -200, y: -130, w: 45, h: 45, name: 'Cable Car Hub SFO' }
        ]
      };
    } else { // New York / Jack
      return {
        city: "New York City",
        region: "Manhattan Central Grid, US",
        accuracy: "±4 meters",
        landmarks: [
          { id: 'l1', name: 'Grand Central Station Vault', x: 140, y: -120, type: 'transit', desc: 'Enormous heritage transport hub' },
          { id: 'l2', name: 'Times Square Crossroads', x: -140, y: 30, type: 'public', desc: 'Vibrant digital billboard plaza' },
          { id: 'l3', name: 'Bryant Park Lawn', x: -60, y: -40, type: 'public', desc: 'Beautiful manicured library lawns' },
          { id: 'l4', name: 'Jack Henderson\'s Pixel Node', x: 0, y: 0, type: 'device', desc: 'Low-battery last stand' },
          { id: 'l5', name: 'New York Public Library Head', x: -20, y: -70, type: 'public', desc: 'Famous stone lions library' },
        ],
        streets: [
          { name: '42nd Street Subway Line', points: 'M -250 -40 L 250 -40' },
          { name: 'Fifth Avenue Corridor', points: 'M -40 -250 L -40 250' },
          { name: 'Sixth Avenue (Avenue of Americas)', points: 'M -150 -250 L -150 250' },
          { name: 'Park Avenue Transit flyover', points: 'M 140 -250 L 140 250' }
        ],
        buildings: [
          { x: 20, y: 50, w: 90, h: 80, name: 'Chrysler Retail Tower' },
          { x: -120, y: -180, w: 60, h: 60, name: 'Lexington Residence Complex' },
          { x: 30, y: -200, w: 50, h: 40, name: 'New York Comms Hub' }
        ]
      };
    }
  };

  const mapData = getCityDetails();

  return (
    <div 
      id="root-interactive-gps-map"
      ref={mapContainerRef}
      className={`bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 border-indigo-500/40' : 'h-full flex-1 min-h-[360px] lg:min-h-[420px]'
      }`}
    >
      {/* MAP TITLE HEADER */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-100 flex items-center gap-1.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> {title} (Live Tracker View)
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">
              Currently Focusing on: <strong className="text-slate-200">{mapData.city}</strong> ({mapData.region})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* MAP MODE LAYERS SELECTOR */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-0.5">
            <button
              onClick={() => setMapMode('vector')}
              className={`p-1 px-1.5 text-[10px] font-bold rounded uppercase transition-colors ${
                mapMode === 'vector' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vector Street Map"
            >
              Vector
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`p-1 px-1.5 text-[10px] font-bold rounded uppercase transition-colors ${
                mapMode === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Satellite View"
            >
              Satellite
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`p-1 px-1.5 text-[10px] font-bold rounded uppercase transition-colors ${
                mapMode === 'terrain' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Military radar grid model"
            >
              Radar
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Interactive Map"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* COMPACT MAP INFO BAR */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-850/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-mono">
            🎯 Target: <span className="text-slate-200 font-bold">{device.ownerName} ({device.deviceModel})</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">
            Network status: {device.isPoweredOff ? (
              <span className="text-rose-400 font-bold animate-pulse">📡 Cryptographic BLE Mesh standby</span>
            ) : (
              <span className="text-emerald-400 font-bold">📶 Live GPS Constellation Online</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
            GPS Resolution: {mapData.accuracy}
          </span>
          <span className="bg-slate-900 border border-slate-800 text-[10px] text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
            Zoom Scale: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* MAIN INTERACTIVE VECTOR/SATELLITE GROUND STAGE */}
      <div 
        className={`flex-1 relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          mapMode === 'satellite' 
            ? 'bg-radial-gradient from-slate-900 via-indigo-950/40 to-slate-950' 
            : mapMode === 'terrain'
            ? 'bg-grid-slate-900/10 bg-slate-950'
            : 'bg-slate-900'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {/* Dynamic Zoom & Pan Container */}
        <div 
          className="absolute inset-0 transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
          }}
        >
          {/* MOCK MAP GRAPHICS CANVAS SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Ambient Background Grid depending on map style */}
            {mapMode === 'satellite' ? (
              <>
                <defs>
                  <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#081026" />
                    <stop offset="100%" stopColor="#02050d" />
                  </radialGradient>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#101827" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#oceanGrad)" />
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Simulated topo satellite shapes */}
                <circle cx="20%" cy="30%" r="180" fill="#061c16" className="opacity-20 filter blur-3xl animate-pulse" />
                <circle cx="80%" cy="70%" r="220" fill="#1e1b4b" className="opacity-15 filter blur-3xl" />
              </>
            ) : mapMode === 'terrain' ? (
              <>
                <defs>
                  <pattern id="radarGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="28" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="30" x2="60" y2="30" stroke="#1e293b" strokeWidth="0.5" />
                    <line x1="30" y1="0" x2="30" y2="60" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#020617" />
                <rect width="100%" height="100%" fill="url(#radarGrid)" />
                <circle cx="50%" cy="50%" r="90" fill="none" stroke="#4f46e5" strokeWidth="0.5" className="opacity-20" />
                <circle cx="50%" cy="50%" r="180" fill="none" stroke="#4f46e5" strokeWidth="0.5" className="opacity-10" />
                <circle cx="50%" cy="50%" r="270" fill="none" stroke="#4f46e5" strokeWidth="0.5" className="opacity-5" />
                {/* Radar sweep */}
                <line x1="50%" y1="50%" x2="10%" y2="20%" stroke="#10b981" strokeWidth="1" className="opacity-40 origin-center animate-spin" style={{ animationDuration: '6s' }} />
              </>
            ) : (
              <>
                {/* Standard Dark CAD / Vector Layout */}
                <defs>
                  <pattern id="vectorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <rect width="30" height="30" fill="none" stroke="#1e293b" strokeWidth="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#0f172a" />
                <rect width="100%" height="100%" fill="url(#vectorGrid)" />
              </>
            )}

            {/* DRAW WATER BODY FOR OUTLINE IF SATELLITE/VECTOR */}
            {mapMode !== 'terrain' && (
              <path 
                d="M -300 -250 Q -100 -200 -120 100 T -200 350 L -450 350 L -450 -250 Z" 
                fill={mapMode === 'satellite' ? '#0f172a' : '#1e293b'} 
                className="opacity-60" 
              />
            )}

            {/* URBAN STREET LAYOUT (Drawn relative to exact target centered at 50%, 50% / coordinates x=0, y=0) */}
            <g transform="translate(450, 200)" className="opacity-70">
              {/* Build roads with standard stroke styles */}
              {mapData.streets.map((street, idx) => (
                <g key={idx}>
                  {/* Outer casing */}
                  <path 
                    d={street.points} 
                    fill="none" 
                    stroke={mapMode === 'satellite' ? '#111827' : '#334155'} 
                    strokeWidth="11" 
                    strokeLinecap="round" 
                  />
                  {/* Core street line */}
                  <path 
                    d={street.points} 
                    fill="none" 
                    stroke={mapMode === 'satellite' ? '#4b5563' : '#1e293b'} 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                  />
                  {/* Dashed center lane strip under high zoom */}
                  {zoom > 1.8 && (
                    <path 
                      d={street.points} 
                      fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="1" 
                      strokeDasharray="4,6" 
                      className="opacity-80" 
                    />
                  )}
                </g>
              ))}

              {/* DRAW MOCK HIGH-ZOOM BUILDING CONSTELLATIONS */}
              {zoom >= 1.6 && mapData.buildings.map((b, idx) => (
                <rect
                  key={idx}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="4"
                  fill="#1e1b4b"
                  stroke="#4338ca"
                  strokeWidth="1"
                  className="opacity-45 hover:opacity-80 transition-all cursor-help"
                />
              ))}
            </g>
          </svg>

          {/* DYNAMIC LANDMARKS & GPS MARKERS (Absolute layers centered around 450px x, 200px y) */}
          <div 
            className="absolute" 
            style={{ 
              left: '50%', 
              top: '50%',
              transform: 'translate(-50%, -50%) translate(0px, 0px)',
              width: '900px',
              height: '400px',
              pointerEvents: 'none'
            }}
          >
            {/* The absolute relative center for landmarks is x=450, y=200 */}
            <div className="absolute inset-0 pointer-events-auto">
              
              {/* Actual Tracked target device ping */}
              <div 
                className="absolute transition-all duration-300"
                style={{ 
                  left: `${450}px`, 
                  top: `${200}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Glowing ring */}
                <div className={`absolute -inset-8 rounded-full pointer-events-none ${
                  device.isPoweredOff 
                    ? 'border border-indigo-400/25 bg-indigo-500/5 animate-pulse' 
                    : 'border-2 border-emerald-500/20 bg-emerald-500/5 animate-ping'
                }`}></div>
                
                <div className={`absolute -inset-16 rounded-full pointer-events-none ${
                  device.isPoweredOff 
                    ? 'hidden' 
                    : 'border border-emerald-500/10 bg-emerald-500/2 animate-ping'
                }`} style={{ animationDelay: '0.4s' }}></div>

                {/* Pin element */}
                <div className="relative flex flex-col items-center">
                  <div className={`p-2 rounded-full shadow-2xl ring-4 flex items-center justify-center animate-bounce ${
                    device.isPoweredOff 
                      ? 'bg-slate-950 border border-indigo-500 text-indigo-400 ring-indigo-500/15' 
                      : 'bg-emerald-600 border border-slate-900 text-white ring-emerald-500/30'
                  }`}>
                    <Smartphone className="w-5 h-5 shrink-0" />
                  </div>
                  
                  {/* Mini floating flag */}
                  <div className="mt-1.5 bg-slate-950/95 text-slate-100 border border-slate-800 rounded px-2 py-1 shadow-2xl text-[10px] font-mono whitespace-nowrap space-y-0.5 text-center leading-none">
                    <span className="font-extrabold text-white block">{device.ownerName}'s Phone</span>
                    <span className="text-[9px] text-indigo-400 block font-mono">{device.deviceModel}</span>
                    <span className="text-emerald-400 font-bold text-[9.5px] block mt-0.5">
                      {device.isPoweredOff ? "📡 BLE Standby Core" : "✓ Active Online"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Local Landmarks on Map depending on Zoom level */}
              {mapData.landmarks.map((landmark) => {
                // Skip the device itself since it's already rendered
                if (landmark.type === 'device') return null;

                // High zoom reveal constraint
                const displayThis = zoom >= 1.4 || landmark.type === 'transit';
                if (!displayThis) return null;

                const posX = 450 + landmark.x;
                const posY = 180 + landmark.y;

                return (
                  <div
                    key={landmark.id}
                    className="absolute"
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 30
                    }}
                  >
                    <button
                      onClick={() => setSelectedLandmark(landmark.id)}
                      className={`p-1 rounded-md border flex items-center gap-1 shadow-lg transition-all active:scale-90 ${
                        selectedLandmark === landmark.id
                          ? 'bg-rose-500 border-rose-300 text-white'
                          : landmark.type === 'transit'
                          ? 'bg-indigo-950/90 border-indigo-700/60 text-indigo-300 hover:bg-slate-900'
                          : landmark.type === 'water'
                          ? 'bg-slate-950/80 border-cyan-800 text-cyan-400 hover:bg-slate-900'
                          : 'bg-slate-950/95 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <Navigation className="w-2.5 h-2.5 rotate-45 shrink-0" />
                      <span className="text-[9px] font-medium font-sans whitespace-nowrap">{landmark.name}</span>
                    </button>

                    {/* Popover helper */}
                    {selectedLandmark === landmark.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 bg-slate-950 text-slate-100 p-2.5 rounded-lg border border-rose-500 w-[180px] shadow-2xl z-40 text-left space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Landmark Pin</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLandmark(null);
                            }}
                            className="text-slate-500 hover:text-white font-bold text-[10px] px-1"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[10.5px] font-bold text-slate-200 leading-tight">{landmark.name}</p>
                        <p className="text-[9px] text-slate-400 leading-normal">{landmark.desc}</p>
                        <div className="text-[8.5px] text-slate-500 font-mono flex justify-between pt-0.5 border-t border-slate-900">
                          <span>Offset: {landmark.x}m, {landmark.y}m</span>
                          <span className="text-emerald-400">Stable Node</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* BLE MESH RELAY NODES SIMULATOR IN SWITCHED OFF STATE */}
              {device.isPoweredOff && (
                <>
                  {/* Bluetooth Relay circle */}
                  <div 
                    className="absolute border border-indigo-500/20 rounded-full animate-pulse flex items-center justify-center text-[8px] font-mono text-indigo-300"
                    style={{
                      left: '280px',
                      top: '100px',
                      width: '110px',
                      height: '110px',
                    }}
                  >
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-950 border border-indigo-900/60 p-1 rounded">
                      <Radio className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                      Smartwatch Node
                    </div>
                  </div>

                  <div 
                    className="absolute border border-indigo-500/20 rounded-full animate-pulse flex items-center justify-center text-[8px] font-mono text-indigo-300"
                    style={{
                      left: '600px',
                      top: '250px',
                      width: '120px',
                      height: '120px',
                      animationDelay: '0.6s'
                    }}
                  >
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-950 border border-indigo-900/60 p-1 rounded">
                      <Radio className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                      Vehicle IN_102
                    </div>
                  </div>

                  {/* Draw dashed lines indicating BLE signal hopping path */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="335" y1="155" x2="450" y2="200" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4,4" className="opacity-60" />
                    <line x1="660" y1="310" x2="450" y2="200" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4,4" className="opacity-60" />
                  </svg>
                </>
              )}

            </div>
          </div>
        </div>

        {/* MAP COMPASS ROSE DESKTOP ACCENT */}
        <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-850 p-2 rounded-xl flex items-center gap-2 text-[10px] text-slate-300 pointer-events-none">
          <Compass className="w-4 h-4 text-rose-500 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="font-mono leading-none">
            <span className="block font-bold text-white">NORTH 0°</span>
            <span className="text-[8.5px] text-slate-500">Auto-align active</span>
          </div>
        </div>

        {/* MAP USER ZOOM BUTTON CONTROLS PANEL */}
        <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-indigo-950 p-2 rounded-xl flex flex-col gap-1.5 shadow-2xl">
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-indigo-650 hover:bg-indigo-650 text-white font-bold flex items-center justify-center transition-all bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-90"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center transition-all active:scale-90"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button 
            onClick={handleResetMap}
            className="p-1 text-[8.5px] uppercase font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-850 hover:border-slate-800 rounded font-sans transition-colors mt-0.5 text-center"
            title="Recenter GPS focus"
          >
            Center
          </button>
        </div>

        {/* DRAG INSTRUCTION WATERMARK */}
        <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 text-[9px] font-mono text-center text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-850/80">
          🖱️ Click and drag anywhere to pan map
        </div>
      </div>

      {/* QUICK PLACE ZOOM FINDER FOR ACCESSIBILITY */}
      <div className="bg-slate-900 border-t border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-sans flex items-center gap-1 shrink-0">
          <Eye className="w-3.5 h-3.5 text-indigo-400" /> Street-Address Zoom Checker:
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setZoom(1.0);
              setPanOffset({ x: 0, y: 0 });
              setSelectedLandmark(null);
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
              zoom === 1.0 
                ? 'bg-indigo-600 border-indigo-400 text-white' 
                : 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-800'
            }`}
          >
            City Loop
          </button>
          <button
            onClick={() => {
              setZoom(2.0);
              setPanOffset({ x: 0, y: 0 });
              setSelectedLandmark(null);
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
              zoom === 2.0 
                ? 'bg-indigo-600 border-indigo-400 text-white' 
                : 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-800'
            }`}
          >
            Sectors (Zoom 2x)
          </button>
          <button
            onClick={() => {
              setZoom(3.0);
              setPanOffset({ x: 0, y: 0 });
              setSelectedLandmark(null);
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
              zoom === 3.0 
                ? 'bg-indigo-600 border-indigo-400 text-white' 
                : 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-800'
            }`}
          >
            Streets (Zoom 3x)
          </button>
          <button
            onClick={() => {
              setZoom(4.0);
              setPanOffset({ x: 20, y: 20 });
              // Select direct landmark device target
              const mainTarget = mapData.landmarks.find(l => l.type === 'device');
              if (mainTarget) setSelectedLandmark(mainTarget.id);
            }}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all animate-pulse ${
              zoom === 4.0 
                ? 'bg-rose-600 border-rose-400 text-white' 
                : 'bg-slate-950 border-rose-950 text-rose-350 hover:bg-slate-800'
            }`}
            title="Zoom in 4X on the exact place where the phone is currently hidden"
          >
            🕵️ FIND EXACT PLACE (4x)
          </button>
        </div>
      </div>
    </div>
  );
};
