import { OrderKitItems } from '../order_kit_items/order_kit_items';
import { OrderStatus } from '../order_status/order_status';

export class OrderItemsModel {
  id: string;
  name: string;
  baseChoosedPrice: number;
  choosedPrice: number;
  collectedTax: number;
  costPrice: number;
  saleQuantityStr: string;
  saleQuantity: number;
  isProduct: boolean;
  isReturnable: boolean;
  url: string;
  rating: number;
  categoryName: string;
  categoryID: string;
  orderKitItems: OrderKitItems[];
  status?: OrderStatus;
  cartItemCount: number;

  constructor(params: {
    id?: string;
    name?: string;
    baseChoosedPrice?: number;
    choosedPrice?: number;
    collectedTax?: number;
    costPrice?: number;
    saleQuantityStr?: string;
    saleQuantity?: number;
    isProduct?: boolean;
    isReturnable?: boolean;
    url?: string;
    rating?: number;
    categoryName?: string;
    categoryID?: string;
    orderKitItems?: OrderKitItems[];
    status?: OrderStatus;
    cartItemCount?: number;
  }) {
    this.id = params.id ?? '';
    this.name = params.name ?? '';
    this.baseChoosedPrice = params.baseChoosedPrice ?? 0;
    this.choosedPrice = params.choosedPrice ?? 0;
    this.collectedTax = params.collectedTax ?? 0;
    this.costPrice = params.costPrice ?? 0;
    this.saleQuantityStr = params.saleQuantityStr ?? '';
    this.saleQuantity = params.saleQuantity ?? 0;
    this.isProduct = params.isProduct ?? false;
    this.isReturnable = params.isReturnable ?? false;
    this.url = params.url ?? '';
    this.rating = params.rating ?? 0;
    this.categoryName = params.categoryName ?? '';
    this.categoryID = params.categoryID ?? '';
    this.orderKitItems = params.orderKitItems ?? [];
    this.status = params.status;
    this.cartItemCount = params.cartItemCount ?? 0;
  }

  static fromMap(map: any): OrderItemsModel {
    return new OrderItemsModel({
      id: map.id,
      name: map.name,
      baseChoosedPrice: map.base_choosed_price,
      choosedPrice: map.choosed_price,
      costPrice: map.cost_price,
      saleQuantityStr: map.sale_quantity_str,
      saleQuantity: map.sale_quantity,
      isProduct: map.is_product,
      isReturnable: map.is_returnable,
      url: map.url,
      rating: map.rating,
      categoryName: map.category_name,
      categoryID: map.category_id,
      orderKitItems: Array.isArray(map.order_kit_items)
        ? map.order_kit_items.map((item: any) => OrderKitItems.fromMap(item))
        : [],
      status: map.status ? OrderStatus.fromMap(map.status) : undefined,
      cartItemCount: map.cart_item_count,
      collectedTax: map.collected_tax,
    });
  }

  toJsonObj(): any {
    return {
      id: this.id,
      name: this.name,
      base_choosed_price: this.baseChoosedPrice,
      choosed_price: this.choosedPrice,
      cost_price: this.costPrice,
      sale_quantity_str: this.saleQuantityStr,
      sale_quantity: this.saleQuantity,
      is_product: this.isProduct,
      is_returnable: this.isReturnable,
      url: this.url,
      rating: this.rating,
      category_name: this.categoryName,
      category_id: this.categoryID,
      order_kit_items: this.orderKitItems.map(item => item.toJsonObj()),
      status: this.status?.toJsonObj(),
      cart_item_count: this.cartItemCount,
      collected_tax: this.collectedTax,
    };
  }
}
