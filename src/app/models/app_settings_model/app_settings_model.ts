export class AppSettingsModel {
  id: string;
  showErrorsAtMobile: boolean;
  apiVersion: string;
  currency: string;
  refreshInterval: string;
  secretKey: string;

  constructor({
    id,
    showErrorsAtMobile,
    apiVersion,
    currency,
    refreshInterval,
    secretKey,
  }: {
    id: string;
    showErrorsAtMobile: boolean;
    apiVersion: string;
    currency: string;
    refreshInterval: string;
    secretKey: string;
  }) {
    if (!id || !apiVersion || !currency || !refreshInterval || !secretKey) {
      throw new Error("Required fields must not be empty.");
    }

    this.id = id;
    this.showErrorsAtMobile = showErrorsAtMobile;
    this.apiVersion = apiVersion;
    this.currency = currency;
    this.refreshInterval = refreshInterval;
    this.secretKey = secretKey;
  }

  static fromMap(map: any): AppSettingsModel {
    return new AppSettingsModel({
      id: map.id,
      showErrorsAtMobile: map.show_errors_at_mobile,
      apiVersion: map.api_version,
      currency: map.currency,
      refreshInterval: map.refresh_interval,
      secretKey: map.secret_key,
    });
  }

  static emptyAppSettings(): AppSettingsModel {
    return new AppSettingsModel({
      id: "",
      showErrorsAtMobile: false,
      apiVersion: "",
      currency: "",
      refreshInterval: "",
      secretKey: "",
    });
  }
}
