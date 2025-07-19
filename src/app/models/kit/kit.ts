import { RatingModel, TaxModel, TaxGroupModel, Discount , KitProduct } from "@/app/models/models";

interface OrderKitItems {
  name: string;
  inKitSalePrice: number;
  inKitQuantity: number;
  img: string[];
  inKitCount: number;
  inKitCostPrice: number;
}

const TAX_CONDITION_LESS_THAN_OR_EQUAL_TO = 'less_than_or_equal_to';
const TAX_CONDITION_MORE_THAN_OR_EQUAL_TO = 'more_than_or_equal_to';
const TAX_CONDITION_IN_BETWEEN = 'in_between';
const INCLUSIVE_TAX = 'inclusive';

export class Kit {
  id: string;
  name: string;
  active: boolean;
  img: string[];
  label: string;
  isReturnable: boolean;
  sellingPrice: number;
  minCount: number;
  maxCount: number;
  stock: number;
  saleCount: number;
  acceptBackFill: boolean;
  rating: RatingModel;
  description: Record<string, any>[];
  creationTime: string;
  outOfStock: boolean;
  isAvailable: boolean;
  timingId: string;
  cartItemCount: number;
  cartPurchaseOptions: any[];
  cartPurchaseOptionStr: string;
  taxId: string;
  tax: TaxModel | undefined;
  taxType: string;
  storeId: string;
  discount: Discount | null;
  kitItems: KitProduct[];
  tags: string[];

  constructor({
    id,
    name,
    active,
    img,
    label,
    isReturnable,
    sellingPrice,
    minCount,
    maxCount,
    stock,
    saleCount,
    acceptBackFill,
    rating,
    description,
    creationTime,
    outOfStock,
    isAvailable,
    timingId,
    cartItemCount = 1,
    cartPurchaseOptions = [],
    cartPurchaseOptionStr = '',
    taxId,
    tax,
    taxType,
    storeId,
    discount = null,
    kitItems,
    tags,
  }: {
    id: string;
    name: string;
    active: boolean;
    img: string[];
    label: string;
    isReturnable: boolean;
    sellingPrice: number;
    minCount: number;
    maxCount: number;
    stock: number;
    saleCount: number;
    acceptBackFill: boolean;
    rating: RatingModel;
    description: Record<string, any>[];
    creationTime: string;
    outOfStock: boolean;
    isAvailable: boolean;
    timingId: string;
    cartItemCount?: number;
    cartPurchaseOptions?: any[];
    cartPurchaseOptionStr?: string;
    taxId: string;
    tax?: TaxModel | undefined;
    taxType: string;
    storeId: string;
    discount?: Discount | null;
    kitItems: KitProduct[];
    tags: string[];
  }) {
    this.id = id;
    this.name = name;
    this.active = active;
    this.img = img;
    this.label = label;
    this.isReturnable = isReturnable;
    this.sellingPrice = sellingPrice;
    this.minCount = minCount;
    this.maxCount = maxCount;
    this.stock = stock;
    this.saleCount = saleCount;
    this.acceptBackFill = acceptBackFill;
    this.rating = rating;
    this.description = description;
    this.creationTime = creationTime;
    this.outOfStock = outOfStock;
    this.isAvailable = isAvailable;
    this.timingId = timingId;
    this.cartItemCount = cartItemCount;
    this.cartPurchaseOptions = cartPurchaseOptions;
    this.cartPurchaseOptionStr = cartPurchaseOptionStr;
    this.taxId = taxId;
    this.tax = tax;
    this.taxType = taxType;
    this.storeId = storeId;
    this.discount = discount;
    this.kitItems = kitItems;
    this.tags = tags;
  }

  static copyWith(kit: Kit): Kit {
    return new Kit({
      id: kit.id,
      name: kit.name,
      active: kit.active,
      img: [...kit.img],
      label: kit.label,
      isReturnable: kit.isReturnable,
      sellingPrice: kit.sellingPrice,
      minCount: kit.minCount,
      maxCount: kit.maxCount,
      stock: kit.stock,
      saleCount: kit.saleCount,
      acceptBackFill: kit.acceptBackFill,
      rating: kit.rating,
      description: [...kit.description],
      creationTime: kit.creationTime,
      outOfStock: kit.outOfStock,
      isAvailable: kit.isAvailable,
      timingId: kit.timingId,
      cartItemCount: kit.cartItemCount,
      cartPurchaseOptions: [...kit.cartPurchaseOptions],
      cartPurchaseOptionStr: kit.cartPurchaseOptionStr,
      taxId: kit.taxId,
      tax: kit.tax,
      taxType: kit.taxType,
      storeId: kit.storeId,
      discount: kit.discount,
      kitItems: kit.kitItems,
      tags: [...kit.tags],
    });
  }

  toMap(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      store_id: this.storeId,
      active: this.active,
      img: this.img,
      is_returnable: this.isReturnable,
      selling_price: this.sellingPrice,
      min_count: this.minCount,
      max_count: this.maxCount,
      stock: this.stock,
      sale_count: this.saleCount,
      accept_back_fill: this.acceptBackFill,
      rating: this.rating.toMap(),
      creation_time: this.creationTime,
      is_discount: this.isDiscount(),
      cart_item_count: this.cartItemCount,
      cart_purchase_options: this.cartPurchaseOptions,
      cart_purchase_option_str: this.cartPurchaseOptionStr,
      timing_id: this.timingId,
      kit_items: this.kitItems.map(item => item.toMap()),
      tax_id: this.taxId,
      tax: this.tax,
      tax_type: this.taxType,
      discount: this.discount,
    };
  }

  static fromMap(map: Record<string, any>): Kit {
    const rating = map.rating ? RatingModel.fromMap(map.rating) : RatingModel.emptyRating();
    
    return new Kit({
      id: map.id,
      name: map.name,
      storeId: map.store_id,
      active: map.active,
      img: Array.isArray(map.img) ? map.img : [],
      isReturnable: map.is_returnable,
      sellingPrice: map.selling_price || 0,
      minCount: map.min_count || 0,
      maxCount: map.max_count || 0,
      stock: map.stock || 0,
      saleCount: map.sale_count || 0,
      acceptBackFill: map.accept_back_fill || false,
      rating,
      creationTime: map.creation_time || '',
      cartItemCount: map.cart_item_count || 1,
      cartPurchaseOptions: Array.isArray(map.cart_purchase_options) 
        ? [...map.cart_purchase_options] 
        : [],
      cartPurchaseOptionStr: map.cart_purchase_option_str || '',
      timingId: map.timing_id || '',
      label: map.label || '',
      description: Array.isArray(map.description) 
        ? [...map.description] 
        : [],
      discount: map.discount 
        ? (typeof map.discount === 'object' 
            ? map.discount 
            : Discount.fromMap(map.discount))
        : null,
      taxId: map.tax_id || '',
      tags: Array.isArray(map.tags) ? [...map.tags] : [],
      tax: map.tax 
        ? (typeof map.tax === 'object' 
            ? map.tax 
            : TaxModel.fromMap(map.tax))
        : null,
      kitItems: Array.isArray(map.kit_items)
        ? map.kit_items.map((item: any) => KitProduct.fromMap(item))
        : [],
      taxType: map.tax_type || '',
      outOfStock: map.out_of_stock || false,
      isAvailable: map.is_available || false,
    });
  }

  static emptyKit(): Kit {
    return new Kit({
      id: '',
      name: '',
      storeId: '',
      active: false,
      img: [],
      isReturnable: false,
      sellingPrice: 0,
      minCount: 0,
      maxCount: 0,
      stock: 0,
      saleCount: 0,
      acceptBackFill: false,
      rating: RatingModel.emptyRating(),
      creationTime: '',
      cartItemCount: 1,
      cartPurchaseOptions: [],
      cartPurchaseOptionStr: '',
      timingId: '',
      label: '',
      description: [],
      kitItems: [],
      taxId: '',
      tax: undefined,
      tags: [],
      discount: null,
      taxType: '',
      outOfStock: false,
      isAvailable: false,
    });
  }

  //getOrderKitItems(): OrderKitItems[] {
    //return this.getKitProducts();
    // return this.getKitProducts().map(item => ({
    //   name: item.name,
    //   inKitSalePrice: this.calculateKitProductPriceWithTax(item),
    //   inKitQuantity: item.inKitQuantity,
    //   img: item.img,
    //   inKitCount: item.inKitCount,
    //   inKitCostPrice: item.inKitCostPrice,
    // }));
  //}

  getKitProducts(): KitProduct[] {
    return [...this.kitItems];
  }

  getKitProductsCount(): number {
    return this.kitItems.length;
  }

  getKitTotalCount(): number {
    return this.kitItems.reduce((sum, item) => sum + item.inKitCount, 0);
  }

  getKitProductItems(): Record<string, any>[] {
    return this.kitItems.map(item => item.toMap());
  }

  removeProductFromKit(id: string): void {
    this.kitItems = this.kitItems.filter(item => item.id !== id);
  }

  getBasePrice({ cartQuantity = 1, cartPurchaseOptionStr = '' }: { 
    cartQuantity?: number; 
    cartPurchaseOptionStr?: string 
  }): number {
    return this.getPrice({ cartQuantity, purchaseOptionStr: '' });
  }

  getCostPrice({ quantity = 0 }: { quantity?: number } = {}): number {
    return this.kitItems.reduce((sum, item) => sum + item.getCostPrice(), 0) * quantity;
  }

  getDiscountPercentage(): boolean {
    return !!this.discount?.isDiscountPercent;
  }

  getDiscountStartDate(): string {
    return this.discount?.discountStartDate?.toISOString() || '';
  }

  getDiscountEndDate(): string {
    return this.discount?.discountEndDate?.toISOString() || '';
  }

  isDiscount(): boolean {
    return !!this.discount;
  }

  getDiscountName(): string {
    return this.discount?.name || '';
  }

  isTaxActive(): boolean {
    return !!this.tax?.active;
  }

  applyTaxList(tax: TaxGroupModel, amount: number, percentage: number, cartQuantity: number): number {
    const singleUnitPrice = amount / cartQuantity;
    let taxValue = 0;

    switch (tax.condition) {
      case TAX_CONDITION_LESS_THAN_OR_EQUAL_TO:
        if (singleUnitPrice <= tax.conditionPrice1) taxValue = percentage;
        break;
      case TAX_CONDITION_MORE_THAN_OR_EQUAL_TO:
        if (singleUnitPrice >= tax.conditionPrice1) taxValue = percentage;
        break;
      case TAX_CONDITION_IN_BETWEEN:
        if (singleUnitPrice >= tax.conditionPrice1 && singleUnitPrice <= tax.conditionPrice2) {
          taxValue = percentage;
        }
        break;
    }

    return (amount * taxValue) / 100;
  }

  getPrice({ cartQuantity = 0, purchaseOptionStr = '' }: { 
    cartQuantity?: number; 
    purchaseOptionStr?: string 
  } = {}): number {
    const quantity = cartQuantity === 0 ? this.cartItemCount : cartQuantity;
    const option = purchaseOptionStr === '' ? this.cartPurchaseOptionStr : purchaseOptionStr;
    
    return this.kitItems.reduce((sum, item) => sum + item.getItemPrice(), 0) * quantity;
  }

  getTaxAmountInCart(amount: number, cartQuantity: number): number {
    if (!this.isTaxActive()) return 0;

    return this.tax!.taxs.reduce((sum, taxGroup) => {
      return sum + taxGroup.tax.reduce((taxSum, taxRate) => {
        return taxSum + this.applyTaxList(taxGroup, amount, taxRate, cartQuantity);
      }, 0);
    }, 0);
  }

  calculateTaxAmountForKit(): number {
    if (!this.isTaxActive()) return 0;

    const discountedPrice = this.getPriceWithDiscount({ quantity: 1 });
    return this.tax!.taxs.reduce((sum, taxGroup) => {
      return sum + taxGroup.tax.reduce((taxSum, taxRate) => {
        return taxSum + this.applyTaxList(taxGroup, discountedPrice, taxRate, 1);
      }, 0);
    }, 0);
  }

  calculateKitProductPriceWithTax(product: KitProduct): number {
    const kitBasePrice = this.getPrice({ cartQuantity: 1 });
    if (kitBasePrice === 0) return 0;

    const discount = this.getDiscountAmountInCart({ quantity: 1, price: kitBasePrice });
    const discountedPrice = kitBasePrice - discount;
    const productDiscountedPrice = product.getItemPrice() * (discountedPrice / kitBasePrice);
    const productPercentageOfKit = product.getItemPrice() / kitBasePrice;

    if (!this.isTaxActive()) return productDiscountedPrice;

    if (this.taxType === INCLUSIVE_TAX) {
      const totalTaxAmount = this.calculateTaxAmountForKit();
      const productTaxAmount = totalTaxAmount * productPercentageOfKit;
      return productDiscountedPrice + productTaxAmount;
    }

    return productDiscountedPrice;
  }

  getBasePriceInCart({ cartQuantity = 0, purchaseOptionStr = '' }: { 
    cartQuantity?: number; 
    purchaseOptionStr?: string 
  } = {}): number {
    const price = this.getPrice({ cartQuantity, purchaseOptionStr });
    const discount = this.getPriceWithDiscount({ quantity: cartQuantity });

    if (this.taxType === INCLUSIVE_TAX) {
      return price + this.getTaxAmountInCart(discount, cartQuantity);
    }

    return price;
  }

  getDiscount(): number {
    return this.discount?.discount || 0;
  }

  getDiscountPriceInCart({ quantity = 0 }: { quantity?: number } = {}): number {
    const price = this.getPrice({ cartQuantity: quantity });
    const discount = this.getDiscountAmountInCart({ quantity, price });
    const discountedPrice = price - discount;

    if (this.taxType === INCLUSIVE_TAX) {
      return discountedPrice + this.getTaxAmountInCart(discountedPrice, quantity);
    }

    return discountedPrice;
  }

  getDiscountAmountInCart({ quantity = 0, price }: { 
    quantity?: number; 
    price: number 
  }): number {
    const qty = quantity === 0 ? this.cartItemCount : quantity;
    if (!this.isDiscount() || this.isDiscountExpired() || !this.isDiscountActive()) {
      return 0;
    }

    const discount = this.getDiscount();
    const isDiscountPercentage = this.getDiscountPercentage();

    return isDiscountPercentage 
      ? (price * discount) / 100 
      : qty * discount;
  }

  isDiscountNotExpired(): boolean {
    // Note: You'll need to implement Get.find<UserController>() equivalent in your Next.js app
    const userPhoneNumber = ''; // Replace with actual user phone number
    if (!this.discount) return false;

    const isExcluded = this.discount.isDiscountExcludedToPhoneNumber(userPhoneNumber);
    const isActive = this.discount.active;
    // Note: You'll need to implement TrackDiscount and DoneDiscount equivalents
    const isNotExpired = true; // Replace with actual implementation
    const isNotDone = true; // Replace with actual implementation

    return !isExcluded && !!isActive && isNotExpired && isNotDone;
  }

  getPriceWithDiscount({ quantity = 0 }: { quantity?: number } = {}): number {
    const price = this.getBasePrice({ cartQuantity: quantity });
    const discount = this.getDiscountAmount({ quantity });
    return price - discount;
  }

  getDiscountAmount({ quantity = 0 }: { quantity?: number } = {}): number {
    if (!this.isDiscount() || this.isDiscountExpired() || !this.isDiscountActive()) {
      return 0;
    }

    const price = this.getBasePrice({ cartQuantity: quantity });
    const discount = this.getDiscount();
    const isDiscountPercentage = this.getDiscountPercentage();

    return isDiscountPercentage 
      ? (price * discount) / 100 
      : discount * quantity;
  }

  isDiscountActive(): boolean {
    return !!this.discount?.active;
  }

  isDiscountExpired(): boolean {
    if (!this.isDiscount()) return false;

    const endDate = this.getDiscountEndDate();
    if (!endDate) return false;

    const now = new Date();
    const end = new Date(endDate);
    return now > end;
  }

  getSearchTags(): string[] {
    return [...this.tags];
  }

  getTaxType(): string {
    return this.startCase(this.taxType);
  }

  startCase(input: string): string {
    return input
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  isInStock(): boolean {
    return this.acceptBackFill || this.stock > 0;
  }

  isInOrderStock(quantity: number): boolean {
    return this.acceptBackFill || this.stock >= quantity;
  }

  isDiscountExcluded(phoneNumber: string): boolean {
    return this.discount?.isDiscountExcludedToPhoneNumber(phoneNumber) || false;
  }
}