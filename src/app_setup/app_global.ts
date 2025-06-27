// lib/global.ts
import { logger } from '@/app/globalProvider'; // or any logger you prefer
import Cookies from 'js-cookie';
import { ReactNode, createContext } from 'react';

// Device info types
interface DeviceInfo {
  os: string;
  version: string;
  model: string;
  isPhysicalDevice: boolean;
  screenSize: string;
}

class Global {
  // Logger instance
  static readonly logger = logger;

  // Constants
  static readonly orderProgressKey = 'OrderProgress';
  
  // Device info
  static deviceInfo: DeviceInfo = {
    os: '',
    version: '',
    model: '',
    isPhysicalDevice: true,
    screenSize: '0 x 0'
  };

  // Pool implementation (using semaphore-like functionality)
  private static activeRequests = 0;
  private static maxConcurrent = 2;
  private static requestQueue: (() => void)[] = [];

  // Initialize device details
  static async setDeviceDetails(): Promise<void> {
    let details = '';
    
    // Detect browser/device info
    const userAgent = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
    
    // Basic device detection
    let os = 'unknown';
    if (/Android/i.test(userAgent)) os = 'Android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
    if (/Windows/i.test(userAgent)) os = 'Windows';
    if (/Mac/i.test(userAgent)) os = 'Mac';

    details += `${os}/`;
    details += `${userAgent.split(' ')[0]}/`; // Simplified model
    details += isMobile ? 'true' : 'false';
    details += `(${window.innerHeight} x ${window.innerWidth})`;

    this.deviceInfo = {
      os,
      version: '', // Would need a library for proper version detection
      model: userAgent,
      isPhysicalDevice: isMobile,
      screenSize: `${window.innerHeight} x ${window.innerWidth}`
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Device details:', details);
    }
  }

  // Order progress methods
  static async setOrderProgress(value: boolean): Promise<void> {
    try {
      // Using cookies (alternative: localStorage)
      Cookies.set(this.orderProgressKey, value.toString(), { expires: 1 }); // 1 day expiry
    } catch (e) {
      this.logger.error(`Unable to set order progress: ${e}`);
      throw new Error(`Unable to set order progress: ${e}`);
    }
  }

  static async isOrderProgress(): Promise<boolean> {
    try {
      const value = Cookies.get(this.orderProgressKey);
      return value === 'true';
    } catch (e) {
      this.logger.error(`Error getting order progress: ${e}`);
      return false;
    }
  }

  // Pool implementation for concurrency control
  static async withPool<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      await new Promise<void>(resolve => {
        this.requestQueue.push(resolve);
      });
    }

    this.activeRequests++;
    try {
      return await fn();
    } finally {
      this.activeRequests--;
      if (this.requestQueue.length > 0) {
        const next = this.requestQueue.shift();
        next?.();
      }
    }
  }
}

// React context for global state
export const GlobalContext = createContext({
  deviceInfo: Global.deviceInfo,
  setDeviceDetails: Global.setDeviceDetails,
  setOrderProgress: Global.setOrderProgress,
  isOrderProgress: Global.isOrderProgress
});

export default Global;