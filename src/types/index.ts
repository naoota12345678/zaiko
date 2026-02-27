import { Timestamp } from "firebase/firestore";

// ============================================================
// 共通
// ============================================================

export type UserRole = "owner" | "manager" | "staff";

// ============================================================
// 1. stores（店舗）
// Collection: stores/{storeId}
// ============================================================

export interface Store {
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  openTime: string; // "09:00"
  closeTime: string; // "19:00"
  regularHoliday: string;
  imageUrl: string;
  acceptedCards: CreditCardBrand[];
  bankInfo: BankInfo;
  contractInfo: ContractInfo;
  posReceiptPrinterIp: string;
  transportBureau: string;

  // ★追加: ハイシーズン期間
  highSeasonPeriods: HighSeasonPeriod[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HighSeasonPeriod {
  startDate: Timestamp;
  endDate: Timestamp;
  label: string; // "GW" "お盆" "年末年始" 等
}

export type CreditCardBrand = "visa" | "mastercard" | "jcb" | "amex" | "diners";

export interface BankInfo {
  bankName: string;
  branchName: string;
  accountType: "普通" | "当座";
  accountNumber: string;
  accountHolder: string;
}

export interface ContractInfo {
  companyName: string;
  representative: string;
  registrationNumber: string;
}

// ============================================================
// 2. users（スタッフ・アカウント）
// Collection: users/{uid} ← Firebase Auth UID
// ============================================================

export interface User {
  storeId: string;
  name: string;
  nameKana: string;
  role: UserRole;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  staffCategory: StaffCategory;
  isActive: boolean;
  retiredAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type StaffCategory = "full_time" | "part_time" | "contract";

export const STAFF_CATEGORY_LABELS: Record<StaffCategory, string> = {
  full_time: "正社員",
  part_time: "パート",
  contract: "契約",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "オーナー",
  manager: "店長",
  staff: "スタッフ",
};

// ============================================================
// 3. vehicles（車両）
// Collection: vehicles/{vehicleId}
// ============================================================

export interface Vehicle {
  storeId: string;
  vehicleClass: VehicleClass;
  maker: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  chassisNumber: string;
  displacement: number;
  fuelType: FuelType;
  transmission: "AT" | "MT";
  capacity: number;
  imageUrl: string;

  // 期限管理
  inspectionExpiry: Timestamp;
  legalInspectionExpiry: Timestamp;
  insuranceExpiry: Timestamp;

  // リース情報
  leaseExpiry: Timestamp | null;
  leaseCompany: string;
  leaseMonthlyFee: number;

  // オイル交換管理
  oilChangeIntervalKm: number;
  lastOilChangeKm: number;
  lastOilChangeDate: Timestamp | null;

  // 走行距離
  currentMileage: number;

  // 運用状態
  status: VehicleStatus;
  suspendedReason: string;
  suspendedFrom: Timestamp | null;
  suspendedTo: Timestamp | null;

  // 車両共有
  sharedWithStores: string[];

  // ★追加: ダミー車両
  isDummy: boolean;

  // ★追加: WEB予約最低貸出日数（車両単位）
  webMinRentalDays: number;

  // ★追加: 標準装備
  standardEquipment: StandardEquipment[];

  // ★追加: 禁煙車
  isNonSmoking: boolean;

  // ★追加: スタッドレス装備
  hasStudless: boolean;

  // ★追加: 車庫証明保管場所標章番号
  parkingCertNumber: string;

  // ★追加: 仕入れ情報
  purchaseInfo: PurchaseInfo;

  // ★追加: 保険詳細情報
  insuranceInfo: InsuranceInfo;

  memo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type StandardEquipment =
  | "carnavi"       // カーナビ
  | "etc"           // ETC
  | "bluetooth"     // Bluetooth
  | "back_camera"   // バックカメラ
  | "drive_recorder" // ドライブレコーダー
  | "usb";          // USB端子

export const STANDARD_EQUIPMENT_LABELS: Record<StandardEquipment, string> = {
  carnavi: "カーナビ",
  etc: "ETC",
  bluetooth: "Bluetooth",
  back_camera: "バックカメラ",
  drive_recorder: "ドライブレコーダー",
  usb: "USB端子",
};

export interface PurchaseInfo {
  purchaseDate: Timestamp | null;
  purchasePrice: number;
  purchaseFrom: string; // 仕入先
}

export interface InsuranceInfo {
  insuranceCompany: string;
  policyNumber: string;    // 証券番号
  coverageType: string;    // 補償内容
}

export type VehicleClass =
  | "kei" | "compact" | "sedan" | "suv"
  | "minivan" | "wagon" | "van" | "truck";

export type FuelType = "gasoline" | "diesel" | "hybrid" | "ev";
export type VehicleStatus = "active" | "suspended" | "deleted";

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  kei: "軽自動車", compact: "コンパクト", sedan: "セダン", suv: "SUV",
  minivan: "ミニバン", wagon: "ワゴン", van: "バン", truck: "トラック",
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: "ガソリン", diesel: "ディーゼル", hybrid: "ハイブリッド", ev: "EV",
};

// ============================================================
// 4. customers（顧客）
// Collection: customers/{customerId}
// ============================================================

export interface Customer {
  storeId: string;
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  gender: "male" | "female" | "other";
  birthDate: Timestamp | null;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;

  // 免許情報
  licenseNumber: string;
  licenseExpiry: Timestamp | null;
  licenseType: string;

  // ブラックリスト
  blackLevel: BlackLevel;
  blackReason: string;

  // ★追加: アプリ会員
  isAppMember: boolean;
  appMemberId: string;

  // デノーマライズ（集計用）
  totalRentals: number;
  totalRevenue: number;
  lastRentalDate: Timestamp | null;

  memo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BlackLevel = 0 | 1 | 2 | 3;

export const BLACK_LEVEL_LABELS: Record<BlackLevel, string> = {
  0: "通常",
  1: "注意",
  2: "要注意",
  3: "貸出禁止",
};

// ============================================================
// 5. reservations（予約）★稼働表の主要データソース
// Collection: reservations/{reservationId}
// ============================================================

export interface Reservation {
  storeId: string;
  reservationNumber: string;

  // 顧客（デノーマライズ）
  customerId: string;
  customerName: string;
  customerPhone: string;

  // 車両（デノーマライズ）
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleClass: VehicleClass;

  // 期間
  startDate: Timestamp;
  endDate: Timestamp;

  // 予約情報
  source: ReservationSource;
  status: ReservationStatus;
  isLocked: boolean;
  isEndDateBlocked: boolean;

  // 料金
  // ★追加: pricingClass（車両クラスとは別の料金適用クラス）
  pricingClass: VehicleClass;
  options: RentalOption[];
  basePrice: number;
  optionPrice: number;
  // ★追加: 配車料金
  deliveryFee: number;
  // ★追加: 値引き
  discount: number;
  totalPrice: number;
  depositAmount: number;
  paymentMethod: PaymentMethod;

  // 担当（デノーマライズ）
  staffId: string;
  staffName: string;

  // ★追加: 追加運転者
  additionalDrivers: AdditionalDriver[];

  // ★追加: 本人確認書類
  identityVerification: string;

  // キャンセル
  cancelledAt: Timestamp | null;
  cancelReason: string;
  cancelFee: number;

  memo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdditionalDriver {
  name: string;
  licenseNumber: string;
}

export type ReservationSource = "walk_in" | "phone" | "web";
export type ReservationStatus =
  | "pending_approval" | "approved" | "converted_to_rental"
  | "cancelled" | "rejected";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending_approval: "未承認",
  approved: "承認済み",
  converted_to_rental: "貸出済み",
  cancelled: "キャンセル",
  rejected: "却下",
};

export const RESERVATION_SOURCE_LABELS: Record<ReservationSource, string> = {
  walk_in: "窓口",
  phone: "電話",
  web: "ネット",
};

// ============================================================
// 6. rentals（貸出）★稼働表の主要データソース
// Collection: rentals/{rentalId}
// ============================================================

export interface Rental {
  storeId: string;
  reservationId: string | null;
  contractNumber: string;

  // 顧客（デノーマライズ）
  customerId: string;
  customerName: string;
  customerPhone: string;

  // 車両（デノーマライズ）
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleClass: VehicleClass;

  // 期間
  startDate: Timestamp;
  endDate: Timestamp;
  actualReturnDate: Timestamp | null;

  // 走行距離
  departureMileage: number;
  returnMileage: number | null;
  fuelLevelAtReturn: string;

  // ステータス
  status: RentalStatus;
  isEndDateBlocked: boolean;
  // ★追加: 予約枠ロック
  isLocked: boolean;

  // 料金
  // ★追加: pricingClass
  pricingClass: VehicleClass;
  options: RentalOption[];
  basePrice: number;
  optionPrice: number;
  // ★追加: 配車料金
  deliveryFee: number;
  // ★追加: 値引き
  discount: number;
  totalPrice: number;
  totalPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;

  // 担当（デノーマライズ）
  staffId: string;
  staffName: string;

  // ★追加: 追加運転者
  additionalDrivers: AdditionalDriver[];

  // ★追加: 貸出・返却場所
  pickupType: LocationType;
  returnType: LocationType;

  // ★追加: 本人確認書類
  identityVerification: string;

  // 延長履歴
  extensions: RentalExtension[];

  // 車両入替履歴
  vehicleReplacements: VehicleReplacement[];

  memo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type LocationType = "store" | "delivery";

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  store: "店頭",
  delivery: "出張",
};

export type RentalStatus =
  | "active" | "extended" | "overdue"
  | "unreturned" | "returned" | "early_returned";

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  active: "貸出中",
  extended: "延長済み",
  overdue: "返却超過",
  unreturned: "不返還",
  returned: "返却済み",
  early_returned: "早期返却",
};

export type ExtensionType = "renewal" | "addition" | "unauthorized";

export const EXTENSION_TYPE_LABELS: Record<ExtensionType, string> = {
  renewal: "契約更新",
  addition: "日数追加",
  unauthorized: "無断延長",
};

export interface RentalExtension {
  type: ExtensionType;
  previousEndDate: Timestamp;
  newEndDate: Timestamp;
  additionalPrice: number;
  registeredAt: Timestamp;
  staffId: string;
  staffName: string;
}

export interface VehicleReplacement {
  previousVehicleId: string;
  previousVehiclePlate: string;
  newVehicleId: string;
  newVehiclePlate: string;
  replacedAt: Timestamp;
  reason: string;
  staffId: string;
}

// ============================================================
// 共通サブ型
// ============================================================

export interface RentalOption {
  name: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod =
  | "cash" | "credit_card" | "bank_transfer"
  | "e_money" | "invoice" | "other";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "現金",
  credit_card: "クレジットカード",
  bank_transfer: "銀行振込",
  e_money: "電子マネー",
  invoice: "売掛（請求書）",
  other: "その他",
};

// ============================================================
// 7. payments（請求・入金）
// Collection: payments/{paymentId}
// ============================================================

export interface Payment {
  storeId: string;
  rentalId: string | null;
  reservationId: string | null;
  customerId: string;

  type: PaymentType;
  category: PaymentCategory;
  amount: number;
  method: PaymentMethod;
  description: string;

  // ★追加: 決済ブランド名（Visa, Suica等）
  brandName: string;
  // ★追加: 銀行振込日
  bankTransferDate: Timestamp | null;

  isCancelled: boolean;
  cancelledAt: Timestamp | null;
  cancelReason: string;

  staffId: string;
  staffName: string;

  transactionDate: Timestamp;
  createdAt: Timestamp;
}

export type PaymentType = "charge" | "payment" | "refund" | "write_off";
export type PaymentCategory =
  // charge
  | "base_rental" | "extension" | "option" | "additional" | "cancel_fee"
  // payment
  | "deposit" | "rental_payment" | "cancel_fee_payment"
  // refund
  | "early_return" | "overcharge"
  // write_off
  | "bad_debt" | "cancel_fee_waive";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  charge: "請求",
  payment: "入金",
  refund: "返金",
  write_off: "貸倒れ/免除",
};

// ============================================================
// 8. maintenanceShops（整備工場マスタ）
// Collection: maintenanceShops/{shopId}
// ============================================================

export interface MaintenanceShop {
  storeId: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
}

// ============================================================
// 9. maintenanceRecords（整備記録）
// Collection: maintenanceRecords/{recordId}
// ============================================================

export interface MaintenanceRecord {
  storeId: string;
  vehicleId: string;
  vehiclePlate: string;
  shopId: string;
  shopName: string;
  category: MaintenanceCategory;
  description: string;
  cost: number;
  mileageAtService: number;
  serviceDate: Timestamp;
  nextServiceDate: Timestamp | null;
  memo: string;
  createdAt: Timestamp;
}

export type MaintenanceCategory =
  | "inspection" | "legal_inspection" | "repair"
  | "oil_change" | "tire" | "body_repair" | "other";

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  inspection: "車検",
  legal_inspection: "法定点検",
  repair: "修理",
  oil_change: "オイル交換",
  tire: "タイヤ交換",
  body_repair: "板金",
  other: "その他",
};

// ============================================================
// 10. closedDays（店舗休業日）
// Collection: closedDays/{storeId}_{YYYY-MM-DD}
// ============================================================

export interface ClosedDay {
  storeId: string;
  date: Timestamp;
  isClosed: boolean;
}

// ============================================================
// 11. netReservationSettings（ネット予約設定）
// Collection: netReservationSettings/{storeId}
// ============================================================

export interface NetReservationSettings {
  storeId: string;
  isAccepting: boolean;
  minRentalDays: number;
  maxAdvanceDays: number;       // 30 | 60 | 90
  acceptableClasses: VehicleClass[];
  naviCount: number;

  // ★追加: 予約インターバル（車両清掃用 0-10時間）
  reservationIntervalHours: number;

  // ★追加: ネット予約受付時間制限（何時間前まで 0-10時間）
  advanceHoursLimit: number;

  // ★追加: 時間帯別予約制限
  timeSlotLimits: TimeSlotLimit[];

  // ★追加: 冬期シーズン料金適用期間
  winterSeasonStart: Timestamp | null;
  winterSeasonEnd: Timestamp | null;

  // ★追加: スタッドレス強制適用期間
  forceStudlessStart: Timestamp | null;
  forceStudlessEnd: Timestamp | null;

  updatedAt: Timestamp;
}

export interface TimeSlotLimit {
  hour: number;                      // 時間（9, 10, 11 ...）
  maxReservations: number;           // 通常時の最大予約件数
  overnightMaxReservations: number;  // 閉店後における翌営業日の受入件数
}

// ============================================================
// 12. parkingViolations（違法駐車履歴）
// Collection: parkingViolations/{violationId}
// ============================================================

export interface ParkingViolation {
  storeId: string;
  vehicleId: string;
  vehiclePlate: string;
  rentalId: string | null;
  customerId: string | null;
  customerName: string;
  violationDate: Timestamp;
  location: string;
  fineAmount: number;
  status: "pending" | "resolved" | "paid_by_customer";
  memo: string;
  createdAt: Timestamp;
}

// ============================================================
// 13. ★新規追加: pricingPlans（料金プランマスタ）
// Collection: pricingPlans/{planId}
//
// G-OASYS P.36, P.39:
// 「自動で適用プランが割り当てられます。
//  最安値料金となるように自動計算されます。」
// ============================================================

export interface PricingPlan {
  storeId: string;
  name: string;                      // "日貸し" "週貸し" "月貸し" 等
  vehicleClass: VehicleClass;        // 適用車種クラス
  durationType: DurationType;        // 期間タイプ
  durationDays: number;              // 期間日数（日貸し=1, 週貸し=7, 月貸し=30 等）
  basePrice: number;                 // 基本料金
  highSeasonPrice: number;           // ハイシーズン料金
  perExtraDayPrice: number;          // 超過1日あたり料金
  isActive: boolean;
  sortOrder: number;                 // 表示順
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type DurationType = "daily" | "weekly" | "monthly" | "custom";

export const DURATION_TYPE_LABELS: Record<DurationType, string> = {
  daily: "日貸し",
  weekly: "週貸し",
  monthly: "月貸し",
  custom: "カスタム",
};

// ============================================================
// 14. ★新規追加: optionMaster（オプションマスタ）
// Collection: optionMaster/{optionId}
//
// G-OASYS P.36 ⑱:
// 「オプション・・・車両に標準装備されているオプションについては、
//  既にチェックが入った状態で表示されています」
// ============================================================

export interface OptionMaster {
  storeId: string;
  name: string;                      // "カーナビ" "スタッドレス" "チャイルドシート" 等
  durationType: "per_day" | "per_rental" | "fixed";
  unitPrice: number;                 // 単価（日額 or 1回あたり）
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// 15. ★新規追加: cancelPolicies（キャンセル料テーブル）
// Collection: cancelPolicies/{policyId}
//
// G-OASYS P.53:
// 「通常キャンセルまたは無断キャンセルかで料金が変わります」
// 「キャンセル日に基づき、キャンセル料が発生しない場合、
//  「請求する」を選択することはできません」
// ============================================================

export interface CancelPolicy {
  storeId: string;
  name: string;                      // "通常キャンセル" "無断キャンセル"
  rules: CancelPolicyRule[];         // 日数ごとのキャンセル料ルール
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CancelPolicyRule {
  daysBeforeStart: number;           // 貸出日の何日前（7 = 7日前、0 = 当日）
  feeType: "percentage" | "fixed";   // パーセント or 固定額
  feeValue: number;                  // 50 = 50% or 5000 = 5000円
}

// ============================================================
// Firestore 複合インデックス定義（修正版）
// firestore.indexes.json に反映
// ============================================================

/*
必要な複合インデックス:

1.  reservations: storeId ASC, status ASC, startDate ASC
2.  reservations: storeId ASC, status ASC, endDate ASC
3.  reservations: storeId ASC, status ASC, createdAt DESC
4.  rentals: storeId ASC, status ASC, startDate ASC
5.  rentals: storeId ASC, status ASC, endDate ASC
6.  payments: storeId ASC, transactionDate ASC
7.  payments: storeId ASC, type ASC, transactionDate ASC
8.  payments: storeId ASC, type ASC, isCancelled ASC, transactionDate ASC
9.  payments: storeId ASC, type ASC, method ASC, transactionDate ASC
10. vehicles: storeId ASC, status ASC, vehicleClass ASC
11. customers: storeId ASC, lastNameKana ASC
12. maintenanceRecords: vehicleId ASC, serviceDate DESC
13. maintenanceRecords: storeId ASC, category ASC, serviceDate DESC
14. pricingPlans: storeId ASC, vehicleClass ASC, isActive ASC
15. cancelPolicies: storeId ASC, isActive ASC
16. optionMaster: storeId ASC, isActive ASC, sortOrder ASC
*/
