(function extension(){
  'use strict';
  (() => {
    if (typeof render !== 'function' || typeof finishSession !== 'function' || typeof S === 'undefined') {
      console.warn('Bitácora Gym: dependencia app.js no disponible');return;
    }
    const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const catalog=[
      {id:'01',name:'¡Despegamos!',detail:'Primera sesión finalizada',kind:'count',target:1,group:'Primeros pasos'},
      {id:'02',name:'En marcha',detail:'5 sesiones finalizadas',kind:'count',target:5,group:'Primeros pasos'},
      {id:'03',name:'¡Con todo!',detail:'10 sesiones finalizadas',kind:'count',target:10,group:'Primeros pasos'},
      {id:'04',name:'Sin excusas',detail:'25 sesiones finalizadas',kind:'count',target:25,group:'Primeros pasos'},
      {id:'05',name:'Semana activa',detail:'3 días distintos en una semana',kind:'week',target:3,group:'Constancia'},
      {id:'06',name:'Mes constante',detail:'Al menos 2 días por semana durante 4 semanas',kind:'month',target:4,group:'Constancia'},
      {id:'07',name:'Imparable',detail:'50 sesiones finalizadas',kind:'count',target:50,group:'Constancia'},
      {id:'08',name:'Leyenda',detail:'100 sesiones finalizadas',kind:'count',target:100,group:'Constancia'},
      {id:'09',name:'Modo fuerza',detail:'10 sesiones con series registradas',kind:'strength',target:10,group:'Especiales'},
      {id:'10',name:'Modo acuático',detail:'5 sesiones de natación',kind:'swim',target:5,group:'Especiales'},
      {id:'11',name:'Nuevo récord',detail:'Supera tu peso anterior en un ejercicio',kind:'record',target:1,group:'Especiales'},
      {id:'12',name:'Doble poder',detail:'Fuerza y natación en la misma sesión',kind:'hybrid',target:1,group:'Especiales'}
    ];
    const badges=[
      {icon:'🥉',name:'Primer paso',kind:'count',target:1},
      {icon:'🥈',name:'En marcha',kind:'count',target:5},
      {icon:'🥇',name:'Constancia',kind:'count',target:10},
      {icon:'🔥',name:'Semana activa',kind:'week',target:3},
      {icon:'💪',name:'Disciplina',kind:'count',target:25},
      {icon:'🏆',name:'Leyenda Gym',kind:'count',target:100}
    ];
    const entries=()=>Array.isArray(S.history)?S.history:[];
    const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s?.date||''))?s.date:null;
    const sticker=id=>`./stickers/${id}.svg`;
    const stickerImg=(id,cl='')=>`<img src="${sticker(id)}" alt="" class="${cl}" loading="lazy">`;
    let month=new Date();month.setDate(1);
    let selected='', newlyUnlocked=[];
    const monday=d=>{
      const v=new Date(`${d}T12:00:00Z`); if(Number.isNaN(v.getTime()))return NaN;
      v.setUTCDate(v.getUTCDate()-(v.getUTCDay()+6)%7);v.setUTCHours(0,0,0,0);return v.getTime();
    };
    function stats(){
      const records=entries(), days=new Set(records.map(date).filter(Boolean)), weeks=new Map();
      for(const day of days){const w=monday(day);weeks.set(w,(weeks.get(w)||0)+1)}
      const qualified=[...weeks].filter(([,v])=>v>=2).map(([k])=>k).sort((a,b)=>a-b);
      let last=NaN,run=0,monthRun=0;
      for(const w of qualified){run=(w-last===604800000)?run+1:1;last=w;monthRun=Math.max(monthRun,run)}
      const hasForce=s=>Object.values(s.entries||{}).some(a=>Array.isArray(a)&&a.length>0);
      const isPool=s=>[s.cardio?.type,s.warmup?.type].includes('pool');
      let record=0;const best=new Map();
      const sorted=[...records].sort((a,b)=>String(a.finishedAt||a.date).localeCompare(String(b.finishedAt||b.date)));
      for(const s of sorted)for(const it of s.daySnapshot?.items||[]){
        const key=String(it.exerciseId||it.recordedName||it.freeName||it.id).toLowerCase();
        const values=(s.entries?.[it.id]||[]).filter(x=>Number(x.reps)>0).map(x=>Number(x.weight)*(x.unit==='lb'?.45359237:1)).filter(x=>Number.isFinite(x)&&x>0);
        if(!values.length)continue;
        const high=Math.max(...values),prev=best.get(key);
        if(prev!==undefined&&high>prev+.05)record++;
        best.set(key,Math.max(high,prev||0));
      }
      return {count:records.length,days,weeks,week:Math.max(0,...weeks.values()),month:monthRun,strength:records.filter(hasForce).length,swim:records.filter(isPool).length,record,hybrid:records.filter(s=>hasForce(s)&&isPool(s)).length};
    }
    const progress=(item,s)=>s[item.kind]||0;
    const unlocked=()=>{const s=stats();return catalog.filter(c=>progress(c,s)>=c.target)};
    function calendar(){
      const y=month.getFullYear(),m=month.getMonth(),start=new Date(y,m,1),length=new Date(y,m+1,0).getDate(),offset=(start.getDay()+6)%7;
      const title=start.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
      const count={};for(const s of entries())if(date(s))count[s.date]=(count[s.date]||0)+1;
      let cells='';
      for(let i=0;i<Math.ceil((offset+length)/7)*7;i++){
        const n=i-offset+1;
        if(n<1||n>length){cells+='<span></span>';continue}
        const d=`${y}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
        const now=new Date(),isToday=d===`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        cells+=`<button type="button" class="bg-day ${count[d]?'trained':''} ${isToday?'today':''} ${d===selected?'selected':''}" data-bg="date" data-date="${d}" aria-label="${n} de ${esc(title)}, ${count[d]||0} sesiones" aria-pressed="${d===selected}">${n}${count[d]?'<b>✓</b>':''}</button>`;
      }
      const onDay=entries().filter(s=>date(s)===selected);
      return `<section class="bg-box"><div class="bg-flex"><div><span class="bg-eyebrow">Días de actividad</span><h2>Calendario</h2></div><span class="bg-subtle">${stats().days.size} días</span></div><div class="bg-month"><button type="button" data-bg="prev" aria-label="Mes anterior">‹</button><strong>${esc(title)}</strong><button type="button" data-bg="next" aria-label="Mes siguiente">›</button></div><div class="bg-calendar-grid bg-weekdays">${['L','M','M','J','V','S','D'].map(v=>`<span>${v}</span>`).join('')}</div><div class="bg-calendar-grid">${cells}</div><p class="bg-subtle">✓ Día registrado al pulsar «Finalizar y ver resumen».</p>${selected?`<div class="bg-calendar-detail"><strong>${selected}</strong>: ${onDay.length?`${onDay.length} sesión(es): ${onDay.map(s=>esc(s.daySnapshot?.title||'Entrenamiento')).join(', ')}`:'Sin sesiones finalizadas'}</div>`:''}</section>`;
    }
    function coach(){
      const name=String(S.profile?.name||'').trim().split(/\s+/)[0]||'campeón',last=entries()[0];
      let message;
      if(S.active)message='¡Vamos paso a paso! Buena técnica y control.';
      else if(last&&date(last)===new Date().toLocaleDateString('en-CA'))message='¡Buen trabajo! Hoy ya entrenaste. Descansar también cuenta.';
      else if(!entries().length)message='¡Hoy puede ser tu primer gran paso!';
      else message=['Un ejercicio a la vez. ¡Tú puedes!','Tu constancia construye resultados.','¡Qué gusto verte! Vamos a tu ritmo.','Recuerda hidratarte y escuchar a tu cuerpo.'][new Date().getDate()%4];
      return `<section class="bg-box bg-coach">${stickerImg('01')}<div><span class="bg-eyebrow">Tu Mini Coach</span><h2>¡Hola, ${esc(name)}! 👋</h2><p>${esc(message)}</p><button type="button" class="bg-small-btn" data-bg="logros">Ver mis Logros →</button></div></section>`;
    }
    function logrosPreview(){
      const earned=new Set(unlocked().map(x=>x.id));
      return `<section class="bg-box"><div class="bg-flex"><h2>🏆 Mis Logros</h2><span class="bg-subtle">${earned.size}/12</span></div><div class="bg-preview">${catalog.slice(0,6).map(c=>`<span class="${earned.has(c.id)?'':'bg-locked'}">${stickerImg(c.id)}</span>`).join('')}</div><button type="button" class="btn outline block" data-bg="logros">Ver insignias y stickers</button></section>`;
    }
    function logrosPage(){
      const data=stats(),earned=new Set(unlocked().map(x=>x.id));
      return `<div class="title-block"><div class="kicker">Tu colección</div><h1>🏆 Mis Logros</h1><p>Personajes divertidos que se desbloquean con tu progreso. Los días de descanso no rompen tus logros.</p></div><section class="bg-box"><div class="bg-flex"><h2>Insignias</h2><span class="bg-subtle">${badges.filter(b=>progress(b,data)>=b.target).length}/6</span></div><div class="bg-badges">${badges.map(b=>`<div class="bg-badge ${progress(b,data)>=b.target?'':'locked'}"><span>${b.icon}</span><strong>${esc(b.name)}</strong><small>${Math.min(progress(b,data),b.target)}/${b.target}</small></div>`).join('')}</div></section><section class="bg-box"><div class="bg-flex"><h2>Stickers de Logros</h2><span class="bg-subtle">${earned.size}/12</span></div><div class="bg-progress"><span style="width:${earned.size/12*100}%"></span></div>${['Primeros pasos','Constancia','Especiales'].map(group=>`<h3>${group}</h3><div class="bg-sticker-grid">${catalog.filter(c=>c.group===group).map(c=>{const ok=earned.has(c.id);return `<div class="bg-sticker ${ok?'':'locked'}">${stickerImg(c.id)}<b>${esc(c.name)}</b><small>${esc(c.detail)}</small><span class="bg-subtle">${ok?'✓ Desbloqueado':Math.min(progress(c,data),c.target)+'/'+c.target}</span>${ok?`<button data-bg="share" data-id="${c.id}" type="button">Compartir sticker</button>`:''}</div>`}).join('')}</div>`).join('')}</section><button class="btn block" type="button" data-bg="home">Volver al inicio</button>`;
    }
    function deletePanel(){return `<section class="bg-box bg-danger"><h2>Eliminar historial</h2><p>Borra las sesiones finalizadas, las marcas del calendario y los logros, pero conserva tu perfil, tus planes y una sesión en curso. Se requerirán dos confirmaciones.</p><button type="button" class="bg-danger-btn" data-bg="delete">🗑 Eliminar historial de entrenamientos</button></section>`}
    function summaryCoach(){return `<section class="bg-box"><h2>Tu Mini Coach</h2><div class="bg-summary-coach">${stickerImg('01')}<p>¡Excelente sesión! Recupérate, hidrátate y celebra tu avance.</p></div>${newlyUnlocked.length?`<h3>🎉 Nuevos Logros</h3><div class="bg-preview">${newlyUnlocked.map(c=>stickerImg(c.id)).join('')}</div><button type="button" class="btn block" data-bg="logros">Ver mis Logros</button>`:''}</section>`}
    function enhance(){
      const app=document.getElementById('app');if(!app)return;
      const version=app.querySelector('.subbrand');if(version)version.textContent='Planes editables · Versión 0.4';
      if(ui.screen==='logros'){app.innerHTML=topbar()+logrosPage();document.title='Mis Logros · Bitácora Gym';return}
      const title=app.querySelector('.title-block');
      if(ui.screen==='home'&&title)title.insertAdjacentHTML('afterend',coach()+calendar()+logrosPreview());
      else if(ui.screen==='history'&&title)title.insertAdjacentHTML('afterend',calendar());
      else if(ui.screen==='summary'&&title)title.insertAdjacentHTML('afterend',summaryCoach());
      else if(ui.screen==='settings')app.insertAdjacentHTML('beforeend',deletePanel());
      else if(ui.screen==='profile')app.querySelector('#profileForm')?.insertAdjacentHTML('afterend',deletePanel());
    }
    const baseRender=render;
    render=function(...args){const result=baseRender(...args);enhance();return result};
    const baseFinish=finishSession;
    finishSession=function(...args){const before=new Set(unlocked().map(x=>x.id)),length=entries().length;newlyUnlocked=[];const result=baseFinish(...args);if(entries().length>length){newlyUnlocked=unlocked().filter(x=>!before.has(x.id));if(newlyUnlocked.length)render()}return result};
    function dialog(content){
      document.getElementById('bg-dialog')?.remove();
      const el=document.createElement('dialog');el.id='bg-dialog';el.className='bg-dialog';el.innerHTML=content;document.body.appendChild(el);
      if(el.showModal)el.showModal();else el.setAttribute('open','');el.addEventListener('close',()=>el.remove());return el;
    }
    function firstConfirm(){dialog(`<h2>⚠ Eliminar historial</h2><p>Se borrarán definitivamente las sesiones registradas, el calendario y tus logros. El perfil y los planes se conservarán.</p><div class="bg-dialog-actions"><button type="button" data-bg="cancel">Cancelar</button><button type="button" class="danger" data-bg="second">Entiendo, continuar</button></div>`)}
    function secondConfirm(){dialog(`<h2>Segunda confirmación</h2><p>Escribe <strong>ELIMINAR</strong> para autorizar el borrado. No hay forma de recuperar los registros sin respaldo.</p><input id="bg-delete-input" aria-label="Escribe ELIMINAR" autocomplete="off" placeholder="ELIMINAR"><div class="bg-dialog-actions"><button type="button" data-bg="cancel">Cancelar</button><button type="button" class="danger" data-bg="erase" disabled>Eliminar historial</button></div>`)}
    function erase(){S.history=[];S.last={};newlyUnlocked=[];selected='';save();document.getElementById('bg-dialog')?.close?.();document.getElementById('bg-dialog')?.remove();go('settings');toast('Historial eliminado. Perfil y planes conservados.')}
    async function share(id){
      if(!unlocked().some(c=>c.id===id))return;
      try{
        const img=new Image();img.crossOrigin='anonymous';img.src=sticker(id);
        await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,512,512);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw Error('No se pudo generar PNG');
        const file=new File([blob],`bitacora-gym-logro-${id}.png`,{type:'image/png'});
        if(navigator.canShare?.({files:[file]})&&navigator.share){
          try{await navigator.share({files:[file],title:'Mi logro en Bitácora Gym'});return}catch(e){if(e.name==='AbortError')return}
        }
        const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(href),15000);
      }catch(e){alert('No se pudo preparar la imagen. Comprueba tu conexión.')}
    }
    document.addEventListener('click',e=>{
      const btn=e.target.closest('button[data-bg]');if(!btn||btn.disabled)return;
      const action=btn.dataset.bg;
      if(action==='logros')go('logros');
      else if(action==='home')go('home');
      else if(action==='prev'||action==='next'){month.setMonth(month.getMonth()+(action==='prev'?-1:1));selected='';render()}
      else if(action==='date'){selected=btn.dataset.date;render()}
      else if(action==='delete')firstConfirm();
      else if(action==='second')secondConfirm();
      else if(action==='cancel'){document.getElementById('bg-dialog')?.close?.();document.getElementById('bg-dialog')?.remove()}
      else if(action==='erase')erase();
      else if(action==='share')share(btn.dataset.id);
    });
    document.addEventListener('input',e=>{if(e.target.id==='bg-delete-input'){const b=document.querySelector('[data-bg="erase"]');if(b)b.disabled=e.target.value.trim().toUpperCase()!=='ELIMINAR'}});
    window.BGExtras={stats,unlocked,progress,catalog,badges};
    // app.js initializes asynchronously; enhance is invoked via wrapped render().
  })();
})();