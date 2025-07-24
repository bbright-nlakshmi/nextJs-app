// app-bootstrap.ts
import { StoreBaseDetails, BusinessDetails, AppLogo } from '@/app/models/models';
import { NotificationService } from '@/app/providers/notification/local_notification'; // Your notification utility
import * as API from '@/app/services/api.service'; // Your API service


export type MessageType = 'success' | 'error' | 'warning' | 'info';

class AppBootStrap {
  public static instance: AppBootStrap;
  public static store: StoreBaseDetails = StoreBaseDetails.emptyStore();
  public static appLogo: AppLogo = AppLogo.emptyAppLogo();
  public static businessDetails: BusinessDetails = BusinessDetails.emptyBusinessDetails();

  private constructor() {}

  public static saveStore(s: StoreBaseDetails): AppBootStrap {
    AppBootStrap.store = StoreBaseDetails.copy(s);
    return this.instance || (this.instance = new AppBootStrap());
  }

  public static saveBusiness(b: BusinessDetails): AppBootStrap {
    AppBootStrap.businessDetails = BusinessDetails.copy(b);
    return this.instance || (this.instance = new AppBootStrap());
  }

  public static saveAppLogo(a: AppLogo): AppBootStrap {
    AppBootStrap.appLogo = AppLogo.copy(a);
    return this.instance || (this.instance = new AppBootStrap());
  }

  public static getStoreBaseDetails(): StoreBaseDetails {
    return this.store;
  }

  public static getBusinessDetails(): BusinessDetails {
    return this.businessDetails;
  }

  public static getAppLogo(): AppLogo {
    return this.appLogo;
  }

  // public static async refreshCurrentStore(): Promise<void> {
  //   try {
  //     const storeDetails = await API.getCurrentStoreBaseDetails();
  //    this.store = storeDetails;
  //   } catch (err) {
  //     NotificationService.display({
  //             notification: {
  //               title: err instanceof Error ? err.message : String(err),
  //               body: 'refreshCurrentStore'
  //             }
  //           });
      
  //     throw err;
  //   }
  // }
}

export default AppBootStrap;