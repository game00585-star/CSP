import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  MapPinned,
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
  Empty,
  ConfirmModal,
} from "../components/common";
import ReportNavigation from "../components/ReportNavigation";
import "./warehouseEnhancements.css";

const normalizeLotDate = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return match
    ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
    : "";
};

const stockCardMovementTypes = ["RECEIVE", "ISSUE", "TRANSFER_IN", "TRANSFER_OUT"];
const movementActionText = (movement) => {
  const source = movement.sourceWarehouse || movement.warehouseGroup || "—";
  const destination = movement.destinationWarehouse || movement.warehouseGroup || "—";
  if (movement.transactionType === "RECEIVE") return `รับเข้า → คลัง ${destination}`;
  if (movement.transactionType === "ISSUE") return `จ่ายออกจากคลัง ${source}`;
  if (movement.transactionType === "TRANSFER_OUT") return `โอนออก ${source} → ${destination}`;
  if (movement.transactionType === "TRANSFER_IN") return `โอนเข้า ${source} → ${destination}`;
  return movementLabels[movement.transactionType] || movement.transactionType || "—";
};

export default function StockCardPage({ lotsOnly = false, embedded = false }) {
  const { products, movements, lots, activePeriod, removeStockCardLots } = useApp(),
    [params,setParams] = useSearchParams(),navigate=useNavigate();
  const mapLocationId = params.get("locationId") || "",
    mapLocation = params.get("location") || "",
    mapProduct = params.get("product") || "",
    mapGroup = params.get("group") || "",
    mapType = params.get("type") || "",
    mapStatus = params.get("status") || "",
    mapMonth = params.get("month") || activePeriod?.month || new Date().toISOString().slice(0,7),
    mapFrom = params.get("from") || "",
    mapTo = params.get("to") || "";
  const [product, setProduct] = useState(mapProduct),
    [productSearch, setProductSearch] = useState(mapLocation),
    [lotSearch, setLotSearch] = useState(""),
    [group, setGroup] = useState(mapGroup),
    [type, setType] = useState(mapType),
    [month, setMonth] = useState(mapMonth),
    [status, setStatus] = useState(mapStatus),
    [from, setFrom] = useState(mapFrom),
    [to, setTo] = useState(mapTo);
  const [selectedLots, setSelectedLots] = useState([]),
    [selectedMapProducts,setSelectedMapProducts]=useState([]),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    setProduct(mapProduct);
    setProductSearch(mapLocation);
    setGroup(mapGroup);
    setType(mapType);
    setMonth(mapMonth);
    setStatus(mapStatus);
    setFrom(mapFrom);
    setTo(mapTo);
    setSelectedLots([]);
    setSelectedMapProducts([]);
  }, [mapLocation, mapProduct, mapGroup, mapType, mapStatus, mapMonth, mapFrom, mapTo]);
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
            ((!mapLocationId && String(lot.locationName || "").toLowerCase().includes(term)) ||
              (mapLocationId && lot.locationId === mapLocationId)),
        );
        return matchesProduct || matchesLocation;
      }),
    [products, lots, productSearch, group, status, mapLocationId],
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
        const movementLot=lots.find(lot=>lot.id===movement.lotId),locationLots=lots.filter(lot=>lot.productId===movement.productId&&Number(lot.quantityRemaining)>0),matchesLocation=!mapLocationId&&!mapLocation||movement.locationId===mapLocationId||movementLot?.locationId===mapLocationId||(!mapLocationId&&String(movement.locationName||'').toLowerCase()===mapLocation.toLowerCase())||locationLots.some(lot=>(mapLocationId&&lot.locationId===mapLocationId)||(!mapLocationId&&String(lot.locationName||'').toLowerCase()===mapLocation.toLowerCase()));
        return (
          stockCardMovementTypes.includes(movement.transactionType) &&
          (!product || movement.productId === product) &&
          matchesStatus &&
          matchesLocation &&
          (!productSearch || mapLocation ||
            `${movement.productName} ${movement.productCode} ${movement.barcode} ${movement.locationName}`
              .toLowerCase()
              .includes(productSearch.toLowerCase())) &&
          (!lotSearch || normalizeLotDate(movement.lotNo) === lotSearch) &&
          (!group || movement.warehouseGroup === group) &&
          (!month || movement.periodMonth === month || String(movement.transactionDate || "").startsWith(month)) &&
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
      month,
      status,
      from,
      to,
      lots,
      mapLocation,
      mapLocationId,
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
            (!mapLocationId || lot.locationId === mapLocationId) &&
            (!mapLocationId && mapLocation ? String(lot.locationName||'').toLowerCase()===mapLocation.toLowerCase() : true) &&
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
    [lots, products, product, productSearch, lotSearch, group, status, from, to, mapLocation, mapLocationId],
  );
  const totals = {
    in: list
      .filter((movement) => movement.transactionType === "RECEIVE")
      .reduce((sum, movement) => sum + Number(movement.quantityIn || 0), 0),
    out: list
      .filter((movement) => movement.transactionType === "ISSUE")
      .reduce((sum, movement) => sum + Number(movement.quantityOut || 0), 0),
    tin: list
      .filter((movement) => movement.transactionType === "TRANSFER_IN")
      .reduce((sum, movement) => sum + Number(movement.quantityIn || 0), 0),
    tout: list
      .filter((movement) => movement.transactionType === "TRANSFER_OUT")
      .reduce((sum, movement) => sum + Number(movement.quantityOut || 0), 0),
  };
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
    setParams({});
    setProduct("");
    setProductSearch("");
    setLotSearch("");
    setGroup("");
    setType("");
    setMonth(activePeriod?.month || new Date().toISOString().slice(0,7));
    setStatus("");
    setFrom("");
    setTo("");
    setSelectedLots([]);
  };
  const movementLocation=movement=>movement.locationName||lots.find(lot=>lot.id===movement.lotId)?.locationName||(mapLocation&&lots.some(lot=>lot.productId===movement.productId&&Number(lot.quantityRemaining)>0&&((mapLocationId&&lot.locationId===mapLocationId)||(!mapLocationId&&lot.locationName===mapLocation)))?mapLocation:'ไม่ระบุจุดเก็บ');
  const visibleMapProducts=[...new Set(list.map(movement=>movement.productId).filter(id=>products.some(product=>product.id===id)))];
  const toggleMapProduct=(productId)=>setSelectedMapProducts(current=>current.includes(productId)?current.filter(id=>id!==productId):[...current,productId]);
  const allMapProductsSelected=visibleMapProducts.length>0&&visibleMapProducts.every(id=>selectedMapProducts.includes(id));
  const toggleAllMapProducts=()=>setSelectedMapProducts(allMapProductsSelected?[]:visibleMapProducts);
  const openMapAssignment=()=>{if(!selectedMapProducts.length)return;const selectedGroups=[...new Set(selectedMapProducts.map(id=>products.find(product=>product.id===id)?.warehouseGroup).filter(Boolean))],targetWarehouse=selectedGroups.length===1?warehouseGroups.find(item=>item.id===selectedGroups[0]):null;sessionStorage.setItem('csp_map_product_selection',JSON.stringify(selectedMapProducts));navigate(`/warehouse-map/${targetWarehouse?.path||'all'}?assign=1`)};
  const stockCardExportRows=list.map(movement=>({
    'วันที่ทำรายการ':movement.transactionDate||'—',
    'ประเภท':movementLabels[movement.transactionType]||movement.transactionType||'—',
    'ทำรายการ':movementActionText(movement),
    'จุดเก็บ':movementLocation(movement),
    'เลขที่เอกสาร':movement.documentNo||'—',
    'รหัสสินค้า':movement.productCode||'—',
    'ชื่อสินค้า':movement.productName||'—',
    'คลัง / จุดเก็บ':`${movement.warehouseGroup||'—'} / ${movementLocation(movement)}`,
    'Lot':movement.lotNo||'—',
    'จำนวน':Number(movement.quantityIn||movement.quantityOut||0),
    'ผู้ทำรายการ':movement.userName||movement.createdBy||'—',
  }));
  return (
    <>
      {!embedded && <PageHeader
        title={lotsOnly ? "Lot คงเหลือ" : "Stock Card"}
        subtitle={lotsOnly ? "ตรวจสอบสินค้าคงเหลือแยกตาม Lot วันที่รับ คลัง และจุดเก็บ" : "ตรวจสอบประวัติรับเข้า จ่ายออก และโอนระหว่างคลัง"}
        actions={
          <ExportButton
            rows={lotsOnly ? lotList : stockCardExportRows}
            name={lotsOnly ? "CSP-lot-balance" : "CSP-stock-card"}
          />
        }
      />}
      {!embedded && <ReportNavigation />}
      <div className="card filters report-unified-filters">
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
          เดือนที่ต้องการตรวจสอบ
          <input type="month" value={month} onChange={(event)=>setMonth(event.target.value)}/>
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
        </div>
      )}
      {!lotsOnly && <><div className="stats-grid compact" style={{gridTemplateColumns:'repeat(3, minmax(0, 1fr))'}}>
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
      <div className="report-tabs stock-card-tabs" aria-label="แยกประเภทรายการ Stock Card">
        <button className={!type?'active':''} onClick={()=>setType('')}>ทั้งหมด</button>
        <button className={type==='RECEIVE'?'active':''} onClick={()=>setType('RECEIVE')}>รับเข้า</button>
        <button className={type==='ISSUE'?'active':''} onClick={()=>setType('ISSUE')}>จ่ายออก</button>
        <button className={type==='TRANSFER'?'active':''} onClick={()=>setType('TRANSFER')}>โอนระหว่างคลัง</button>
      </div>
      <div className="card stock-movement-card">
        <div className="card-title">
          <div><h2>รายการเคลื่อนไหว</h2><p>แยกตามวันที่และประเภท รับเข้า จ่ายออก โอนเข้า และโอนออก</p></div>
          <div className="stock-card-lot-actions">{selectedMapProducts.length>0&&<button className="btn primary" onClick={openMapAssignment}><MapPinned/> จัดเข้าแผนที่ ({selectedMapProducts.length})</button>}<span className="movement-result-count">{list.length} รายการ</span></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th><input type="checkbox" checked={allMapProductsSelected} onChange={toggleAllMapProducts} aria-label="เลือกสินค้าทั้งหมดเพื่อจัดเข้าแผนที่"/></th><th>วันที่ทำรายการ</th><th>ประเภท</th><th>ทำรายการ</th><th>จุดเก็บ</th><th>เลขที่เอกสาร</th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>คลัง / จุดเก็บ</th><th>Lot</th><th>จำนวน</th><th>ผู้ทำรายการ</th></tr></thead>
            <tbody>{list.map(movement=>{const incoming=movement.transactionType==='RECEIVE'||movement.transactionType==='TRANSFER_IN',quantity=Number(movement.quantityIn||movement.quantityOut||0),canAssign=products.some(product=>product.id===movement.productId);return <tr key={movement.id} className={selectedMapProducts.includes(movement.productId)?'selected-row':''}><td><input type="checkbox" disabled={!canAssign} checked={selectedMapProducts.includes(movement.productId)} onChange={()=>toggleMapProduct(movement.productId)} aria-label={`เลือก ${movement.productName} เพื่อจัดเข้าแผนที่`}/></td><td><b>{movement.transactionDate||'—'}</b><small>{movement.transactionTime||''}</small></td><td><span className={`movement-badge ${String(movement.transactionType||'').toLowerCase()}`}>{movementLabels[movement.transactionType]||movement.transactionType}</span></td><td><b>{movementActionText(movement)}</b></td><td>{movementLocation(movement)}</td><td>{movement.documentNo||'—'}</td><td><b>{movement.productCode||'—'}</b></td><td>{movement.productName||'—'}</td><td>{movement.warehouseGroup||'—'}<small>{movementLocation(movement)}</small></td><td>{movement.lotNo||'—'}</td><td className={incoming?'qty-in':'qty-out'}><b>{quantity?fmt(quantity):'—'}</b></td><td>{movement.userName||movement.createdBy||'—'}</td></tr>})}</tbody>
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
