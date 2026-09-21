export const finiteNumber=value=>{
  const number=typeof value==='number'?value:Number(String(value??'').replaceAll(',','').trim());
  return Number.isFinite(number)?number:null;
};

export const movementDateTime=movement=>{
  if(movement?.occurredAt){const value=new Date(movement.occurredAt);if(!Number.isNaN(value.getTime()))return value}
  if(movement?.createdAt){const value=new Date(movement.createdAt);if(!Number.isNaN(value.getTime()))return value}
  const date=movement?.transactionDate||movement?.receiveDate||movement?.issueDate;
  if(!date)return null;
  const value=new Date(`${date}T${movement?.transactionTime||'00:00:00'}`);
  return Number.isNaN(value.getTime())?null:value;
};

export const endOfMonth=month=>{
  const [year,number]=String(month||'').split('-').map(Number);
  return year&&number?new Date(year,number,0,23,59,59,999):null;
};

export const movementSignedQuantity=movement=>Number(movement?.quantityIn||0)-Number(movement?.quantityOut||0);

export const movementsAfterCount=(movements,line,month)=>{
  const countedAt=new Date(line?.countedAt),end=endOfMonth(month);
  if(Number.isNaN(countedAt.getTime())||!end)return[];
  return movements.filter(movement=>{
    if(movement.productId!==line.productId||movement.warehouseGroup!==line.warehouseGroup)return false;
    if(movement.id===line.adjustmentMovementId||movement.stockCountLineId===line.id)return false;
    const at=movementDateTime(movement);
    return at&&at>countedAt&&at<=end;
  });
};

export const projectCountLine=(line,movements,month)=>{
  const after=movementsAfterCount(movements,line,month);
  const incoming=after.reduce((sum,item)=>sum+Number(item.quantityIn||0),0);
  const outgoing=after.reduce((sum,item)=>sum+Number(item.quantityOut||0),0);
  return{...line,inAfterCount:incoming,outAfterCount:outgoing,projectedClosing:Number(line.countedQuantity||0)+incoming-outgoing,afterMovements:after};
};

export const latestCountLines=(stockCounts,month,warehouseGroup)=>{
  const latest=new Map();
  stockCounts.filter(session=>String(session.countDate||session.createdAt||'').startsWith(month)&&(!warehouseGroup||session.warehouseGroup===warehouseGroup)).forEach(session=>{
    (session.lines||[]).forEach(line=>{
      const normalized={...line,countSessionId:line.countSessionId||session.id,documentNo:line.documentNo||session.documentNo,warehouseGroup:line.warehouseGroup||session.warehouseGroup};
      const current=latest.get(normalized.productId);
      if(!current||String(normalized.countedAt||'')>String(current.countedAt||''))latest.set(normalized.productId,normalized);
    });
  });
  return latest;
};

export const nextMonthKey=month=>{
  const [year,number]=String(month).split('-').map(Number),date=new Date(year,number,1);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
};
