export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "https://1rpapp.in/v1",
  tenantServiceUrl: "https://tenantservice.1rpapp.in/v1",
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "sbvhnjgg",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "One Step Delivery",
  defaultStoreId: "3b94651a-80e8-4480-80ce-6cf975e39ae7",
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
// Get tenantId from environment variables or config
// {etcnlzil, 5e2f938f-5d53-4f33-bfd1-1248acec2fc7}
// {frmkiokg, c3d1ca3c-98c1-43f9-8f48-ea9641b390ad}
// {dxrhudtb,5b547df0-967d-4aa4-8996-e02511c66e26}
//  {owuhhrlb, b0aec458-86f7-4c29-8587-ec4271b9168c}
