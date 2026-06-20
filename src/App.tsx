import React, { useState, useEffect } from "react";
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
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(true);

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-rose-500 selection:text-white">
      
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
            onClick={() => setShowAddDeviceModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Test Phone
          </button>
          
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden max-w-[1700px] mx-auto w-full">
        
        {/* HOW IT WORKS UNDERSTANDABLE USER GUIDE */}
        {showWalkthrough && (
          <div className="lg:col-span-12 bg-slate-950 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950">
            {/* Ambient glow decoration */}
            <div className="absolute right-0 top-0 w-[300px] h-full bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/30 shrink-0">
                  <HelpCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
                    <span>🌟 Easy Guide: How to Test & Find This Lost Phone (Even if Switched Off!)</span>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      Android & iOS versions (US/India)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                    Standard safety apps can easily be deleted or disconnected by smart thieves. This high-security shield demonstration shows how our app protects and finds target Android and iOS devices across the **US** and **India**, even when completely **offline**, **battery dead**, or **switched off**! <span className="text-indigo-300 italic font-medium">(If you hide this guide, click the "Learn How to Use" button in the header to bring it back anytime.)</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkthrough(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-all font-sans whitespace-nowrap active:scale-95"
              >
                Hide Guide ✕
              </button>
            </div>

            {/* STEP BY STEP INTERACTIVE FLOWS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800/80">
              
              {/* Step 1 */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/20 transition-all space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center font-sans">1</span>
                  <span className="font-bold text-xs text-slate-200">Try Deletion Protection</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Our special anti-theft block stops thieves from deleting the tracking app. 
                  <br />
                  <strong className="text-amber-400">Action:</strong> Click the amber <span className="text-amber-400 underline font-semibold">"Simulate App Uninstall"</span> button on the simulated mobile screen (center panel). Type in some random letters vs the correct passcode block on display stats!
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/20 transition-all space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center font-sans">2</span>
                  <span className="font-bold text-xs text-slate-200">Switch Off the Device</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  What if a thief powers off the phone? 
                  <br />
                  <strong className="text-rose-400">Action:</strong> Click <span className="text-rose-400 font-semibold underline">"Simulate Switch Off"</span> or drain battery below the screen. The screen goes black, but it triggers low-power <span className="text-emerald-400 font-semibold">Bluetooth Reserve Beacons</span> so nearby devices automatically route the location!
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/20 transition-all space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center font-sans">3</span>
                  <span className="font-bold text-xs text-slate-200">Track on Real Map</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Find any lost phone in India or US with dynamic location updates.
                  <br />
                  <strong className="text-emerald-400">Action:</strong> Look at the right column. Enter the phone number of your active simulator (e.g., <span className="font-mono text-slate-200 bg-slate-800 px-1 rounded">+917777700000</span> for Rohan's off iPhone) and hit <span className="text-emerald-400 font-semibold underline">"Locate Target Phone"</span> to locate on map!
                </p>
              </div>

            </div>
          </div>
        )}

        {/* LEFT COLUMN: ACTIVE RECOVERY STATUS / INTEL LOGS / SIMULATION TRACERS (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* SECURE DEVICE SWITCHER */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Target Devices
              </span>
              <span className="text-[11px] bg-slate-800 font-mono text-slate-400 px-2 py-0.5 rounded-full">
                {Object.keys(devices).length} Registered
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Select which mobile device simulator is currently representing the lost phone:
            </p>

            <div className="space-y-2 max-h-[185px] overflow-y-auto pr-1">
              {Object.entries(devices).map(([phone, entry]) => {
                const dev = entry as DeviceState;
                const isSelected = selectedPhoneNum === phone;
                return (
                  <button
                    key={phone}
                    onClick={() => {
                      setSelectedPhoneNum(phone);
                      setFoundTrackerDevice(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? "bg-rose-950/40 border-rose-600/75 shadow-rose-950/20 shadow-lg text-white"
                        : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white font-semibold transition-transform duration-200 ${
                        isSelected ? "bg-rose-600 scale-105" : "bg-slate-800 text-slate-400 group-hover:scale-105"
                      }`}>
                        {dev.osType === 'iOS' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <SmartphoneNfc className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          {dev.deviceModel}
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            dev.country === 'IN' ? 'bg-amber-600/30 text-amber-300' : 'bg-blue-600/30 text-blue-300'
                          }`}>
                            {dev.country}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          {dev.ownerPhone} • <span className="italic">{dev.ownerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {dev.isLocked && (
                        <span className="bg-amber-500/20 text-amber-400 p-1 rounded" title="Remote locked">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      {!dev.wifiConnected && !dev.cellularConnected ? (
                        <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono" title="No internet or cell data">
                          Offline Only
                        </span>
                      ) : (
                        <div className="flex gap-1 text-[11px] text-slate-500">
                          {dev.wifiConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIMULATED DEVICE SPECIFICATIONS */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl shrink-0">
            <h3 className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-bold mb-3 flex items-center gap-1.5 font-sans">
              <Info className="w-4 h-4" /> Device Key Information
            </h3>
            
            <p className="text-xs text-slate-400 mb-3 leading-snug">
              Every device is configured with specific parameters. Use the pin below to test the anti-uninstall shield:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Device OS Type</span>
                <span className="text-slate-200 font-bold flex items-center gap-1">
                  <span>{activeDevice.osType}</span>
                  <span className="text-[9.5px] text-slate-400 font-normal">(all versions)</span>
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-950 bg-gradient-to-br from-slate-900 to-indigo-950/20 text-indigo-200">
                <span className="text-[9px] text-indigo-400 block uppercase font-bold tracking-wider">Unlock PIN / Passcode</span>
                <span className="text-emerald-400 font-extrabold tracking-widest font-mono text-sm leading-none block mt-0.5">
                  🔑 {activeDevice.passcode}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Current Power</span>
                <span className={`font-bold flex items-center gap-1.5 ${activeDevice.batteryLevel < 20 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${activeDevice.batteryLevel < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  {activeDevice.batteryLevel}% Battery
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Phone Location Band</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <span className="text-base">{activeDevice.country === 'IN' ? '🇮🇳' : '🇺🇸'}</span>
                  <span className="font-semibold">{activeDevice.country === 'IN' ? 'India Region' : 'United States'}</span>
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-indigo-950/20 rounded-lg border border-indigo-900/40 text-[11px] text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-bold block mb-1">💡 Anti-Uninstall Test Instruction:</span>
              Thieves cannot delete this tracking app. If you click <strong className="text-amber-300">"Simulate Uninstall Request"</strong> in the phone, it hard-blocks the attempt and asks for PIN <strong className="font-mono text-emerald-400">{activeDevice.passcode}</strong>!
            </div>
          </div>

          {/* SECURE AUDIT EVENT LOGS */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl flex-1 min-h-[220px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Secure Audit Logs (Active Device)
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Live Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 font-mono">
                Historical records for client: <span className="text-slate-200">{activeDevice.ownerPhone}</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[280px]">
              {activeDevice.logs.map((log) => {
                let badgeColor = "bg-slate-800 text-slate-400";
                if (log.type === 'success') badgeColor = "bg-emerald-900/40 text-emerald-400 border border-emerald-800/60";
                if (log.type === 'warning') badgeColor = "bg-amber-900/40 text-amber-400 border border-amber-800/60";
                if (log.type === 'alert') badgeColor = "bg-rose-950 text-rose-400 border border-rose-800";

                return (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-850 text-[11px] font-mono flex gap-2.5 items-start">
                    <span className="text-slate-500 shrink-0 select-none text-[10px] mt-0.5">{log.timestamp}</span>
                    <div className="space-y-1">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold shrink-0 inline-block ${badgeColor}`}>
                        {log.type}
                      </span>
                      <p className="text-slate-300 leading-tight break-words">{log.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: INTERACTIVE DEVICE PHONE CASE SIMULATOR (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          
          <div className="relative w-full max-w-[340px] bg-slate-950 p-4 rounded-[40px] border-4 border-slate-850 shadow-2xl ring-1 ring-slate-800 flex flex-col select-none overflow-hidden h-[680px]">
            {/* PHONE SPEAKER/NOTCH HEADER */}
            <div className="w-full flex justify-between px-6 pb-2.5 pt-0.5 items-center bg-slate-950 absolute top-0 left-0 right-0 z-30 border-b border-slate-900">
              <span className="text-[10px] font-mono text-slate-400 font-bold">9:12 AM</span>
              <div className="w-16 h-3.5 bg-black rounded-full flex items-center justify-center relative">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full absolute left-4"></span>
              </div>
              <div className="flex gap-1.5 items-center text-slate-400 text-[10px]">
                {activeDevice.wifiConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
                <span className={`${activeDevice.batteryLevel < 20 ? 'text-rose-400 font-bold' : ''}`}>{activeDevice.batteryLevel}%</span>
              </div>
            </div>

            {/* SCREEN PORTAL CONTAINER */}
            <div className="flex-1 w-full bg-slate-900 rounded-[24px] mt-6 overflow-hidden flex flex-col relative border border-slate-800 shadow-inner">
              
              {/* LOCKSCREEN COVER SCREEN BYPASS SIMULATOR */}
              {activeDevice.isLocked && (
                <div className="absolute inset-0 bg-slate-950/95 z-25 flex flex-col items-center justify-between p-6 text-center animate-fade-in">
                  <div className="pt-8 space-y-2">
                    <div className="mx-auto w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center animate-pulse border border-amber-500/30">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-100">SIMULATED PHONE HARDLOCKED</h4>
                    <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
                      This mobile app has initiated immediate lockdown mode! Security algorithms have shut down the shell interface.
                    </p>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl">
                      <span className="text-[10px] text-slate-500 block font-mono">Simulated Device PIN Required</span>
                      <span className="text-xl font-mono text-emerald-400 font-bold tracking-widest">{activeDevice.passcode}</span>
                    </div>

                    <p className="text-[10px] text-amber-500 font-mono">
                      🔒 Enter PIN on the device to unlocked
                    </p>

                    <button
                      onClick={() => {
                        updateDeviceState(selectedPhoneNum, { isLocked: false });
                        addLog(selectedPhoneNum, 'success', 'Simulated on-device physical unlock success.');
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs tracking-wider transition-all"
                    >
                      ENTER CORRECT PIN
                    </button>
                  </div>

                  <div className="pb-4 font-mono text-[9px] text-slate-500">
                    Owner: {activeDevice.ownerName}
                  </div>
                </div>
              )}

              {/* SWITCHED OFF COVER SCREEN BYPASS SIMULATOR */}
              {activeDevice.isPoweredOff && (
                <div className="absolute inset-0 bg-black z-25 flex flex-col items-center justify-between p-6 text-center animate-fade-in">
                  <div className="pt-10 space-y-3">
                    <div className="mx-auto w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center animate-pulse border border-rose-500/30">
                      <Power className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-300 tracking-wider uppercase">Phone Switched Off</h4>
                    <div className="inline-block bg-rose-950/60 text-rose-400 rounded-full px-2 py-0.5 text-[9px] font-mono font-bold border border-rose-800">
                      🔋 Cryptographic Reserve Mode
                    </div>
                    <p className="text-[10px] text-slate-400 px-1 leading-relaxed">
                      Hardware is fully shut down. However, finding chips remain in low-power standby state.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-left w-full">
                    <span className="text-[10px] text-emerald-400 font-bold block font-mono flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
                      BLE Mesh Beaconing Active
                    </span>
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      This mobile continues transmitting offline encrypted tracking signals over Bluetooth Low Energy. Nearby participant smartphones or transit mesh systems securely route current coordinates.
                    </p>
                  </div>

                  <div className="space-y-2 w-full">
                    <button
                      onClick={() => {
                        updateDeviceState(selectedPhoneNum, { isPoweredOff: false, batteryLevel: 85 });
                        addLog(selectedPhoneNum, 'success', 'Device successfully rebooted to standard power loop.');
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95"
                    >
                      🔌 POWER ON TARGET
                    </button>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      Secure Find My Network • Active in {activeDevice.country === 'IN' ? 'India' : 'US'}
                    </span>
                  </div>
                </div>
              )}

              {/* PHONE ALERTERS BANNER BAR */}
              {activeDevice.isSirenRunning && (
                <div className="bg-rose-600 text-white text-[11px] font-bold p-1.5 flex items-center justify-between px-3 animate-pulse z-20 shadow-md">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-white rounded-full animate-ping"></span>
                    📢 ALARM SIREN RUNNING OUT LOUD
                  </span>
                  <button 
                    onClick={() => toggleSiren(selectedPhoneNum)}
                    className="bg-black/30 hover:bg-black/50 text-white text-[10px] px-2 py-0.5 rounded"
                  >
                    MUTE
                  </button>
                </div>
              )}

              {/* OFFLINE STATUS NOTIFICATION BANNER */}
              {!activeDevice.wifiConnected && !activeDevice.cellularConnected && (
                <div className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold p-1 text-center shrink-0 z-20">
                  ⚠️ OFFLINE MODE (No Internet/Cellular Data Link)
                </div>
              )}

              {/* MAIN SIMULATOR INNER APP SCREEN */}
              <div className="flex-1 flex flex-col p-4 bg-gradient-to-b from-slate-900 to-slate-950 overflow-y-auto">
                
                {/* Brand inside simulated software */}
                <div className="flex items-center justify-between mb-4 mt-1 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-500" />
                    <div>
                      <span className="text-[11px] font-extrabold tracking-tight text-white block">
                        LostRecovery APP
                      </span>
                      <span className="text-[8px] font-mono text-rose-400">
                        {activeDevice.version} • SECURE ACTIVE
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {activeDevice.osType}
                    </span>
                  </div>
                </div>

                {/* VISUAL GPS TRANSMITTER WIDGET inside the simulated app */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 text-center">
                  <div className="relative w-12 h-12 bg-rose-600/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-500/20">
                    <MapPin className="w-6 h-6 animate-bounce" />
                    <span className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping"></span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">SIMULATED LOCATION:</span>
                  <span className="text-[11px] font-bold text-rose-400 block font-mono">
                    {activeDevice.currentLat.toFixed(5)}° N, {activeDevice.currentLng.toFixed(5)}° E
                  </span>
                  
                  {/* Status pills inside the app */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2">
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      GPS: Active
                    </span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      Cross-Platform
                    </span>
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      Region: {activeDevice.country}
                    </span>
                  </div>
                </div>

                {/* APP HARDENED PROTECTION PANELS */}
                <div className="space-y-3 flex-1">
                  
                  {/* UNINSTALL SHIELD STATUS (HIGH INTENSITY COMPONENT) */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-rose-500/30 rounded-xl p-3 shadow-md relative overflow-hidden">
                    <div className="absolute right-0 top-0 text-slate-800/10 -mr-2">
                      <Shield className="w-16 h-16" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        Uninstall Protection
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold">
                        HARDLOCKED
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal mb-2.5">
                      OS MDM Administrative policies are locked down. Any attempt to uninstall or purge memory blocks requires immediate owner authorization token.
                    </p>

                    <button 
                      onClick={triggerUninstallAttempt}
                      className="w-full py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 hover:text-white border border-rose-500/40 rounded-lg text-[10px] font-mono transition-all flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Trash2 className="w-3 h-3" /> Simulate Uninstall Request
                    </button>
                  </div>

                  {/* UNINSTALL DIALOG POPUP / INCIDENT CONTROLLER */}
                  {uninstallRequestActive && (
                    <div className="bg-rose-950 border border-rose-500 rounded-xl p-3 text-left space-y-3.5 my-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          🛡️ MDM Shell Protection
                        </span>
                        <button 
                          onClick={() => setUninstallRequestActive(false)}
                          className="text-xs text-rose-300 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-[10px] text-rose-200 leading-tight">
                        Warning: App is configured as administrator. Enter correct security passcode to verify permissions and permit deletion:
                      </p>

                      <form onSubmit={handleVerifyUninstall} className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[9px] text-rose-300 mb-1">
                            <label className="font-mono">PASSCODE PIN ({activeDevice.ownerPhone}):</label>
                            <span className="font-bold underline text-slate-200">Tip: {activeDevice.passcode}</span>
                          </div>
                          <input
                            type="password"
                            placeholder="Type numerical/custom passcode"
                            value={uninstallPasscode}
                            onChange={(e) => setUninstallPasscode(e.target.value)}
                            className="w-full bg-black/50 border border-rose-500/50 rounded-md p-1 px-2 text-xs font-mono text-white text-center focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            maxLength={10}
                            required
                          />
                        </div>

                        {uninstallError && (
                          <div className="text-[9px] text-white bg-red-800 p-1 rounded font-mono leading-tight">
                            ❌ {uninstallError}
                          </div>
                        )}

                        {uninstallSuccessMsg && (
                          <div className="text-[9px] text-emerald-400 font-mono leading-tight bg-emerald-950 p-2 rounded border border-emerald-800">
                            ✓ {uninstallSuccessMsg}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[10px] uppercase tracking-wider transition-all"
                        >
                          CONFIRM UNINSTALL PASSCODE
                        </button>
                      </form>
                    </div>
                  )}

                  {/* CORE RECOVERY TELEMETRY (HYBRID SMS / CELL PROTOCOL) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-300 block mb-2 font-mono uppercase tracking-wider">
                      📶 Hybrid Connectivity Modules
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        onClick={forceToggleWifi}
                        className={`p-2 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
                          activeDevice.wifiConnected 
                            ? "bg-slate-950 border-emerald-500 text-emerald-400" 
                            : "bg-slate-950 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex justify-between w-full items-center mb-1">
                          <span>Wi-Fi Network</span>
                          {activeDevice.wifiConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3" />}
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {activeDevice.wifiConnected ? "Connected" : "Not reachable"}
                        </span>
                      </button>

                      <button
                        onClick={forceToggleCellular}
                        className={`p-2 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
                          activeDevice.cellularConnected 
                            ? "bg-slate-950 border-emerald-500 text-emerald-400" 
                            : "bg-slate-950 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex justify-between w-full items-center mb-1">
                          <span>Cellular Radio</span>
                          <Radio className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {activeDevice.cellularConnected ? "Pinging Tow" : "Not reachable"}
                        </span>
                      </button>
                    </div>

                    <div className="mt-2 text-[9px] text-slate-400 leading-normal bg-black/20 p-2 rounded font-mono border border-slate-850">
                      ℹ️ <span className="text-rose-400 font-bold">Fallback offline engine:</span> If cellular data or Wi-Fi fails entirely, remote tracks are transmitted securely utilizing background carrier SMS protocols (No data connection needed!).
                    </div>
                  </div>

                  {/* SYSTEM LOG PANEL INSIDE THE MOBILE PHONE */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Device Self-Diagnostics</span>
                    <div className="flex-1 max-h-[140px] overflow-y-auto text-[10px] font-mono bg-black p-2 rounded border border-slate-850 space-y-1">
                      <div className="text-slate-400 select-none text-[9px]">SYSTEM TERMINAL OUTPUT</div>
                      <div className="text-emerald-400">&gt; bootstrap.service - OK</div>
                      <div className="text-emerald-400">&gt; local_coordinate_watch - Active</div>
                      {!activeDevice.wifiConnected && !activeDevice.cellularConnected ? (
                        <div className="text-amber-400">&gt; fallback_dial_sms_listen - Active (Listening Offline)</div>
                      ) : (
                        <div className="text-slate-400">&gt; cloud_sockets_listen - Active</div>
                      )}
                      {activeDevice.isLocked ? (
                        <div className="text-rose-400 font-bold animate-pulse">&gt; LOCKDOWN PROTOCOL ACTIVE</div>
                      ) : (
                        <div className="text-slate-400">&gt; security_daemon - Locked Screen standby</div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* SIMULATED BUTTON TRAY FOR HARDWARE REENTRANCY */}
              <div className="bg-slate-950 p-2.5 border-t border-slate-850 flex items-center justify-around shrink-0 z-20">
                <button 
                  onClick={toggleScreenLock}
                  className={`p-2 rounded-xl transition-all ${
                    activeDevice.isLocked ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-900 text-slate-300'
                  }`}
                  title={activeDevice.isLocked ? "Unlock screen" : "Lock screen immediately"}
                >
                  <Lock className="w-4 h-4" />
                </button>

                {/* Simulated physical home button */}
                <button 
                  onClick={() => {
                    addLog(selectedPhoneNum, 'info', "Physical device home key triggered simulated view state refresh.");
                  }}
                  className="w-12 h-4 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                ></button>

                <button 
                  onClick={() => toggleSiren(selectedPhoneNum)}
                  className={`p-2 rounded-xl transition-all ${
                    activeDevice.isSirenRunning ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-900 text-slate-300'
                  }`}
                  title="Test anti-theft siren trigger"
                >
                  {activeDevice.isSirenRunning ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              onClick={triggerSimulatedLocationShift}
              className="py-1 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs border border-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 font-semibold"
            >
              🏃 Move Location
            </button>
            <button
              onClick={() => {
                const b = activeDevice.batteryLevel;
                const nextB = Math.max(0, b - 15);
                const isOffNow = nextB === 0;
                updateDeviceState(selectedPhoneNum, { 
                  batteryLevel: nextB,
                  isPoweredOff: isOffNow ? true : activeDevice.isPoweredOff,
                  wifiConnected: isOffNow ? false : activeDevice.wifiConnected,
                  cellularConnected: isOffNow ? false : activeDevice.cellularConnected
                });
                addLog(selectedPhoneNum, nextB < 20 ? 'alert' : 'warning', isOffNow 
                  ? "Device battery drained fully to 0%. Switched off automatically into secure BLE beacon standby." 
                  : `Device battery drained to ${nextB}% dynamically`
                );
              }}
              className="py-1 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs border border-slate-700 text-rose-300 rounded-lg flex items-center gap-1 font-semibold"
              title="Drain battery by 15% (Will automatically trigger Switched Off beacon state when reaching 0%)"
            >
              ⚡ Fast Battery Drain
            </button>
            <button
              onClick={() => {
                const nextOff = !activeDevice.isPoweredOff;
                updateDeviceState(selectedPhoneNum, { 
                  isPoweredOff: nextOff,
                  batteryLevel: nextOff ? 0 : 85,
                  wifiConnected: nextOff ? false : activeDevice.wifiConnected,
                  cellularConnected: nextOff ? false : activeDevice.cellularConnected
                });
                addLog(selectedPhoneNum, nextOff ? 'alert' : 'success', nextOff 
                  ? "Device Switched Off completely. Cryptographic BLE reserve beaconing initialized."
                  : "Device turned back on. Fully synced GPS & telemetry modules connected."
                );
              }}
              className={`py-1 px-3 active:scale-95 transition-all text-xs border rounded-lg flex items-center gap-1.5 font-semibold ${
                activeDevice.isPoweredOff 
                  ? "bg-emerald-950 border-emerald-500 text-emerald-400 animate-pulse" 
                  : "bg-rose-950/80 hover:bg-rose-900 border-rose-800/80 text-rose-300"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {activeDevice.isPoweredOff ? "Power ON Device" : "Simulate Switch Off"}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: RECOVERY CONTROLS, DUAL PHONE SEARCH TOOL, MAPS ENGINE (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* TRACK FROM ANOTHER DEVICE CONTROLLER (THE MULTI-PHONE INTERFACE KEY CONSTRAINTS) */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-rose-950 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/15 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Track From Other Phone
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                Dual Platform
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Enter any phone number below to locate it on the map, or click one of the quick buttons below to instantly track a target device:
            </p>

            <form onSubmit={handleTrackPhoneSearch} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter phone (e.g. +919876543210)"
                  value={trackInputPhone}
                  onChange={(e) => setTrackInputPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 pl-9 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                />
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              {/* QUICK INSTANT TRACK SELECTORS */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">🎯 Quick-Track Presets:</span>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setTrackInputPhone("+919876543210");
                      setFoundTrackerDevice(devices["+919876543210"]);
                      setTrackerSearchError("");
                    }}
                    className="w-full text-left p-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-850 hover:border-slate-800 flex items-center justify-between"
                  >
                    <span>🇮🇳 Priya's Android (Kolkata)</span>
                    <span className="font-mono text-[10px] text-indigo-400 font-semibold">+919876543210</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackInputPhone("+917777700000");
                      setFoundTrackerDevice(devices["+917777700000"]);
                      setTrackerSearchError("");
                    }}
                    className="w-full text-left p-1.5 px-2 bg-slate-900 hover:bg-rose-950/20 text-slate-300 rounded border border-slate-850 hover:border-slate-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1">
                      <span>🇮🇳 Rohan's iPhone (Mumbai)</span>
                      <span className="bg-rose-950 text-rose-400 text-[8px] px-1 rounded uppercase font-bold animate-pulse">Off BLE</span>
                    </span>
                    <span className="font-mono text-[10px] text-indigo-400 font-semibold">+917777700000</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackInputPhone("+14155552671");
                      setFoundTrackerDevice(devices["+14155552671"]);
                      setTrackerSearchError("");
                    }}
                    className="w-full text-left p-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-850 hover:border-slate-800 flex items-center justify-between"
                  >
                    <span>🇺🇸 Alex's iPhone (San Francisco)</span>
                    <span className="font-mono text-[10px] text-indigo-400 font-semibold">+14155552671</span>
                  </button>
                </div>
              </div>

              {trackerSearchError && (
                <div className="text-[11px] text-rose-400 font-mono bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg leading-relaxed">
                  ⚠️ {trackerSearchError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 font-extrabold text-white text-xs rounded-xl shadow-lg transition-transform active:scale-95 uppercase tracking-wider text-center"
                >
                  Locate Target Phone
                </button>
                {foundTrackerDevice && (
                  <button
                    type="button"
                    onClick={() => {
                      setFoundTrackerDevice(null);
                      setTrackInputPhone("");
                    }}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-xl"
                    title="Clear tracked device"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </form>

            {/* FOUND TARGET REAL-TIME COORDINATES */}
            {foundTrackerDevice && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-emerald-600/30 text-xs text-slate-300 space-y-3 relative overflow-hidden animate-fade-in">
                <div className="absolute right-0 top-0 text-emerald-500/10 -mr-2">
                  <Check className="w-16 h-16" />
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="font-bold text-white font-mono break-all">{foundTrackerDevice.ownerPhone}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase bg-emerald-950/40 px-2 py-0.5 rounded">
                    SUCCESS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-500 block">MODEL</span>
                    <span className="font-semibold text-slate-200">{foundTrackerDevice.deviceModel}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">OWNER</span>
                    <span className="font-semibold text-slate-200">{foundTrackerDevice.ownerName}</span>
                  </div>

                  {foundTrackerDevice.isPoweredOff ? (
                    <div className="col-span-2 p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-[10px] space-y-1 my-1">
                      <span className="text-rose-400 font-extrabold flex items-center gap-1.5 animate-pulse uppercase">
                        📴 POWER POWER-DOWN ACTIVE
                      </span>
                      <p className="text-[9.5px] text-slate-300 leading-normal">
                        This lost smartphone is physically <span className="text-rose-400 font-bold">TURNED OFF</span>. However, it continues broadcasting a dynamic cryptographic reserve Bluetooth signal. Nearby {foundTrackerDevice.country === 'IN' ? 'Indian' : 'US'} mesh nodes are securely routing coordinates automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="col-span-2 p-2 bg-emerald-950/20 border border-emerald-900/60 rounded-md text-[10px] space-y-0.5 my-1 px-2 py-1">
                      <span className="text-emerald-400 font-extrabold uppercase">
                        📶 Telemetry Links Online
                      </span>
                      <p className="text-[9.5px] text-slate-300">
                        Device is fully active. Tracking via standard cellular data / GPS constellation triangulation.
                      </p>
                    </div>
                  )}

                  <div className="col-span-2 p-2 bg-slate-950 rounded border border-slate-850 mt-1">
                    <span className="text-[9px] text-slate-500 block font-mono">LIVE GPS POSITION COORDS</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm block">
                      {foundTrackerDevice.currentLat.toFixed(5)}° N, {foundTrackerDevice.currentLng.toFixed(5)}° E
                    </span>
                    <span className="text-[9px] text-slate-400 italic block mt-0.5">
                      Country: {foundTrackerDevice.country === 'IN' ? 'India' : 'United States'} • Accuracy Guaranteed
                    </span>
                  </div>
                </div>

                {/* SATELLITE SHORTCUTS FROM TRACKING DEVICE */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      toggleSiren(foundTrackerDevice.ownerPhone);
                      setFoundTrackerDevice(devices[foundTrackerDevice.ownerPhone]);
                    }}
                    className={`py-1.5 px-2.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      foundTrackerDevice.isSirenRunning 
                        ? "bg-rose-600 text-white" 
                        : "bg-slate-800 text-rose-300 hover:bg-slate-700"
                    }`}
                  >
                    🔊 Remote Siren
                  </button>
                  <button
                    onClick={() => {
                      const nextLock = !foundTrackerDevice.isLocked;
                      updateDeviceState(foundTrackerDevice.ownerPhone, { isLocked: nextLock });
                      setFoundTrackerDevice(devices[foundTrackerDevice.ownerPhone]);
                      addLog(foundTrackerDevice.ownerPhone, nextLock ? 'alert' : 'success', `Screen remote lockdown initiated via other console.`);
                    }}
                    className={`py-1.5 px-2.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      foundTrackerDevice.isLocked 
                        ? "bg-amber-500 text-slate-900" 
                        : "bg-slate-800 text-amber-300 hover:bg-slate-700"
                    }`}
                  >
                    🔒 Remote Lock
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TELEPHONE Carrier SMS CLI Command Gateway fallback (Offline mode tester) */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <h3 className="text-xs uppercase tracking-widest font-mono text-indigo-400 font-bold mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" /> Offline Carrier SMS Gateway API
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Test how the phone handles emergency tracks when data networks are offline. Direct carrier SMS command structures trigger native OS kernels immediately:
            </p>

            <form onSubmit={handleSimulateSmsCommand} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. locate, lock 1234, siren on, siren off"
                  value={smsCommandMessage}
                  onChange={(e) => setSmsCommandMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-500 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Send className="w-3 h-3" /> Send SMS
                </button>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Direct to: {activeDevice.ownerPhone}</span>
                <span className="text-indigo-400">Works even with WIFI/LTE turned OFF</span>
              </div>
            </form>

            {/* CARRIER HISTORY SIMULATOR */}
            {smsHistory.length > 0 && (
              <div className="mt-3 max-h-[140px] overflow-y-auto space-y-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 font-mono text-[10px]">
                <span className="text-slate-500 uppercase block text-[9px]">Carrier SMS Message History Logs:</span>
                {smsHistory.map((h, i) => (
                  <div key={i} className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                    <p className="text-indigo-300">&gt; Command: "{h.text}"</p>
                    <p className="text-emerald-400 leading-normal pl-2 font-bold">↳ System response: {h.response}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC TRACKING VISUAL MAP CANVAS */}
          <InteractiveMap 
            device={foundTrackerDevice || activeDevice} 
            title={foundTrackerDevice ? `Lost Device: ${foundTrackerDevice.ownerName}'s ${foundTrackerDevice.deviceModel}` : `Live Simulated App Target: ${activeDevice.deviceModel}`}
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

    </div>
  );
}
