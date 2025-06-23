// lib/appSettings.ts
import { AppSettingsModel } from '@/app/globalProvider'; // You'll need to define this interface
import Cookies from 'js-cookie';

class AppSettings {
  private static setting: AppSettingsModel = this.getEmptyAppSettings();
  private static testingMode: boolean = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';

  private static getEmptyAppSettings(): AppSettingsModel {
    return AppSettingsModel.emptyAppSettings();
  }

  public static setAppSettings(m: AppSettingsModel): void {
    this.setting = m;
  }

  public static async setOnBoardingComplete(): Promise<void> {
    // Using cookies for web (alternative to localStorage)
    Cookies.set('onBoardingComplete', 'true', { expires: 365 }); // Expires in 1 year
    
    // Alternatively using localStorage:
    if (typeof window !== 'undefined') {
      localStorage.setItem('onBoardingComplete', 'true');
    }
  }

  public static async getOnBoardingComplete(): Promise<boolean> {
    // Check cookies first
    const cookieValue = Cookies.get('onBoardingComplete');
    if (cookieValue) return true;
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const localStorageValue = localStorage.getItem('onBoardingComplete');
      return localStorageValue === 'true';
    }
    
    return false;
  }
}

export default AppSettings;