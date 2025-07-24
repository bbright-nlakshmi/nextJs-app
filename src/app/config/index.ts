export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://1rpapp.in/v1",
  tenantServiceUrl: "https://tenantservice.1rpapp.in/v1",
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "etcnlzil",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "One Step Delivery",
  defaultStoreId: "5e2f938f-5d53-4f33-bfd1-1248acec2fc7",
  logger: {
    serverLogging: process.env.NODE_ENV === "production",
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || "debug",
  },
  version: "1.0",
  mediaQueries: {
    0: { slidesPerView: 1, spaceBetween: 0 },
    320: { slidesPerView: 2, spaceBetween: 10 },
    480: { slidesPerView: 3, spaceBetween: 20 },
    575: { slidesPerView: 4, spaceBetween: 20 },
    991: { slidesPerView: 5, spaceBetween: 20 },
    // 1140: { slidesPerView: 6, spaceBetween: 20 },
    1199: { slidesPerView: 6, spaceBetween: 20 },
  },
};
