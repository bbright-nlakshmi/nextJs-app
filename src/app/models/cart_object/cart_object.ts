
import { OrderKitItems, Product, Kit } from '@/app/globalProvider'; // define or import this

export class CartObject {
  id: string;
  subProductId: string;
  name: string;
  choosedPrice: number;
  choosedQuantityStr: string;
  choosedQuantityNum: number;
  purchaseOptionIndex: number;
  purchaseOptionStepper: number;
  price: number;
  url: string;
  isProduct: boolean;
  isReturnable: boolean;
  product?: Product;
  kit?: Kit;
  orderKitItems: OrderKitItems[];
  saleQuantityStr: string;
  saleQuantity: string;

  constructor(params: {
    id: string;
    subProductId: string;
    name: string;
    choosedPrice: number;
    choosedQuantityStr: string;
    choosedQuantityNum: number;
    purchaseOptionIndex: number;
    purchaseOptionStepper: number;
    price: number;
    url: string;
    isProduct?: boolean;
    isReturnable: boolean;
    product?: Product;
    kit?: Kit;
    orderKitItems: OrderKitItems[];
    saleQuantityStr: string;
    saleQuantity: string;
  }) {
    this.id = params.id;
    this.subProductId = params.subProductId;
    this.name = params.name;
    this.choosedPrice = params.choosedPrice;
    this.choosedQuantityStr = params.choosedQuantityStr;
    this.choosedQuantityNum = params.choosedQuantityNum;
    this.purchaseOptionIndex = params.purchaseOptionIndex;
    this.purchaseOptionStepper = params.purchaseOptionStepper;
    this.price = params.price;
    this.url = params.url;
    this.isProduct = params.isProduct ?? true;
    this.product = params.product;
    this.kit = params.kit;
    this.isReturnable = params.isReturnable;
    this.orderKitItems = params.orderKitItems;
    this.saleQuantityStr = params.saleQuantityStr;
    this.saleQuantity = params.saleQuantity;
  }

  toMap(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      choosedPrice: this.choosedPrice,
      choosedQuantityStr: this.choosedQuantityStr,
      choosedQuantityNum: this.choosedQuantityNum,
      purchaseOptionIndex: this.purchaseOptionIndex,
      purchaseOptionStepper: this.purchaseOptionStepper,
      price: this.price,
      url: this.url,
      product: this.isProduct ? this.product?.toMap?.() : null,
      kit: this.isProduct ? null : this.kit?.toMap?.(),
      isReturnable: this.isReturnable,
      orderKitItems: this.orderKitItems.map(item => item.toJsonObj()),
      saleQuantityStr: this.saleQuantityStr,
      saleQuantity: this.saleQuantity,
    };
  }
}

export class NewCartObject {
  item: any;

  constructor(item: any) {
    this.item = item;
  }
}
