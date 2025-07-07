import { Product, Kit, Discount, Category, Tags, PriceBetween, KitProduct, BannerModel, StorePriceRanges, StoreAnnounce, DiscountItem } from "@/app/models/models";
import EventEmitter from "events";
import { BehaviorSubject, Subject } from "rxjs";

interface allProductsProps {
  category: string,
  products: Product[];
}
// objCache.ts
export class ObjCache extends EventEmitter {
  public premiumList: Map<string, Product[]> = new Map();
  public nonPremiumList: Map<string, Product[]> = new Map();
  //public nonPremiumList: Product[] = [];
  public kitList: Kit[] = [];
  public allBannersList: BannerModel[] = [];
  public discountList: Discount[] = [];
  public discountProducts = new Subject<Discount[]>();
  public allCategories: Category[] = [];
  public allProducts: Map<string, Product[]> = new Map();
  public allProducstsList: Product[] = [];
  public priceRanges: StorePriceRanges | undefined;
  public announcement: StoreAnnounce | undefined;
  public tags: Tags | undefined;
  public refreshControllers: (() => void)[] = [];
  public categories: Category[];


  constructor() {
    super(); // Call the parent constructor
    // Add any custom properties or initialization here
    this.categories = [];
  }

  registerController(updateCallback: () => void) {

    //this.refreshControllers.push(updateCallback);
  }

  resetAllObjCaches() {
    this.premiumList.clear();
   // this.nonPremiumList.clear();
    this.kitList = [];
    this.discountList = [];
    this.discountProducts.next([])
    this.categories = [];
    this.allCategories = [];
    this.allProducts.clear();
    this.tags = Tags.emptyTags();
    this.removeAllListeners();
  }

  resetObjCachePremiumList() {
    this.premiumList = new Map();
  }

  resetObjCacheNonPremiumList() {
   // this.nonPremiumList = new Map();
  }

  resetObjCacheKitList() {
    this.kitList = [];
  }

  resetObjCacheDiscountList() {

    this.discountProducts.next([])
  }

  resetObjCacheCategoryList() {
    this.categories = [];

  }

  resetObjCacheAllCategoryList() {
    this.allCategories = [];

  }

  resetObjCacheTags() {
    this.tags = Tags.emptyTags();
  }

  insertObjCachePremiumList( lst: any) {
    //this.premiumList.set(key, lst);
    this.emit('updatePremiumList', lst);
    this.emit('update');
  }

  insertObjCacheNonPremiumList(lst: any) {
    
    this.emit('updateNonPremiumList', lst);
    this.emit('update');
  }

  insertObjCacheKitList(lst: Kit[]) {
    this.kitList = lst;
    this.emit('update');
    this.emit('updateKits', lst);
  }

  insertObjCacheDiscountList(lst: Discount[]) {
    this.discountList = lst;
    this.emit('update');
    this.emit('updateDiscountProducts', lst);
  }

  insertObjCacheAllBannersList(lst: BannerModel[]) {
    this.allBannersList = lst;
    this.emit('update');
    this.emit('updateAllBanners', lst);
  }

  insertObjCacheCategoryList(lst: Category[]) {
    this.categories = lst;
    this.emit('update');
    //this.categoryList.next(lst);
    this.emit('updateCategories', lst);
  }


  insertObjCacheAllProducts(lst: any) {
    
    this.allProducstsList = lst;
    this.emit('updateAllProducts', lst);
    this.emit('update');
    
  }


  insertObjCacheAllCategoryList(lst: Category[]) {
    this.allCategories = lst;
    this.emit('update');
    this.emit('updateAllCategories', lst)
    // console.log(lst)
    //this.allCategoryList.next(lst);
  }
  insertObjCachePriceRangeStream(lst: StorePriceRanges) {

    //this.priceRanges = lst;
    this.emit('UpdatePriceRanges', lst);
    this.emit('update');
  }

  insertObjCacheAnnouncementStream(lst: StoreAnnounce) {
    this.announcement = lst;
    this.emit('update');
    this.emit('UpdateAnnouncement', lst);

  }



  getProductDiscount(id: string): Discount | null {
    for (const discount of this.discountList) {
      for (const item of discount.getDiscountItems()) {
        if (item.id === id) {
          return discount;
        }
      }
    }
    return null;
  }

  insertObjCacheTags(t: Tags) {
    this.tags = t;
  }

  getTags(): Tags | undefined {
    return this.tags;
  }

  getProductsMatchingWithTag(name: string): number {
    let count = 0;

    this.premiumList.forEach((products) => {
     
       for (const product of products) {
        if (product.getSearchTags().includes(name)) {
          count++;
        }
      }
    });

    this.nonPremiumList.forEach((products) => {
      for (const product of products) {
        if (product.getSearchTags().includes(name)) {
          count++;
        }
      }
    });

    return count;
  }

  getKitById(id: string): Kit | null {
    return this.kitList?.find(k => k.id === id) || null;
  }

  getProductById(id: string): Product | null {
    var product;
   
      product = this.getAllPremiumProducts().find(p => p.id === id);
     
      if (product) return product;
    
      product = this.getAllNonPremiumProducts().find(p => p.id === id);
      if (product) return product;
   
    product = this.getAllProducts().find(p => p.id === id);
      if (product) return product;
     
    return null;
  }

  getCategoryProducts(str: string): Product[] {

    return this.premiumList.get(str) || this.nonPremiumList.get(str) || [];
  }

  getCategoryCount(str: string): number {
    return this.premiumList.get(str)?.length || this.nonPremiumList.get(str)?.length || 0;
  }

  getOtherCategoryProductsExcept(cateName: string, prdId: string): Product[] {
    const products = this.premiumList.get(cateName) || this.nonPremiumList.get(cateName) || [];
    return products.filter(element => !element.id.includes(prdId)).slice(0, 8);
  }

  getOtherKitsExcept(kitId: string): Kit[] {
    return this.kitList.filter(element => !element.id.includes(kitId));
  }

  getAllPremiumProducts(): Product[] {
    
    return Array.from(this.premiumList.values()).flat();
  }

  getAllNonPremiumProducts(): Product[] {
    return Array.from(this.nonPremiumList.values()).flat();
  }

  getAllProducts(): Product[] {
    return Array.from(this.allProducts.values()).flat();
  }

  getAllKits(): Kit[] {
    return this.kitList;
  }

  getAllDiscounts(): Discount[] {
    return this.discountList;
  }

  searchPremiumProducts(str: string): Product[] {
    const results: Product[] = [];
    const searchStr = str.toLowerCase();

    this.premiumList.forEach((products) => {
      for (const p of products) {
        const matchesDescription = p.description.some(map =>
          Object.values(map).some(value =>
            value.toString().toLowerCase().includes(searchStr)
          ));

        const matchProductName = p.name.toLowerCase().includes(searchStr);

        if (matchProductName || matchesDescription) {
          results.push(p);
        }
      }
    });

    return results;
  }

  searchNonPremiumProducts(str: string): Product[] {
    const results: Product[] = [];
    const searchStr = str.toLowerCase();

    this.nonPremiumList.forEach((products) => {
      for (const p of products) {
        const matchesDescription = p.description.some(map =>
          Object.values(map).some(value =>
            value.toString().toLowerCase().includes(searchStr)
          ));

        const matchProductName = p.name.toLowerCase().includes(searchStr);

        if (matchProductName || matchesDescription) {
          results.push(p);
        }
      }
    });

    return results;
  }

  searchKits(str: string): Kit[] {
    const results: Kit[] = [];
    const searchStr = str.toLowerCase();

    for (const p of this.kitList) {
      const matchesDescription = p.description.some((map: any) =>
        Object.values(map).some((value: any) =>
          value.toString().toLowerCase().includes(searchStr))
      );

      const matchesKitProduct = p.getKitProducts().some((kitProduct: KitProduct) =>
        kitProduct.name.toLowerCase().includes(searchStr)
      );

      const matchKitName = p.name.toLowerCase().includes(searchStr);

      if (matchKitName || matchesDescription || matchesKitProduct) {
        results.push(p);
      }
    }

    return results;
  }

  getItemsInPriceRange(filter: PriceBetween): (Product | Kit)[] {
    const results: (Product | Kit)[] = [];

    // Check kits
    for (const p of this.kitList) {
      const vPrice = p.getPrice();

      if (filter.before === -1) {
        if (vPrice <= filter.price) {
          results.push(p);
        }
      } else if (vPrice > filter.before && vPrice <= filter.price) {
        results.push(p);
      }
    }

    // Check premium products
    this.getAllPremiumProducts().forEach((p) => {
      
      const vPrice = p.getProductPrice();

      if (filter.before === -1) {
        if (vPrice <= filter.price) {
          results.push(p);
        }
      } else if (vPrice > filter.before && vPrice <= filter.price) {
        results.push(p);
      }
      
    });

    // Check non-premium products
    this.getAllNonPremiumProducts().forEach((p) => {
      
      const vPrice = p.getProductPrice();

      if (filter.before === -1) {
        if (vPrice <= filter.price) {
          results.push(p);
        }
      } else if (vPrice > filter.before && vPrice <= filter.price) {
        results.push(p);
      }
     
    });

    return results;
  }
  findProductById(pathId: string) {
    var found, foundItem;
    // this.allCategories.map((products: Category) => {

    //   found = products.category_products.findIndex((item: any) => item.productId === pathId);

    //   if (found != -1) {

    //      foundItem = products.category_products[found];
    //   }
    // });
    // console.log(foundItem);
    // if (foundItem) return foundItem;

    foundItem = this.getProductById(pathId)

    if (foundItem) return foundItem;
    
    //console.log(this.discountList)
    // this.discountList.map((products: Discount) => {

    //   found = products.discountItems.findIndex((item: DiscountItem) => item.id === pathId);

    //   if (found != -1) {
    //      foundItem = products.discountItems[found];
    //   }
    // });
    // if (foundItem) return foundItem;
    return null;

  }

    // In objCache.ts
getRecentlyAddedProducts(limit: number = 10): Product[] {
  // Get all products from all sources
  const allProducts = [
    // ...this.getAllPremiumProducts(),
    // ...this.getAllNonPremiumProducts(),
    ...this.getAllProducts()
  ];

  // Remove duplicates by creating a map with product IDs
  const uniqueProducts = new Map<string, Product>();
  allProducts.forEach(product => {
    if (!uniqueProducts.has(product.id)) {
      uniqueProducts.set(product.id, product);
    }
  });

  // Convert to array and sort by creationTime (newest first)
  const sortedProducts = Array.from(uniqueProducts.values()).sort((a, b) => {
    return new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime();
  });

  // Return limited number of products
  return sortedProducts.slice(0, limit);
}


}


export const objCache = new ObjCache();

