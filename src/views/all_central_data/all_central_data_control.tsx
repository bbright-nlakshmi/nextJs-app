import { Observable, Subject, BehaviorSubject, asyncScheduler } from 'rxjs';
//import { RateScheduler } from 'schedulers'; // Assuming you have a similar library for TS
//import { Get, Update } from 'some-rxjs-decorator'; // Assuming similar decorators for TS
import { BannerModel, Discount, DiscountItem, Category , StoreAnnounce} from '../../app/models/models';
import cron from 'node-cron';
import { TrackDiscount } from '@/app/providers/track_discount';
import {API } from '@/app/services/api.service';
import {userController} from '../user_auth/user_controller';

class LiveData<T> {
  private _subject: Subject<T>;
  
  constructor(initialValue: T) {
    this._subject = new BehaviorSubject<T>(initialValue);
  }
  
  get streamController(): Subject<T> {
    return this._subject;
  }
  
  // Add other LiveData methods as needed
}

class ObjCache {
  static resetObjCacheCategoryList(): void {
    // Implementation
  }
  
  static insertObjCacheCategoryList(categories: Category[]): void {
    // Implementation
  }
  
  static resetObjCacheDiscountList(): void {
    // Implementation
  }
  
  static insertObjCacheDiscountList(discounts: Discount[]): void {
    // Implementation
  }
  
  static refreshAllControllers(): void {
    // Implementation
  }
}



class DoneDiscount {
  static resetDoneDiscount(): void {
    // Implementation
  }
  
  static addDoneDiscount(id: string): void {
    // Implementation
  }
}



class AppSettings {
  static setting = {
    refreshInterval: '60' // Default value
  };
}

class AppBootStrap {
  static refreshCurrentStore(): Promise<void> {
    // Implementation
    return Promise.resolve();
  }
}

class Global {
  static logger = {
    i: (message: string) => console.log(message),
    e: (message: string) => console.error(message)
  };
}

class UserController {
  loggedInPhoneNumber: string | null = null;
}

class SearchPageController {
  onInit(): void {
    // Implementation
  }
}

//@Update // Decorator similar to GetX's update
class AllStoreCentralDataCollector {
  readonly bannerStream: LiveData<BannerModel[]> = new LiveData<BannerModel[]>([]);
  readonly discountLiveData: LiveData<Discount[]> = new LiveData<Discount[]>([]);
  readonly categoryStream: LiveData<Category[]> = new LiveData<Category[]>([]);
  readonly isLoading = { value: false };
  readonly isInitialLoading = { value: true };
  readonly isCentralLoading = { value: false };
  //dataScheduler!: RateScheduler;

  readonly isPopular = { value: false };
  readonly isListView = { value: true };

  readonly announceLiveData: LiveData<StoreAnnounce> = new LiveData<StoreAnnounce>(StoreAnnounce.emptyAnnounce());

  onInit(): void {
    this.resetInitialLoad();
    const refreshIntervalInSeconds = parseInt(AppSettings.setting.refreshInterval);
    //this.dataScheduler = new RateScheduler(1, { seconds: refreshIntervalInSeconds });
    this.scheduleGetData();
  }

  scheduleGetData(): void {

    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Running scheduler for every hour')
          await this.getData();
            await AppBootStrap.refreshCurrentStore();
            this.scheduleGetData();
      } catch (error) {
        console.error('Error triggering refresh:', error);
      }
    
     });
  }

  onClose(): void {
    //this.dataScheduler.stop();
    Global.logger.i('Data scheduler stopped');
  }

  getCategories(): Promise<void> {
    return API.getAllCategories().then((value) => {
      if (!this.categoryStream.streamController.closed) {
        this.categoryStream.streamController.next(value);
      }
      ObjCache.resetObjCacheCategoryList();
      ObjCache.insertObjCacheCategoryList(value);
    }).catch((error) => {
      if (!this.categoryStream.streamController.closed) {
        this.categoryStream.streamController.error(error);
      }
    });
  }

  async getDiscounts(): Promise<void> {
    DoneDiscount.resetDoneDiscount();
    await this.getAllDiscount();
  }

  getBanners(): Promise<void> {
    return API.getAllBanners().then((value) => {
      if (!this.bannerStream.streamController.closed) {
        this.bannerStream.streamController.next(value);
      }
    }).catch((error) => {
      if (!this.bannerStream.streamController.closed) {
        this.bannerStream.streamController.error(error);
      }
    });
  }

  async getData(): Promise<void> {
    if (this.isInitialLoading.value) {
      this.isCentralLoading.value = true;
    }
    try {
      await this.getAnnouce();
      await this.getBanners();
      await this.getCategories();
      await this.getDiscounts();
    } catch (e) {
      Global.logger.e(`Error fetching data: ${e}`);
    } finally {
      if (this.isInitialLoading.value) {
        this.isCentralLoading.value = false;
        this.isInitialLoading.value = false;
        //Get.find<SearchPageController>().onInit();
      }

      ObjCache.refreshAllControllers();
      
    }
  }

  resetInitialLoad(): void {
    this.isInitialLoading.value = true;
  }

  getAnnouce(): Promise<void> {
    return API.getStoreAnnounce().then((value) => {
      if (!this.announceLiveData.streamController.closed) {
        this.announceLiveData.streamController.next(value);
      }
    }).catch((error) => {
      if (!this.announceLiveData.streamController.closed) {
        this.announceLiveData.streamController.error(error);
      }
    });
  }

  async getAllDiscount(): Promise<void> {
    try {
      const result = await API.getAllDiscounts();
      const hideDiscounts: string[] = [];
      const userCntrl = userController;
      const phoneNumber = userCntrl.loggedInPhoneNumber;

      if (phoneNumber == null) {
        throw new Error('Logged in phone number is null');
      }

      const discountsToRemove: string[] = [];

      for (const itemId of TrackDiscount.discountsTracker.keys()) {
        const isItemInResult = result.some((element) => {
          if (element.id === itemId) {
            return true;
          } else {
            const discountItems = element.getDiscountItems();
            return discountItems.some((discountItem) => discountItem.id === itemId);
          }
        });

        if (!isItemInResult) {
          discountsToRemove.push(itemId);
        }
      }

      for (const discount of discountsToRemove) {
        TrackDiscount.removeDiscountDetail(discount);
        DoneDiscount.addDoneDiscount(discount);
      }

      for (const discount of result) {
        if (discount.isDiscountExcludedToPhoneNumber(phoneNumber)) {
          Global.logger.i(`Discount is excluded to this user: ${discount.id}`);
          hideDiscounts.push(discount.id);
        }
      }

      const filteredDiscounts = result.filter((discount) => {
        return !hideDiscounts.includes(discount.id);
      });

      const notExpiredDiscounts = filteredDiscounts
        .filter((element) => (element.discountEndDate?.getTime() ?? 0) >= 0);

      const expiredDiscounts = filteredDiscounts
        .filter((element) => (element.discountEndDate?.getTime() ?? 0) < 0);

      this.discountLiveData.streamController.next(notExpiredDiscounts);
      ObjCache.resetObjCacheDiscountList();
      ObjCache.insertObjCacheDiscountList(notExpiredDiscounts);

      for (const discount of notExpiredDiscounts) {
        TrackDiscount.insertDiscountDetail(discount.id, discount.discountEndDate);

        const discountItems = discount.getDiscountItems();
        for (const discountItem of discountItems) {
          TrackDiscount.insertDiscountDetail(discountItem.id, discount.discountEndDate);
        }
      }

      for (const discount of expiredDiscounts) {
        TrackDiscount.removeDiscountDetail(discount.id);
        DoneDiscount.addDoneDiscount(discount.id);
      }

      for (const discountId of hideDiscounts) {
        TrackDiscount.removeDiscountDetail(discountId);
        DoneDiscount.addDoneDiscount(discountId);
      }
    } catch (error) {
      if (!this.discountLiveData.streamController.closed) {
        this.discountLiveData.streamController.error(error);
      }
    }
  }

  updateView({ isList }: { isList: boolean }): void {
    this.isListView.value = isList;
    
  }

  updateStoreView({ isPopular }: { isPopular: boolean }): void {
    this.isPopular.value = isPopular;
    
  }

}
