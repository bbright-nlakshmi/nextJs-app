interface CartJson {
  id?: string;
  store_id: string;
  cart_item_count: number;
  cart_purchase_option_str: string;

  // schedule_type: string;
  // interval: number;
  // start_date: string;
  // end_date?: string | null;
  // selected_weekdays: string[] | string;
  // selected_months: string[] | string;
  // time_slots: string[] | string;
  // custom_timings: string[] | string;
}

export class CartModel {
  id: string;
  storeId: string;
  cartItemCount: number;
  cartPurchaseOptionStr: string;

  // scheduleType: string;
  // interval: number;
  // startDate: string;   // ISO format string
  // endDate?: string | null;
  // selectedWeekdays: string[];
  // selectedMonths: string[];
  // timeSlots: string[];
  // customTimings: string[];

  constructor({
    id,
    storeId,
    cartItemCount,
    cartPurchaseOptionStr,
    // scheduleType,
    // interval,
    // startDate,
    // endDate = null,
    // selectedWeekdays = [],
    // selectedMonths = [],
    // timeSlots = [],
    // customTimings = [],
  }: {
    id: string;
    storeId: string;
    cartItemCount: number;
    cartPurchaseOptionStr: string;
    // scheduleType: string;
    // interval: number;
    // startDate: string;
    // endDate?: string | null;
    // selectedWeekdays?: string[];
    // selectedMonths?: string[];
    // timeSlots?: string[];
    // customTimings?: string[];
  }) {
    this.id = id;
    this.storeId = storeId;
    this.cartItemCount = cartItemCount;
    this.cartPurchaseOptionStr = cartPurchaseOptionStr;
    // this.scheduleType = scheduleType;
    // this.interval = interval;
    // this.startDate = startDate;
    // this.endDate = endDate;
    // this.selectedWeekdays = selectedWeekdays;
    // this.selectedMonths = selectedMonths;
    // this.timeSlots = timeSlots;
    // this.customTimings = customTimings;
  }

  private static decodeList(value: any): string[] {
    try {
      if (typeof value === "string") {
        const decoded = JSON.parse(value);
        if (Array.isArray(decoded)) {
          return decoded.map((e) => String(e)).filter((e) => e.length > 0);
        }
      } else if (Array.isArray(value)) {
        return value.map((e) => String(e));
      }
    } catch {
      return [];
    }
    return [];
  }

  static fromMap(json: CartJson): CartModel {
    return new CartModel({
      id: json.id ?? "",
      storeId: json.store_id,
      cartItemCount: json.cart_item_count,
      cartPurchaseOptionStr: json.cart_purchase_option_str,
      // scheduleType: json.schedule_type,
      // interval: json.interval,
      // startDate: json.start_date,
      // endDate: json.end_date ?? null,
      // selectedWeekdays: this.decodeList(json.selected_weekdays),
      // selectedMonths: this.decodeList(json.selected_months),
      // timeSlots: this.decodeList(json.time_slots),
      // customTimings: this.decodeList(json.custom_timings),
    });
  }

  toMap(): CartJson {
    return {
      id: this.id,
      store_id: this.storeId,
      cart_item_count: this.cartItemCount,
      cart_purchase_option_str: this.cartPurchaseOptionStr,
      // schedule_type: this.scheduleType,
      // interval: this.interval,
      // start_date: this.startDate,
      // end_date: this.endDate,
      // selected_weekdays: this.selectedWeekdays,
      // selected_months: this.selectedMonths,
      // time_slots: this.timeSlots,
      // custom_timings: this.customTimings,
    };
  }

  toJsonObj() {
    return {
      id: this.id,
      store_id: this.storeId,
      cart_item_count: this.cartItemCount,
      cart_purchase_option_str: this.cartPurchaseOptionStr,
      // schedule_type: this.scheduleType,
      // interval: this.interval,
      // start_date: this.startDate,
      // end_date: this.endDate,
      // selected_weekdays: this.selectedWeekdays,
      // selected_months: this.selectedMonths,
      // time_slots: this.timeSlots,
      // custom_timings: this.customTimings,
    };
  }
}
