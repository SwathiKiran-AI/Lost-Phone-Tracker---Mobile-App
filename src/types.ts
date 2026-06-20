import React from "react";

// Initial mock device databases for user simulations in India and United States
export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
}

export interface SecuritySettings {
  uninstallProtectionEnabled: boolean;
  lockdownOnSimChange: boolean;
  stealthMode: boolean;
}

export interface DeviceState {
  appName: string;
  version: string;
  deviceModel: string;
  osType: 'iOS' | 'Android';
  ownerName: string;
  ownerPhone: string;
  country: 'IN' | 'US';
  passcode: string;
  isLocked: boolean;
  isLosingPower: boolean; // low battery warning state
  isPoweredOff: boolean; // simulated switch off state with Bluetooth BLE beacon tracking
  isSirenRunning: boolean;
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  lastUpdated: string;
  wifiConnected: boolean;
  cellularConnected: boolean;
  logs: LogEvent[];
  security: SecuritySettings;
}

export const INITIAL_DEVICES: Record<string, DeviceState> = {
  "+919876543210": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "Samsung Galaxy S24 Ultra",
    osType: 'Android',
    ownerName: "Aarav Sharma",
    ownerPhone: "+919876543210",
    country: 'IN',
    passcode: "1234",
    isLocked: false,
    isLosingPower: false,
    isPoweredOff: false,
    isSirenRunning: false,
    batteryLevel: 82,
    currentLat: 28.6139, // Delhi Area
    currentLng: 77.2090,
    lastUpdated: "Just Now",
    wifiConnected: true,
    cellularConnected: true,
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: true,
      stealthMode: false
    },
    logs: [
      { id: "1", timestamp: "09:00:00", type: "success", message: "Lost Phone Recovery Service background tracker daemon active" },
      { id: "2", timestamp: "09:05:00", type: "info", message: "Device successfully bound to secure region client in New Delhi, India" },
      { id: "3", timestamp: "09:12:00", type: "info", message: "App uninstall filter applied via administrative device-owner payload constraint" }
    ]
  },
  "+917777700000": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "Apple iPhone 15 Pro",
    osType: 'iOS',
    ownerName: "Rohan Gupta",
    ownerPhone: "+917777700000",
    country: 'IN',
    passcode: "8888",
    isLocked: false,
    isLosingPower: false,
    isPoweredOff: true, // Started as Switched Off to highlight BLE tracker features!
    isSirenRunning: false,
    batteryLevel: 0, // 0% state
    currentLat: 19.0760, // Mumbai Area
    currentLng: 72.8777,
    lastUpdated: "Just Now",
    wifiConnected: false,
    cellularConnected: false,
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: false,
      stealthMode: true
    },
    logs: [
      { id: "rohan-1", timestamp: "09:15:00", type: "warning", message: "Device physically powered off by unauthorized holder." },
      { id: "rohan-2", timestamp: "09:15:15", type: "alert", message: "Power-down intercepted! Switched to offline Find My Bluetooth Low Energy (BLE) Reserve Beaconing." }
    ]
  },
  "+14155552671": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "Apple iPhone 15 Pro Max",
    osType: 'iOS',
    ownerName: "Sarah Jenkins",
    ownerPhone: "+14155552671",
    country: 'US',
    passcode: "9999",
    isLocked: true,
    isLosingPower: false,
    isPoweredOff: false,
    isSirenRunning: false,
    batteryLevel: 41,
    currentLat: 37.7749, // San Francisco Area
    currentLng: -122.4194,
    lastUpdated: "3 mins ago",
    wifiConnected: false,
    cellularConnected: true,
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: false,
      stealthMode: true
    },
    logs: [
      { id: "101", timestamp: "08:45:00", type: "success", message: "App system framework active under simulated MDM Apple Configurator payload" },
      { id: "102", timestamp: "08:48:00", type: "warning", message: "Wi-Fi disconnected; tracking now operating through simulated cellular-tower triangulation" },
      { id: "103", timestamp: "08:52:00", type: "alert", message: "Lock Screen activated remotely from backup node" }
    ]
  },
  "+12125550199": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "Google Pixel 8 Pro",
    osType: 'Android',
    ownerName: "Jack Henderson",
    ownerPhone: "+12125550199",
    country: 'US',
    passcode: "4321",
    isLocked: false,
    isLosingPower: false,
    isPoweredOff: false,
    isSirenRunning: false,
    batteryLevel: 15,
    currentLat: 40.7128, // New York
    currentLng: -74.0060,
    lastUpdated: "5 mins ago",
    wifiConnected: false,
    cellularConnected: true,
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: true,
      stealthMode: false
    },
    logs: [
      { id: "301", timestamp: "08:31:00", type: "info", message: "Device registered at New York Hub" },
      { id: "302", timestamp: "08:58:00", type: "warning", message: "Battery alert: 15% remaining. Transmitting dynamic last-known-location beacon." }
    ]
  },
  "+918888888888": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "OnePlus 12",
    osType: 'Android',
    ownerName: "Priya Patel",
    ownerPhone: "+918888888888",
    country: 'IN',
    passcode: "5678",
    isLocked: false,
    isLosingPower: false,
    isPoweredOff: false,
    isSirenRunning: false,
    batteryLevel: 95,
    currentLat: 22.5726, // Kolkata Area
    currentLng: 88.3639,
    lastUpdated: "Just Now",
    wifiConnected: false,
    cellularConnected: false, // Totally Offline!
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: true,
      stealthMode: false
    },
    logs: [
      { id: "201", timestamp: "09:02:10", type: "success", message: "Service successfully setup" },
      { id: "202", timestamp: "09:05:00", type: "warning", message: "Device offline (No internet/cellular). Initialized fallback SMS listening protocol." }
    ]
  },
  "+919999988888": {
    appName: "Lost Phone Recovery DevApp",
    version: "v4.12.2 Pro",
    deviceModel: "Android Pixel 8 Pro",
    osType: 'Android',
    ownerName: "My Tracker Phone",
    ownerPhone: "+919999988888",
    country: 'IN',
    passcode: "1234",
    isLocked: false,
    isLosingPower: false,
    isPoweredOff: false,
    isSirenRunning: false,
    batteryLevel: 95,
    currentLat: 28.6100,
    currentLng: 77.2300,
    lastUpdated: "Just Now",
    wifiConnected: true,
    cellularConnected: true,
    security: {
      uninstallProtectionEnabled: true,
      lockdownOnSimChange: false,
      stealthMode: false
    },
    logs: [
      { id: "find-1", timestamp: "12:00:00", type: "success", message: "Tracker node established and registered automatically on install." }
    ]
  }
};
