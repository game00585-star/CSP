import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  PackageCheck,
  Search,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { warehouseGroups, movementLabels } from "../data/constants";
import { fmt, stockStatus } from "../utils/helpers";
import {
  PageHeader,
  StatCard,
  ExportButton,
  StatusBadge,
  Empty,
  ConfirmModal,
} from "../components/common";
import ReportNavigation from "../components/ReportNavigation";

const normalizeLotDate = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return match
    ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
    : "";
};

export default function StockCardPage({ lotsOnly = false, embedded = false }) {
  const { products, movements, lots, removeStockCardLots } = useApp(),
    [params] = useSearchParams();
  const mapLocation = params.get("location") || "",
    mapProduct = params.get("product") || "",
    mapGroup = params.get("group") || "",
    mapType = params.get("type") || "",
    mapStatus = params.get("status") || "",
    mapFrom = params.get("from") || "",
    mapTo = params.get("to") || "";
  const [product, setProduct] = useState(mapProduct),
    [productSearch, setProductSearch] = useState(mapLocation),
    [lotSearch, setLotSearch] = useState(""),
    [group, setGroup] = useState(mapGroup),
    [type, setType] = useState(mapType),
    [status, setStatus] = useState(mapStatus),
    [from, setFrom] = useState(mapFrom),
    [to, setTo] = useState(mapTo);
  const [selectedLots, setSelectedLots] = useState([]),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    setProduct(mapProduct);
    setProductSearch(mapLocation);
    setGroup(mapGroup);
    setType(mapType);
    setStatus(mapStatus);
    setFrom(mapFrom);
    setTo(mapTo);
    setSelectedLots([]);
  }, [mapLocation, mapProduct, mapGroup, mapType, mapStatus, mapFrom, mapTo]);
  const filteredProducts = useMemo(
    () =>
      products.filter((item) => {
        if (group && item.warehouseGroup !== group) return false;
        if (status === "low" && stockStatus(item) !== "ใกล้หมด") return false;
        if (status === "out" && stockStatus(item) !== "หมด") return false;
        if (!productSearch) return true;
        const term = productSearch.toLowerCase(),
          matchesProduct =
            `${item.productName} ${item.productCode} ${item.barcode}`
              .toLowerCase()
              .includes(term);
        const matchesLocation = lots.some(
          (lot) =>
            lot.productId === item.id &&
            Number(lot.quantityRemaining) > 0 &&
            String(lot.locationName || "")
              .toLowerCase()
              .includes(term),
        );
        return matchesProduct || matchesLocation;
      }),
    [products, lots, productSearch, group, status],
  );
  const selected = products.find((item) => item.id === product);
  const list = useMemo(
    () =>
      movements.filter((movement) => {
        const movementProduct = products.find(
            (item) => item.id === movement.productId,
          ),
          matchesStatus =
            !status ||
            (status === "low" &&
              stockStatus(
                movementProduct || { currentStock: 0, minStock: 0 },
              ) === "ใกล้หมด") ||
            (status === "out" &&
              stockStatus(
                movementProduct || { currentStock: 0, minStock: 0 },
              ) === "หมด");
        return (
          (!product || movement.productId === product) &&
          matchesStatus &&
          (!productSearch ||
            `${movement.productName} ${movement.productCode} ${movement.barcode} ${movement.locationName}`
              .toLowerCase()
              .includes(productSearch.toLowerCase())) &&
          (!lotSearch || normalizeLotDate(movement.lotNo) === lotSearch) &&
          (!group || movement.warehouseGroup === group) &&
          (!type ||
            (type === "TRANSFER"
              ? movement.transactionType.startsWith("TRANSFER_")
              : movement.transactionType === type)) &&
          (!from || (normalizeLotDate(movement.transactionDate) || String(movement.transactionDate || "").slice(0, 10)) >= from) &&
          (!to || (normalizeLotDate(movement.transactionDate) || String(movement.transactionDate || "").slice(0, 10)) <= to)
        );
      }),
    [
      movements,
      products,
      product,
      productSearch,
      lotSearch,
      group,
      type,
      status,
      from,
      to,
    ],
  );
  const lotList = useMemo(
    () =>
      lots
        .filter((lot) => {
          const lotProduct = products.find((item) => item.id === lot.productId),
            receivedDate = normalizeLotDate(lot.receivedDate) || String(lot.receivedDate || "").slice(0, 10),
            matchesStatus =
              !status ||
              (status === "low" &&
                stockStatus(lotProduct || { currentStock: 0, minStock: 0 }) ===
                  "ใกล้หมด") ||
              (status === "out" &&
                stockStatus(lotProduct || { currentStock: 0, minStock: 0 }) ===
                  "หมด");
          return (
            Number(lot.quantityRemaining) > 0 &&
            matchesStatus &&
            (!product || lot.productId === product) &&
            (!productSearch ||
              `${lot.productName} ${lot.productCode} ${lot.barcode} ${lot.locationName}`
                .toLowerCase()
                .includes(productSearch.toLowerCase())) &&
            (!lotSearch || normalizeLotDate(lot.lotNo) === lotSearch) &&
            (!group || lot.warehouseGroup === group) &&
            (!from || receivedDate >= from) &&
            (!to || receivedDate <= to)
          );
        })
        .sort((a, b) => a.receivedDate.localeCompare(b.receivedDate)),
    [lots, products, product, productSearch, lotSearch, group, status, from, to],
  );
  const totals = {
    in: list.reduce((sum, movement) => sum + Number(movement.quantityIn || 0), 0),
    out: list.reduce((sum, movement) => sum + Number(movement.quantityOut || 0), 0),
    tin: list
      .filter((movement) => movement.transactionType === "TRANSFER_IN")
      .reduce((sum, movement) => sum + Number(movement.quantityIn || 0), 0),
    tout: list
      .filter((movement) => movement.transactionType === "TRANSFER_OUT")
      .reduce((sum, movement) => sum + Number(movement.quantityOut || 0), 0),
  };
  const filteredStock = lotList.reduce(
      (sum, lot) => sum + Number(lot.quantityRemaining || 0),
      0,
    ),
    hasStockFilter = Boolean(product || productSearch || lotSearch || group);
  const visibleSelected = selectedLots.filter((id) =>
      lotList.some((lot) => lot.id === id),
    ),
    allLotsSelected =
      lotList.length > 0 &&
      lotList.every((lot) => selectedLots.includes(lot.id));
  const toggleAllLots = () =>
    setSelectedLots(
      allLotsSelected
        ? selectedLots.filter((id) => !lotList.some((lot) => lot.id === id))
        : [...new Set([...selectedLots, ...lotList.map((lot) => lot.id)])],
    );
  const toggleLot = (id) =>
    setSelectedLots((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const deleteSelectedLots = () => {
    removeStockCardLots(visibleSelected);
    setSelectedLots((current) =>
      current.filter((id) => !visibleSelected.includes(id)),
    );
    setConfirmDelete(false);
  };
  const clear = () => {
    setProduct("");
    setProductSearch("");
    setLotSearch("");
    setGroup("");
    setType("");
    setStatus("");
    setFrom("");
    setTo("");
    setSelectedLots([]);
  };
  return (
    <>
      {!embedded && <PageHeader
        title={lotsOnly ? "Lot คงเหลือ" : "Stock Card"}
        subtitle={lotsOnly ? "ตรวจสอบสินค้าคงเหลือแยกตาม Lot วันที่รับ คลัง และจุดเก็บ" : "ตรวจสอบวันที่ทำรายการ ประเภทรายการ และยอดคงเหลือ"}
        actions={
          <ExportButton
            rows={lotsOnly ? lotList : list.map((movement) => ({
              ...movement,
              transactionType: movementLabels[movement.transactionType],
            }))}
            name={lotsOnly ? "CSP-lot-balance" : "CSP-stock-card"}
          />
        }
      />}
      {!embedded && <ReportNavigation />}
      <div className="card filters">
        <label>
          ค้นหาสินค้า / จุดเก็บ
          <div className="filter-search">
            <Search />
            <input
              value={productSearch}
              onChange={(event) => {
                setProductSearch(event.target.value);
                setProduct("");
              }}
              placeholder="รหัสสินค้า ชื่อสินค้า หรือจุดเก็บ"
            />
          </div>
        </label>
        <label>
          ค้นหา Lot (วันที่)
          <input
            type="date"
            value={lotSearch}
            onChange={(event) => setLotSearch(event.target.value)}
          />
        </label>
        <label>
          สินค้า
          <select
            value={product}
            onChange={(event) => setProduct(event.target.value)}
          >
            <option value="">ทุกสินค้า ({filteredProducts.length})</option>
            {filteredProducts.map((item) => (
              <option value={item.id} key={item.id}>
                {item.productCode} · {item.productName} · {item.warehouseGroup}
              </option>
            ))}
          </select>
        </label>
        <label>
          กลุ่มคลัง
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            <option value="">ทุกคลัง</option>
            {warehouseGroups.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {!lotsOnly && <label>
          ประเภท
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">ทุกประเภท</option>
            <option value="TRANSFER">โอนเข้าและโอนออก</option>
            {Object.entries(movementLabels).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>}
        <label>
          สถานะสินค้า
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="low">สินค้าใกล้หมด</option>
            <option value="out">สินค้าหมด</option>
          </select>
        </label>
        <label>
          วันที่ทำรายการ ตั้งแต่
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          วันที่ทำรายการ ถึง
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button className="btn ghost" onClick={clear}>
          ล้างค่า
        </button>
      </div>
      {selected && (
        <div className="product-banner">
          <div>
            <small>
              {selected.barcode} · {selected.productCode}
            </small>
            <h2>{selected.productName}</h2>
            <span>
              {selected.warehouseGroup} · {selected.unit}
            </span>
          </div>
          <div>
            <small>Stock ตามตัวกรอง</small>
            <b>{fmt(filteredStock)}</b>
            <StatusBadge
              status={stockStatus({ ...selected, currentStock: filteredStock })}
            />
          </div>
        </div>
      )}
      {!lotsOnly && <><div className="stats-grid compact">
        <StatCard
          icon={PackageCheck}
          label={
            productSearch ? `Stock ที่ ${productSearch}` : "Stock ปัจจุบัน"
          }
          value={fmt(
            hasStockFilter
              ? filteredStock
              : products.reduce((sum, item) => sum + item.currentStock, 0),
          )}
          unit={selected?.unit || "หลายหน่วย"}
          onClick={() => setType("")}
        />
        <StatCard
          icon={ArrowDownToLine}
          label="รับเข้ารวม"
          value={fmt(totals.in)}
          unit={selected?.unit || "หลายหน่วย"}
          color="green"
          onClick={() => setType("RECEIVE")}
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="จ่ายออกรวม"
          value={fmt(totals.out)}
          unit={selected?.unit || "หลายหน่วย"}
          color="orange"
          onClick={() => setType("ISSUE")}
        />
        <StatCard
          icon={ArrowRightLeft}
          label="โอนเข้า / ออก"
          value={`${fmt(totals.tin)} / ${fmt(totals.tout)}`}
          unit={selected?.unit || "หลายหน่วย"}
          color="purple"
          onClick={() => setType("TRANSFER")}
        />
      </div>
      <div className="card stock-movement-card">
        <div className="card-title">
          <div><h2>รายการเคลื่อนไหว</h2><p>แยกตามวันที่และประเภท รับเข้า จ่ายออก โอนเข้า และโอนออก</p></div>
          <span className="movement-result-count">{list.length} รายการ</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>วันที่ทำรายการ</th><th>ประเภท</th><th>เลขที่เอกสาร</th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>คลัง / จุดเก็บ</th><th>Lot</th><th>IN</th><th>OUT</th><th>คงเหลือหลังทำรายการ</th><th>ผู้ทำรายการ</th></tr></thead>
            <tbody>{list.map(movement=><tr key={movement.id}><td><b>{movement.transactionDate||'—'}</b><small>{movement.transactionTime||''}</small></td><td><span className={`movement-badge ${String(movement.transactionType||'').toLowerCase()}`}>{movementLabels[movement.transactionType]||movement.transactionType}</span></td><td>{movement.documentNo||'—'}</td><td>{movement.productCode||'—'}</td><td>{movement.productName||'—'}</td><td>{movement.warehouseGroup||'—'}<small>{movement.locationName||'ไม่ระบุจุดเก็บ'}</small></td><td>{movement.lotNo||'—'}</td><td className="qty-in">{movement.quantityIn?fmt(movement.quantityIn):'—'}</td><td className="qty-out">{movement.quantityOut?fmt(movement.quantityOut):'—'}</td><td className="num">{movement.balanceAfter==null?'—':fmt(movement.balanceAfter)}</td><td>{movement.userName||movement.createdBy||'—'}</td></tr>)}</tbody>
          </table>
          {!list.length&&<Empty/>}
        </div>
      </div></>}
      {lotsOnly && <div className="card">
        <div className="card-title">
          <h2>Lot คงเหลือ</h2>
          <div className="stock-card-lot-actions">
            {visibleSelected.length > 0 && (
              <button
                className="btn danger-btn"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> ลบที่เลือก ({visibleSelected.length})
              </button>
            )}
            <ExportButton rows={lotList} name="CSP-lot-balance" />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allLotsSelected}
                    onChange={toggleAllLots}
                    aria-label="เลือก Lot ทั้งหมดตามตัวกรอง"
                  />
                </th>
                <th>รหัสสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>จุดเก็บ</th>
                <th>คลัง</th>
                <th>Lot</th>
                <th>วันที่รับ Lot</th>
                <th>หน่วย</th>
                <th>รับทั้งหมด</th>
                <th>คงเหลือ Lot</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {lotList.map((lot) => (
                <tr
                  key={lot.id}
                  className={
                    selectedLots.includes(lot.id) ? "selected-row" : ""
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLots.includes(lot.id)}
                      onChange={() => toggleLot(lot.id)}
                      aria-label={`เลือก Lot ${lot.lotNo} ${lot.productName}`}
                    />
                  </td>
                  <td>
                    <b>{lot.productCode}</b>
                    <small>{lot.barcode}</small>
                  </td>
                  <td>{lot.productName}</td>
                  <td>{lot.locationName || "ไม่ระบุจุดเก็บ"}</td>
                  <td>{lot.warehouseGroup}</td>
                  <td>
                    <b>{lot.lotNo}</b>
                  </td>
                  <td>{lot.receivedDate}</td>
                  <td>
                    {products.find((item) => item.id === lot.productId)?.unit ||
                      "—"}
                  </td>
                  <td>{fmt(lot.quantityReceived)}</td>
                  <td>
                    <b>{fmt(lot.quantityRemaining)}</b>
                  </td>
                  <td>
                    <button
                      className="icon-btn danger"
                      title="ลบ Lot นี้"
                      onClick={() => {
                        setSelectedLots([lot.id]);
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!lotList.length && <Empty />}
        </div>
      </div>}
      {confirmDelete && (
        <ConfirmModal
          title={`ลบรายการ Stock Card ${visibleSelected.length} รายการ`}
          text={`ยืนยันลบ Lot ที่เลือก ${visibleSelected.length} รายการหรือไม่? ระบบจะหักยอดคงเหลือของสินค้า บันทึกรายการปรับออก และเก็บประวัติไว้ใน Audit Log การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          onClose={() => setConfirmDelete(false)}
          onConfirm={deleteSelectedLots}
        />
      )}
    </>
  );
}
