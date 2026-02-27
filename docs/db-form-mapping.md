# DB設計 ↔ 入力フォーム 対応表

マニュアル（G-OASYS）の画面項目と、Firestoreの各コレクション・フィールドの紐づけを検証した結果です。
「⚠️ DB未対応」はDB設計に不足があるフィールド、「✅」は対応済みを示します。

---

## 1. 店舗情報編集（stores コレクション）

マニュアル参照: P.15「店舗の基本情報を登録する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 店舗名 | name | string | ✅ |
| 郵便番号 | postalCode | string | ✅ |
| 都道府県 | prefecture | string | ✅ |
| 市区町村 | city | string | ✅ |
| 番地以降 | address | string | ✅ |
| 電話番号 | phone | string | ✅ |
| FAX番号 | fax | string | ✅ |
| メールアドレス（ネット予約通知先） | email | string | ✅ |
| 営業開始時間 | openTime | string | ✅ |
| 営業終了時間 | closeTime | string | ✅ |
| メイン画像（アプリ表示用） | imageUrl | string | ✅ |
| 定休日テキスト | regularHoliday | string | ✅ |
| 対応クレジットカード（チェックボックス） | acceptedCards | string[] | ✅ |
| 金融機関名 | bankInfo.bankName | string | ✅ |
| 支店名 | bankInfo.branchName | string | ✅ |
| 口座種類 | bankInfo.accountType | string | ✅ |
| 口座番号 | bankInfo.accountNumber | string | ✅ |
| 口座名義 | bankInfo.accountHolder | string | ✅ |
| 運輸支局名 | transportBureau | string | ✅ |
| POSレジ プリンタIP | posReceiptPrinterIp | string | ✅ |
| 契約書用 会社名 | contractInfo.companyName | string | ✅ |
| 契約書用 代表者名 | contractInfo.representative | string | ✅ |
| 契約書用 登録番号 | contractInfo.registrationNumber | string | ✅ |

**✅ 過不足なし**

---

## 2. 店舗休業日設定（closedDays コレクション）

マニュアル参照: P.16「店舗の休業日を設定する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 日付 | date | timestamp | ✅ |
| 営業日/休業日 | isClosed | boolean | ✅ |
| 店舗ID | storeId | string | ✅ |
| 貸出・返却予定あり表示 | — | — | ⚠️ クエリで取得（DBフィールド不要） |
| ハイシーズン期間（背景色） | — | — | ⚠️ DB未対応（下記参照） |

### ⚠️ 要追加: ハイシーズン期間

マニュアルP.16:「各日の背景色が黄色の日はハイシーズン期間」。G-OASYSでは本部設定だが、自社システムでは自分で設定する必要がある。

**対応案**: `stores` に `highSeasonPeriods` フィールドを追加

```typescript
// stores コレクションに追加
highSeasonPeriods: {
  startDate: Timestamp;
  endDate: Timestamp;
}[]
```

---

## 3. スタッフ・アカウント（users コレクション）

マニュアル参照: P.17「スタッフ登録」、P.21「アカウント登録」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| スタッフ名 | name | string | ✅ |
| フリガナ | nameKana | string | ✅ |
| 郵便番号 | postalCode | string | ✅ |
| 住所 | address | string | ✅ |
| 電話番号 | phone | string | ✅ |
| メールアドレス | email | string | ✅ |
| 区分（正社員/パート） | staffCategory | string | ✅ |
| 権限（オーナー/店長/パート） | role | string | ✅ |
| ログインID | — | — | ⚠️ Firebase Auth のemail で代替 |
| パスワード | — | — | ⚠️ Firebase Auth で管理 |
| 退職年月 | retiredAt | timestamp | ✅ |
| 有効/無効 | isActive | boolean | ✅ |

**⚠️ 注意点**: G-OASYSは「ログインID + パスワード」だが、Firebase Authは「メール + パスワード」。UI上でメールアドレスをログインIDとして使う旨を表示する。

---

## 4. ネット予約設定（netReservationSettings コレクション）

マニュアル参照: P.27-28「ネット予約の受け入れ条件を設定する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| ネット予約受付中 | isAccepting | boolean | ✅ |
| ネット予約受付可能期間（30/60/90日） | maxAdvanceDays | number | ✅ |
| ネット予約可能な車両クラス | acceptableClasses | string[] | ✅ |
| ポータブルナビ台数 | naviCount | number | ✅ |
| 最低貸出日数 | minRentalDays | number | ✅ |
| 予約インターバル（車両清掃用） | — | — | ⚠️ DB未対応 |
| ネット予約受付時間制限（何時間前まで） | — | — | ⚠️ DB未対応 |
| ネット予約時間帯別制限（時間帯×件数） | — | — | ⚠️ DB未対応 |
| 冬期シーズン料金適用期間 | — | — | ⚠️ DB未対応 |
| スタッドレス強制適用期間 | — | — | ⚠️ DB未対応 |
| 閉店後における翌営業日の予約受入設定 | — | — | ⚠️ DB未対応 |

### ⚠️ 要追加: 6フィールド

```typescript
// netReservationSettings に追加
reservationIntervalHours: number;      // 予約インターバル（0-10時間）
advanceHoursLimit: number;             // 何時間前まで受付（0-10時間）
timeSlotLimits: {                      // 時間帯別制限
  hour: number;                        // 時間（9, 10, 11...）
  maxReservations: number;             // 最大予約件数
  overnightMaxReservations: number;    // 閉店後翌営業日の受入件数
}[];
winterSeasonStart: Timestamp | null;   // 冬期シーズン開始
winterSeasonEnd: Timestamp | null;     // 冬期シーズン終了
forceStudlessStart: Timestamp | null;  // スタッドレス強制適用開始
forceStudlessEnd: Timestamp | null;    // スタッドレス強制適用終了
```

---

## 5. 車両登録（vehicles コレクション）

マニュアル参照: P.30-31「車両を登録する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 車種クラス | vehicleClass | string | ✅ |
| メーカー | maker | string | ✅ |
| 車名 | model | string | ✅ |
| 年式 | year | number | ✅ |
| 色 | color | string | ✅ |
| ナンバープレート | plateNumber | string | ✅ |
| 車台番号 | chassisNumber | string | ✅ |
| 排気量 | displacement | number | ✅ |
| 燃料種別 | fuelType | string | ✅ |
| AT/MT | transmission | string | ✅ |
| 乗車定員 | capacity | number | ✅ |
| 車両画像 | imageUrl | string | ✅ |
| 車検有効期限 | inspectionExpiry | timestamp | ✅ |
| 法定点検満了日 | legalInspectionExpiry | timestamp | ✅ |
| 保険満了日 | insuranceExpiry | timestamp | ✅ |
| リースアップ日 | leaseExpiry | timestamp | ✅ |
| リース会社名 | leaseCompany | string | ✅ |
| リース月額 | leaseMonthlyFee | number | ✅ |
| オイル交換間隔(km) | oilChangeIntervalKm | number | ✅ |
| 最終オイル交換時走行距離 | lastOilChangeKm | number | ✅ |
| 最終オイル交換日 | lastOilChangeDate | timestamp | ✅ |
| 現在走行距離 | currentMileage | number | ✅ |
| 運用状態 | status | string | ✅ |
| 運用停止理由 | suspendedReason | string | ✅ |
| 運用停止期間 | suspendedFrom / suspendedTo | timestamp | ✅ |
| 車両共有設定 | sharedWithStores | string[] | ✅ |
| 備考 | memo | string | ✅ |
| ダミー車両フラグ | — | — | ⚠️ DB未対応 |
| WEB予約最低貸出日数（車両単位） | — | — | ⚠️ DB未対応 |
| 標準装備（カーナビ・ETC等） | — | — | ⚠️ DB未対応 |
| 禁煙車フラグ | — | — | ⚠️ DB未対応 |
| 車庫証明保管場所標章番号 | — | — | ⚠️ DB未対応 |
| 仕入れ情報（仕入日・仕入額等） | — | — | ⚠️ DB未対応 |
| 保険情報（保険会社・証券番号等） | — | — | ⚠️ DB未対応 |
| スタッドレス装備フラグ | — | — | ⚠️ DB未対応 |

### ⚠️ 要追加: 8フィールド

```typescript
// vehicles コレクションに追加
isDummy: boolean;                      // ダミー車両
webMinRentalDays: number;              // WEB予約最低貸出日数（車両単位）
standardEquipment: string[];           // 標準装備 ["carnavi", "etc", "bluetooth" ...]
isNonSmoking: boolean;                 // 禁煙車
hasStudless: boolean;                  // スタッドレス装備
parkingCertNumber: string;             // 車庫証明保管場所標章番号
purchaseInfo: {                        // 仕入れ情報
  purchaseDate: Timestamp | null;
  purchasePrice: number;
  purchaseFrom: string;                // 仕入先
};
insuranceInfo: {                       // 保険情報
  insuranceCompany: string;
  policyNumber: string;
  coverageType: string;
};
```

---

## 6. 顧客登録（customers コレクション）

マニュアル参照: P.99「新規の顧客情報を登録する」、P.36 予約時の利用者情報入力

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 姓 | lastName | string | ✅ |
| 名 | firstName | string | ✅ |
| セイ | lastNameKana | string | ✅ |
| メイ | firstNameKana | string | ✅ |
| 性別 | gender | string | ✅ |
| 生年月日 | birthDate | timestamp | ✅ |
| 郵便番号 | postalCode | string | ✅ |
| 都道府県 | prefecture | string | ✅ |
| 市区町村 | city | string | ✅ |
| 番地以降 | address | string | ✅ |
| 電話番号 | phone | string | ✅ |
| 携帯番号 | mobile | string | ✅ |
| メール | email | string | ✅ |
| 免許証番号 | licenseNumber | string | ✅ |
| 免許有効期限 | licenseExpiry | timestamp | ✅ |
| 免許種別 | licenseType | string | ✅ |
| ブラックレベル | blackLevel | number | ✅ |
| ブラック理由 | blackReason | string | ✅ |
| 備考 | memo | string | ✅ |
| 会員フラグ（アプリ会員） | — | — | ⚠️ DB未対応 |

### ⚠️ 要追加: 1フィールド

```typescript
// customers コレクションに追加
isAppMember: boolean;   // アプリ会員（「（会員）」表示用）
appMemberId: string;    // アプリ会員ID
```

---

## 7. 予約登録（reservations コレクション）

マニュアル参照: P.33-36「電話や窓口で受け付けた予約を登録する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 予約番号 | reservationNumber | string | ✅ |
| 顧客ID | customerId | string | ✅ |
| 顧客名 | customerName | string | ✅（デノーマライズ） |
| 顧客電話番号 | customerPhone | string | ✅（デノーマライズ） |
| 車両ID | vehicleId | string | ✅ |
| ナンバー | vehiclePlate | string | ✅（デノーマライズ） |
| 車名 | vehicleModel | string | ✅（デノーマライズ） |
| 車種クラス | vehicleClass | string | ✅（デノーマライズ） |
| 貸出日時 | startDate | timestamp | ✅ |
| 返却予定日時 | endDate | timestamp | ✅ |
| 予約経路（窓口/電話/ネット） | source | string | ✅ |
| ステータス | status | string | ✅ |
| 予約枠ロック | isLocked | boolean | ✅ |
| ネット予約制限 | isEndDateBlocked | boolean | ✅ |
| オプション | options | map[] | ✅ |
| 基本料金 | basePrice | number | ✅ |
| オプション料金合計 | optionPrice | number | ✅ |
| 合計料金 | totalPrice | number | ✅ |
| 前受金額 | depositAmount | number | ✅ |
| 支払方法 | paymentMethod | string | ✅ |
| 担当スタッフ | staffId / staffName | string | ✅ |
| キャンセル日時 | cancelledAt | timestamp | ✅ |
| キャンセル理由 | cancelReason | string | ✅ |
| キャンセル料 | cancelFee | number | ✅ |
| 備考 | memo | string | ✅ |
| 料金クラス（車両クラスと別に指定可） | — | — | ⚠️ DB未対応 |
| 配車料金 | — | — | ⚠️ DB未対応 |
| 値引き | — | — | ⚠️ DB未対応 |
| 追加運転者（運転者名＋免許証No.） | — | — | ⚠️ DB未対応 |
| 予約受付日 | — | — | ⚠️ createdAtで代替可能 |
| 本人確認書類情報 | — | — | ⚠️ DB未対応 |

### ⚠️ 要追加: 5フィールド

```typescript
// reservations コレクションに追加
pricingClass: VehicleClass;            // 料金クラス（車両クラスと異なる場合）
deliveryFee: number;                   // 配車料金
discount: number;                      // 値引き
additionalDrivers: {                   // 追加運転者
  name: string;
  licenseNumber: string;
}[];
identityVerification: string;          // 本人確認書類種別
```

---

## 8. 貸出登録（rentals コレクション）

マニュアル参照: P.57-59「予約から新規貸出登録をする」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 契約番号 | contractNumber | string | ✅ |
| 顧客情報 | customerId/customerName/customerPhone | string | ✅ |
| 車両情報 | vehicleId/vehiclePlate/vehicleModel | string | ✅ |
| 貸出日時 | startDate | timestamp | ✅ |
| 返却予定日時 | endDate | timestamp | ✅ |
| 実返却日時 | actualReturnDate | timestamp | ✅ |
| 出発時走行距離 | departureMileage | number | ✅ |
| 返却時走行距離 | returnMileage | number | ✅ |
| 返却時燃料レベル | fuelLevelAtReturn | string | ✅ |
| ステータス | status | string | ✅ |
| ネット予約制限 | isEndDateBlocked | boolean | ✅ |
| オプション | options | map[] | ✅ |
| 基本料金 | basePrice | number | ✅ |
| 合計請求額 | totalPrice | number | ✅ |
| 合計入金額 | totalPaid | number | ✅ |
| 残高 | balance | number | ✅ |
| 支払方法 | paymentMethod | string | ✅ |
| 担当スタッフ | staffId / staffName | string | ✅ |
| 延長履歴 | extensions | map[] | ✅ |
| 車両入替履歴 | vehicleReplacements | map[] | ✅ |
| 備考 | memo | string | ✅ |
| 料金クラス | — | — | ⚠️ DB未対応 |
| 配車料金 | — | — | ⚠️ DB未対応 |
| 値引き | — | — | ⚠️ DB未対応 |
| 追加運転者 | — | — | ⚠️ DB未対応 |
| 予約枠ロック | — | — | ⚠️ DB未対応 |
| 貸出場所（店頭/出張） | — | — | ⚠️ DB未対応 |
| 返却場所（店頭/出張） | — | — | ⚠️ DB未対応 |
| 本人確認書類情報 | — | — | ⚠️ DB未対応 |
| 契約書番号（店舗管理用） | — | — | ⚠️ contractNumberで代替? 別管理? |

### ⚠️ 要追加: 7フィールド

```typescript
// rentals コレクションに追加
pricingClass: VehicleClass;            // 料金クラス
deliveryFee: number;                   // 配車料金
discount: number;                      // 値引き
additionalDrivers: {                   // 追加運転者
  name: string;
  licenseNumber: string;
}[];
isLocked: boolean;                     // 予約枠ロック
pickupType: "store" | "delivery";      // 貸出場所
returnType: "store" | "delivery";      // 返却場所
identityVerification: string;          // 本人確認書類種別
```

---

## 9. 請求・入金（payments コレクション）

マニュアル参照: P.41「前入金」、P.55「キャンセル料入金」、P.71-78 請求・入金・返金

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 店舗ID | storeId | string | ✅ |
| 貸出ID | rentalId | string | ✅ |
| 予約ID（キャンセル料） | reservationId | string | ✅ |
| 顧客ID | customerId | string | ✅ |
| 種別（請求/入金/返金/貸倒） | type | string | ✅ |
| カテゴリ | category | string | ✅ |
| 金額 | amount | number | ✅ |
| 支払方法 | method | string | ✅ |
| 摘要 | description | string | ✅ |
| 取消済みフラグ | isCancelled | boolean | ✅ |
| 取消日時 | cancelledAt | timestamp | ✅ |
| 取消理由 | cancelReason | string | ✅ |
| 処理スタッフ | staffId / staffName | string | ✅ |
| 取引日 | transactionDate | timestamp | ✅ |
| 入金日（前入金の場合） | — | — | ⚠️ transactionDateで代替 ✅ |
| 電子決済ブランド種類 | — | — | ⚠️ DB未対応 |
| クレジットカードブランド種類 | — | — | ⚠️ DB未対応 |
| 銀行振込日 | — | — | ⚠️ DB未対応 |

### ⚠️ 要追加: 2フィールド

```typescript
// payments コレクションに追加
brandName: string;                     // 決済ブランド名（Visa/Suica等）
bankTransferDate: Timestamp | null;    // 銀行振込日（振込入金の場合）
```

---

## 10. 違法駐車（parkingViolations コレクション）

マニュアル参照: P.97「違法駐車の履歴を登録する」

| マニュアル上の項目 | DBフィールド | 型 | 状態 |
|---|---|---|---|
| 車両ID | vehicleId | string | ✅ |
| ナンバー | vehiclePlate | string | ✅ |
| 貸出ID | rentalId | string | ✅ |
| 顧客ID | customerId | string | ✅ |
| 顧客名 | customerName | string | ✅ |
| 違反日 | violationDate | timestamp | ✅ |
| 違反場所 | location | string | ✅ |
| 罰金額 | fineAmount | number | ✅ |
| 対応状態 | status | string | ✅ |
| 備考 | memo | string | ✅ |

**✅ 過不足なし**

---

## 要修正サマリー

### 追加が必要なフィールド一覧

| コレクション | 追加フィールド | 理由 |
|---|---|---|
| **stores** | highSeasonPeriods | ハイシーズン期間管理 |
| **netReservationSettings** | reservationIntervalHours | 予約インターバル |
| **netReservationSettings** | advanceHoursLimit | 受付時間制限 |
| **netReservationSettings** | timeSlotLimits | 時間帯別制限 |
| **netReservationSettings** | winterSeasonStart/End | 冬期シーズン |
| **netReservationSettings** | forceStudlessStart/End | スタッドレス強制 |
| **vehicles** | isDummy | ダミー車両 |
| **vehicles** | webMinRentalDays | WEB最低貸出日数(車両単位) |
| **vehicles** | standardEquipment | 標準装備 |
| **vehicles** | isNonSmoking | 禁煙車 |
| **vehicles** | hasStudless | スタッドレス装備 |
| **vehicles** | parkingCertNumber | 車庫証明番号 |
| **vehicles** | purchaseInfo | 仕入れ情報 |
| **vehicles** | insuranceInfo | 保険情報 |
| **customers** | isAppMember / appMemberId | アプリ会員 |
| **reservations** | pricingClass | 料金クラス（車両と別） |
| **reservations** | deliveryFee | 配車料金 |
| **reservations** | discount | 値引き |
| **reservations** | additionalDrivers | 追加運転者 |
| **reservations** | identityVerification | 本人確認書類 |
| **rentals** | pricingClass | 料金クラス |
| **rentals** | deliveryFee | 配車料金 |
| **rentals** | discount | 値引き |
| **rentals** | additionalDrivers | 追加運転者 |
| **rentals** | isLocked | 予約枠ロック |
| **rentals** | pickupType / returnType | 貸出・返却場所 |
| **rentals** | identityVerification | 本人確認書類 |
| **payments** | brandName | 決済ブランド名 |
| **payments** | bankTransferDate | 銀行振込日 |

### 合計: **29フィールドの追加が必要**

---

## 判断が必要な項目

以下はG-OASYS固有の仕組みであり、自社システムで採用するか判断が必要です。

| 項目 | マニュアル参照 | 判断ポイント |
|---|---|---|
| 料金プラン自動計算 | P.36 ⑱ | 「最安値プランを自動計算」→ プラン管理テーブルが別途必要 |
| GUTSポイント | P.155 | ガッツレンタカー固有。自社ポイント制度を作るか |
| 運輸支局帳票出力 | P.15 ④ | レンタカー事業では必須。帳票テンプレートが必要 |
| キャンセル料テーブル | P.53 | 何日前で何%のルール。設定テーブルが必要 |
| ハイシーズン料金テーブル | P.28 ⑦ | 期間×クラスで料金が変わる。料金マスタが必要 |
