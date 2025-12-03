const SALE_MODE_RANGE = 'RANGE';
const SALE_MODE_CUSTOM = 'CUSTOM';
const SALE_MODE_FLEXIBLE = 'FLEXIBLE';

export class DiscountItem {
  id: string;
  name: string;
  img: string[];
  saleMode: string;
  type: string;
  sellingPrice: number;
  sellingPrices: number[];
  isDiscountPercent: boolean;
  discount: number;

  constructor(params: {
    id: string;
    name: string;
    img: string[];
    saleMode: string;
    type: string;
    sellingPrice: number;
    sellingPrices: number[];
    isDiscountPercent: boolean;
    discount: number;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.img = params.img;
    this.saleMode = params.saleMode;
    this.type = params.type;
    this.sellingPrice = params.sellingPrice;
    this.sellingPrices = params.sellingPrices;
    this.isDiscountPercent = params.isDiscountPercent;
    this.discount = params.discount;
  }

  static fromMap(map: any): DiscountItem {
    return new DiscountItem({
      id: map.id,
      name: map.name,
      img: Array.isArray(map.img) ? [...map.img] : [],
      saleMode: map.sale_mode,
      type: map.type || '',
      sellingPrice: map.selling_price ?? 0,
      sellingPrices: Array.isArray(map.selling_prices) ? [...map.selling_prices] : [],
      isDiscountPercent: map.is_discount_percent ?? false,
      discount: map.discount ?? 0,
    });
  }

  isDiscountItemKit(): boolean {
    return this.type === 'KIT';
  }

  getSalePrice(): number {
    return this.saleMode === SALE_MODE_RANGE ? this.sellingPrice : this.sellingPrices[0] ?? 0;
  }

  getPrice(): number {
    if (this.type === 'GOOD') {
      return this.getGoodSalePrice();
    } else {
      return this.getKitSalePrice();
    }
  }

  getGoodSalePrice(): number {
    if (this.saleMode === SALE_MODE_RANGE) {
      return this.sellingPrice;
    } else if (
      this.saleMode === SALE_MODE_CUSTOM ||
      this.saleMode === SALE_MODE_FLEXIBLE
    ) {
      return this.sellingPrices[0] ?? 0;
    }
    return 0;
  }

  getKitSalePrice(): number {
    return this.sellingPrice;
  }

  getDiscountAmount(): number {
    const currentPrice = this.getPrice();
    if (this.isDiscountPercent) {
      if (this.discount === 0) return 0;
      return currentPrice * (this.discount / 100);
    } else {
      if (this.discount === 0) return 0;
      return this.discount;
    }
  }

  getAfterDiscountAmount(): number {
    const currentPrice = this.getPrice();
    const discountAmount = this.getDiscountAmount();
    return currentPrice - discountAmount;
  }

  toMap(): any {
    return {
      id: this.id,
      name: this.name,
      img: this.img,
      sale_mode: this.saleMode,
      type: this.type,
      selling_price: this.sellingPrice,
      selling_prices: this.sellingPrices,
      is_discount_percent: this.isDiscountPercent,
      discount: this.discount,
    };
  }
}

export class SaveDiscountItemModel {
  id: string;
  isDiscountPercent: boolean;
  discount: number;
  type: string;

  constructor(params?: Partial<SaveDiscountItemModel>) {
    this.id = params?.id || '';
    this.isDiscountPercent = params?.isDiscountPercent || false;
    this.discount = params?.discount || 0;
    this.type = params?.type || '';
  }

  static fromJson(json: any): SaveDiscountItemModel {
    return new SaveDiscountItemModel({
      id: json.id ?? '',
      isDiscountPercent: json.is_discount_percent ?? false,
      discount: json.discount != null ? Number(json.discount) : 0,
      type: json.type ?? '',
    });
  }

  toJson(): any {
    return {
      id: this.id,
      is_discount_percent: this.isDiscountPercent,
      discount: this.discount,
      type: this.type,
    };
  }
}
