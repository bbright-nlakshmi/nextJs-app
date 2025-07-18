// ignore_for_file: depend_on_referenced_packages


export * from '@bbright-nlakshmi/rupeecom-services';

// PROVIDERS
export * from '@/app/providers/all_providers';


// SERVICES

export * from '@/app/services/global.services';


import {API} from '@bbright-nlakshmi/rupeecom-services';
API.baseURL = 'https://devqarupeecomservice.rupeecom.in/v1';
API.tenant_service_url = 'https://tenantservice.1rpapp.in/v1';
API.tenantId = 'owuhhrlb';
API.storeId = 'b0aec458-86f7-4c29-8587-ec4271b9168c';

export {API};


