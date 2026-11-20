/* Klasse 9 IGS RLP: § 67 Abs. 2 und § 74 Abs. 1 ÜSchO */
(function(root){'use strict';
const core=n=>['Deutsch','Mathematik','Englisch'].includes(n);
const wpf=n=>/Wahlpflichtfach|\bWPF\b/i.test(n);
const note=s=>Math.max(1,Number(s.grade)-(s.level==='E'?1:0));
function evaluate(input,mode){
 if(!['berufsreife','versetzung'].includes(mode))throw Error('Unbekannter Modus');
 const errors=[];
 if(input.some(s=>s.grade===''||s.grade==null))errors.push('Bitte alle Noten eintragen.');
 if(input.some(s=>s.grade!==''&&(!Number.isInteger(Number(s.grade))||Number(s.grade)<1||Number(s.grade)>6)))errors.push('Ungültige Note.');
 if(input.some(s=>s.differentiated&&!['E','G'].includes(s.level)))errors.push('Bei differenzierten Fächern E oder G auswählen.');
 const rows=input.filter(s=>s.grade!==''&&s.grade!=null).map(s=>({...s,note:note(s),core:core(s.name),wpf:wpf(s.name)}));
 const relevant=rows.filter(s=>!(mode==='berufsreife'&&s.name==='Informatik (Pflichtfach)'));
 const minimum=r=>mode==='versetzung'&&r.differentiated?3:4;
 const deficits=relevant.filter(r=>r.note>minimum(r));
 const reasons=[];
 if(deficits.length>3)reasons.push('Mehr als drei Unterschreitungen.');
 if(mode==='versetzung'&&deficits.length===3&&deficits.filter(r=>r.core).length>=2)reasons.push('Drei Unterschreitungen, darunter mindestens zwei in Deutsch, Mathematik oder Englisch.');
 const recipes=d=>{const m=minimum(d);if(m===3)return d.note===4?[[1],[2]]:d.note===5?[[1]]:[];
 return d.note===5?[[1],[2],[3,3]]:d.note===6?[[1],[2,2]]:[]};
 const donors=relevant.filter(r=>!deficits.includes(r));
 function search(required){
  function solve(i,used,allocation){if(i===required.length)return allocation;
   const d=required[i];for(const recipe of recipes(d)){
    function pick(j,usedNow,chosen){if(j===recipe.length)return solve(i+1,usedNow,[...allocation,{subject:d.name,by:chosen.map(r=>r.name)}]);
     for(let k=0;k<donors.length;k++){const r=donors[k];if(usedNow.has(k)||r.note!==recipe[j])continue;
      if(mode==='versetzung'&&d.core&&!r.core&&!r.wpf)continue;
      if(mode==='berufsreife'&&d.core&&['Deutsch','Mathematik'].includes(d.name)&&deficits.some(x=>x.name===(d.name==='Deutsch'?'Mathematik':'Deutsch'))&&!['Englisch'].includes(r.name)&&!r.wpf)continue;
      const found=pick(j+1,new Set([...usedNow,k]),[...chosen,r]);if(found)return found;
     }return null;
    }
    const found=pick(0,used,[]);if(found)return found;
   }return null;
  }return solve(0,new Set(),[]);
 }
 let allocation=[];
 if(!reasons.length){
  if(mode==='versetzung'){
   const required=deficits.length===1&&deficits[0].note===minimum(deficits[0])+1?[]:deficits;
   const found=search(required);if(found===null)reasons.push('Nicht alle erforderlichen Unterschreitungen lassen sich ausgleichen.');else allocation=found;
  }else{
   const both=deficits.some(d=>d.name==='Deutsch')&&deficits.some(d=>d.name==='Mathematik');
   const requiredCount=deficits.length===3?1:0;
   if(requiredCount||both){
    let found=null;
    // Bei drei Unterschreitungen genügt ein Ausgleich; bei D+M muss einer von beiden ausgeglichen werden.
    const eligible=both?deficits.filter(d=>['Deutsch','Mathematik'].includes(d.name)):deficits;
    for(const d of eligible){const candidate=search([d]);if(candidate!==null){found=candidate;break}}
    if(found===null)reasons.push('Der nach § 74 erforderliche Ausgleich ist nicht möglich.');else allocation=found;
   }
  }
 }
 return {status:errors.length?'incomplete':reasons.length?'not_met':'met',errors,reasons,allocation,deficits:deficits.map(r=>({name:r.name,note:r.note,minimum:minimum(r)})),details:rows.map(r=>({name:r.name,original:Number(r.grade),level:r.level,note:r.note,minimum:minimum(r)}))};
}
root.IGS9Rules={evaluate};
})(typeof module!=='undefined'&&module.exports?module.exports:window);
