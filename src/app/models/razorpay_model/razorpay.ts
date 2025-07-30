export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  new (options: RazorpayOptions): RazorpayInstance;
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
}

declare global {
  interface Window {
    Razorpay: RazorpayInstance;
  }
}

export class RazorpayModel {
  id: string;
  keyId: string;
  secretkey: string;
  businessId: string;

  constructor(params: {
    id: string;
    keyId: string;
    secretkey: string;
    businessId: string;
  }) {
    this.id = params.id;
    this.keyId = params.keyId;
    this.secretkey = params.secretkey;
    this.businessId = params.businessId;
  }

  static fromMap(map: any): RazorpayModel {
    return new RazorpayModel({
      id: map?.id ?? '',
      keyId: map?.key_id ?? '',
      secretkey: map?.secret_key ?? '',
      businessId: map?.business_id ?? '',
    });
  }

  static empty(): RazorpayModel {
    return new RazorpayModel({
      id: '',
      keyId: '',
      secretkey: '',
      businessId: '',
    });
  }
}
