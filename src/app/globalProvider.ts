// ignore_for_file: depend_on_referenced_packages

//library one_rpapp_service;

//APP SETUP

//export * from '@/app_setup/app_bootstrap';
// export * from '@/app_setup/app_global';
// export * from '@/app_setup/app_settings';
// export * from '@/app_setup/human_id';
// export * from '@/app_setup/nano_id';
//export * from '@/app/constants/constants';

// MODELS

//export * from '@/app/models/models';
export * from '@bbright-nlakshmi/rupeecom-services';

// PROVIDERS
export * from '@/app/providers/all_providers';


//export * from '@/app/providers/providers';

// SERVICES

export * from '@/app/services/global.services';

//UTILS
//export * from '@/utils/logger';
import {API} from '@bbright-nlakshmi/rupeecom-services';
API.baseURL = 'https://devqarupeecomservice.rupeecom.in/v1';
API.tenant_service_url = 'https://tenantservice.1rpapp.in/v1';
API.tenantId = 'owuhhrlb';
API.storeId = 'b0aec458-86f7-4c29-8587-ec4271b9168c';

export {API};


