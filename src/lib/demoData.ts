// ============================================================
// デモ用ダミーデータ
// ============================================================

export interface Store {
  id: string;
  name: string;
  area: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  partName: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  unit: string;
  unitPrice: number;
  lastOrderDate: string;
}

export interface TransferRequest {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  partName: string;
  quantity: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestDate: string;
  note: string;
}

export interface MonthlyCost {
  month: string;
  storeId: string;
  totalCost: number;
}

// 店舗一覧
export const STORES: Store[] = [
  { id: "sapporo", name: "札幌店", area: "札幌市中央区" },
  { id: "asahikawa", name: "旭川店", area: "旭川市永山" },
  { id: "hakodate", name: "函館店", area: "函館市五稜郭" },
  { id: "obihiro", name: "帯広店", area: "帯広市西" },
  { id: "kushiro", name: "釧路店", area: "釧路市北大通" },
  { id: "kitami", name: "北見店", area: "北見市光西町" },
  { id: "tomakomai", name: "苫小牧店", area: "苫小牧市表町" },
  { id: "muroran", name: "室蘭店", area: "室蘭市中島町" },
];

export const CATEGORIES = ["オイル類", "タイヤ", "バッテリー", "ワイパー", "フィルター", "その他"];

const PARTS = [
  { name: "エンジンオイル 5W-30", category: "オイル類", unit: "L", unitPrice: 980 },
  { name: "エンジンオイル 0W-20", category: "オイル類", unit: "L", unitPrice: 1200 },
  { name: "ATF(オートマオイル)", category: "オイル類", unit: "L", unitPrice: 1500 },
  { name: "ブレーキフルード", category: "オイル類", unit: "L", unitPrice: 1800 },
  { name: "夏タイヤ 195/65R15", category: "タイヤ", unit: "本", unitPrice: 8500 },
  { name: "夏タイヤ 205/55R16", category: "タイヤ", unit: "本", unitPrice: 12000 },
  { name: "スタッドレス 195/65R15", category: "タイヤ", unit: "本", unitPrice: 11000 },
  { name: "スタッドレス 205/55R16", category: "タイヤ", unit: "本", unitPrice: 15000 },
  { name: "バッテリー 40B19L", category: "バッテリー", unit: "個", unitPrice: 5800 },
  { name: "バッテリー 55B24L", category: "バッテリー", unit: "個", unitPrice: 8900 },
  { name: "バッテリー 75D23L", category: "バッテリー", unit: "個", unitPrice: 12500 },
  { name: "ワイパーブレード 400mm", category: "ワイパー", unit: "本", unitPrice: 980 },
  { name: "ワイパーブレード 500mm", category: "ワイパー", unit: "本", unitPrice: 1100 },
  { name: "ワイパーブレード 600mm", category: "ワイパー", unit: "本", unitPrice: 1200 },
  { name: "エアフィルター", category: "フィルター", unit: "個", unitPrice: 1500 },
  { name: "オイルフィルター", category: "フィルター", unit: "個", unitPrice: 800 },
  { name: "エアコンフィルター", category: "フィルター", unit: "個", unitPrice: 2200 },
  { name: "ウォッシャー液", category: "その他", unit: "L", unitPrice: 300 },
  { name: "LLC(冷却水)", category: "その他", unit: "L", unitPrice: 600 },
  { name: "補機ベルト", category: "その他", unit: "本", unitPrice: 3500 },
];

function generateInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  let id = 1;
  const stockPatterns = [
    [45, 120, 8, 15, 6, 10, 12, 3, 4, 5, 2, 18, 14, 12, 8, 20, 6, 50, 30, 4],
    [30, 80, 5, 10, 8, 6, 20, 5, 3, 4, 3, 15, 10, 8, 6, 15, 4, 40, 25, 3],
    [25, 60, 4, 8, 4, 8, 16, 2, 2, 3, 1, 12, 8, 10, 5, 12, 3, 35, 20, 2],
    [35, 90, 6, 12, 10, 4, 14, 4, 5, 6, 4, 20, 16, 14, 10, 18, 8, 45, 28, 5],
    [20, 50, 3, 6, 3, 5, 10, 1, 2, 2, 1, 10, 6, 6, 4, 10, 2, 30, 15, 1],
    [15, 40, 2, 5, 5, 3, 8, 3, 3, 3, 2, 8, 5, 4, 3, 8, 3, 25, 12, 2],
    [28, 70, 4, 9, 7, 7, 18, 3, 4, 5, 3, 16, 12, 11, 7, 16, 5, 38, 22, 3],
    [22, 55, 3, 7, 5, 4, 12, 2, 3, 3, 2, 11, 7, 7, 5, 11, 4, 32, 18, 2],
  ];
  const reorderPoints = [20, 40, 3, 5, 4, 4, 8, 2, 3, 3, 2, 8, 6, 6, 4, 10, 3, 20, 10, 2];
  const months = ["2026-01-15", "2026-02-03", "2026-01-28", "2026-02-10", "2026-02-20", "2025-12-15", "2026-01-05", "2026-02-25"];

  STORES.forEach((store, si) => {
    PARTS.forEach((part, pi) => {
      items.push({
        id: `inv-${id++}`,
        storeId: store.id,
        partName: part.name,
        category: part.category,
        currentStock: stockPatterns[si][pi],
        reorderPoint: reorderPoints[pi],
        unit: part.unit,
        unitPrice: part.unitPrice,
        lastOrderDate: months[si],
      });
    });
  });

  return items;
}

export const ALL_INVENTORY: InventoryItem[] = generateInventory();

export function getStoreInventory(storeId: string): InventoryItem[] {
  return ALL_INVENTORY.filter((item) => item.storeId === storeId);
}

export function getInventoryStatus(item: InventoryItem): "ok" | "low" | "critical" {
  if (item.currentStock <= item.reorderPoint * 0.5) return "critical";
  if (item.currentStock <= item.reorderPoint) return "low";
  return "ok";
}

export const TRANSFER_REQUESTS: TransferRequest[] = [
  { id: "tr-1", fromStoreId: "sapporo", toStoreId: "asahikawa", partName: "エンジンオイル 5W-30", quantity: 20, status: "pending", requestDate: "2026-03-04", note: "旭川店在庫不足のため" },
  { id: "tr-2", fromStoreId: "hakodate", toStoreId: "muroran", partName: "スタッドレス 195/65R15", quantity: 4, status: "approved", requestDate: "2026-03-03", note: "室蘭店顧客対応用" },
  { id: "tr-3", fromStoreId: "obihiro", toStoreId: "kushiro", partName: "バッテリー 55B24L", quantity: 2, status: "completed", requestDate: "2026-03-01", note: "釧路店緊急補充" },
  { id: "tr-4", fromStoreId: "sapporo", toStoreId: "tomakomai", partName: "ワイパーブレード 500mm", quantity: 10, status: "pending", requestDate: "2026-03-05", note: "春先需要増加" },
  { id: "tr-5", fromStoreId: "kitami", toStoreId: "asahikawa", partName: "オイルフィルター", quantity: 8, status: "rejected", requestDate: "2026-02-28", note: "北見店も在庫不足" },
  { id: "tr-6", fromStoreId: "sapporo", toStoreId: "hakodate", partName: "LLC(冷却水)", quantity: 15, status: "approved", requestDate: "2026-03-02", note: "函館店季節需要" },
  { id: "tr-7", fromStoreId: "obihiro", toStoreId: "kitami", partName: "エアフィルター", quantity: 5, status: "pending", requestDate: "2026-03-05", note: "定期補充" },
];

export const MONTHLY_COSTS: MonthlyCost[] = [];
const costBase: Record<string, number[]> = {
  sapporo: [680000, 720000, 850000, 790000, 710000, 660000],
  asahikawa: [420000, 480000, 510000, 450000, 390000, 430000],
  hakodate: [380000, 350000, 420000, 400000, 360000, 390000],
  obihiro: [520000, 560000, 610000, 580000, 490000, 530000],
  kushiro: [290000, 310000, 340000, 320000, 280000, 300000],
  kitami: [250000, 270000, 300000, 280000, 240000, 260000],
  tomakomai: [460000, 490000, 540000, 510000, 440000, 470000],
  muroran: [320000, 340000, 380000, 360000, 310000, 330000],
};
const costMonths = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
STORES.forEach((store) => {
  costMonths.forEach((month, i) => {
    MONTHLY_COSTS.push({ month, storeId: store.id, totalCost: costBase[store.id][i] });
  });
});
