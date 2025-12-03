interface DeliveryAddressJson {
  id?: string | null;
  at_store: boolean | number;
  first_name: string;
  last_name: string;
  pin_code: string;
  city: string;
  address: string;
  phone_number: string;
  is_choosed?: number | null;
  lat: number;
  lng: number;
  // audio_path?: string;
  // leaveAtDoor?: number;
  // leaveWithGuard?: number;
  // avoidCalling?: number;
  // doNotRingTheBell?: number;
  // petAtHome?: number;
}

export class DeliveryAddressModel {
  id?: string | null;
  atStore: number;
  firstName: string;
  lastName: string;
  pinCode: string;
  city: string;
  address: string;
  phoneNumber: string;
  isChoosed?: number | null;
  lat: number;
  lng: number;
  // audioPath?: string;
  // leaveAtDoor?: number;
  // leaveWithGuard?: number;
  // avoidCalling?: number;
  // doNotRingTheBell?: number;
  // petAtHome?: number;

  constructor({
    id = null,
    atStore,
    firstName,
    lastName,
    pinCode,
    city,
    address,
    phoneNumber,
    isChoosed = null,
    lat,
    lng,
    // audioPath,
    // leaveAtDoor = 0,
    // leaveWithGuard = 0,
    // avoidCalling = 0,
    // doNotRingTheBell = 0,
    // petAtHome = 0,
  }: {
    id?: string | null;
    atStore: number;
    firstName: string;
    lastName: string;
    pinCode: string;
    city: string;
    address: string;
    phoneNumber: string;
    isChoosed?: number | null;
    lat: number;
    lng: number;
    // audioPath?: string;
    // leaveAtDoor?: number;
    // leaveWithGuard?: number;
    // avoidCalling?: number;
    // doNotRingTheBell?: number;
    // petAtHome?: number;
  }) {
    this.id = id;
    this.atStore = atStore;
    this.firstName = firstName;
    this.lastName = lastName;
    this.pinCode = pinCode;
    this.city = city;
    this.address = address;
    this.phoneNumber = phoneNumber;
    this.isChoosed = isChoosed;
    this.lat = lat;
    this.lng = lng;
    // this.audioPath = audioPath;
    // this.leaveAtDoor = leaveAtDoor;
    // this.leaveWithGuard = leaveWithGuard;
    // this.avoidCalling = avoidCalling;
    // this.doNotRingTheBell = doNotRingTheBell;
    // this.petAtHome = petAtHome;
  }

  static fromMap(json: DeliveryAddressJson): DeliveryAddressModel {
    return new DeliveryAddressModel({
      id: json.id ?? null,
      atStore: json.at_store === true ? 1 : (typeof json.at_store === 'number' ? json.at_store : 0),
      firstName: json.first_name,
      lastName: json.last_name,
      pinCode: json.pin_code,
      city: json.city,
      address: json.address,
      phoneNumber: json.phone_number,
      isChoosed: json.is_choosed ?? null,
      lat: json.lat,
      lng: json.lng,
      // audioPath: json.audio_path,
      // leaveAtDoor: json.leaveAtDoor,
      // leaveWithGuard: json.leaveWithGuard,
      // avoidCalling: json.avoidCalling,
      // doNotRingTheBell: json.doNotRingTheBell,
      // petAtHome: json.petAtHome,
    });
  }

  toMap(): DeliveryAddressJson {
    return {
      id: this.id ?? null,
      at_store: this.atStore,
      first_name: this.firstName,
      last_name: this.lastName,
      pin_code: this.pinCode,
      city: this.city,
      address: this.address,
      phone_number: this.phoneNumber,
      is_choosed: this.isChoosed ?? null,
      lat: this.lat,
      lng: this.lng,
      // audio_path: this.audioPath,
      // leaveAtDoor: this.leaveAtDoor,
      // leaveWithGuard: this.leaveWithGuard,
      // avoidCalling: this.avoidCalling,
      // doNotRingTheBell: this.doNotRingTheBell,
      // petAtHome: this.petAtHome,
    };
  }

  toJsonObj() {
    return {
      id: this.id ?? null,
      at_store: this.atStore === 0 ? false : true,
      first_name: this.firstName,
      last_name: this.lastName,
      pin_code: this.pinCode,
      address: this.address,
      phone_number: this.phoneNumber,
      city: this.city,
      is_choosed: this.isChoosed ?? null,
      lat: this.lat,
      lng: this.lng,
      // audio_path: this.audioPath,
      // leaveAtDoor: this.leaveAtDoor,
      // leaveWithGuard: this.leaveWithGuard,
      // avoidCalling: this.avoidCalling,
      // doNotRingTheBell: this.doNotRingTheBell,
      // petAtHome: this.petAtHome,
    };
  }
}
