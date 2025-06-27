export class StorePriceRanges {
  price_ranges: number[];

  constructor(priceRanges: number[]) {
    this.price_ranges = priceRanges;
  }

  static fromMap(map: Record<string, any>): StorePriceRanges {
    return new StorePriceRanges([...map['price_ranges']]);
  }

  toMap(): Record<string, any> {
    return {
      price_ranges: this.price_ranges,
    };
  }

  static emptyPriceRanges(): StorePriceRanges {
    return new StorePriceRanges([]);
  }
}
