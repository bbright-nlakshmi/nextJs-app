import { TaxModel } from "../tax_model/tax_model";
import { CategoryProducts } from "../category_product/category_product";


export class Category {
  img: string[];
  name: string;
  sort: number;
  id: string;
  storeId: string;
  viewOption: string;
  viewOptionLabel: string;
  active: boolean;
  isAvailable: boolean;
  taxId: string;
  taxType: string;
  tax?: TaxModel;
  timingId: string;
  creationTime: string;
  category_products: CategoryProducts[];

  constructor({
    img,
    name,
    sort,
    id,
    storeId,
    viewOption,
    viewOptionLabel,
    active,
    isAvailable,
    taxId,
    taxType,
    tax,
    timingId,
    creationTime,
    category_products,
  }: {
    img: string[];
    name: string;
    sort: number;
    id: string;
    storeId: string;
    viewOption: string;
    viewOptionLabel: string;
    active: boolean;
    isAvailable: boolean;
    taxId: string;
    taxType: string;
    tax?: TaxModel;
    timingId: string;
    creationTime: string;
    category_products: CategoryProducts[];
  }) {
    this.img = img;
    this.name = name;
    this.sort = sort;
    this.id = id;
    this.storeId = storeId;
    this.viewOption = viewOption;
    this.viewOptionLabel = viewOptionLabel;
    this.active = active;
    this.isAvailable = isAvailable;
    this.taxId = taxId;
    this.taxType = taxType;
    this.tax = tax;
    this.timingId = timingId;
    this.creationTime = creationTime;
    this.category_products = category_products;
  }

  static fromMap(map: any): Category {
    return new Category({
      img: Array.isArray(map.img) ? map.img : [],
      name: map.name ?? '',
      sort: map.sort ?? 0,
      id: map.id ?? '',
      storeId: map.store_id ?? '',
      viewOption: map.view_option ?? '',
      viewOptionLabel: map.view_option_label ?? '',
      active: map.active ?? false,
      taxId: map.tax_id ?? '',
      taxType: map.tax_type ?? '',
      tax: map.tax ? TaxModel.fromMap(map.tax) : undefined,
      timingId: map.timing_id ?? '',
      creationTime: map.creation_time ?? '',
      category_products: Array.isArray(map.category_products)
        ? map.category_products.map((item: any) => CategoryProducts.fromMap(item))
        : [],
      isAvailable: map.is_available ?? false,
    });
  }

  toMap(): Record<string, any> {
    return {
      img: this.img,
      name: this.name,
      sort: this.sort,
      id: this.id,
      storeId: this.storeId,
      viewOption: this.viewOption,
      viewOptionLabel: this.viewOptionLabel,
      active: this.active,
      taxId: this.taxId,
      taxType: this.taxType,
      tax: this.tax ? this.tax.toJson() : null,
      timingId: this.timingId,
      creationTime: this.creationTime,
      category_products: this.category_products,
      isAvailable: this.isAvailable,
    };
  }

  getCategoryProducts(): CategoryProducts[] {
    return this.category_products;
  }

  getCategoryProductsCount(): number {
    return this.category_products.length;
  }

  isTaxActive(): boolean {
    return this.taxId.length > 0 && this.tax?.active === true;
  }
}


// models/CategoryRender.ts
export class CategoryRender {
  constructor(
    public readonly name: string,
    public readonly viewOption: string,
    public readonly img: string[], // Assuming images are URLs (strings)
    public readonly sort: number
  ) {}

  // Factory method to create from JSON/map
  public static fromMap(map: Record<string, any>): CategoryRender {
    return new CategoryRender(
      map['name'] || '',
      map['viewOption'] || map['view_option'] || 'grid',
      Array.isArray(map['img']) ? map['img'] : [],
      map['sort'] || map['category_sort'] || 0
    );
  }

  // Empty/default instance
  public static empty(): CategoryRender {
    return new CategoryRender('', 'grid', [], 0);
  }

  // Convert to plain object (for JSON serialization)
  public toMap(): Record<string, any> {
    return {
      name: this.name,
      viewOption: this.viewOption,
      img: this.img,
      sort: this.sort
    };
  }

  // Helper method to get first image or placeholder
  public getFirstImage(): string {
    return this.img.length > 0 ? this.img[0] : '/placeholder.jpg';
  }

  // Clone with overrides
  public copyWith({
    name,
    viewOption,
    img,
    sort
  }: {
    name?: string;
    viewOption?: string;
    img?: string[];
    sort?: number;
  }): CategoryRender {
    return new CategoryRender(
      name ?? this.name,
      viewOption ?? this.viewOption,
      img ?? [...this.img], // Shallow copy array
      sort ?? this.sort
    );
  }
}

