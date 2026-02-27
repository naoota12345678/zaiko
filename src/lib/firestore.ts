import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============================================================
// 共通CRUD
// ============================================================

export async function addDocument(
  collectionName: string,
  data: DocumentData
) {
  const ref = collection(db, collectionName);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeDocument(
  collectionName: string,
  docId: string
) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// ============================================================
// 店舗限定クエリ
// ============================================================

export async function getByStore<T>(
  collectionName: string,
  storeId: string,
  additionalConstraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const ref = collection(db, collectionName);
  const q = query(
    ref,
    where("storeId", "==", storeId),
    ...additionalConstraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as (T & { id: string })[];
}

// ============================================================
// 車両関連
// ============================================================

export async function getActiveVehicles(storeId: string) {
  return getByStore("vehicles", storeId, [
    where("status", "==", "active"),
    orderBy("vehicleClass"),
  ]);
}

export async function getActiveVehiclesByClass(storeId: string, vehicleClass: string) {
  return getByStore("vehicles", storeId, [
    where("status", "==", "active"),
    where("vehicleClass", "==", vehicleClass),
  ]);
}

// ============================================================
// 予約関連
// ============================================================

export async function getReservationsForPeriod(
  storeId: string,
  startDate: Date,
  endDate: Date
) {
  return getByStore("reservations", storeId, [
    where("status", "in", ["approved", "pending_approval"]),
    where("startDate", "<=", Timestamp.fromDate(endDate)),
    orderBy("startDate"),
  ]);
}

export async function getPendingReservations(storeId: string) {
  return getByStore("reservations", storeId, [
    where("status", "==", "pending_approval"),
    orderBy("createdAt", "desc"),
  ]);
}

// ============================================================
// 貸出関連
// ============================================================

export async function getRentalsForPeriod(
  storeId: string,
  startDate: Date,
  endDate: Date
) {
  return getByStore("rentals", storeId, [
    where("status", "in", ["active", "extended", "overdue", "unreturned"]),
    where("startDate", "<=", Timestamp.fromDate(endDate)),
    orderBy("startDate"),
  ]);
}

export async function getOverdueRentals(storeId: string) {
  return getByStore("rentals", storeId, [
    where("status", "in", ["overdue", "unreturned"]),
    orderBy("endDate"),
  ]);
}

// ============================================================
// 顧客関連
// ============================================================

export async function searchCustomers(
  storeId: string,
  searchField: "lastNameKana" | "phone" | "licenseNumber",
  searchValue: string
) {
  return getByStore("customers", storeId, [
    where(searchField, ">=", searchValue),
    where(searchField, "<=", searchValue + "\uf8ff"),
    limit(20),
  ]);
}

// ============================================================
// 入金関連
// ============================================================

export async function getPaymentsForPeriod(
  storeId: string,
  type: "charge" | "payment",
  startDate: Date,
  endDate: Date
) {
  return getByStore("payments", storeId, [
    where("type", "==", type),
    where("isCancelled", "==", false),
    where("transactionDate", ">=", Timestamp.fromDate(startDate)),
    where("transactionDate", "<=", Timestamp.fromDate(endDate)),
    orderBy("transactionDate"),
  ]);
}

export async function getPaymentsByMethod(
  storeId: string,
  method: string,
  startDate: Date,
  endDate: Date
) {
  return getByStore("payments", storeId, [
    where("type", "==", "payment"),
    where("method", "==", method),
    where("isCancelled", "==", false),
    where("transactionDate", ">=", Timestamp.fromDate(startDate)),
    where("transactionDate", "<=", Timestamp.fromDate(endDate)),
    orderBy("transactionDate"),
  ]);
}

// ============================================================
// ★新規: 料金プラン関連
// ============================================================

export async function getActivePricingPlans(storeId: string) {
  const all = await getByStore<{ isActive: boolean; vehicleClass: string; sortOrder: number }>("pricingPlans", storeId);
  return all
    .filter((p) => p.isActive)
    .sort((a, b) => {
      if (a.vehicleClass !== b.vehicleClass) return a.vehicleClass.localeCompare(b.vehicleClass);
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
}

export async function getPricingPlansByClass(storeId: string, vehicleClass: string) {
  const all = await getByStore<{ vehicleClass: string; isActive: boolean; sortOrder: number }>("pricingPlans", storeId);
  return all
    .filter((p) => p.vehicleClass === vehicleClass && p.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * 最安値の料金プランを自動計算
 * G-OASYS: 「最安値料金となるように自動計算されます」
 */
export function calculateBestPrice(
  plans: { durationDays: number; basePrice: number; perExtraDayPrice: number; highSeasonPrice: number }[],
  rentalDays: number,
  isHighSeason: boolean
): { planIndex: number; totalPrice: number } {
  let bestPlanIndex = 0;
  let bestPrice = Infinity;

  plans.forEach((plan, index) => {
    const price = isHighSeason ? plan.highSeasonPrice : plan.basePrice;
    let total: number;

    if (rentalDays <= plan.durationDays) {
      total = price;
    } else {
      const extraDays = rentalDays - plan.durationDays;
      total = price + extraDays * plan.perExtraDayPrice;
    }

    // 複数プランを組み合わせた方が安い場合も計算
    const fullSets = Math.floor(rentalDays / plan.durationDays);
    const remainder = rentalDays % plan.durationDays;
    const combinedTotal = fullSets * price + remainder * plan.perExtraDayPrice;
    total = Math.min(total, combinedTotal);

    if (total < bestPrice) {
      bestPrice = total;
      bestPlanIndex = index;
    }
  });

  return { planIndex: bestPlanIndex, totalPrice: bestPrice };
}

// ============================================================
// ★新規: キャンセル料計算
// ============================================================

export async function getActiveCancelPolicies(storeId: string) {
  const all = await getByStore<{ isActive: boolean }>("cancelPolicies", storeId);
  return all.filter((p) => p.isActive);
}

/**
 * キャンセル料を計算
 */
export function calculateCancelFee(
  rules: { daysBeforeStart: number; feeType: "percentage" | "fixed"; feeValue: number }[],
  daysBeforeStart: number,
  totalPrice: number
): number {
  // ルールを日数の降順にソート（遠い日付から近い日付へ）
  const sortedRules = [...rules].sort((a, b) => b.daysBeforeStart - a.daysBeforeStart);

  // 該当するルールを探す
  const applicableRule = sortedRules.find(
    (rule) => daysBeforeStart <= rule.daysBeforeStart
  );

  if (!applicableRule) return 0; // 該当なし = キャンセル料なし

  if (applicableRule.feeType === "percentage") {
    return Math.floor(totalPrice * (applicableRule.feeValue / 100));
  } else {
    return applicableRule.feeValue;
  }
}

// ============================================================
// ★新規: オプションマスタ関連
// ============================================================

export async function getActiveOptions(storeId: string) {
  const all = await getByStore<{ isActive: boolean; sortOrder: number }>("optionMasters", storeId);
  return all
    .filter((o) => o.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// ============================================================
// ユーティリティ
// ============================================================

export function generateReservationNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `R-${date}-${rand}`;
}

export function generateContractNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `C-${date}-${rand}`;
}
