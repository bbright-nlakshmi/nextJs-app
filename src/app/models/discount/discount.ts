import { DiscountItem } from "../models";
export class Discount {
  [x: string]: any;
  id: string;
  name?: string;
  details?: string;
  active?: boolean;
  img?: string[];
  isDiscountPercent?: boolean;
  discountStartDate?: Date;
  excludeUsers?: string[];
  creationTime?: string;
  itemSpecific?: boolean;
  discount?: number;
  discountItems: DiscountItem[];
  discountEndDate?: Date;

  constructor({
    id,
    name,
    details,
    active,
    img,
    isDiscountPercent,
    discountStartDate,
    excludeUsers,
    creationTime,
    itemSpecific,
    discount,
    discountEndDate,
    discountItems,
  }: {
    id: string;
    name?: string;
    details?: string;
    active?: boolean;
    img?: string[];
    isDiscountPercent?: boolean;
    discountStartDate?: Date;
    excludeUsers?: string[];
    creationTime?: string;
    itemSpecific?: boolean;
    discount?: number;
    discountEndDate?: Date;
    discountItems?: DiscountItem[];
  }) {
    this.id = id;
    this.name = name;
    this.details = details;
    this.active = active;
    this.img = img;
    this.isDiscountPercent = isDiscountPercent;
    this.discountStartDate = discountStartDate;
    this.excludeUsers = excludeUsers;
    this.creationTime = creationTime;
    this.itemSpecific = itemSpecific;
    this.discount = discount;
    this.discountEndDate = discountEndDate;
    this.discountItems = discountItems;
  }

  toMap(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      details: this.details,
      active: this.active,
      img: this.img,
      discount: this.discount,
      discount_end_date: this.discountEndDate?.toISOString(),
      discount_start_date: this.discountStartDate?.toISOString(),
      is_discount_percent: this.isDiscountPercent,
      exclude_users: this.excludeUsers,
      creation_time: this.creationTime,
      item_specific: this.itemSpecific,
      discount_items: this.discountItems?.map((item) => item.toMap()),
    };
  }

  static fromMap(map: Record<string, any>): Discount {
    return new Discount({
      id: map['id'],
      name: map['name'],
      details: map['details'],
      active: map['active'],
      img: map['img'] ? [...map['img']] : undefined,
      discount: map['discount'],
      discountEndDate: map['discount_end_date'] ? new Date(map['discount_end_date']) : undefined,
      discountStartDate: map['discount_start_date'] ? new Date(map['discount_start_date']) : undefined,
      isDiscountPercent: map['is_discount_percent'],
      excludeUsers: map['exclude_users'] ? [...map['exclude_users']] : undefined,
      creationTime: map['creation_time'],
      itemSpecific: map['item_specific'],
      discountItems: map['discount_items']
        ? map['discount_items'].map((item: any) => DiscountItem.fromMap(item))
        : undefined,
    });
  }

  static fromMapWithNoDiscountEndDate(map: Record<string, any>): Discount {
    return new Discount({
      id: map['id'],
      name: map['name'],
      details: map['details'],
      active: map['active'],
      img: map['img'],
      discount: map['discount'],
      discountEndDate: map['discountEndDate'],
      discountStartDate: map['discountStartDate'],
      isDiscountPercent: map['isDiscountPercent'],
      excludeUsers: map['excludeUsers'],
      creationTime: map['creationTime'],
      itemSpecific: map['itemSpecific'],
      discountItems: map['discount_items'].map((item: any) => DiscountItem.fromMap(item)),
    });
  }

  getDiscountItems(): DiscountItem[] {
    return (
      this.discountItems?.filter((item) => item.type === 'GOOD' || item.type === 'KIT') ?? []
    );
  }

  isDiscountExcludedToPhoneNumber(phoneNumber: string): boolean {
    return this.excludeUsers?.includes(phoneNumber) ?? false;
  }

  isDiscountActive(): boolean {
    return this.active ?? false;
  }

  isDiscount(): boolean {
    return this.isDiscountActive();
  }

  isDiscountNotExpired(): boolean {
    if (this.isDiscount()) {
      // You'll need to implement discountNotExpired function in TypeScript
      return discountNotExpired(this.id);
    }
    return false;
  }
}

// You'll need to implement this function or import it
function discountNotExpired(id: string): boolean {
  // Implementation goes here
  return false;
}