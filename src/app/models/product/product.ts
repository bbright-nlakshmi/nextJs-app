// models/Product.ts
import { DoneDiscount, TrackDiscount } from '@/app/globalProvider';
import { Discount, RatingModel, TaxGroupModel, TaxModel } from '@/app/models/models';
const INCLUSIVE_TAX = 'inclusive'; // Define your tax type constant

export class Product {
  // Core Product Properties
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly img: string[];
  readonly sort: number;
  readonly sellingDisplayOption: string;
  readonly sellingPrice: number;
  readonly costPrice: number;
  readonly rangeMargin: number;
  readonly rangeMarginIsPercent: boolean;
  readonly categoryID: string;
  readonly isReturnable: boolean;
  readonly acceptBackFill: boolean;
  readonly outOfStock: boolean;
  readonly description: Record<string, any>[];
  readonly saleMode: string;
  readonly sellingDisplayOptions: string[];
  readonly sellingPrices: number[];
  readonly costPrices: number[];
  readonly margin: any;
  readonly isMarginPercent: boolean;
  readonly finalPrice: number;
  readonly minCount: number;
  readonly maxCount: number;
  readonly priceUnitFlexible: number | null;
  readonly priceUnitRange: number | null;
  readonly active: boolean;
  readonly stock: number;
  readonly saleCount: number;
  readonly label: string;
  readonly isAvailable: boolean;

  // Kit Options
  readonly inKitQuantity: string;
  readonly inKitSalePrice: number;
  readonly inKitCount: number;

  // Product Details
  readonly rating: RatingModel;
  readonly mfgDate: string;
  readonly expDate: string;
  readonly creationTime: string;
  readonly categoryName: string;
  readonly timing: any;

  // Tax Information
  readonly taxType: string;
  readonly tax?: TaxModel;
  readonly discount?: Discount;
  readonly tags: string[];
  readonly brandName: string;

  // Cart Properties (Mutable)
  cartItemCount: number;
  cartPurchaseOptionStr: string;
  INCLUSIVE_TAX: string = INCLUSIVE_TAX;
  specs: {} ={};
  images: boolean = false;

  constructor(params: {
    id: string;
    storeId: string;
    name: string;
    img: string[];
    sort: number;
    sellingDisplayOption: string;
    sellingPrice: number;
    costPrice: number;
    rangeMargin: number;
    rangeMarginIsPercent: boolean;
    categoryID: string;
    isReturnable: boolean;
    acceptBackFill: boolean;
    description: Record<string, any>[];
    saleMode: string;
    sellingDisplayOptions: string[];
    sellingPrices: number[];
    costPrices: number[];
    margin: any;
    isMarginPercent: boolean;
    minCount: number;
    maxCount: number;
    priceUnitFlexible?: number | null;
    priceUnitRange?: number | null;
    active: boolean;
    stock: number;
    saleCount: number;
    label: string;
    inKitQuantity: string;
    inKitSalePrice: number;
    categoryName: string;
    rating: RatingModel;
    mfgDate: string;
    expDate: string;
    creationTime: string;
    timing: any;
    tax?: TaxModel;
    taxType: string;
    outOfStock: boolean;
    inKitCount: number;
    finalPrice: number;
    tags: string[];
    brandName: string;
    isAvailable: boolean;
    cartItemCount?: number;
    cartPurchaseOptionStr?: string;
    discount?: Discount;
  }) {
    // Initialize all properties
    this.id = params.id;
    this.storeId = params.storeId;
    this.name = params.name;
    this.img = params.img;
    this.sort = params.sort;
    this.sellingDisplayOption = params.sellingDisplayOption;
    this.sellingPrice = params.sellingPrice;
    this.costPrice = params.costPrice;
    this.rangeMargin = params.rangeMargin;
    this.rangeMarginIsPercent = params.rangeMarginIsPercent;
    this.categoryID = params.categoryID;
    this.isReturnable = params.isReturnable;
    this.acceptBackFill = params.acceptBackFill;
    this.description = params.description;
    this.saleMode = params.saleMode;
    this.sellingDisplayOptions = params.sellingDisplayOptions;
    this.sellingPrices = params.sellingPrices;
    this.costPrices = params.costPrices;
    this.margin = params.margin;
    this.isMarginPercent = params.isMarginPercent;
    this.minCount = params.minCount;
    this.maxCount = params.maxCount;
    this.priceUnitFlexible = params.priceUnitFlexible ?? null;
    this.priceUnitRange = params.priceUnitRange ?? null;
    this.active = params.active;
    this.stock = params.stock;
    this.saleCount = params.saleCount;
    this.label = params.label;
    this.inKitQuantity = params.inKitQuantity;
    this.inKitSalePrice = params.inKitSalePrice;
    this.categoryName = params.categoryName;
    this.rating = params.rating;
    this.mfgDate = params.mfgDate;
    this.expDate = params.expDate;
    this.creationTime = params.creationTime;
    this.timing = params.timing;
    this.taxType = params.taxType;
    this.outOfStock = params.outOfStock;
    this.inKitCount = params.inKitCount;
    this.finalPrice = params.finalPrice;
    this.tags = params.tags;
    this.brandName = params.brandName;
    this.isAvailable = params.isAvailable;
    this.cartItemCount = params.cartItemCount ?? 1;
    this.cartPurchaseOptionStr = params.cartPurchaseOptionStr ?? '';
    this.tax = params.tax;
    this.discount = params.discount;
  }

  // Factory method to create from JSON
  static fromJson(map: Record<string, any>, isPremium: boolean = false): Product {
    return new Product({
      id: map.id,
      storeId: map.store_id,
      name: map.name,
      img: Array.isArray(map.img) ? map.img.map(String) : [],
      sort: map.sort || 0,
      sellingDisplayOption: map.selling_display_option || '',
      sellingPrice: map.selling_price || 0,
      costPrice: map.cost_price || 0,
      rangeMargin: map.range_margin || 0,
      rangeMarginIsPercent: map.range_margin_is_percent || false,
      categoryID: map.category_id || '',
      categoryName: map.category_name || '',
      isReturnable: map.is_returnable || false,
      acceptBackFill: map.accept_back_fill || false,
      outOfStock: map.out_of_stock || false,
      description: Array.isArray(map.description) ? map.description : [],
      discount: map.discount ? Discount.fromMap(map.discount) : undefined,
      saleMode: map.sale_mode || '',
      sellingDisplayOptions: Array.isArray(map.selling_display_options)
        ? map.selling_display_options.map(String)
        : [],
      sellingPrices: Array.isArray(map.selling_prices)
        ? map.selling_prices.map(Number)
        : [],
      costPrices: Array.isArray(map.cost_prices)
        ? map.cost_prices.map(Number)
        : [],
      margin: map.margin,
      isMarginPercent: map.is_marginpercent || false,
      minCount: map.min_count || 0,
      maxCount: map.max_count || 0,
      priceUnitFlexible: map.price_unit_flexible ?? null,
      priceUnitRange: map.price_unit_range ?? null,
      stock: map.stock ?? 0,
      active: map.active || false,
      inKitSalePrice: map.in_kit_sale_price || 0,
      inKitQuantity: map.in_kit_quantity?.toString() || '',
      rating: map.rating
        ? RatingModel.fromMap(map.rating)
        : RatingModel.emptyRating(),
      saleCount: map.sale_count ?? 0,
      label: map.label || '',
      mfgDate: map.mfg_date || '',
      expDate: map.exp_date || ' ',
      creationTime: map.creation_time || '',
      timing: map.timing,
      taxType: map.tax_type || '',
      tax: map.tax ? TaxModel.fromMap(map.tax) : undefined,
      tags:
        map.tags && Array.isArray(map.tags)
          ? map.tags.map((tag: any) => tag.toString())
          : [],
      inKitCount: map.in_kit_count || 0,
      finalPrice: map.final_price || 0,
      cartItemCount: map.cart_item_count ?? 1,
      cartPurchaseOptionStr: map.cart_purchase_option_str || '',
      brandName: map.brand_name || '',
      isAvailable: map.is_available || false,
    });
  }

  // Convert to plain object
  toMap(): Record<string, any> {
    return {
      id: this.id,
      store_id: this.storeId,
      category_name: this.categoryName,
      category_id: this.categoryID,
      name: this.name,
      active: this.active,
      is_returnable: this.isReturnable,
      description: this.description,
      sale_mode: this.saleMode,
      min_count: this.minCount,
      max_count: this.maxCount,
      stock: this.stock,
      accept_back_fill: this.acceptBackFill,
      img: this.img,
      final_price: this.finalPrice,
      discount: this.discount?.toMap(),
      brand_name: this.brandName,
    };
  }

  // Create a copy with updated values
  copyWith(params: Partial<Product>): Product {
    return new Product({
      id: params.id ?? this.id,
      storeId: params.storeId ?? this.storeId,
      name: params.name ?? this.name,
      img: params.img ?? [...this.img],
      sort: params.sort ?? this.sort,
      sellingDisplayOption: params.sellingDisplayOption ?? this.sellingDisplayOption,
      sellingPrice: params.sellingPrice ?? this.sellingPrice,
      costPrice: params.costPrice ?? this.costPrice,
      rangeMargin: params.rangeMargin ?? this.rangeMargin,
      rangeMarginIsPercent: params.rangeMarginIsPercent ?? this.rangeMarginIsPercent,
      categoryID: params.categoryID ?? this.categoryID,
      isReturnable: params.isReturnable ?? this.isReturnable,
      acceptBackFill: params.acceptBackFill ?? this.acceptBackFill,
      description: params.description ?? [...this.description],
      saleMode: params.saleMode ?? this.saleMode,
      sellingDisplayOptions: params.sellingDisplayOptions ?? [...this.sellingDisplayOptions],
      sellingPrices: params.sellingPrices ?? [...this.sellingPrices],
      costPrices: params.costPrices ?? [...this.costPrices],
      margin: params.margin ?? this.margin,
      isMarginPercent: params.isMarginPercent ?? this.isMarginPercent,
      minCount: params.minCount ?? this.minCount,
      maxCount: params.maxCount ?? this.maxCount,
      priceUnitFlexible: params.priceUnitFlexible ?? this.priceUnitFlexible,
      priceUnitRange: params.priceUnitRange ?? this.priceUnitRange,
      active: params.active ?? this.active,
      stock: params.stock ?? this.stock,
      saleCount: params.saleCount ?? this.saleCount,
      label: params.label ?? this.label,
      inKitQuantity: params.inKitQuantity ?? this.inKitQuantity,
      inKitSalePrice: params.inKitSalePrice ?? this.inKitSalePrice,
      categoryName: params.categoryName ?? this.categoryName,
      rating: params.rating ?? this.rating,
      mfgDate: params.mfgDate ?? this.mfgDate,
      expDate: params.expDate ?? this.expDate,
      creationTime: params.creationTime ?? this.creationTime,
      timing: params.timing ?? this.timing,
      taxType: params.taxType ?? this.taxType,
      outOfStock: params.outOfStock ?? this.outOfStock,
      inKitCount: params.inKitCount ?? this.inKitCount,
      finalPrice: params.finalPrice ?? this.finalPrice,
      tags: params.tags ?? [...this.tags],
      brandName: params.brandName ?? this.brandName,
      isAvailable: params.isAvailable ?? this.isAvailable,
      cartItemCount: params.cartItemCount ?? this.cartItemCount,
      cartPurchaseOptionStr: params.cartPurchaseOptionStr ?? this.cartPurchaseOptionStr,
      tax: params.tax ?? this.tax,
      discount: params.discount ?? this.discount,
    });
  }

  // Empty product factory
  static empty(): Product {
    return new Product({
      id: '',
      name: '',
      storeId: '',
      img: [],
      sort: 0,
      sellingDisplayOption: '',
      sellingPrice: 0,
      costPrice: 0,
      rangeMargin: 0,
      rangeMarginIsPercent: false,
      categoryID: '',
      categoryName: '',
      isReturnable: false,
      acceptBackFill: false,
      outOfStock: false,
      description: [],
      saleMode: '',
      sellingDisplayOptions: [],
      sellingPrices: [],
      costPrices: [],
      margin: null,
      isMarginPercent: false,
      minCount: 0,
      maxCount: 0,
      priceUnitFlexible: null,
      priceUnitRange: null,
      stock: 0,
      active: false,
      inKitSalePrice: 0,
      inKitQuantity: '',
      rating: RatingModel.emptyRating(),
      saleCount: 0,
      label: '',
      mfgDate: '',
      expDate: '',
      creationTime: '',
      timing: null,
      taxType: '',
      tax: undefined,
      inKitCount: 0,
      finalPrice: 0,
      cartItemCount: 1,
      cartPurchaseOptionStr: '',
      tags: [],
      discount: undefined,
      brandName: '',
      isAvailable: false,
    });
  }

  // Price calculation methods
  getProductPrice(): number {
    if (this.saleMode === 'range') {
      return this.sellingPrice * this.minCount;
    } else if (this.saleMode === 'custom' || this.saleMode === 'flexible') {
      return this.sellingPrices.length > 0 ? this.sellingPrices[0] * this.minCount : 0;
    }
    return 0;
  }

  getPrice(params: { cartQuantity?: number; purchaseOptionStr?: string } = {}): number {
    const cartQuantity = params.cartQuantity ?? this.cartItemCount;
    const purchaseOptionStr = params.purchaseOptionStr ?? this.cartPurchaseOptionStr;

    if (this.saleMode === 'range') {
      return this.sellingPrice * cartQuantity;
    }

    let purchaseOptionIndex = 0;
    if (purchaseOptionStr && this.sellingDisplayOptions.includes(purchaseOptionStr)) {
      purchaseOptionIndex = this.sellingDisplayOptions.indexOf(purchaseOptionStr);
    }

    if (this.saleMode === 'custom' || this.saleMode === 'flexible') {
      return (this.sellingPrices[purchaseOptionIndex] || 0) * cartQuantity;
    }

    return 0;
  }

  // Discount methods
  isDiscountExpired(): boolean {
    if (!this.discount?.discountEndDate) return false;
    return new Date() > this.discount.discountEndDate;
  }

  getDiscountAmount(params: { cartQuantity?: number; purchaseOptionStr?: string } = {}): number {
    const cartQuantity = params.cartQuantity ?? this.cartItemCount;

    if (!this.discount || this.isDiscountExpired() || !this.discount.active) {
      return 0;
    }

    const price = this.getPrice(params);
    const discount = this.getDiscount();
    return this.discount.isDiscountPercent
      ? (price * discount) / 100
      : cartQuantity * discount;
  }

  getDiscount() {
    if (this.discount?.discount == null) {
      return 0;
    }
    return this.discount!.discount;
  }
  isDiscountActive(): boolean {
    if (!this.discount || this.discount.active == null) {
      return false;
    }
    return this.discount.active ?? false;
  }

  getDiscountName(): string {
    if (!this.discount || this.discount.name == null) {
      return '';
    }
    return this.discount.name ?? '';
  }

  getCostPrice(cartQuantity: number = 0, purchaseOptionStr: string = ''): number {
    // Use instance values if parameters are not provided
    const quantity = cartQuantity === 0 ? this.cartItemCount : cartQuantity;
    const option = purchaseOptionStr === '' ? this.cartPurchaseOptionStr : purchaseOptionStr;

    let purchaseOptionIndex = 0;
    if (option !== '') {
      purchaseOptionIndex = this.sellingDisplayOptions.findIndex(
        item => item === this.cartPurchaseOptionStr
      );
    }

    if (this.saleMode === 'SALE_MODE_RANGE') {
      return this.costPrice * quantity;
    } else if (this.saleMode === 'SALE_MODE_CUSTOM' || this.saleMode === 'SALE_MODE_FLEXIBLE') {
      return this.costPrices[purchaseOptionIndex] * quantity;
    }

    return 0;
  }

  getPriceWithDiscount(params: { cartQuantity?: number; purchaseOptionStr?: string } = {}): number {
    const price = this.getPrice(params);
    const discount = this.getDiscountAmount(params);
    return price - discount;
  }

  // Stock methods
  isInStock(): boolean {
    return this.acceptBackFill || this.stock > 0;
  }

  isInOrderStock(quantity: number): boolean {
    return this.acceptBackFill || this.stock >= quantity;
  }

  // Tax methods
  isTaxActive(): boolean {
    return !!this.tax?.active;
  }

  getTaxAmount(amount: number, cartQuantity: number): number {
    if (!this.isTaxActive() || !this.tax) return 0;

    let taxAmount = 0;
    for (const taxGroup of this.tax.taxs) {
      for (const taxRate of taxGroup.tax) {
        taxAmount += this.applyTax(taxGroup, amount, taxRate, cartQuantity);
      }
    }
    return taxAmount;
  }

  private applyTax(
    taxGroup: TaxGroupModel,
    amount: number,
    taxRate: number,
    cartQuantity: number
  ): number {
    const singleItemAmount = amount / cartQuantity;
    let shouldApplyTax = false;

    switch (taxGroup.condition) {
      case 'less_than_or_equal_to':
        shouldApplyTax = singleItemAmount <= taxGroup.conditionPrice1;
        break;
      case 'more_than_or_equal_to':
        shouldApplyTax = singleItemAmount >= taxGroup.conditionPrice1;
        break;
      case 'in_between':
        shouldApplyTax =
          singleItemAmount >= taxGroup.conditionPrice1 &&
          singleItemAmount <= taxGroup.conditionPrice2;
        break;
    }

    return shouldApplyTax ? (amount * taxRate) / 100 : 0;
  }

  getSearchTags(): string[] {
    return this.tags;
  }


  getBasePriceInCart(options: { cartQuantity?: number; purchaseOptionStr?: string } = {}): number {
    const { cartQuantity = 0, purchaseOptionStr = '' } = options;

    const price = this.getPrice({ cartQuantity, purchaseOptionStr });
    const discount = this.getPriceWithDiscount({ cartQuantity, purchaseOptionStr: '' });

    if (this.taxType === INCLUSIVE_TAX) {
      return price + this.getTaxAmountInCart(discount, cartQuantity);
    }

    return price;
  };

  getTaxAmountInCart(amount: number, cartQuantity: number): number {
    let taxAmount = 0.0;

    if (this.isTaxActive() && this.tax) {
      for (const taxItem of this.tax.taxs) {
        for (const taxRate of taxItem.tax) {
          taxAmount += this.applyTax(taxItem, amount, taxRate, cartQuantity);
        }
      }
    }

    return taxAmount;
  };

  getDiscountPriceInCart(options: { quantity?: number } = {}): number {
    const { quantity = 0 } = options;
    const price = this.getPrice({ cartQuantity: quantity, purchaseOptionStr: '' });
    const discount = this.getDiscountAmountInCart({ quantity, price });
    const discountedPrice = price - discount;

    if (this.taxType === this.INCLUSIVE_TAX) {
      return discountedPrice + this.getTaxAmountInCart(discountedPrice, quantity);
    }
    return discountedPrice;
  }

  isDiscount(): boolean {
    return this.discount != null;
  }

  getDiscountAmountInCart(options: { quantity?: number; price: number }): number {
    const { quantity = 0, price } = options;
    const actualQuantity = quantity === 0 ? this.cartItemCount : quantity;

    if (!this.isDiscount() || this.isDiscountExpired() || !this.isDiscountActive()) {
      return 0;
    }

    const discount = this.getDiscount();
    const isDiscountPercentage = this.getDiscountPercentage();

    if (isDiscountPercentage) {
      return (price * discount) / 100;
    }
    return actualQuantity * discount;
  }
   isDiscountNotExpired():boolean {
    const userPhoneNumber =  '8861821698';
    if (this.discount == null) return false;
    const isExcluded =
        this.discount?.isDiscountExcludedToPhoneNumber(userPhoneNumber);
    const isActive = this.discount?.active;
    const isNotExpired = TrackDiscount.getItemDiscountExpireSec(this.id) > 0;
    const isNotDone = !DoneDiscount.ids.includes(this.id);

    return !isExcluded! && isActive! && isNotExpired && isNotDone;
  }
  getDiscountPercentage():boolean {
    if (this.discount == null || this.discount?.isDiscountPercent == null) {
      return false;
    }
    return this.discount!.isDiscountPercent!;
  }

  getDiscountStartDate(): string {
    if (!this.discount || !this.discount.discountStartDate) {
      return '';
    }
    return this.discount.discountStartDate.toISOString();
  }

  // Convert Dart's getDiscountEndDate()
  getDiscountEndDate(): string {
    if (!this.discount || !this.discount.discountEndDate) {
      return '';
    }
    return this.discount.discountEndDate.toISOString();
  }

  getBasePrice(options: { cartQuantity?: number; purchaseOptionStr?: string } = {}): number {
    const { cartQuantity = 1, purchaseOptionStr = '' } = options;
    return this.getPrice({ cartQuantity, purchaseOptionStr });
  }

   isDiscountExcluded( phoneNumber:string):boolean {
    return this.discount?.isDiscountExcludedToPhoneNumber(phoneNumber) ?? false;
  }

}