'use client'
import axios, { AxiosError, AxiosResponse } from 'axios';

import { NotificationService } from '@/app/providers/notification/local_notification';

import { appConfig } from '@/app/config';
import { logger } from '@/utils/logger';
import AppBootStrap from '@/app_setup/app_bootstrap';
import {
  AppCreditModel,
  AppLogo,
  AppSettingsModel,
  BannerModel,
  BusinessDetails,
  Category,
  CategoryRender,
  CouponModel,
  Discount,
  Job,
  Kit,
  LatLng,
  OnBoardingModel,
  OrderModel,
  OrderSummary,
  PrivacyModel,
  Product,
  RazorpayModel,
  ReturnsAndRefund,
  StoreAnnounce,
  StoreBaseDetails,
  StoreContactDetails,
  StorePriceRanges,
  TermsAndConditions,
  UserModel
} from '@/app/globalProvider';
import { useEffect } from 'react';




// Configuration
const API_BASE_URL = 'https://1rpapp.in/v1';
//const API_BASE_URL = 'https://devqarupeecomservice.rupeecom.in/v1';

const DEV_API_BASE_URL = 'https://devqarupeecomservice.rupeecom.in/v1';
const TENANT_SERVICE_URL = 'https://tenantservice.1rpapp.in/v1';

// Get tenantId from environment variables or config {dxrhudtb,5b547df0-967d-4aa4-8996-e02511c66e26} {owuhhrlb, b0aec458-86f7-4c29-8587-ec4271b9168c}
const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'etcnlzil';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'One Step Delivery';
const storeId = '5e2f938f-5d53-4f33-bfd1-1248acec2fc7';

export class APIService { 
  private static instance: APIService;
  private axiosInstance = axios.create();

  private constructor() {
    // Initialize axios instance with default config
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );

    
      NotificationService.initialize();
   
  }

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  // Helper method for GET requests
  private async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw new Error(`Unknown error: ${error}`);
    }
  }

  // Helper method for POST requests
  private async post<T>(url: string, data?: any, params?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw new Error(`Unknown error: ${error}`);
    }
  }

  // Helper method for PUT requests
  private async put<T>(url: string, data?: any, params?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw new Error(`Unknown error: ${error}`);
    }
  }

  // Banners
  async getBanners(): Promise<BannerModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-banners`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        const banners: BannerModel[] = [];
        for (const item of response.data) {
          try {
            banners.push(BannerModel.fromMap(item));
          } catch (e) {
            console.error(`Error parsing BannerModel for item: ${item.name ?? 'Unknown'}. Error: ${e}`);
          }
        }
        return banners;
      }
      return [];
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  }

  async getAllBanners(): Promise<BannerModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-All-banners`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data)) {
        const banners: BannerModel[] = [];
        for (const item of response.data) {
          try {
            banners.push(BannerModel.fromMap(item));
          } catch (e) {
            console.error(`Error parsing BannerModel for item: ${item.name ?? 'Unknown'}. Error: ${e}`);
          }
        }
        return banners;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all banners:', error);
      return [];
    }
  }

  // Business Details
  async getBusinessDetails(): Promise<BusinessDetails> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-business`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        return BusinessDetails.fromMap(response.data[0]);
      }
      throw new Error('No business details found');
    } catch (error) {
      console.error('Error fetching business details:', error);
      throw error;
    }
  }

  // Tenant Onboarding Status
  async getTenantOnboardingStatus(): Promise<string> {
    try {
      const response = await this.get<string>(`${DEV_API_BASE_URL}/get-tenant-onboarding-status`, {
        tenant_id: tenantId,
      });
      return response;
    } catch (error) {
      console.error('Error fetching tenant onboarding status:', error);
      throw error;
    }
  }

  // Stores
  async getStoresBaseDetails(): Promise<Map<string, StoreBaseDetails>> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-store-base-details`, {
        tenant_id: tenantId,
      });

      const stores = new Map<string, StoreBaseDetails>();
      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          try {
            const store = StoreBaseDetails.fromMap(item);
            stores.set(store.id, store);
          } catch (e) {
            console.error(`Error parsing StoreBaseDetails for item: ${item.name}. Error: ${e}`);
          }
        }
      }
      return stores;
    } catch (error) {
      console.error('Error fetching stores base details:', error);
      return new Map();
    }
  }

  public async getCurrentStoreBaseDetails(): Promise<StoreBaseDetails> {
    try {
      const response = await this.get<{ data: any }>(`${DEV_API_BASE_URL}/fetch-single-store-base-details`, {
        tenant_id: tenantId,
        store_id: storeId,
      });
      const stores = new Map<string, StoreBaseDetails>();
      return StoreBaseDetails.fromMap(response.data['data']);
      
      
    } catch (error) {
      console.error('Error fetching current store base details:', error);
      return AppBootStrap.store;
    }
  }

  // Store Announce
  async getStoreAnnounce(): Promise<StoreAnnounce> {
    try {
      const response = await this.get<{ data: any }>(`${DEV_API_BASE_URL}/fetch-store-announce`, {
        tenant_id: tenantId,
        store_id: storeId,
      });
      return StoreAnnounce.fromMap(response.data);
    } catch (error) {
      console.error('Error fetching store announce:', error);
      throw error;
    }
  }

  // Store Price Ranges
  async getStorePriceRanges(): Promise<StorePriceRanges> {
    try {
      const response = await this.get<{ data: any }>(`${DEV_API_BASE_URL}/fetch-store-price-ranges`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (response.data && response.data.price_ranges) {
        try {
          return StorePriceRanges.fromMap({ price_ranges: response.data.price_ranges });
        } catch (e) {
          console.error('Error parsing price ranges:', e);
          throw new Error('Invalid price ranges data.');
        }
      }
      throw new Error('Price ranges data is empty.');
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      throw error;
    }
  }

  // Store Contact Details
  async getStoreContactDetails(): Promise<StoreContactDetails> {
    try {
      let contactDetails = StoreContactDetails.emptyContactDetails();
      const response = await this.get<any[]>(`${DEV_API_BASE_URL}/get-app-settings`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response)) {
        for (const element of response) {
          try {
            contactDetails = StoreContactDetails.fromMap(element);
          } catch (e) {
            const errorMessage = `Error parsing StoreContactDetails: ${e}`;
            NotificationService.display({
              notification: {
                title: errorMessage,
                body: 'getStoreContactDetails'
              }
            });
          }
        }
      }
      return contactDetails;
    } catch (error) {
      console.error('Error fetching store contact details:', error);
      throw error;
    }
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-jobs`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((jobData) => {
            try {
              return Job.fromMap(jobData);
            } catch (e) {
              console.error(`Error parsing job data: ${JSON.stringify(jobData)}`);
              return null;
            }
          })
          .filter((job): job is Job => job !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  // Premium Products
  async getPremium(): Promise<Map<CategoryRender, Product[]>> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-premium-products`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      const premium = new Map<CategoryRender, Product[]>();
      for (const element of response.data) {
        try {
          const category = element.category_name;
          const viewOption = element.view_option;
          const img = element.category_image;
          const sort = element.category_sort;

          const sr = new CategoryRender(category, viewOption, sort, img);

          for (const p of element.products) {
            try {
              const product = Product.fromJson(p, true);
              if (!premium.has(sr)) {
                premium.set(sr, []);
              }
              premium.get(sr)?.push(product);
            } catch (e) {
              console.error(`Error parsing premium product: ${JSON.stringify(p)}`);
            }
          }
        } catch (e) {
          console.error(`Error parsing premium category: ${JSON.stringify(element)}`);
        }
      }
      return premium;
    } catch (error) {
      console.error('Error fetching premium products:', error);
      throw error;
    }
  }

  // Non-Premium Products
  async getNonPremium(): Promise<Map<CategoryRender,Product[]>> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-non-premium-products`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      const nonPremium = new Map<CategoryRender, Product[]>();
      for (const element of response.data) {
        try {
          const category = element.category_name;
          const viewOption = element.view_option;
          const img = element.category_image;
          const sort = element.category_sort;

          const sr = new CategoryRender(category, viewOption, sort, img);

          for (const p of element.products) {
            try {
              const product = Product.fromJson(p, false);
              if (!nonPremium.has(sr)) {
                nonPremium.set(sr, []);
              }
              nonPremium.get(sr)?.push(product);
            } catch (e) {
              console.error(`Error parsing non-premium product: ${JSON.stringify(p)}`);
            }
          }
        } catch (e) {
          console.error(`Error parsing non-premium category: ${JSON.stringify(element)}`);
        }
      }
      return nonPremium;
    } catch (error) {
      console.error('Error fetching non-premium products:', error);
      throw error;
    }
  }

  // All Products
  async getAllProducts(): Promise<Map<CategoryRender, Product[]>> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-all-products`, {
        tenant_id: tenantId,
      });

      const allProducts = new Map<CategoryRender, Product[]>();
      for (const element of response.data) {
        try {
          const category = element.category_name;
          const viewOption = element.view_option;
          const img = element.category_image;
          const sort = element.category_sort;

          const sr = new CategoryRender(category, viewOption, img,sort);

          if (!allProducts.has(sr)) {
            allProducts.set(sr, []);
          }

          for (const p of element.products) {
            try {
              const premiumProduct = Product.fromJson(p, true);
              const nonPremiumProduct = Product.fromJson(p, false);
              allProducts.get(sr)?.push(premiumProduct);
              allProducts.get(sr)?.push(nonPremiumProduct);
            } catch (e) {
              console.error(`Error parsing product: ${JSON.stringify(p)}`);
            }
          }
        } catch (e) {
          console.error(`Error parsing category: ${JSON.stringify(element)}`);
        }
      }
      return allProducts;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  }

  // Discounts
  async getDiscounts(): Promise<Discount[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-discounts-details`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((data) => {
            try {
              return Discount.fromMap(data);
            } catch (e) {
              console.error(`Error parsing discount: ${JSON.stringify(data)}`);
              return null;
            }
          })
          .filter((discount): discount is Discount => discount !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching discounts:', error);
      throw error;
    }
  }

  async getAllDiscounts(): Promise<Discount[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-all-discounts`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((data) => {
            try {
              return Discount.fromMap(data);
            } catch (e) {
              console.error(`Error parsing discount: ${JSON.stringify(data)}`);
              return null;
            }
          })
          .filter((discount): discount is Discount => discount !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all discounts:', error);
      throw error;
    }
  }

  // Kits
  async getKits(): Promise<Kit[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-kits`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((kitData) => {
            try {
              return Kit.fromMap(kitData);
            } catch (e) {
              console.error(`Error parsing kit: ${JSON.stringify(kitData)}`);
              return null;
            }
          })
          .filter((kit): kit is Kit => kit !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching kits:', error);
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-active-categories`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((categoryData) => {
            try {
              return Category.fromMap(categoryData);
            } catch (e) {
              console.error(`Error parsing category: ${JSON.stringify(categoryData)}`);
              return null;
            }
          })
          .filter((category): category is Category => category !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/fetch-all-categories`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((categoryData) => {
            try {
              return Category.fromMap(categoryData);
            } catch (e) {
              console.error(`Error parsing category: ${JSON.stringify(categoryData)}`);
              return null;
            }
          })
          .filter((category): category is Category => category !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  }

  // Orders
  async saveOrderSummary(orderSummary: any): Promise<void> {
    try {
      await this.post(`${TENANT_SERVICE_URL}/order-summary`, orderSummary);
    } catch (error) {
      console.error('Error saving order summary:', error);
      throw error;
    }
  }

  // App Logo
  async getAppLogo(): Promise<AppLogo> {
    try {
      const response = await this.get<{ data: any }>(`${TENANT_SERVICE_URL}/get-app-config`, {
        tenant_id: tenantId,
      });
      return AppLogo.fromMap(response.data);
    } catch (error) {
      console.error('Error fetching app logo:', error);
      throw error;
    }
  }

  // Visitor tracking
  async insertVisitor(phoneNumber: string): Promise<void> {
    try {
      const requestBody = {
        tenant_id: tenantId,
        doc: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          hour: new Date().getHours(),
          store_id: storeId,
          phone_number: phoneNumber,
        },
      };

      await this.put(`${DEV_API_BASE_URL}/insert-visitor`, requestBody);
    } catch (error) {
      console.error('Error inserting visitor:', error);
      throw error;
    }
  }

  // Ratings
  async updateKitRating(kitId: string, rating: number, orderId: string): Promise<void> {
    try {
      const data = {
        tenant_id: tenantId,
        kit_id: kitId,
        rating: rating,
        order_id: orderId,
      };

      await this.put(`${DEV_API_BASE_URL}/update-kit-rating`, data);
    } catch (error) {
      console.error('Error updating kit rating:', error);
      throw error;
    }
  }

  async updateProductRating(productId: string, rating: number, orderId: string): Promise<void> {
    try {
      const data = {
        tenant_id: tenantId,
        product_id: productId,
        rating: rating,
        order_id: orderId,
      };

      await this.put(`${DEV_API_BASE_URL}/update-product-rating`, data);
    } catch (error) {
      console.error('Error updating product rating:', error);
      throw error;
    }
  }

  // App Logs
  async saveAppLogs(code: string, message: string): Promise<void> {
    try {
      const appDetails = await this.getAppBuildVersion();
      const payload = {
        tenant_id: tenantId,
        doc: {
          business_id: AppBootStrap.getBusinessDetails().id,
          store_id: storeId,
          log_code: code,
          log_count: 0, // You might want to track this properly
          log_message: message,
          device_details: {}, // Replace with actual device details
          app_details: appDetails,
          log_time: new Date().toISOString(),
        },
      };

      await this.post(`${DEV_API_BASE_URL}/save-app-log`, payload);
    } catch (error) {
      console.error('Error saving app logs:', error);
      throw error;
    }
  }

  // Onboarding
  async getOnboardingDetails(): Promise<OnBoardingModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-onboarding`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((data) => OnBoardingModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching onboarding details:', error);
      throw error;
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettingsModel> {
    try {
      const response = await this.get<any[]>(`${DEV_API_BASE_URL}/get-app-settings`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response) && response.length > 0) {
        return AppSettingsModel.fromMap(response[0]);
      }
      throw new Error('No app settings found');
    } catch (error) {
      console.error('Error fetching app settings:', error);
      throw error;
    }
  }

  // Orders
  async getOrders(phoneNumber: string): Promise<OrderModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-orders`, {
        tenant_id: tenantId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter((orderData) => orderData.phone_number === phoneNumber)
          .map((orderData) => {
            try {
              return OrderModel.fromMap(orderData);
            } catch (e) {
              console.error(`Error parsing order: ${JSON.stringify(orderData)}`);
              return null;
            }
          })
          .filter((order): order is OrderModel => order !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Coupons
  async getCoupons(phoneNumber: string): Promise<CouponModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-coupons`, {
        tenant_id: tenantId,
        store_id: storeId,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((couponData) => {
            try {
              return CouponModel.fromJson(couponData);
            } catch (e) {
              console.error(`Error parsing coupon: ${JSON.stringify(couponData)}`);
              return null;
            }
          })
          .filter(
            (coupon) => coupon !== null && coupon.isCouponAllowedForUser(phoneNumber)
          ) as CouponModel[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  // Order operations
  async saveOrder(order: OrderModel): Promise<void> {
    try {
      const data = {
        tenant_id: tenantId,
        doc: order.toJsonObj(),
      };

      await this.post(`${DEV_API_BASE_URL}/create-order`, data);
    } catch (error) {
      let errorMessage = 'Failed to complete order';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      NotificationService.display({
        notification: {
          title: errorMessage,
          body: 'saveOrder'
        }
      });

      throw new Error(errorMessage);
    }
  }

  async saveOrderStatus(order: OrderModel): Promise<void> {
    try {
      const data = {
        tenant_id: tenantId,
        doc: order.toJsonObj(),
      };

      await this.post(`${DEV_API_BASE_URL}/save-order-status`, data);
    } catch (error) {
      let errorMessage = 'Failed to save order status';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      NotificationService.display({
        notification: {
          title: errorMessage,
          body: 'saveOrder'
        }
      });

      throw new Error(errorMessage);
    }
  }

  async updateOrderDetailsInCoupon(order: OrderModel, coupon: CouponModel): Promise<void> {
    try {
      const data = {
        tenant_id: tenantId,
        doc: order.toJsonObj(),
        coupon_doc: coupon.toJsonObj(),
      };

      await this.put(`${DEV_API_BASE_URL}/update-order-details-in-coupon`, data);
    } catch (error) {
      console.error('Error updating order details in coupon:', error);
      throw error;
    }
  }

  // App Credits
  async getAppCredits(): Promise<AppCreditModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-app-credits`, {
        tenant_id: tenantId,
        business_id: AppBootStrap.getBusinessDetails().id,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((data) => AppCreditModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching app credits:', error);
      throw error;
    }
  }

  // Returns and Refunds
  async getReturnsAndRefunds(): Promise<ReturnsAndRefund[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-returns-refund`, {
        tenant_id: tenantId,
        business_id: AppBootStrap.businessDetails.id,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((data) => ReturnsAndRefund.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching returns and refunds:', error);
      throw error;
    }
  }

  // Privacy Policy
  async getPrivacyPolicy(): Promise<PrivacyModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-privacy`, {
        tenant_id: tenantId,
        business_id:"wnysgv7k67z",
      });

      if (Array.isArray(response.data)) {
        return response.data.map((data) => PrivacyModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      throw error;
    }
  }

  // Terms and Conditions
  async getTermsAndConditions(): Promise<TermsAndConditions[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-termsAndConditions`, {
        tenant_id: tenantId,
        business_id:"wnysgv7k67z",
      });

      if (Array.isArray(response.data)) {
        return response.data.map((data) => TermsAndConditions.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      throw error;
    }
  }

  // Image Upload
  async uploadImage(imageFile: File, orderId: string): Promise<string> {
    try {
      const formData = new FormData();
      const fileName = `${Date.now()}.jpg`;
      formData.append('file', imageFile, fileName);

      const uploadResponse = await this.post<string>(
        `${DEV_API_BASE_URL}/save-image-upload`,
        formData,
        { bucket_name: tenantId }
      );

      const imageUrl = uploadResponse;
      await this.put(`${DEV_API_BASE_URL}/save-order-image`, {
        tenant_id: tenantId,
        order_id: orderId,
        img: [imageUrl],
      });

      return imageUrl;
    } catch (error) {
      await this.delete(`${DEV_API_BASE_URL}/delete-image-upload`, {
        params: { fileName: `${Date.now()}.jpg`, bucket_name: tenantId },
      });
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // OTP Operations
  async sendOtp(phoneNumber: string): Promise<void> {
    try {
      await this.post(`${DEV_API_BASE_URL}/send-otp`, null, {
        tenant_id: tenantId,
        phone_number: phoneNumber,
        app_name: appName,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOtp(userName: string, phoneNumber: string, otp: string): Promise<void> {
    try {
      await this.post(`${DEV_API_BASE_URL}/verify-otp`, null, {
        tenant_id: tenantId,
        phone_number: phoneNumber,
        display_name: userName,
        otp: otp,
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async resendOtp(phoneNumber: string): Promise<void> {
    try {
      await this.post(`${DEV_API_BASE_URL}/resend-otp`, null, {
        tenant_id: tenantId,
        phone_number: phoneNumber,
        app_name: appName,
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  // Razorpay
  async getRazorPayDetails(): Promise<RazorpayModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-razorpay`, {
        tenant_id: tenantId,
        business_id: AppBootStrap.businessDetails.id,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((data) => {
            try {
              return RazorpayModel.fromMap(data);
            } catch (e) {
              console.error(`Error parsing Razorpay details: ${JSON.stringify(data)}`);
              return null;
            }
          })
          .filter((model): model is RazorpayModel => model !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching Razorpay details:', error);
      throw error;
    }
  }

  // Users
  async getUserData(): Promise<UserModel[]> {
    try {
      const response = await this.get<{ data: any[] }>(`${DEV_API_BASE_URL}/get-users`, {
        tenant_id: tenantId,
        business_id: AppBootStrap.getBusinessDetails().id,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .map((data) => {
            try {
              return UserModel.fromMap(data);
            } catch (e) {
              console.error(`Error parsing user data: ${JSON.stringify(data)}`);
              return null;
            }
          })
          .filter((model): model is UserModel => model !== null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  // Delivery
  async getDistanceFromOlaMaps(storeLocation: LatLng, deliveryLocation: LatLng): Promise<any> {
    try {
      const apiKey = 'ijYxL3r81K2jDVB35iEKfk2AMvHRTOok9CyNwtlT';
      const response = await this.post(
        'https://api.olamaps.io/routing/v1/directions/basic',
        null,
        {
          origin: `${storeLocation.latitude},${storeLocation.longitude}`,
          destination: `${deliveryLocation.latitude},${deliveryLocation.longitude}`,
          api_key: apiKey,
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting distance from Ola Maps:', error);
      throw error;
    }
  }

  async getDeliveryAndPackageCost(distance: string): Promise<any> {
    try {
      const response = await this.get(`${DEV_API_BASE_URL}/calculate-delivery-amount`, {
        tenant_id: tenantId,
        order_distance: distance,
        delivery_setup_id: AppBootStrap.getStoreBaseDetails().deliverySetupId,
      });

      if (!response) {
        throw new Error('Invalid response: no data received');
      }
      return response;
    } catch (error) {
      console.error('Error calculating delivery cost:', error);
      throw error;
    }
  }

  // Helper method for DELETE requests
  private async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API error: ${error.message}`);
      }
      throw new Error(`Unknown error: ${error}`);
    }
  }

  // App build version (placeholder - implement as needed)
  private async getAppBuildVersion(): Promise<any> {
    return {}; // Implement this based on your needs
  }


// Helper functions
 async  getAppSettingsBusinessDetails(): Promise<void> {
  const api = APIService.getInstance();
  try {
    const [settings, businessDetails, appLogo] = await Promise.all([
      api.getAppSettings(),
      api.getBusinessDetails(),
      api.getAppLogo(),
    ]);

    // Assuming you have these functions implemented elsewhere
    // AppSettings.setAppSettings(settings);
    AppBootStrap.saveBusiness(businessDetails);
    AppBootStrap.saveAppLogo(appLogo);
  } catch (error) {
    console.error('Error initializing app settings:', error);
    throw error;
  }
}

 
}
// Export a singleton instance
export const API = APIService.getInstance();


