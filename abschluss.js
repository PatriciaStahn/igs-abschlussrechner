/* IGS RLP, §75(1) und §30(3) ÜSchO. Unabhängige, nachvollziehbare Regel-Engine. */
(function(root){'use strict';
function adjusted(s){const n=Number(s.grade);return s.level==='E2'?Math.max(1,n-1):n}
function evaluate(input,mode){
 const rows=input.filter(s=>s.grade!==''&&s.grade!=null).map(s=>({...s,note:adjusted(s),core:['Deutsch','Mathematik','Englisch'].includes(s.name),wpf:/Wahlpflichtfach|\bWPF\b/i.test(s.name)}));
 const errors=[];if(!rows.length)errors.push('Es wurden noch keine Noten eingegeben.');
 if(input.some(s=>s.grade===''||s.grade==null))errors.push('Es fehlen Noten.');
 if(rows.some(s=>!Number.isInteger(Number(s.grade))||Number(s.grade)<1||Number(s.grade)>6))errors.push('Ungültige Note.');
 if(!['abschluss','oberstufe'].includes(mode))throw Error('Unbekannter Prüfmodus');
 const min=r=>mode==='abschluss'?4:(r.level==='E1'||r.level==='E2'?3:4);
 const deficits=rows.filter(r=>r.note>min(r));
 const details=rows.map(r=>({name:r.name,original:Number(r.grade),level:r.level,note:r.note,minimum:min(r),deficit:r.note>min(r)}));
 const reasons=[];
 if(deficits.length>3)reasons.push('Mehr als drei Fächer unterschreiten die Mindestleistung.');
 if(deficits.length===3&&deficits.filter(r=>r.core).length>=2)reasons.push('Bei drei Unterschreitungen liegen mindestens zwei in Deutsch, Mathematik oder erster Fremdsprache.');
 // One one-grade shortfall is permissible without compensation.
 const need=deficits.length===1&&deficits[0].note===min(deficits[0])+1?[]:deficits;
 function recipes(d){const m=min(d);if(m===4){if(d.note===5)return [[2],[1],[3,3]];if(d.note===6)return [[1],[2,2]]}
 if(m===3){if(d.note===4)return [[1],[2]];if(d.note===5)return [[1]]}
 return []}
 // Every compensation grade can be used once; no deficit can be used as compensation.
 const donors=rows.filter(r=>!deficits.includes(r));
 function eligible(d,r){return !d.core||r.core||r.wpf}
 function search(idx,used,alloc){if(idx===need.length)return alloc;
 const d=need[idx];for(const recipe of recipes(d)){
  function pick(j,mask,chosen){if(j===recipe.length)return search(idx+1,mask,[...alloc,{subject:d.name,by:chosen.map(x=>x.name)}]);
   for(let k=0;k<donors.length;k++){const r=donors[k];if(mask.has(k)||!eligible(d,r)||r.note!==recipe[j])continue;
    const res=pick(j+1,new Set([...mask,k]),[...chosen,r]);if(res)return res}return null}
  const found=pick(0,used,[]);if(found)return found
 }return null}
 let allocation=null;
 if(!reasons.length&&need.length){allocation=search(0,new Set(),[]);if(!allocation)reasons.push('Für die erforderlichen Notenausgleiche wurde keine zulässige Kombination gefunden.');}
 if(errors.length)return {status:'incomplete',errors,details,deficits:deficits.map(x=>x.name),reasons:[],allocation:[]};
 return {status:reasons.length?'not_met':'met',errors:[],details,deficits:deficits.map(x=>x.name),reasons,allocation:allocation||[],withoutCompensation:need.length===0&&deficits.length===1};
}
root.IGSRules={evaluate,adjusted};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
