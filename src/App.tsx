import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  MapPin, 
  Smartphone, 
  Radio, 
  Lock, 
  Wifi, 
  WifiOff, 
  Trash2, 
  Search, 
  Volume2, 
  VolumeX, 
  Power, 
  RotateCcw, 
  Settings, 
  ListRestart, 
  Fingerprint, 
  FileText, 
  Plus, 
  Key, 
  Send, 
  Check, 
  Info, 
  SmartphoneNfc,
  HelpCircle
} from "lucide-react";
import { INITIAL_DEVICES, DeviceState, LogEvent } from "./types";
import { startSiren, stopSiren } from "./utils/audio";
import { InteractiveMap } from "./components/InteractiveMap";

export default function App() {
  // Database of all simulated smartphones in this environment
  const [devices, setDevices] = useState<Record<string, DeviceState>>(() => {
    const saved = localStorage.getItem("lost_phone_devices");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_DEVICES; }
    }
    return INITIAL_DEVICES;
  });

  // Track the 'current' phone that is currently displayed/active on the screen simulator UI
  const [selectedPhoneNum, setSelectedPhoneNum] = useState<string>("+919876543210");
  const activeDevice = devices[selectedPhoneNum] || devices["+919876543210"];

  // ----------------------------------------------------
  // UNINSTALL ATTEMPTS & PROTECTIONS STATE
  // ----------------------------------------------------
  const [uninstallRequestActive, setUninstallRequestActive] = useState<boolean>(false);
  const [uninstallPasscode, setUninstallPasscode] = useState<string>("");
  const [uninstallError, setUninstallError] = useState<string>("");
  const [uninstallSuccessMsg, setUninstallSuccessMsg] = useState<string>("");

  // ----------------------------------------------------
  // TARGET TRACKING PANEL (Simulate tracking from other phone)
  // ----------------------------------------------------
  const [trackInputPhone, setTrackInputPhone] = useState<string>("");
  const [foundTrackerDevice, setFoundTrackerDevice] = useState<DeviceState | null>(null);
  const [trackerSearchError, setTrackerSearchError] = useState<string>("");
  const [trackerMode, setTrackerMode] = useState<boolean>(false); // whether viewing other phone tracker visualizer

  // ----------------------------------------------------
  // SIMULATOR CONTROL DECORATORS
  // ----------------------------------------------------
  const [customPhoneNum, setCustomPhoneNum] = useState<string>("");
  const [customDeviceModel, setCustomDeviceModel] = useState<string>("");
  const [customOwnerName, setCustomOwnerName] = useState<string>("");
  const [customCountry, setCustomCountry] = useState<'IN' | 'US'>('IN');
  const [customOsType, setCustomOsType] = useState<'iOS' | 'Android'>('Android');
  const [customPasscode, setCustomPasscode] = useState<string>("1234");
  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false);
  const [addDeviceError, setAddDeviceError] = useState<string>("");
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(false);
  const [lostPhoneNumInput, setLostPhoneNumInput] = useState<string>("");
  const [lostNameInput, setLostNameInput] = useState<string>("");
  const [proximityDistance, setProximityDistance] = useState<number>(2.4);

  // 2-second beautiful splash loader states
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    const totalDuration = 2000; // Exact 2 seconds
    const intervalTime = 20; // 20ms steps
    const totalSteps = totalDuration / intervalTime;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const currentProgress = Math.min((stepCount / totalSteps) * 100, 100);
      setLoadingProgress(currentProgress);

      if (stepCount >= totalSteps) {
        clearInterval(timer);
        setTimeout(() => {
          setShowSplash(false);
        }, 150); // Fluid finish transition transition
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // ----------------------------------------------------
  // BACKEND / OFFLINE/SMS SIMULATION MESSAGING CONTEXT
  // ----------------------------------------------------
  const [smsCommandMessage, setSmsCommandMessage] = useState<string>("");
  const [smsHistory, setSmsHistory] = useState<Array<{ sender: string, text: string, response: string, timestamp: string }>>([]);

  // Save changes to state helper
  const updateDeviceState = (phone: string, patch: Partial<DeviceState>) => {
    setDevices(prev => {
      const updated = { ...prev };
      if (updated[phone]) {
        updated[phone] = {
          ...updated[phone],
          ...patch,
          lastUpdated: "Just Now"
        } as DeviceState;
      }
      localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
      return updated;
    });
  };

  // Push immediate custom logs
  const addLog = (phone: string, type: 'info' | 'warning' | 'alert' | 'success', message: string) => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
    setDevices(prev => {
      const updated = { ...prev };
      if (updated[phone]) {
        const newLog: LogEvent = {
          id: Math.random().toString(36).substring(5),
          timestamp: timeStr,
          type,
          message
        };
        updated[phone] = {
          ...updated[phone],
          logs: [newLog, ...updated[phone].logs].slice(0, 40) // cap to 40 logs
        };
      }
      localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
      return updated;
    });
  };

  // Turn siren on/off
  const toggleSiren = (phoneNum: string) => {
    const dev = devices[phoneNum];
    if (!dev) return;
    const nextSiren = !dev.isSirenRunning;
    
    // Play actual physical backup Web Audio alert in agent iframe if it becomes true for active phone
    if (phoneNum === selectedPhoneNum) {
      if (nextSiren) {
        startSiren();
      } else {
        stopSiren();
      }
    }

    updateDeviceState(phoneNum, { isSirenRunning: nextSiren });
    addLog(phoneNum, nextSiren ? 'alert' : 'info', nextSiren ? "Loud anti-theft siren activated!" : "Anti-theft siren deactivated.");
  };

  // Ensure sound stops if phone selected drops sound or switches
  useEffect(() => {
    if (activeDevice && activeDevice.isSirenRunning) {
      startSiren();
    } else {
      stopSiren();
    }
    return () => {
      stopSiren();
    };
  }, [selectedPhoneNum]);



  // Clean trigger command simulation
  const handleSimulateSmsCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCommandMessage.trim()) return;

    const cmd = smsCommandMessage.trim().toLowerCase();
    const phone = selectedPhoneNum;
    const device = devices[phone];
    if (!device) return;

    let response = "SMS Command unrecognized. Options: 'locate', 'lock [passcode]', 'siren on', 'siren off', 'wipe stats'.";
    let triggerType: 'info' | 'warning' | 'alert' | 'success' = "warning";

    if (cmd === "locate") {
      response = `GPS Location received! Lat: ${device.currentLat.toFixed(4)}, Lng: ${device.currentLng.toFixed(4)}. Accuracy: 5 meters.`;
      triggerType = "success";
      addLog(phone, triggerType, `Offline SMS command trigger 'locate' completed successfully of GPS coordinates`);
    } else if (cmd.startsWith("lock")) {
      const parts = cmd.split(" ");
      const maybePass = parts[1] || device.passcode;
      updateDeviceState(phone, { isLocked: true, passcode: maybePass });
      response = `Device fully locked. Locking down file systems & touch panels configured with secure passcode.`;
      triggerType = "alert";
      addLog(phone, triggerType, `Offline SMS command trigger 'lock' forced lockscreen authentication lock active`);
    } else if (cmd === "siren on") {
      updateDeviceState(phone, { isSirenRunning: true });
      if (phone === selectedPhoneNum) startSiren();
      response = `Siren alert has been turned ON at maximum DB power!`;
      triggerType = "alert";
      addLog(phone, triggerType, `Offline SMS command trigger 'siren on' toggled synthesiser bypass`);
    } else if (cmd === "siren off") {
      updateDeviceState(phone, { isSirenRunning: false });
      if (phone === selectedPhoneNum) stopSiren();
      response = `Siren sound stopped.`;
      triggerType = "info";
      addLog(phone, triggerType, `Offline SMS command trigger 'siren off' toggled synthesiser bypass`);
    } else if (cmd === "wipe stats") {
      updateDeviceState(phone, { isLocked: true, batteryLevel: 1 });
      response = `Emergency Wipe Mode loaded. Client critical memory sectors encrypted. UI lockdown in effect.`;
      triggerType = "alert";
      addLog(phone, triggerType, `Offline SMS command trigger 'wipe stats' purged secure local sectors`);
    }

    setSmsHistory(prev => [
      {
        sender: "Fallback Sim Gateway (+1-800-LOST)",
        text: smsCommandMessage,
        response,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);

    setSmsCommandMessage("");
  };

  // Track phone lookup
  const handleTrackPhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackerSearchError("");
    setFoundTrackerDevice(null);

    const checkPhone = trackInputPhone.trim();
    if (!checkPhone) {
      setTrackerSearchError("Please enter a valid mobile number.");
      return;
    }

    // Attempt to match device
    const target = devices[checkPhone];
    if (target) {
      setFoundTrackerDevice(target);
      addLog(checkPhone, 'info', `Cross-device tracking request initiated from monitoring node`);
    } else {
      // Create intelligent notification or error logic
      setTrackerSearchError(`We could not find a device registered with phone number ${checkPhone}. Use custom phone builder below to add it first!`);
    }
  };

  // Try uninstalling app
  const triggerUninstallAttempt = () => {
    setUninstallRequestActive(true);
    setUninstallPasscode("");
    setUninstallError("");
    setUninstallSuccessMsg("");
  };

  const handleVerifyUninstall = (e: React.FormEvent) => {
    e.preventDefault();
    setUninstallError("");

    if (uninstallPasscode === activeDevice.passcode) {
      setUninstallSuccessMsg("Success! Security Token generated. Safe administrative uninstall permission granted.");
      addLog(selectedPhoneNum, 'success', `Authorized administrative uninstall request succeeded via correct passcode input.`);
      
      // Simulate deleting device after a delay
      setTimeout(() => {
        setDevices(prev => {
          const updated = { ...prev };
          delete updated[selectedPhoneNum];
          const keys = Object.keys(updated);
          const defaultKey = keys.length ? keys[0] : "";
          if (defaultKey) setSelectedPhoneNum(defaultKey);
          localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
          return updated;
        });
        setUninstallRequestActive(false);
      }, 2000);
    } else {
      setUninstallError("Access Denied: Incorrect passcode. Under MDM Policy, uninstall of 'Lost Phone Recovery' has been hardlocked.");
      addLog(selectedPhoneNum, 'alert', `Unauthorized uninstall attempt detected! Intruder entered incorrect passcode: "${uninstallPasscode}"`);
    }
  };

  // Immediate find-your-phone handler on Track, creating simulated target if new
  const handleTrackLostPhone = () => {
    const phone = lostPhoneNumInput.trim();
    const name = lostNameInput.trim() || "Simulated Owner";

    if (!phone) {
      alert("Please enter a valid mobile number to track!");
      return;
    }

    setDevices(prev => {
      const updated = { ...prev };
      
      if (!updated[phone]) {
        const isIos = phone.startsWith("+1") || Math.random() > 0.5;
        const country = phone.startsWith("+91") ? "IN" : "US";
        
        // High-fidelity random offsets
        const offsetDelhi = { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.2090 + (Math.random() - 0.5) * 0.05 };
        const offsetSF = { lat: 37.7749 + (Math.random() - 0.5) * 0.05, lng: -122.4194 + (Math.random() - 0.5) * 0.05 };
        const chosenLoc = country === "IN" ? offsetDelhi : offsetSF;

        updated[phone] = {
          appName: "Lost Phone Recovery App",
          version: "v4.12.2 Pro",
          deviceModel: isIos ? "Apple iPhone 15 Pro Max" : "Google Pixel 8 Pro",
          osType: isIos ? 'iOS' : 'Android',
          ownerName: name,
          ownerPhone: phone,
          country: country,
          passcode: "1234",
          isLocked: false,
          isLosingPower: false,
          isPoweredOff: false,
          isSirenRunning: false,
          batteryLevel: 89,
          currentLat: chosenLoc.lat,
          currentLng: chosenLoc.lng,
          lastUpdated: "Just Now",
          wifiConnected: true,
          cellularConnected: true,
          security: {
            uninstallProtectionEnabled: true,
            lockdownOnSimChange: true,
            stealthMode: false
          },
          logs: [
            { id: "tr-1", timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), type: "success", message: `Initiated high-precision dual GPS tracking request on target phone ${phone}.` },
            { id: "tr-2", timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), type: "info", message: `Satellite triangulation signal resolved. GPS stable.` }
          ]
        };
      } else {
        // If it exists, update key info
        updated[phone].ownerName = name || updated[phone].ownerName;
        updated[phone].logs = [
          { id: "tr-ping-" + Date.now(), timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), type: "success", message: `Active trace initiated. Pinging GPS constellation coordinate system on ${phone}...` },
          ...updated[phone].logs
        ].slice(0, 40);
      }

      localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
      return updated;
    });

    setSelectedPhoneNum(phone);
  };

  // Update lost phone profile real-time as details are filled or saved
  const handleUpdateLostPhoneDetails = (phone: string, name: string) => {
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    if (!cleanPhone) return;

    setDevices(prev => {
      const updated = { ...prev };
      
      // If the number key itself has changed, rename the key in the database
      if (selectedPhoneNum !== cleanPhone) {
        const oldState = updated[selectedPhoneNum] || INITIAL_DEVICES["+919876543210"];
        delete updated[selectedPhoneNum];
        updated[cleanPhone] = {
          ...oldState,
          ownerPhone: cleanPhone,
          ownerName: cleanName || oldState.ownerName,
          country: cleanPhone.startsWith("+91") ? "IN" : "US",
        } as DeviceState;
        
        setSelectedPhoneNum(cleanPhone);
      } else {
        if (updated[cleanPhone]) {
          updated[cleanPhone].ownerName = cleanName;
        }
      }
      
      localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
      return updated;
    });
  };

  // Add a newly crafted custom phone
  const handleCreatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    setAddDeviceError("");

    const phoneIn = customPhoneNum.trim();
    if (!phoneIn) {
      setAddDeviceError("Mobile network number is strictly required.");
      return;
    }

    if (devices[phoneIn]) {
      setAddDeviceError("A smartphone is already registered with this mobile number.");
      return;
    }

    const randomOfsDelhi = { lat: 28.6139 + (Math.random() - 0.5) * 0.1, lng: 77.2090 + (Math.random() - 0.5) * 0.1 };
    const randomOfsSF = { lat: 37.7749 + (Math.random() - 0.5) * 0.1, lng: -122.4194 + (Math.random() - 0.5) * 0.1 };
    const chosenLoc = customCountry === 'IN' ? randomOfsDelhi : randomOfsSF;

    const newDevice: DeviceState = {
      appName: "Lost Phone Recovery DevApp",
      version: "v4.12.2 Pro",
      deviceModel: customDeviceModel.trim() || `${customOsType === 'iOS' ? "Apple iPhone 14 Pro" : "Android Pixel 7"}`,
      osType: customOsType,
      ownerName: customOwnerName.trim() || "Simulated User",
      ownerPhone: phoneIn,
      country: customCountry,
      passcode: customPasscode.trim() || "1234",
      isLocked: false,
      isLosingPower: false,
      isPoweredOff: false,
      isSirenRunning: false,
      batteryLevel: 90,
      currentLat: chosenLoc.lat,
      currentLng: chosenLoc.lng,
      lastUpdated: "Just registered",
      wifiConnected: true,
      cellularConnected: true,
      security: {
        uninstallProtectionEnabled: true,
        lockdownOnSimChange: true,
        stealthMode: false
      },
      logs: [
        { id: "new-1", timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), type: "success", message: `Lost Phone Recovery App custom provisioned for ${customCountry === 'IN' ? "India" : "United States"}` }
      ]
    };

    setDevices(prev => {
      const updated = { ...prev, [phoneIn]: newDevice };
      localStorage.setItem("lost_phone_devices", JSON.stringify(updated));
      return updated;
    });

    setSelectedPhoneNum(phoneIn);
    setIsMobileMapExpanded(false);
    setShowAddDeviceModal(false);
    // Reset inputs
    setCustomPhoneNum("");
    setCustomDeviceModel("");
    setCustomOwnerName("");
  };

  // Force simulated location move
  const triggerSimulatedLocationShift = () => {
    // Generate slight offset
    const randomShift = (Math.random() - 0.5) * 0.015;
    const nextLat = activeDevice.currentLat + randomShift;
    const nextLng = activeDevice.currentLng + randomShift;

    updateDeviceState(selectedPhoneNum, {
      currentLat: nextLat,
      currentLng: nextLng
    });

    addLog(selectedPhoneNum, 'info', `Device GPS coordinate moved dynamically to Lat: ${nextLat.toFixed(4)}, Lng: ${nextLng.toFixed(4)}`);
  };

  // Quick states triggers
  const forceToggleWifi = () => {
    const next = !activeDevice.wifiConnected;
    updateDeviceState(selectedPhoneNum, { wifiConnected: next });
    addLog(selectedPhoneNum, next ? 'success' : 'warning', next ? "Wi-Fi link restored. Secure cloud sync online." : "Wi-Fi disconnected. Operating in offline cellular / SMS command fallback mode.");
  };

  const forceToggleCellular = () => {
    const next = !activeDevice.cellularConnected;
    updateDeviceState(selectedPhoneNum, { cellularConnected: next });
    addLog(selectedPhoneNum, next ? 'success' : 'warning', next ? "Cellular radio registered online." : "No internet or mobile cellular data. Dynamic positioning fallback offline mode engaged (Works without data/Wi-Fi).");
  };

  const toggleScreenLock = () => {
    const next = !activeDevice.isLocked;
    updateDeviceState(selectedPhoneNum, { isLocked: next });
    addLog(selectedPhoneNum, next ? 'alert' : 'success', next ? `Device locked down immediately. Passcode screen activated.` : "Device unlocked successfully via validated PIN entry.");
  };

  const setFullReset = () => {
    localStorage.removeItem("lost_phone_devices");
    setDevices(INITIAL_DEVICES);
    setSelectedPhoneNum("+919876543210");
    stopSiren();
    setSmsHistory([]);
  };

  // State to make mobile simulator screen expand or expand trace map
  const [isMobileMapExpanded, setIsMobileMapExpanded] = useState<boolean>(false);

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 text-center select-none"
        >
          {/* Ambient Background Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.06)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-sm w-full flex flex-col items-center z-10">
            
            {/* Embedded High Fidelity Custom Vector Logo in compliance with user uploaded mockup */}
            <div className="relative mb-6 w-56 h-56 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
              {/* Concentric glowing radar sweeps */}
              <div className="absolute inset-0 rounded-full border border-rose-500/10 animate-ping" />
              <div className="absolute inset-6 rounded-full border border-rose-500/5 animate-pulse" />
              <div className="absolute inset-2 rounded-full border-t-2 border-rose-500/20 animate-spin" style={{ animationDuration: '6s' }} />

              <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]">
                <defs>
                  <radialGradient id="splashBgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#be123c" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#0b1329" stopOpacity="0"/>
                  </radialGradient>
                  <linearGradient id="splashShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e11d48"/>
                    <stop offset="50%" stopColor="#be123c"/>
                    <stop offset="100%" stopColor="#4c0519"/>
                  </linearGradient>
                  <linearGradient id="splashSilverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff"/>
                    <stop offset="50%" stopColor="#94a3b8"/>
                    <stop offset="100%" stopColor="#475569"/>
                  </linearGradient>
                  <linearGradient id="splashNeedleRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e"/>
                    <stop offset="100%" stopColor="#9f1239"/>
                  </linearGradient>
                </defs>

                <circle cx="256" cy="220" r="180" fill="url(#splashBgGlow)" />

                {/* Radar grid coordinates */}
                <circle cx="256" cy="220" r="140" fill="none" stroke="#be123c" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="6 4"/>
                <circle cx="256" cy="220" r="100" fill="none" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.2"/>
                <circle cx="256" cy="220" r="60" fill="none" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.15"/>
                <path d="M 256 50 L 256 390 M 86 220 L 426 220" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.1" />

                {/* The Red Shield Base with Silver Border */}
                <g>
                  {/* Outer Silver Beveled Border */}
                  <path d="M 256 80 C 316 80, 366 100, 366 120 C 366 210, 316 280, 256 320 C 196 280, 146 210, 146 120 C 146 100, 196 80, 256 80 Z" 
                        fill="url(#splashShieldGrad)" stroke="url(#splashSilverGrad)" strokeWidth="5" strokeLinejoin="round"/>
                  
                  {/* Inner detailing curve */}
                  <path d="M 256 95 C 298 95, 335 110, 335 125 C 335 190, 298 245, 256 280 C 214 245, 177 190, 177 125 C 177 110, 214 95, 256 95 Z" 
                        fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 2"/>
                </g>

                {/* Compass Dial Marks */}
                <circle cx="256" cy="220" r="72" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.25"/>

                {/* Rotating Compass Needle (Northeast Angle) */}
                <g transform="translate(256, 220) rotate(-45)">
                  {/* Southwest Point (Silver Bevel) */}
                  <path d="M 0 0 L -12 7 L 0 90 L 12 7 Z" fill="url(#splashSilverGrad)"/>
                  <path d="M 0 0 L 0 90 L 12 7 Z" fill="#334155" opacity="0.4"/>

                  {/* Northeast Point (Red Bevel) */}
                  <path d="M 0 0 L -12 -7 L 0 -115 L 12 -7 Z" fill="url(#splashNeedleRed)"/>
                  <path d="M 0 0 L 0 -115 L 12 -7 Z" fill="#4c0519" opacity="0.45"/>
                </g>

                {/* High precision Map Pin Bubble pointing down on top pivot */}
                <g transform="translate(256, 120)">
                  <path d="M 0 -22 C 12 -22, 22 -12, 22 0 C 22 14, 0 32, 0 32 C 0 32, -22 14, -22 0 C -22 -12, -12 -22, 0 -22 Z" 
                        fill="url(#splashNeedleRed)" stroke="#ffffff" strokeWidth="1.5"/>
                  <circle cx="0" cy="-2" r="7" fill="#ffffff"/>
                  <circle cx="0" cy="-2" r="3" fill="#be123c"/>
                </g>
              </svg>
            </div>

            {/* Title from Custom Attached Mockup */}
            <h1 className="text-2xl font-black tracking-[0.16em] text-white uppercase font-sans leading-none flex flex-col gap-1 select-none">
              <span className="text-slate-100">LOST PHONE</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-amber-450">RECOVERY</span>
            </h1>
            <p className="text-[10px] tracking-[0.45em] text-slate-500 font-extrabold uppercase mt-2.5 mb-8">
              ANTI-THEFT SHIELD
            </p>

            {/* Progress Slider track & loaders */}
            <div className="w-64 space-y-3">
              <div className="relative h-1 w-full bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.5)] transition-all duration-75 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[9px] text-slate-300">
                <span className="font-semibold transition-all duration-300">
                  {loadingProgress < 25 && "Initializing interface hardware..."}
                  {loadingProgress >= 25 && loadingProgress < 50 && "Establishing secure SMS gateway..."}
                  {loadingProgress >= 50 && loadingProgress < 75 && "Connecting peer-to-peer BLE radar..."}
                  {loadingProgress >= 75 && loadingProgress < 95 && "Binding active target tracker..."}
                  {loadingProgress >= 95 && "Active online shield ready."}
                </span>
                <span className="font-bold text-slate-400">{Math.round(loadingProgress)}%</span>
              </div>
            </div>

          </div>
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-rose-500 selection:text-white"
        >
      
       {/* HEADER SECTION WITH BRANDING */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-rose-600 p-2 rounded-xl text-white shadow-lg animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">
              Lost Phone Tracker
            </h1>
            <p className="text-xs text-slate-300 font-sans">
              Anti-Theft Shield Simulator for iOS & Android (India 🇮🇳 / US 🇺🇸)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            Simulator Connected
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-sans text-xs">Active Targets: India & United States</span>
        </div>

        <div className="flex items-center gap-2">
          {!showWalkthrough && (
            <button 
              onClick={() => setShowWalkthrough(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-950/60 border border-indigo-800/80 hover:bg-indigo-900/.40 text-indigo-300 transition-all shadow-md active:scale-95 hover:border-indigo-500/50"
              title="Read guide on how to test this application"
            >
              <HelpCircle className="w-3.5 h-3.5 animate-bounce" /> Learn How to Use
            </button>
          )}


          
          <button 
            onClick={setFullReset}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-755 text-slate-300 transition-all active:scale-95 border border-slate-700"
            title="Reset system database to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart Simulator
          </button>
        </div>
      </header>

      {/* WORKSPACE CONTENT SPLIT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1700px] mx-auto w-full">
        
        {/* HOW IT WORKS UNDERSTANDABLE USER GUIDE */}
        {showWalkthrough && (
          <div className="lg:col-span-12 bg-slate-950 border border-indigo-500/25 rounded-2xl p-5 shadow-xl relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute right-0 top-0 w-[200px] h-full bg-indigo-500/5 blur-[60px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-600/15 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20 shrink-0">
                  <HelpCircle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-1.5">
                    <span>📖 Simple Guide: How This Lost Phone Tracker Works (US / India)</span>
                    <span className="bg-indigo-500/25 text-indigo-300 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      Android & iOS Supported
                    </span>
                  </h2>
                  <p className="text-xs text-slate-350 mt-1.5 max-w-4xl leading-relaxed">
                    Standard lost apps stop working if a thief turns off the mobile or removes the internet. 
                    This simulator shows how our app ensures recovery in **all situations** even with **no data link** or if the device is fully **switched off**! All versions across India 🇮🇳 and US 🇺🇸 devices are supported.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkthrough(false)}
                className="text-slate-400 hover:text-slate-200 text-xs bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-all font-sans whitespace-nowrap active:scale-95"
              >
                Hide Guide ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-900">
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <span className="font-bold text-xs text-slate-200">1. Switched-Off Signal</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Even if the phone is fully switched off or battery dies, it broadcasts secure <span className="text-rose-400 font-semibold font-mono">BLE cryptographic beacons</span> to nearby participant devices to route its exact location!
                </p>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span className="font-bold text-xs text-slate-200">2. Tracking Without Internet</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  If there is no WiFi or mobile network cellular data, coordinates are transmitted via <span className="text-indigo-400 font-semibold">carrier fallback SMS gateways</span>. You can still track it perfectly!
                </p>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">3</span>
                  <span className="font-bold text-xs text-slate-200">3. Find Instantly on Map</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Enter the lost mobile number in the search bar. As soon as you hit locate, the interactive grid points exactly where the phone is hidden with 4x zoom!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LEFT COLUMN: GUIDES, REGISTER FORM & SIMULATOR CONTEXT (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* CONFIGURE LOST APP / TARGET REGISTRATION FORM */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs uppercase tracking-widest font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Configure Lost Phone
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">
                Active Tracker Target
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-normal">
              Please fill the mobile number and owner name of the lost phone you wish to simulate and recover:
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">
                  1. Mobile Phone Number of Lost Phone:
                </label>
                <input
                  type="text"
                  value={lostPhoneNumInput}
                  onChange={(e) => setLostPhoneNumInput(e.target.value)}
                  placeholder="e.g. +919876543210 (or +1...)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block mb-1">
                  2. Owner Name of Lost Phone:
                </label>
                <input
                  type="text"
                  value={lostNameInput}
                  onChange={(e) => setLostNameInput(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* TRACK BUTTON TO IMMEDIATELY TRY TO FIND THE LOST DEVICE */}
              <button
                type="button"
                onClick={handleTrackLostPhone}
                className="w-full mt-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-lg shadow-rose-950/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide border border-rose-400/20"
              >
                <MapPin className="w-3.5 h-3.5 animate-bounce text-amber-250" /> Track Lost Phone
              </button>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850/80 text-[11px] text-slate-400 leading-relaxed font-sans space-y-1">
              <span className="text-rose-400 font-bold block text-[10px] uppercase font-mono tracking-wider">Current Target Info:</span>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <div>OS TYPE: <span className="text-slate-200 font-semibold">{activeDevice?.osType || "Android"}</span></div>
                <div>DEVICE: <span className="text-slate-200 font-semibold truncate block max-w-[120px]">{activeDevice?.deviceModel || "Samsung Galaxy"}</span></div>
                <div>PASSCODE PIN: <span className="text-amber-400 font-bold">{activeDevice?.passcode || "1234"}</span></div>
                <div>COUNTRY: <span className="text-slate-200 font-semibold">{activeDevice?.country === "IN" ? "🇮🇳 India" : "🇺🇸 USA"}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECOVERY CONTROLS, DUAL PHONE SEARCH TOOL, MAPS ENGINE (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
          
          {/* COMPANION TRACKER DEVICE CONSOLE (SECOND MOBILE APP FOR TESTING) */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-rose-950 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/10 shadow-xl space-y-4">
            
            {/* HAPTICS & NOTIFICATION TRAY INSIDE FINDER DEVICE DISPLAY */}
            {(() => {
              const isIos = activeDevice?.osType === 'iOS' || activeDevice?.deviceModel?.toLowerCase().includes('iphone');
              const unit = isIos ? 'miles' : 'km';
              const isWithinRange = proximityDistance <= 5.0;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-mono text-rose-400 font-bold flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Proximity Alerts Dashboard
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                      Radar Active
                    </span>
                  </div>

                  {/* PUSH NOTIFICATION TRAY (ALERT TRIGGERED IF WITHIN 5km/5miles RADIUS) */}
                  <div className="transition-all duration-500 overflow-hidden">
                    {isWithinRange ? (
                      <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-xl text-xs space-y-2 relative overflow-hidden animate-pulse shadow-md">
                        <div className="flex items-center justify-between border-b border-rose-900/60 pb-1.5">
                          <span className="font-extrabold text-rose-300 font-mono text-[10px] flex items-center gap-1">
                            🔔 PUSH NOTIFICATION ALERT
                          </span>
                          <span className="text-[9px] text-rose-400/80 font-mono">Just Now</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">
                          Lost phone belonging to <span className="text-rose-300 font-bold">{activeDevice?.ownerName || "Aarav Sharma"}</span> (<span className="text-rose-400 font-mono font-bold">{activeDevice?.ownerPhone || "+919876543210"}</span>) detected nearby!
                        </p>
                        <div className="bg-rose-950/90 text-rose-300 py-1 px-2.5 rounded font-mono text-[10px] flex justify-between items-center mt-1 border border-rose-900">
                          <span>📡 ADVANCED RADAR:</span>
                          <span className="font-extrabold animate-bounce text-amber-300">
                            {proximityDistance.toFixed(1)} {unit} (Within {isIos ? '5 miles' : '5 km'} Range)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 space-y-2 text-center text-[11.5px] leading-relaxed">
                        <span className="text-slate-500 block text-xs">📡 Out of Proximity Range</span>
                        No signal received in immediate {isIos ? '5 miles' : '5 km'} radius. Awaiting BLE secure mesh network find...
                      </div>
                    )}
                  </div>

                  {/* VIBRATOR FEEDBACK SIMULATOR DISPLAY */}
                  <div className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all duration-300 ${
                    isWithinRange 
                      ? 'bg-gradient-to-r from-rose-950/30 to-amber-950/20 border-amber-500/40' 
                      : 'bg-slate-900/40 border-slate-850'
                  }`}>
                    {isWithinRange ? (
                      <>
                        <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-spin">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 uppercase font-mono tracking-wide animate-pulse">
                            📳 FINDER PHONE VIBRATING
                          </span>
                          <p className="text-[10px] text-slate-300 leading-normal">
                            Finder phone vibrating continuously. Target is within the emergency {isIos ? '5.0 miles' : '5.0 km'} beacon boundary!
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                          <Radio className="w-5 h-5 opacity-40" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wide">
                            Haptics Silent
                          </span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Vibration is inactive. Bring the target device within {isIos ? '5.0 miles' : '5.0 km'} to fire alerts.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* RADAR CONFIGURATOR CONTROLLER SLIDER */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">📐 Simulate Radar Distance:</span>
                      <span className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                        isWithinRange ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-850 text-slate-400'
                      }`}>
                        {proximityDistance.toFixed(1)} {unit}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0.2"
                        max="12.0"
                        step="0.1"
                        value={proximityDistance}
                        onChange={(e) => setProximityDistance(parseFloat(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none focus:outline-none"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>0.2 {unit}</span>
                        <span className="text-rose-500 font-extrabold select-none">5.0 {unit} Threshold</span>
                        <span>12.0 {unit}</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

          </div>

          {/* DYNAMIC TRACKING VISUAL MAP CANVAS */}
          <InteractiveMap 
            device={activeDevice} 
            title={`Lost Device: ${activeDevice?.ownerName}'s ${activeDevice?.deviceModel}`}
          />

        </div>

      </main>

      {/* FOOTER BAR WITH BRIEF FEATURES COMPLIANT OUTLINE */}
      <footer className="bg-slate-950 border-t border-slate-850 py-3.5 px-6 mt-6 flex flex-wrap justify-between items-center text-slate-500 text-xs gap-4 shrink-0">
        <span className="font-mono">
          © Lost Phone Recovery Tracker Tool • Compliance MDM Simulation Interface
        </span>
        <div className="flex gap-4">
          <span className="text-slate-400 font-mono">⚡ Multi-Region: India/United States verified</span>
          <span className="text-slate-400 font-mono">🔐 Anti-Uninstall Lock</span>
          <span className="text-slate-400 font-mono">📶 Offline SMS Command Fallback Engine</span>
        </div>
      </footer>

      {/* CREATE NEW PHONE CUSTOM SIMULATOR DIALOG PROMPT MODAL */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddDeviceModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-base"
            >
              ✕
            </button>

            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5 mb-2">
              <Plus className="w-5 h-5 text-rose-500" /> Create Simulated Phone
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
              Provision a new mobile device for cross-platform simulation testing in either India or the US:
            </p>

            {addDeviceError && (
              <div className="bg-rose-950/50 border border-rose-900 text-rose-300 text-xs p-2.5 rounded-lg mb-4 font-mono">
                ❌ {addDeviceError}
              </div>
            )}

            <form onSubmit={handleCreatePhone} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">Mobile Phone Number (REQUIRED UNIQUE ID)</label>
                <input
                  type="text"
                  placeholder="e.g. +917012345678 or +12125550244"
                  value={customPhoneNum}
                  onChange={(e) => setCustomPhoneNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={customOwnerName}
                  onChange={(e) => setCustomOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Device Brand / Model</label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro Max, OnePlus 12"
                  value={customDeviceModel}
                  onChange={(e) => setCustomDeviceModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-mono">System Type</label>
                  <select 
                    value={customOsType} 
                    onChange={(e: any) => setCustomOsType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Android">Android Device</option>
                    <option value="iOS">iOS iPhone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 font-mono">Region (Bands)</label>
                  <select 
                    value={customCountry} 
                    onChange={(e: any) => setCustomCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="IN">India (+91)</option>
                    <option value="US">United States (+1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono font-bold mb-1">MDM Protection Passcode PIN</label>
                <input
                  type="text"
                  placeholder="PIN code (e.g. 1234)"
                  value={customPasscode}
                  onChange={(e) => setCustomPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  maxLength={10}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-center active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-center active:scale-95 transition-all uppercase tracking-wider"
                >
                  Create Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
