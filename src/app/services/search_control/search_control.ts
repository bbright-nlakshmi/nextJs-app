
import { EventEmitter } from 'events';
import { Kit, Product, Category, Tags, objCache } from '@/app/globalProvider'


export class SearchPageControl extends EventEmitter {
    // State properties
    kits: Kit[] = [];
    allKits: Kit[] = [];
    allProducts: any = [];
    products: Product[] = [];
    nonPremProducts: Product[] = [];
    premProducts: Product[] = [];
    allTags: string[] = [];
    categories: Category[] = [];
    tagsList?: Tags;
    searchStr: string = '';
    selectedTags: string[] = [];
    priceLowToHigh: boolean = true;
    minRatingFilter: number = 0;
    minPrice: number = 0;
    maxPrice: number = 1000;
    isPriceFilterActive: boolean = false;
    selectedMinPrice: number = 1;
    selectedMaxPrice: number = 10;
    showEmptySearchResult: boolean = false;
    shouldShowClear: boolean = true;

    // Text controller replacement for React
    searchInput: string = '';

    constructor() {
        super();
        this.initialize();
    }

    private initialize() {
        this.loadSearchData();
        this.setPriceRangeValues();
        this.resetSelectedRanges();
    }

    // State update method (replaces GetX's update)
    update() {
        this.emit('update');
    }

    setPriceLowToHigh(value: boolean) {
        this.priceLowToHigh = value;
        this.update();
    }

    updatePriceRange(lowerValue: number, upperValue: number) {
        this.selectedMinPrice = lowerValue;
        this.selectedMaxPrice = upperValue;
        this.isPriceFilterActive = true;
        this.update();
    }

    hasSearchResults(): boolean {
        return this.kits.length > 0 ||
            this.nonPremProducts.length > 0 ||
            this.premProducts.length > 0;
    }

    resetFilter() {
        this.searchInput = '';
        this.products = [];
        this.kits = [...this.allKits];
        this.setPriceRangeValues();
        this.resetSelectedRanges();
        this.priceLowToHigh = true;
        this.selectedTags = [];
        this.minRatingFilter = 0;
        this.update();
    }

    clearText() {
        this.searchInput = '';
        this.kits = [];
        this.selectedTags = [];
        this.products = [];
        this.showEmptySearchResult = false;
        this.resetSelectedRanges();
        this.update();
    }

    getSortedItems(ascending: boolean): (Product | Kit)[] {
        const items: (Product | Kit)[] = [
            ...this.nonPremProducts,
            ...this.premProducts,
            ...this.kits
        ];

        items.sort((a, b) => {
            const priceA = a.getBasePriceInCart();
            const priceB = b.getBasePriceInCart();
            return ascending ? priceA - priceB : priceB - priceA;
        });

        return items;
    }

    updateSelectedTags(tags: string[]) {
        this.selectedTags = tags;
        this.update();
    }

    loadSearchData() {
        this.getAllProducts();
        this.getKits();
        this.products = this.allProducts.values();
        this.allTags = this.getAllTags();
    }

   refreshGrid(str: string) {
    this.searchInput = str;
    this.searchStr = str.trim().toLowerCase();

    if (!this.searchStr) {
        this.kits = []; 
        this.products = Array.isArray(this.allProducts)
            ? this.allProducts
            : Array.from(this.allProducts.values()).flat();
        this.showEmptySearchResult = false;
        this.update();
        return;
    }

    const matchScore = (name: string): number => {
        const lowerName = name.toLowerCase();
        if (lowerName.startsWith(this.searchStr)) return 2;
        if (lowerName.includes(this.searchStr)) return 1;
        return 0;
    };

    const filterAndSort = <T extends { name: string }>(items: T[]): T[] => {
        return items
            .map(item => ({
                item,
                score: matchScore(item.name)
            }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(entry => entry.item);
    };

    // Filter kits
    this.kits = filterAndSort(this.allKits);

    const allProductsArray: Product[] = this.allProducts;
    this.products = filterAndSort(allProductsArray);

    // Show/hide "no results"
    this.showEmptySearchResult = this.kits.length === 0 && this.products.length === 0;

    this.update();
}

    convertAllProducts() {
        return this.allProducts instanceof Map
            ? Array.from(this.allProducts.values()).flat()
            : Array.isArray(this.allProducts)
                ? this.allProducts
                : [];
    }
    getAllProducts() {

        objCache.on('updateAllProducts', (data) => {
            this.allProducts = data instanceof Map
            ? Array.from(data.values()).flat()
            : Array.isArray(data)
                ? data
                : [];
            
            this.update();
        });

    }

  getKits() {
  objCache.on("updateKits", (kits) => {
    this.allKits = kits;

    // Only update visible kits if user is searching
    if (this.searchInput && this.searchInput.trim() !== "") {
      this.kits = [...kits]; // Reapply current filter or refresh
      this.refreshGrid(this.searchInput);
    }
    // Do NOT call this.update() unless you really want UI to refresh!
  });
}

    resetFilters() {
        this.setPriceRangeValues();
        this.resetSelectedRanges();
        this.priceLowToHigh = true;
        this.selectedTags = [];
        this.minRatingFilter = 0;
    }

    setPriceRangeValues() {
        const minProdPrice = this.allProducts.length > 0
            ? Math.min(...this.allProducts.map((e: Product) => e.getBasePriceInCart()))
            : 0;

        const maxProdPrice = this.allProducts.length > 0
            ? Math.max(...this.allProducts.map((e: Product) => e.getBasePriceInCart()))
            : 0;

        const minKitPrice = this.kits.length > 0
            ? Math.min(...this.kits.map(e => e.getBasePriceInCart()))
            : 0;

        const maxKitPrice = this.kits.length > 0
            ? Math.max(...this.kits.map(e => e.getBasePriceInCart()))
            : 0;

        this.minPrice = Math.min(minProdPrice, minKitPrice);
        this.maxPrice = Math.max(maxProdPrice, maxKitPrice);

        if (this.maxPrice <= this.minPrice) {
            this.maxPrice = this.minPrice + 1;
        }
    }

    resetSelectedRanges() {
        this.selectedMaxPrice = this.maxPrice === 0 ? 1 : this.maxPrice;
        this.selectedMinPrice = 0;
        this.isPriceFilterActive = false;
    }

    getAllTags(): string[] {
        const allTags = new Set<string>();

        objCache.getAllNonPremiumProducts().forEach(product => {
            product.getSearchTags().forEach(tag => allTags.add(tag));
        });

        objCache.getAllPremiumProducts().forEach(product => {
            product.getSearchTags().forEach(tag => allTags.add(tag));
        });

        objCache.getAllKits().forEach(kit => {
            kit.getSearchTags().forEach(tag => allTags.add(tag));
        });

        return Array.from(allTags);
    }

    getFilteredTags(pattern: string): string[] {
        return this.allTags.filter(tag =>
            tag.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    applyFilter() {
        this.update();
    }

    sortByPrice(): (Product | Kit)[] {
        const items: (Product | Kit)[] = [...this.products, ...this.kits];

        items.sort((a, b) => {
            const priceA = a.getBasePriceInCart();
            const priceB = b.getBasePriceInCart();
            return this.priceLowToHigh ? priceA - priceB : priceB - priceA;
        });

        return items;
    }

    filteredItems(): (Product | Kit)[] {
        const searchText = this.searchStr.toLowerCase();

        let filteredProducts = this.allProducts.filter((product: Product) => {
            const matchesSearch = searchText === '' ||
                product.name.toLowerCase().includes(searchText);
            const matchesTags = this.selectedTags.length === 0 ||
                this.selectedTags.some(tag => product.getSearchTags().includes(tag));
            const matchesPrice = !this.isPriceFilterActive ||
                (product.getBasePriceInCart() >= this.selectedMinPrice &&
                    product.getBasePriceInCart() <= this.selectedMaxPrice);
            const matchesRating = this.minRatingFilter === 0 ||
                product.rating.calculateRating() === this.minRatingFilter;

            return matchesSearch && matchesTags && matchesPrice && matchesRating;
        });

        let filteredKits = this.allKits.filter(kit => {
            const matchesSearch = searchText === '' ||
                kit.name.toLowerCase().includes(searchText);
            const matchesTags = this.selectedTags.length === 0 ||
                this.selectedTags.some(tag => kit.getSearchTags().includes(tag));
            const matchesPrice = !this.isPriceFilterActive ||
                (kit.getPrice() >= this.selectedMinPrice &&
                    kit.getPrice() <= this.selectedMaxPrice);
            const matchesRating = this.minRatingFilter === 0 ||
                kit.rating.calculateRating() === this.minRatingFilter;

            return matchesSearch && matchesTags && matchesPrice && matchesRating;
        });

        this.products = filteredProducts;
        this.kits = filteredKits;

        return this.sortByPrice();
    }

    getDetails(productId: string, eventName: string) {
      var foundItem;
             foundItem = objCache.getAllProducts().find((item: Product) => item.id == productId);

            if (foundItem) {
 
                if (eventName == 'getPrice')
                    return foundItem.getPrice();
                else if (eventName == 'getPriceWithDiscount')
                    return foundItem.getPriceWithDiscount();
                else if (eventName == 'getProductPrice')
                    return foundItem.getProductPrice();
                // else if (eventName == 'getProductById')
                //     return foundItem;

            }
        
        return 0;
    }
}

// Export a singleton instance or create new instances as needed
export const searchController = new SearchPageControl();