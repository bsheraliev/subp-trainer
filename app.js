/* Тренажёр СУБП — логика приложения */
'use strict';

const EXAM_GENERAL = 15;     // общих вопросов в экзамене
const EXAM_SPECIAL = 10;     // профильных вопросов в экзамене
const PASS = 0.75;           // проходной порог
const EXAM_TIME = 20 * 60;   // лимит экзамена, сек
const HIST_KEY = 'subp_history';
const HIST_MAX = 60;

const SVG = {
  radar:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2z"/><path d="M12 6a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4V6z"/><circle cx="12" cy="12" r="1.6"/></svg>',
  plane:'<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/></svg>',
  tools:'<svg viewBox="0 0 24 24"><path d="M22 19l-6.3-6.3a5 5 0 0 0-6.1-6.4l3 3-2.1 2.1-3-3a5 5 0 0 0 6.4 6.1L20 21l2-2zM4 5l3 3 1.5-1.5L5.5 3.5 4 5z"/></svg>',
  cabin:'<svg viewBox="0 0 24 24"><path d="M12 2C8 2 6 5 6 9v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9c0-4-2-7-6-7zm0 2c2.5 0 4 2 4 5H8c0-3 1.5-5 4-5zM9 19a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14V3H5zm0 2h12v12H5V5zm2 2v2h8V7H7zm0 4v2h8v-2H7z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/></svg>'
};

const KEYS = ['А','Б','В','Г','Д'];
const state = { mode:'train', cat:null, name:'', unit:'',
  list:[], i:0, correct:0, answered:false, wrong:[],
  timerId:null, timeLeft:0, startTs:0, elapsed:0, finished:false };

const $ = s => document.querySelector(s);
const el = (t,c) => { const e=document.createElement(t); if(c) e.className=c; return e; };
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function catName(id){ if(id==='all') return 'Все вопросы'; const c=CATEGORIES.find(x=>x.id===id); return c?c.name:id; }
function bestKey(m,c){ return 'subp_best_'+m+'_'+c; }
function getBest(m,c){ return Number(localStorage.getItem(bestKey(m,c))||0); }
function setBest(m,c,p){ if(p>getBest(m,c)) localStorage.setItem(bestKey(m,c),String(p)); }
function fmt(s){ const m=Math.floor(s/60), x=s%60; return m+':'+String(x).padStart(2,'0'); }
function show(id){ ['home','id','quiz','res','log'].forEach(s=>$('#screen-'+s).classList.toggle('hidden', s!==id)); }

/* ---------- История ---------- */
function loadHist(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); }catch(e){ return []; } }
function saveHist(rec){ const h=loadHist(); h.unshift(rec); if(h.length>HIST_MAX) h.length=HIST_MAX; localStorage.setItem(HIST_KEY, JSON.stringify(h)); }

/* ---------- Главный экран ---------- */
function renderHome(){
  state.cat=null; stopTimer();
  show('home'); $('#btn-home').classList.add('hidden');
  $('#mode-train').classList.toggle('on',state.mode==='train');
  $('#mode-exam').classList.toggle('on',state.mode==='exam');
  $('#mode-hint').textContent = state.mode==='train'
    ? 'Практика: вопросы выбранного раздела с мгновенным пояснением. Без ограничений и таймера.'
    : 'Экзамен: '+EXAM_SPECIAL+' профильных + '+EXAM_GENERAL+' общих = 25 вопросов · лимит '+(EXAM_TIME/60)+' мин · проходной 75% · справка.';

  const wrap=$('#cats'); wrap.innerHTML='';
  CATEGORIES.forEach(c=>{
    if(state.mode==='exam' && c.id==='general') return;
    const cnt = state.mode==='exam' ? 25 : QUESTIONS[c.id].length;
    const best=getBest(state.mode,c.id);
    const b=el('button','cat');
    b.innerHTML='<span class="ic">'+SVG[c.icon]+'</span><span><span class="nm">'+c.name+'</span><br>'+
      '<span class="ds">'+c.sub+'</span></span><span class="meta"><span class="cnt">'+cnt+' вопр.</span>'+
      (best?'<br><span class="best">рекорд '+best+'%</span>':'')+'</span>';
    b.onclick=()=>pick(c.id);
    wrap.appendChild(b);
  });
  if(state.mode==='train'){
    const total=Object.values(QUESTIONS).reduce((s,a)=>s+a.length,0);
    const all=el('button','cat');
    all.innerHTML='<span class="ic">'+SVG.shield+'</span><span><span class="nm">Все вопросы</span><br>'+
      '<span class="ds">Полный банк по всем категориям</span></span><span class="meta"><span class="cnt">'+total+' вопр.</span></span>';
    all.onclick=()=>pick('all');
    wrap.appendChild(all);
  }
}

/* ---------- Выбор категории ---------- */
function pick(cat){
  state.cat=cat;
  if(state.mode==='exam'){
    $('#id-cat').textContent='Категория: '+catName(cat);
    $('#in-name').value=state.name; $('#in-unit').value=state.unit;
    validateId();
    show('id'); $('#btn-home').classList.remove('hidden');
  } else startQuiz();
}
function validateId(){
  $('#id-start').disabled = !($('#in-name').value.trim() && $('#in-unit').value.trim());
}

/* ---------- Запуск ---------- */
function buildList(cat){
  if(state.mode==='exam'){
    const spec=shuffle(QUESTIONS[cat]).slice(0,EXAM_SPECIAL);
    const gen=shuffle(QUESTIONS.general).slice(0,EXAM_GENERAL);
    return shuffle(spec.concat(gen));
  }
  if(cat==='all'){ let a=[]; Object.values(QUESTIONS).forEach(x=>a=a.concat(x)); return shuffle(a); }
  return shuffle(QUESTIONS[cat]);
}
function startQuiz(){
  if(state.mode==='exam'){ state.name=$('#in-name').value.trim(); state.unit=$('#in-unit').value.trim(); }
  state.list=buildList(state.cat); state.i=0; state.correct=0; state.wrong=[]; state.answered=false; state.finished=false;
  state.startTs=Date.now(); state.elapsed=0;
  show('quiz'); $('#btn-home').classList.remove('hidden');
  if(state.mode==='exam'){ state.timeLeft=EXAM_TIME; startTimer(); $('#q-timer').classList.remove('hidden'); }
  else $('#q-timer').classList.add('hidden');
  renderQuestion();
}

/* ---------- Таймер ---------- */
function startTimer(){
  stopTimer(); updTimer();
  state.timerId=setInterval(()=>{
    state.timeLeft--; updTimer();
    if(state.timeLeft<=0){ stopTimer(); finish(true); }
  },1000);
}
function stopTimer(){ if(state.timerId){ clearInterval(state.timerId); state.timerId=null; } }
function updTimer(){ const t=$('#q-timer'); t.textContent='⏱ '+fmt(Math.max(0,state.timeLeft)); t.classList.toggle('low',state.timeLeft<=60); }

/* ---------- Вопрос ---------- */
function renderQuestion(){
  const q=state.list[state.i]; state.answered=false;
  q._order=shuffle(q.o.map((t,idx)=>({t,idx})));
  $('#q-count').textContent=(state.i+1)+' / '+state.list.length;
  $('#q-score').innerHTML='<b>'+state.correct+'</b> верно';
  $('#q-bar').style.width=(state.i/state.list.length*100)+'%';
  $('#q-text').textContent=q.q;
  const opts=$('#q-opts'); opts.innerHTML='';
  q._order.forEach((o,vis)=>{
    const b=el('button','opt');
    b.innerHTML='<span class="k">'+KEYS[vis]+'</span><span>'+o.t+'</span>';
    b.onclick=()=>answer(b,o.idx,q);
    opts.appendChild(b);
  });
  $('#q-expl').classList.add('hidden'); $('#q-expl').innerHTML='';
  const nb=$('#q-next'); nb.classList.add('hidden');
  nb.textContent = state.i===state.list.length-1 ? 'Завершить' : 'Следующий вопрос';
}
function answer(btn,chosen,q){
  if(state.answered) return; state.answered=true;
  const ok=chosen===q.a;
  if(ok) state.correct++; else state.wrong.push({q:q.q,your:q.o[chosen],right:q.o[q.a],e:q.e});
  [...$('#q-opts').children].forEach((b,vis)=>{
    b.disabled=true; const r=q._order[vis].idx;
    if(r===q.a) b.classList.add('correct'); else if(b===btn) b.classList.add('wrong'); else b.classList.add('dim');
  });
  const ex=$('#q-expl'); ex.className='expl '+(ok?'ok':'bad');
  ex.innerHTML='<div class="tag">'+(ok?'✓ Верно':'✕ Неверно')+'</div>'+
    (ok?'':'<p style="margin-bottom:6px">Правильный ответ: <b>'+q.o[q.a]+'</b></p>')+'<p>'+q.e+'</p>';
  ex.classList.remove('hidden');
  $('#q-score').innerHTML='<b>'+state.correct+'</b> верно';
  $('#q-bar').style.width=((state.i+1)/state.list.length*100)+'%';
  $('#q-next').classList.remove('hidden');
}
function next(){
  if(state.i<state.list.length-1){ state.i++; renderQuestion(); window.scrollTo({top:0,behavior:'smooth'}); }
  else finish(false);
}

/* ---------- Результаты ---------- */
function finish(timeout){
  if(state.finished) return; state.finished=true; stopTimer();
  state.elapsed=Math.round((Date.now()-state.startTs)/1000);
  renderResults(timeout);
}
function renderResults(timeout){
  show('res');
  const total=state.list.length, ok=state.correct, pct=Math.round(ok/total*100), pass=pct>=PASS*100;
  setBest(state.mode,state.cat,pct);

  const R=66,C=2*Math.PI*R,off=C*(1-pct/100);
  $('#ring').innerHTML='<svg viewBox="0 0 150 150" class="ring">'+
    '<circle cx="75" cy="75" r="'+R+'" fill="none" stroke="#234039" stroke-width="12"/>'+
    '<circle cx="75" cy="75" r="'+R+'" fill="none" stroke="'+(pass?'#1fae84':'#e2574d')+'" stroke-width="12" '+
    'stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+off+'" transform="rotate(-90 75 75)"/>'+
    '<text x="75" y="72" text-anchor="middle" class="res-pct" fill="#eaf3ef">'+pct+'%</text>'+
    '<text x="75" y="92" text-anchor="middle" class="res-sub">'+ok+' из '+total+'</text></svg>';

  const v=$('#verdict');
  if(state.mode==='exam'){
    v.className='verdict '+(pass?'pass':'fail');
    v.textContent=pass?'Тест сдан':'Тест не сдан';
    $('#verdict-sub').textContent=(timeout?'Время вышло. ':'')+(pass?'Поздравляем! Результат зачтён.':'Нужно не менее 75% (19 из 25).');
  } else {
    v.className='verdict pass'; v.textContent='Тренировка завершена';
    $('#verdict-sub').textContent='Правильных ответов: '+ok+' из '+total+'.';
  }
  $('#stat-ok').textContent=ok; $('#stat-bad').textContent=total-ok;
  $('#stat-time').textContent=fmt(state.elapsed);

  // Сертификат + история (только экзамен)
  const cert=$('#cert'), pr=$('#res-print');
  if(state.mode==='exam'){
    const now=new Date();
    const ds=now.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    $('#c-name').textContent=state.name; $('#c-unit').textContent=state.unit;
    $('#c-cat').textContent=catName(state.cat);
    $('#c-score').textContent=pct+'% ('+ok+' из '+total+'), время '+fmt(state.elapsed);
    const st=$('#c-status'); st.textContent=pass?'СДАН':'НЕ СДАН'; st.className=pass?'st-pass':'st-fail';
    $('#c-date').textContent=ds;
    cert.classList.remove('hidden'); pr.classList.remove('hidden');
    saveHist({d:now.toISOString(),name:state.name,unit:state.unit,cat:catName(state.cat),pct,ok,total,sec:state.elapsed,pass});
  } else { cert.classList.add('hidden'); pr.classList.add('hidden'); }

  const rev=$('#review');
  if(state.wrong.length){
    let h='<h3>Разбор ошибок ('+state.wrong.length+')</h3>';
    state.wrong.forEach(w=>{ h+='<div class="rev-item"><div class="q">'+w.q+'</div>'+
      '<div class="a">Ваш ответ: '+w.your+'<br>Верно: <b>'+w.right+'</b><br>'+w.e+'</div></div>'; });
    rev.innerHTML=h;
  } else rev.innerHTML='<h3>Ошибок нет — отличная работа!</h3>';
}

/* ---------- Журнал ---------- */
function renderLog(){
  show('log'); $('#btn-home').classList.remove('hidden');
  const h=loadHist(), wrap=$('#log-list');
  if(!h.length){ wrap.innerHTML='<div class="card" style="text-align:center;color:var(--muted)">Записей пока нет. Пройдите экзамен — результат сохранится здесь.</div>'; return; }
  wrap.innerHTML=h.map(r=>{
    const d=new Date(r.d).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
    return '<div class="log-item '+(r.pass?'p':'f')+'"><div class="li-top"><b>'+r.name+'</b>'+
      '<span class="li-pct '+(r.pass?'p':'f')+'">'+r.pct+'%</span></div>'+
      '<div class="li-sub">'+r.cat+' · '+r.unit+'</div>'+
      '<div class="li-sub">'+d+' · '+(r.pass?'сдан':'не сдан')+' · '+r.ok+'/'+r.total+'</div></div>';
  }).join('');
}

/* ---------- Навигация ---------- */
function init(){
  $('#mode-train').onclick=()=>{state.mode='train';renderHome();};
  $('#mode-exam').onclick=()=>{state.mode='exam';renderHome();};
  $('#in-name').oninput=validateId; $('#in-unit').oninput=validateId;
  $('#id-start').onclick=startQuiz; $('#id-cancel').onclick=renderHome;
  $('#q-next').onclick=next;
  $('#btn-home').onclick=()=>{ stopTimer(); renderHome(); };
  $('#res-retry').onclick=()=>{ if(state.mode==='exam') pick(state.cat); else startQuiz(); };
  $('#res-home').onclick=renderHome;
  $('#res-print').onclick=()=>window.print();
  $('#open-log').onclick=renderLog; $('#log-back').onclick=renderHome;
  $('#log-clear').onclick=()=>{ if(confirm('Очистить журнал прохождений на этом устройстве?')){ localStorage.removeItem(HIST_KEY); renderLog(); } };
  renderHome();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
document.addEventListener('DOMContentLoaded',init);
