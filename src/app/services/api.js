
import axios from 'axios';

import {AppBootStrap} from '@bbright-nlakshmi/rupeecom-services';
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
} from '@bbright-nlakshmi/rupeecom-services';


export class APIService {
   static instance;
   axiosInstance = axios.create();
   baseURL;
   tenant_service_url;
   tenantId;
   appName = 'RupeEcom';
   storeId;

   constructor() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
    
  }

   static getInstance() {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  static setAPIConfig(tenantId,storeId,baseURL,tenant_service_url = '',appName = ''){
    this.tenantId = tenantId;
    this.baseURL = baseURL;
    this.tenant_service_url = tenant_service_url? tenant_service_url:'';
    this.appName = appName?appName:'RupeEcom';
    this.storeId = storeId;
  }

  // HTTP Methods
   async get(url, params = {}) {
    try {
      const response = await this.axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

   async post(url, data, params = {}) {
    try {
      const response = await this.axiosInstance.post(url, data, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

   async put(url, data, params = {}) {
    try {
      const response = await this.axiosInstance.put(url, data, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

   async delete(url, config = {}) {
    try {
      const response = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

   handleError(error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
    console.error('Unknown Error:', error);
    throw new Error('An unknown error occurred');
  }

  // API Methods
  async getBanners() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-banners`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(item => {
          try {
            return BannerModel.fromMap(item);
          } catch (e) {
            console.error('Error parsing BannerModel:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
  }

  async getAllBanners() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-All-banners`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(item => {
          try {
            return BannerModel.fromMap(item);
          } catch (e) {
            console.error('Error parsing BannerModel:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all banners:', error);
      return [];
    }
  }

  async getBusinessDetails() {
    try {
      const response = await this.get(`${this.baseURL}/get-business`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data) && response.data.length > 0) {
        return BusinessDetails.fromMap(response.data[0]);
      }
      throw new Error('No business details found');
    } catch (error) {
      console.error('Error fetching business details:', error);
      throw error;
    }
  }

  async getTenantOnboardingStatus() {
    try {
      const response = await this.get(`${this.baseURL}/get-tenant-onboarding-status`, {
        tenant_id: this.tenantId,
      });
      return response;
    } catch (error) {
      console.error('Error fetching tenant onboarding status:', error);
      throw error;
    }
  }

  async getStoresBaseDetails() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-store-base-details`, {
        tenant_id: this.tenantId,
      });

      const stores = new Map();
      if (Array.isArray(response?.data)) {
        response.data.forEach(item => {
          try {
            const store = StoreBaseDetails.fromMap(item);
            stores.set(store.id, store);
          } catch (e) {
            console.error('Error parsing StoreBaseDetails:', e);
          }
        });
      }
      return stores;
    } catch (error) {
      console.error('Error fetching stores base details:', error);
      return new Map();
    }
  }

  async getCurrentStoreBaseDetails() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-single-store-base-details`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });
      return StoreBaseDetails.fromMap(response?.data?.data || {});
    } catch (error) {
      console.error('Error fetching current store base details:', error);
      return AppBootStrap.store;
    }
  }

  async getStoreAnnounce() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-store-announce`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });
      return StoreAnnounce.fromMap(response?.data || {});
    } catch (error) {
      console.error('Error fetching store announce:', error);
      throw error;
    }
  }

  async getStorePriceRanges() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-store-price-ranges`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (response?.data?.price_ranges) {
        return StorePriceRanges.fromMap({ price_ranges: response.data.price_ranges });
      }
      throw new Error('Price ranges data is empty.');
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      throw error;
    }
  }

  async getStoreContactDetails() {
    try {
      const response = await this.get(`${this.baseURL}/get-app-settings`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response)) {
        for (const element of response) {
          try {
            return StoreContactDetails.fromMap(element);
          } catch (e) {
            console.error('Error parsing StoreContactDetails:', e);
          }
        }
      }
      return StoreContactDetails.emptyContactDetails();
    } catch (error) {
      console.error('Error fetching store contact details:', error);
      throw error;
    }
  }

  async getJobs() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-jobs`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(jobData => {
          try {
            return Job.fromMap(jobData);
          } catch (e) {
            console.error('Error parsing job data:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async getPremium() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-premium-products`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      const premium = new Map();
      response?.data?.forEach(element => {
        try {
          const sr = new CategoryRender(
            element.category_name,
            element.view_option,
            element.category_sort,
            element.category_image
          );

          element.products?.forEach(p => {
            try {
              const product = Product.fromJson(p, true);
              if (!premium.has(sr)) {
                premium.set(sr, []);
              }
              premium.get(sr).push(product);
            } catch (e) {
              console.error('Error parsing premium product:', e);
            }
          });
        } catch (e) {
          console.error('Error parsing premium category:', e);
        }
      });
      return premium;
    } catch (error) {
      console.error('Error fetching premium products:', error);
      throw error;
    }
  }

  async getNonPremium() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-non-premium-products`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      const nonPremium = new Map();
      response?.data?.forEach(element => {
        try {
          const sr = new CategoryRender(
            element.category_name,
            element.view_option,
            element.category_sort,
            element.category_image
          );

          element.products?.forEach(p => {
            try {
              const product = Product.fromJson(p, false);
              if (!nonPremium.has(sr)) {
                nonPremium.set(sr, []);
              }
              nonPremium.get(sr).push(product);
            } catch (e) {
              console.error('Error parsing non-premium product:', e);
            }
          });
        } catch (e) {
          console.error('Error parsing non-premium category:', e);
        }
      });
      return nonPremium;
    } catch (error) {
      console.error('Error fetching non-premium products:', error);
      throw error;
    }
  }

  async getAllProducts() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-all-products`, {
        tenant_id: this.tenantId,
      });

      const allProducts = new Map();
      response?.data?.forEach(element => {
        try {
          const sr = new CategoryRender(
            element.category_name,
            element.view_option,
            element.category_image,
            element.category_sort
          );

          if (!allProducts.has(sr)) {
            allProducts.set(sr, []);
          }

          element.products?.forEach(p => {
            try {
              allProducts.get(sr).push(Product.fromJson(p, true));
              allProducts.get(sr).push(Product.fromJson(p, false));
            } catch (e) {
              console.error('Error parsing product:', e);
            }
          });
        } catch (e) {
          console.error('Error parsing category:', e);
        }
      });
      return allProducts;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  }

  async getDiscounts() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-discounts-details`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => {
          try {
            return Discount.fromMap(data);
          } catch (e) {
            console.error('Error parsing discount:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching discounts:', error);
      throw error;
    }
  }

  async getAllDiscounts() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-all-discounts`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => {
          try {
            return Discount.fromMap(data);
          } catch (e) {
            console.error('Error parsing discount:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all discounts:', error);
      throw error;
    }
  }

  async getKits() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-kits`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });
      
      if (Array.isArray(response?.data)) {
        return response.data.map(kitData => {
          try {
            return Kit.fromMap(kitData);
          } catch (e) {
            console.error('Error parsing kit:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching kits:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-active-categories`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(categoryData => {
          try {
            return Category.fromMap(categoryData);
          } catch (e) {
            console.error('Error parsing category:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getAllCategories() {
    try {
      const response = await this.get(`${this.baseURL}/fetch-all-categories`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(categoryData => {
          try {
            return Category.fromMap(categoryData);
          } catch (e) {
            console.error('Error parsing category:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  }

  async saveOrderSummary(orderSummary) {
    try {
      await this.post(`${this.tenant_service_url}/order-summary`, orderSummary);
    } catch (error) {
      console.error('Error saving order summary:', error);
      throw error;
    }
  }

  async getAppLogo() {
    try {
      const response = await this.get(`${this.tenant_service_url}/get-app-config`, {
        tenant_id: this.tenantId,
      });
      return AppLogo.fromMap(response?.data || {});
    } catch (error) {
      console.error('Error fetching app logo:', error);
      throw error;
    }
  }

  async insertVisitor(phoneNumber) {
    try {
      const requestBody = {
        tenant_id: this.tenantId,
        doc: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          day: new Date().getDate(),
          hour: new Date().getHours(),
          store_id: this.storeId,
          phone_number: phoneNumber,
        },
      };
      await this.put(`${this.baseURL}/insert-visitor`, requestBody);
    } catch (error) {
      console.error('Error inserting visitor:', error);
      throw error;
    }
  }

  async updateKitRating(kitId, rating, orderId) {
    try {
      const data = {
        tenant_id: this.tenantId,
        kit_id: kitId,
        rating: rating,
        order_id: orderId,
      };
      await this.put(`${this.baseURL}/update-kit-rating`, data);
    } catch (error) {
      console.error('Error updating kit rating:', error);
      throw error;
    }
  }

  async updateProductRating(productId, rating, orderId) {
    try {
      const data = {
        tenant_id: this.tenantId,
        product_id: productId,
        rating: rating,
        order_id: orderId,
      };
      await this.put(`${this.baseURL}/update-product-rating`, data);
    } catch (error) {
      console.error('Error updating product rating:', error);
      throw error;
    }
  }

  async saveAppLogs(code, message) {
    try {
      const appDetails = await this.getAppBuildVersion();
      const payload = {
        tenant_id: this.tenantId,
        doc: {
          business_id: AppBootStrap.getBusinessDetails().id,
          store_id: this.storeId,
          log_code: code,
          log_count: 0,
          log_message: message,
          device_details: {},
          app_details: appDetails,
          log_time: new Date().toISOString(),
        },
      };
      await this.post(`${this.baseURL}/save-app-log`, payload);
    } catch (error) {
      console.error('Error saving app logs:', error);
      throw error;
    }
  }

  async getOnboardingDetails() {
    try {
      const response = await this.get(`${this.baseURL}/get-onboarding`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => OnBoardingModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching onboarding details:', error);
      throw error;
    }
  }

  async getAppSettings() {
    try {
      const response = await this.get(`${this.baseURL}/get-app-settings`, {
        tenant_id: this.tenantId,
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

  async getOrders(phoneNumber) {
    try {
      const response = await this.get(`${this.baseURL}/get-orders`, {
        tenant_id: this.tenantId,
      });

      if (Array.isArray(response?.data)) {
        return response.data
          .filter(orderData => orderData.phone_number === phoneNumber)
          .map(orderData => {
            try {
              return OrderModel.fromMap(orderData);
            } catch (e) {
              console.error('Error parsing order:', e);
              return null;
            }
          })
          .filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getCoupons(phoneNumber) {
    try {
      const response = await this.get(`${this.baseURL}/get-coupons`, {
        tenant_id: this.tenantId,
        store_id: this.storeId,
      });

      if (Array.isArray(response?.data)) {
        return response.data
          .map(couponData => {
            try {
              return CouponModel.fromJson(couponData);
            } catch (e) {
              console.error('Error parsing coupon:', e);
              return null;
            }
          })
          .filter(coupon => coupon && coupon.isCouponAllowedForUser(phoneNumber));
      }
      return [];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  async saveOrder(order) {
    try {
      const data = {
        tenant_id: this.tenantId,
        doc: order.toJsonObj(),
      };
      await this.post(`${this.baseURL}/create-order`, data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete order';
      
      throw new Error(errorMessage);
    }
  }

  async saveOrderStatus(order) {
    try {
      const data = {
        tenant_id: this.tenantId,
        doc: order.toJsonObj(),
      };
      await this.post(`${this.baseURL}/save-order-status`, data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save order status';
      
      throw new Error(errorMessage);
    }
  }

  async updateOrderDetailsInCoupon(order, coupon) {
    try {
      const data = {
        tenant_id: this.tenantId,
        doc: order.toJsonObj(),
        coupon_doc: coupon.toJsonObj(),
      };
      await this.put(`${this.baseURL}/update-order-details-in-coupon`, data);
    } catch (error) {
      console.error('Error updating order details in coupon:', error);
      throw error;
    }
  }

  async getAppCredits() {
    try {
      const response = await this.get(`${this.baseURL}/get-app-credits`, {
        tenant_id: this.tenantId,
        business_id: AppBootStrap.getBusinessDetails().id,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => AppCreditModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching app credits:', error);
      throw error;
    }
  }

  async getReturnsAndRefunds() {
    try {
      const response = await this.get(`${this.baseURL}/get-returns-refund`, {
        tenant_id: this.tenantId,
        business_id: AppBootStrap.businessDetails.id,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => ReturnsAndRefund.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching returns and refunds:', error);
      throw error;
    }
  }

  async getPrivacyPolicy() {
    try {
      const response = await this.get(`${this.baseURL}/get-privacy`, {
        tenant_id: this.tenantId,
        business_id: "wnysgv7k67z",
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => PrivacyModel.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      throw error;
    }
  }

  async getTermsAndConditions() {
    try {
      const response = await this.get(`${this.baseURL}/get-termsAndConditions`, {
        tenant_id: this.tenantId,
        business_id: "wnysgv7k67z",
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => TermsAndConditions.fromMap(data));
      }
      return [];
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      throw error;
    }
  }

  async uploadImage(imageFile, orderId) {
    try {
      const formData = new FormData();
      const fileName = `${Date.now()}.jpg`;
      formData.append('file', imageFile, fileName);

      const uploadResponse = await this.post(
        `${this.baseURL}/save-image-upload`,
        formData,
        { bucket_name: this.tenantId }
      );

      const imageUrl = uploadResponse;
      await this.put(`${this.baseURL}/save-order-image`, {
        tenant_id: this.tenantId,
        order_id: orderId,
        img: [imageUrl],
      });

      return imageUrl;
    } catch (error) {
      await this.delete(`${this.baseURL}/delete-image-upload`, {
        params: { fileName: `${Date.now()}.jpg`, bucket_name: this.tenantId },
      });
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async sendOtp(phoneNumber) {
    try {
      await this.post(`${this.baseURL}/send-otp`, null, {
        tenant_id: this.tenantId,
        phone_number: phoneNumber,
        app_name: this.appName,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOtp(userName, phoneNumber, otp) {
    try {
      await this.post(`${this.baseURL}/verify-otp`, null, {
        tenant_id: this.tenantId,
        phone_number: phoneNumber,
        display_name: userName,
        otp: otp,
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async resendOtp(phoneNumber) {
    try {
      await this.post(`${this.baseURL}/resend-otp`, null, {
        tenant_id: this.tenantId,
        phone_number: phoneNumber,
        app_name: this.appName,
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  async getRazorPayDetails() {
    try {
      const response = await this.get(`${this.baseURL}/get-razorpay`, {
        tenant_id: this.tenantId,
        business_id: AppBootStrap.businessDetails.id,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => {
          try {
            return RazorpayModel.fromMap(data);
          } catch (e) {
            console.error('Error parsing Razorpay details:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching Razorpay details:', error);
      throw error;
    }
  }

  async getUserData() {
    try {
      const response = await this.get(`${this.baseURL}/get-users`, {
        tenant_id: this.tenantId,
        business_id: AppBootStrap.getBusinessDetails().id,
      });

      if (Array.isArray(response?.data)) {
        return response.data.map(data => {
          try {
            return UserModel.fromMap(data);
          } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
          }
        }).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  async getDistanceFromOlaMaps(storeLocation, deliveryLocation) {
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

  async getDeliveryAndPackageCost(distance) {
    try {
      const response = await this.get(`${this.baseURL}/calculate-delivery-amount`, {
        tenant_id: this.tenantId,
        order_distance: distance,
        delivery_setup_id: AppBootStrap.getStoreBaseDetails().deliverySetupId,
      });
      return response || {};
    } catch (error) {
      console.error('Error calculating delivery cost:', error);
      throw error;
    }
  }

  async getAppBuildVersion() {
    return {};
  }

  async getAppSettingsBusinessDetails() {
    try {
      const [settings, businessDetails, appLogo] = await Promise.all([
        this.getAppSettings(),
        this.getBusinessDetails(),
        this.getAppLogo(),
      ]);
      AppBootStrap.saveBusiness(businessDetails);
      AppBootStrap.saveAppLogo(appLogo);
    } catch (error) {
      console.error('Error initializing app settings:', error);
      throw error;
    }
  }
}

export const API = new APIService();