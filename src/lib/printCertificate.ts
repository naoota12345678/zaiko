import { Timestamp } from "firebase/firestore";
import { Rental, VEHICLE_CLASS_LABELS, PAYMENT_METHOD_LABELS, LOCATION_TYPE_LABELS } from "@/types";

function fmt(val: Timestamp | null | undefined): string {
  if (!val) return "";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function fmtDate(val: Timestamp | null | undefined): string {
  if (!val) return "";
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as unknown as string);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface StoreInfo {
  name: string;
  phone: string;
  address: string;
  postalCode: string;
  prefecture: string;
  city: string;
  contractInfo?: { companyName: string; representative: string; registrationNumber: string };
  transportBureau?: string;
}

export function printRentalCertificate(rental: Rental & { id: string }, store: StoreInfo) {
  const optionsHtml = (rental.options ?? []).map(
    (opt) => `<tr><td>${opt.name}</td><td class="right">${opt.quantity}</td><td class="right">${(opt.unitPrice * opt.quantity).toLocaleString()}円</td></tr>`
  ).join("");

  const driversHtml = (rental.additionalDrivers ?? []).map(
    (d) => `<tr><td>${d.name}</td><td>${d.licenseNumber || "-"}</td></tr>`
  ).join("");

  const storeAddr = `${store.postalCode ? "〒" + store.postalCode + " " : ""}${store.prefecture}${store.city}${store.address ?? ""}`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>貸渡証 - ${rental.contractNumber}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic", sans-serif; font-size: 11px; color: #222; line-height: 1.6; }
  .header { text-align: center; margin-bottom: 16px; }
  .header h1 { font-size: 22px; letter-spacing: 8px; border-bottom: 2px solid #333; display: inline-block; padding-bottom: 4px; }
  .contract-no { text-align: right; font-size: 12px; margin-bottom: 8px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 3px 8px; border-left: 3px solid #333; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.bordered td, table.bordered th { border: 1px solid #999; padding: 4px 8px; }
  table.bordered th { background: #f5f5f5; font-weight: bold; text-align: left; white-space: nowrap; width: 120px; }
  .right { text-align: right; }
  .total-row td { font-weight: bold; font-size: 13px; border-top: 2px solid #333 !important; }
  .store-info { margin-top: 24px; border-top: 1px solid #ccc; padding-top: 12px; font-size: 10px; }
  .signatures { margin-top: 24px; display: flex; justify-content: space-between; }
  .sig-box { width: 45%; border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 10px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header"><h1>自動車貸渡証</h1></div>
  <div class="contract-no">契約番号: <strong>${rental.contractNumber}</strong></div>
  <div class="contract-no">発行日: ${fmtDate(Timestamp.now())}</div>

  <div class="section">
    <div class="section-title">借受人情報</div>
    <table class="bordered">
      <tr><th>氏名</th><td colspan="3">${rental.customerName}</td></tr>
      <tr><th>電話番号</th><td colspan="3">${rental.customerPhone ?? ""}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">車両情報</div>
    <table class="bordered">
      <tr><th>登録番号</th><td>${rental.vehiclePlate}</td><th>車名</th><td>${rental.vehicleModel}</td></tr>
      <tr><th>車種クラス</th><td>${VEHICLE_CLASS_LABELS[rental.vehicleClass] ?? ""}</td><th>出発メーター</th><td>${(rental.departureMileage ?? 0).toLocaleString()} km</td></tr>
      ${rental.returnMileage != null ? `<tr><th>返却メーター</th><td>${rental.returnMileage.toLocaleString()} km</td><th>走行距離</th><td>${(rental.returnMileage - (rental.departureMileage ?? 0)).toLocaleString()} km</td></tr>` : ""}
    </table>
  </div>

  <div class="section">
    <div class="section-title">貸渡期間</div>
    <table class="bordered">
      <tr><th>貸渡日時</th><td>${fmt(rental.startDate)}</td><th>返却予定日時</th><td>${fmt(rental.endDate)}</td></tr>
      <tr><th>貸渡方法</th><td>${LOCATION_TYPE_LABELS[rental.pickupType] ?? "店頭"}</td><th>返却方法</th><td>${LOCATION_TYPE_LABELS[rental.returnType] ?? "店頭"}</td></tr>
      ${rental.actualReturnDate ? `<tr><th>実返却日時</th><td colspan="3">${fmt(rental.actualReturnDate)}</td></tr>` : ""}
    </table>
  </div>

  ${driversHtml ? `
  <div class="section">
    <div class="section-title">追加運転者</div>
    <table class="bordered">
      <tr><th>氏名</th><th>免許証番号</th></tr>
      ${driversHtml}
    </table>
  </div>` : ""}

  <div class="section">
    <div class="section-title">料金明細</div>
    <table class="bordered">
      <tr><th>基本料金</th><td class="right" colspan="2">${(rental.basePrice ?? 0).toLocaleString()}円</td></tr>
      ${optionsHtml ? `<tr><th colspan="3" style="text-align:center; font-size:10px;">オプション</th></tr>${optionsHtml}` : ""}
      ${(rental.deliveryFee ?? 0) > 0 ? `<tr><th>配車料金</th><td class="right" colspan="2">${rental.deliveryFee.toLocaleString()}円</td></tr>` : ""}
      ${(rental.discount ?? 0) > 0 ? `<tr><th>値引き</th><td class="right" colspan="2">-${rental.discount.toLocaleString()}円</td></tr>` : ""}
      <tr class="total-row"><td style="font-weight:bold;">合計金額</td><td class="right" colspan="2">${(rental.totalPrice ?? 0).toLocaleString()}円</td></tr>
      <tr><th>支払方法</th><td colspan="2">${PAYMENT_METHOD_LABELS[rental.paymentMethod] ?? rental.paymentMethod}</td></tr>
      <tr><th>入金済み</th><td class="right" colspan="2">${(rental.totalPaid ?? 0).toLocaleString()}円</td></tr>
      <tr><th>残金</th><td class="right" colspan="2">${(rental.balance ?? 0).toLocaleString()}円</td></tr>
    </table>
  </div>

  <div class="signatures">
    <div class="sig-box">借受人署名</div>
    <div class="sig-box">貸渡人署名</div>
  </div>

  <div class="store-info">
    <strong>${store.name ?? ""}</strong><br>
    ${storeAddr}<br>
    TEL: ${store.phone ?? ""}
    ${store.contractInfo?.companyName ? `<br>${store.contractInfo.companyName} ${store.contractInfo.representative ? "代表: " + store.contractInfo.representative : ""}` : ""}
    ${store.transportBureau ? `<br>管轄: ${store.transportBureau}` : ""}
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
