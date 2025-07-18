
import {
  objCache,
  DoneDiscount,
  TrackDiscount,
  API,
  userService,
  Discount,
  DiscountItem
} from '@/app/globalProvider';


export class CentralDataCollector {

  // Loading states
  public isLoading = false;
  public isInitialLoading = true;
  public isCentralLoading = false;

  private refreshInterval: number = 60; // Default 60 seconds
  private dataScheduler?: NodeJS.Timeout;
  announceLiveData: any;


  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.resetInitialLoad();
    this.refreshInterval = 60;

  }

  scheduleGetData(): void {
    this.dataScheduler = setInterval(async () => {
      console.log('Refreshing data');
      await this.getData();
      
    }, this.refreshInterval * 1000);
  }

  public cleanup(): void {
    if (this.dataScheduler) {
      clearInterval(this.dataScheduler);
      console.log('Data scheduler stopped');
    }
  }

  // Data fetching methods
  public async getCategories(): Promise<void> {

    try {
      const categories = await API.getCategories();
      objCache.resetObjCacheCategoryList();
      objCache.insertObjCacheCategoryList(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  // Data fetching methods
  public async getAllCategories(): Promise<void> {

    try {
      const categories = await API.getAllCategories();
      objCache.resetObjCacheAllCategoryList();
      objCache.insertObjCacheAllCategoryList(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }
  public async getKits(): Promise<void> {
    try {
      const kits = await API.getKits();
      objCache.resetObjCacheKitList();
      objCache.insertObjCacheKitList(kits);
    } catch (error) {
      console.error('Error fetching kits:', error);
    }
  }

  public async getDiscounts(): Promise<void> {
    DoneDiscount.resetDoneDiscount();
    await this.getAllDiscount();
  }

  public async getPremium(): Promise<void> {
    try {
      const premiumData = await API.getPremium();
      objCache.resetObjCachePremiumList();

      premiumData.forEach((products, category,) => {
        objCache.premiumList.set(category.name, products)
      });
      objCache.insertObjCachePremiumList(objCache.premiumList);
    } catch (error) {
      console.error('Error fetching premium data:', error);
    }
  }

  public async getBanners(): Promise<void> {
    try {
      const banners = await API.getBanners();
      objCache.resetObjCacheBannersList();
       objCache.insertObjCacheBannerList(banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  }

  public async getAllBanners(): Promise<void> {
    try {
      const banners = await API.getAllBanners();
      objCache.resetObjCacheAllBannersList();
      objCache.insertObjCacheAllBannersList(banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  }

  public async getStoreJobs(): Promise<void> {
    try {
      const jobs = await API.getJobs();
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  public async getAllProducts(): Promise<void> {
    try {
      const allProducts = await API.getAllProducts();
      objCache.resetObjCacheAllProducts();
      allProducts.forEach((products,category) => {
        objCache.allProducts.set(category.name, products);
      });
      objCache.insertObjCacheAllProducts(allProducts);

    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  public async getData(): Promise<void> {
    if (this.isInitialLoading) {
      this.isCentralLoading = true;
    }

    try {
      await Promise.all([
        this.getAnnounce(),
        this.getAllBanners(),
        this.getCategories(),
        this.getAllCategories(),
        this.getDiscounts(),
        this.getStorePriceRanges(),
        this.getPremium(),
        this.getAllNonPremiumProducts(),
        this.getAllProducts(),
        this.getKits(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (this.isInitialLoading) {
        this.isCentralLoading = false;
        this.isInitialLoading = false;
        
        
      }

      
    }
  }

  public resetInitialLoad(): void {
    this.isInitialLoading = true;
  }

  public async getStorePriceRanges(): Promise<void> {
    try {
      const priceRanges = await API.getStorePriceRanges();
      objCache.resetObjCachePriceRangeStream();
      objCache.insertObjCachePriceRangeStream(priceRanges);
    } catch (error) {
      console.error('Error fetching price ranges:', error);
    }
  }

  public async getAllNonPremiumProducts(): Promise<void> {
    try {
      const nonPremiumData = await API.getNonPremium();

      objCache.resetObjCacheNonPremiumList();

      nonPremiumData.forEach((products,category) => {
         objCache.nonPremiumList.set(category.name, products);
      });

      objCache.insertObjCacheNonPremiumList(objCache.nonPremiumList);
      
    } catch (error) {
      console.error('Error fetching non-premium products:', error);
    }
  }

  public async getAnnounce(): Promise<void> {
    try {
      const announcement = await API.getStoreAnnounce();
      this.announceLiveData.setValue(announcement);
      objCache.resetObjCacheAnnouncementStream();
      objCache.insertObjCacheAnnouncementStream(announcement)
    } catch (error) {
      console.error('Error fetching announcement:', error);
    }
  }

  public async getAllDiscount(): Promise<void> {
    try {
      const result = await API.getDiscounts();
      const hideDiscounts: string[] = [];
      
       const phoneNumber = userService.loggedInPhoneNumber;

      // if (!phoneNumber) {
      //   throw new Error('Logged in phone number is null');
      // }

      // Filter out removed discounts
      const discountsToRemove = Array.from(TrackDiscount.discountsTracker.keys())
        .filter(itemId => !result.some((discount:Discount) =>
          discount.id === itemId ||
          discount.getDiscountItems().some((item:DiscountItem) => item.id === itemId)
        ));

      discountsToRemove.forEach(discountId => {
        TrackDiscount.removeDiscountDetail(discountId);
        DoneDiscount.addDoneDiscount(discountId);
      });

      // Filter excluded discounts
      result.forEach((discount:Discount) => {
        if (discount.isDiscountExcludedToPhoneNumber(phoneNumber)) {
          console.log(`Discount is excluded to this user: ${discount.id}`);
          hideDiscounts.push(discount.id);
        }
      });

      const filteredDiscounts = result.filter((discount:Discount) =>
        !hideDiscounts.includes(discount.id)
      );

      // Separate expired and active discounts
      const now = Date.now();
      const notExpiredDiscounts = filteredDiscounts.filter((discount:Discount) =>
        (discount.discountEndDate?.getTime() || 0) >= now
      );

      const expiredDiscounts = filteredDiscounts.filter((discount:Discount) =>
        (discount.discountEndDate?.getTime() || 0) < now
      );

      // this.discountLiveData.setValue(notExpiredDiscounts);
      objCache.resetObjCacheDiscountList();
      objCache.insertObjCacheDiscountList(notExpiredDiscounts);

      // Update trackers
      notExpiredDiscounts.forEach((discount:Discount) => {
        TrackDiscount.insertDiscountDetail(discount.id, discount.discountEndDate);
        discount.getDiscountItems().forEach((item:DiscountItem) => {
          TrackDiscount.insertDiscountDetail(item.id, discount.discountEndDate);
        });
      });

      // Clean up expired discounts
      expiredDiscounts.forEach((discount:Discount) => {
        TrackDiscount.removeDiscountDetail(discount.id);
        DoneDiscount.addDoneDiscount(discount.id);
      });

      // Clean up hidden discounts
      hideDiscounts.forEach(discountId => {
        TrackDiscount.removeDiscountDetail(discountId);
        DoneDiscount.addDoneDiscount(discountId);
      });
      
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  }
}

// Singleton instance
export const centralDataCollector = new CentralDataCollector();