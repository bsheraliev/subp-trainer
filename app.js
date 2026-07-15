/* Тренажёр СУБП — логика приложения */
'use strict';

const EXAM_ENABLED = true;   // экзамен включён; старт возможен после ввода данных и одобрения администратора (код).
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
  tower:'<svg viewBox="0 0 24 24"><path d="M12 2c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.72V8H8l1.2 12h1.85l-.4-4h2.7l-.4 4H15L16 8h-3V5.72c.6-.34 1-.98 1-1.72 0-1.1-.9-2-2-2zm-1.7 8h3.4l-.2 2h-3z"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/></svg>',
  brain:'<svg viewBox="0 0 24 24"><path d="M9 2a3 3 0 0 0-3 3 3 3 0 0 0-2 2.8A3 3 0 0 0 3 10.5 3 3 0 0 0 4.2 13 3 3 0 0 0 6 18a3 3 0 0 0 3 3c.9 0 1.7-.4 2.2-1V3.5A2.5 2.5 0 0 0 9 2zm6 0a2.5 2.5 0 0 0-2.2 1.5V20c.5.6 1.3 1 2.2 1a3 3 0 0 0 3-3 3 3 0 0 0 1.8-5A3 3 0 0 0 21 10.5a3 3 0 0 0-1-2.7A3 3 0 0 0 18 5a3 3 0 0 0-3-3z"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zm0 2.3L17.5 7 12 9.7 6.5 7 12 4.3zM2 12l10 5 10-5-2.1-1.05L12 14.7 4.1 10.95 2 12zm0 5 10 5 10-5-2.1-1.05L12 19.7 4.1 15.95 2 17z"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>',
  chair:'<svg viewBox="0 0 24 24"><path d="M6 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1v-2H6V5h2v6h8V5h2v6h-1v2h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6zm-1 12 1 7h2l-.55-4h9.1L16 22h2l1-7H5z"/></svg>'
};

/* Предметы верхнего уровня. general — «общий блок», который в экзамене подмешивается; для ЧФ его нет (экзамен единый по всему предмету). */
const SUBJECTS = [
  { id:'subp', name:'СУБП', sub:'Управление безопасностью полётов · ИКАО Прил. 19', icon:'shield',
    lead:'Подготовка авиаперсонала по Системе управления безопасностью полётов (ИКАО Приложение 19, Doc 9859). Выберите режим и категорию.',
    cats:['atc','pilot','itp','cabin','airport','general'], general:'general',
    certOrg:'Тестирование по СУБП · ИКАО Прил. 19' },
  { id:'hf', name:'Человеческий фактор', sub:'Психология, ошибки, эргономика · ИКАО Doc 9683', icon:'brain',
    lead:'Подготовка по человеческому фактору: модели и ошибки, человек и нагрузка, эргономика рабочего места (ИКАО Doc 9683). Выберите режим и раздел.',
    cats:['hf_model','hf_human','hf_ergo'], general:null,
    certOrg:'Тестирование по ЧФ · ИКАО Doc 9683' }
];
function curSubj(){ return SUBJECTS.find(s=>s.id===state.subject) || SUBJECTS[0]; }

/* Пример матрицы рисков (5×5, ИКАО Doc 9859), отрисовка SVG */
const MTX_FILL=['#e2574d','#e0a02a','#1fae84'];
const MTX_COL=[[0,0,0,1,1],[0,0,1,1,2],[0,1,1,2,2],[1,1,2,2,2],[1,2,2,2,2]];
const MTX_LIK=[['5','Частый','>1 раза/нед'],['4','Случайн.','≈1 раз/мес'],['3','Маловер.','≈1 раз/год'],['2','Редкий','≈1 раз/10 лет'],['1','Крайне р.','<1 раза/100 л']];
const MTX_SEV=[['A','Катастр.'],['B','Опасная'],['C','Серьёзн.'],['D','Незнач.'],['E','Ничтож.']];
function matrixSVG(){
  var gx=112, gy=50, cw=48, ch=42, W=gx+5*cw+6, cells='', sev='', lik='';
  for(var r=0;r<5;r++){ for(var c=0;c<5;c++){
    var x=gx+c*cw, y=gy+r*ch;
    cells+='<rect x="'+(x+1)+'" y="'+(y+1)+'" width="'+(cw-2)+'" height="'+(ch-2)+'" rx="3" fill="'+MTX_FILL[MTX_COL[r][c]]+'"/>'
      +'<text x="'+(x+cw/2)+'" y="'+(y+ch/2+4)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#10201b">'+MTX_LIK[r][0]+MTX_SEV[c][0]+'</text>';
  }}
  for(var c2=0;c2<5;c2++){ var cx=gx+c2*cw+cw/2;
    sev+='<text x="'+cx+'" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="#eaf3ef">'+MTX_SEV[c2][0]+'</text>'
      +'<text x="'+cx+'" y="42" text-anchor="middle" font-size="7.5" fill="#9fb8b0">'+MTX_SEV[c2][1]+'</text>'; }
  for(var r2=0;r2<5;r2++){ var cy=gy+r2*ch+ch/2;
    lik+='<text x="6" y="'+(cy+4)+'" font-size="13" font-weight="700" fill="#eaf3ef">'+MTX_LIK[r2][0]+'</text>'
      +'<text x="22" y="'+(cy-3)+'" font-size="7.5" fill="#9fb8b0">'+MTX_LIK[r2][1]+'</text>'
      +'<text x="22" y="'+(cy+8)+'" font-size="6.5" fill="#6f8a82">'+MTX_LIK[r2][2]+'</text>'; }
  var H=gy+5*ch+34, ly=gy+5*ch+20;
  var leg='<g font-size="8" fill="#9fb8b0">'
    +'<rect x="'+gx+'" y="'+(ly-8)+'" width="10" height="10" rx="2" fill="#e2574d"/><text x="'+(gx+13)+'" y="'+ly+'">Недопустимый</text>'
    +'<rect x="'+(gx+95)+'" y="'+(ly-8)+'" width="10" height="10" rx="2" fill="#e0a02a"/><text x="'+(gx+108)+'" y="'+ly+'">Допустимый</text>'
    +'<rect x="'+(gx+180)+'" y="'+(ly-8)+'" width="10" height="10" rx="2" fill="#1fae84"/><text x="'+(gx+193)+'" y="'+ly+'">Приемлемый</text></g>';
  var cap='<text x="'+(gx+5*cw/2)+'" y="12" text-anchor="middle" font-size="8.5" fill="#9fb8b0">Серьёзность последствий →</text>'
    +'<text x="6" y="44" font-size="7.5" fill="#9fb8b0">Вер.↓</text>';
  return '<div style="margin-top:10px"><div style="font-size:12px;color:var(--muted);margin-bottom:4px">Пример матрицы рисков (ИКАО Doc 9859):</div>'
    +'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:380px;height:auto;display:block;background:#0e1b17;border-radius:8px;padding:4px" xmlns="http://www.w3.org/2000/svg">'
    +cap+sev+lik+cells+leg+'</svg>'
    +'<div style="font-size:11px;color:var(--muted);margin-top:7px;line-height:1.55"><b style="color:var(--txt)">Серьёзность:</b> '
    +'<b style="color:var(--txt)">A</b> Катастрофическая — гибель людей, разрушение ВС · '
    +'<b style="color:var(--txt)">B</b> Опасная — тяжёлые травмы, крупный ущерб · '
    +'<b style="color:var(--txt)">C</b> Серьёзная — серьёзный инцидент, травмы · '
    +'<b style="color:var(--txt)">D</b> Незначительная — мелкий инцидент, ограничения · '
    +'<b style="color:var(--txt)">E</b> Ничтожная — незначительные последствия</div>'
    +'<div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45">Пример: вероятность «Случайный» (4) × серьёзность «Катастрофическая» (A) → <b style="color:var(--txt)">4A</b> → недопустимый риск.<br>Числа частоты — пример; точные значения задаёт организация в руководстве по СУБП.</div></div>';
}

const KEYS = ['А','Б','В','Г','Д'];
const state = { mode:'train', subject:null, cat:null, name:'', unit:'',
  list:[], i:0, correct:0, answered:false, wrong:[],
  timerId:null, timeLeft:0, startTs:0, elapsed:0, finished:false };

const $ = s => document.querySelector(s);
const el = (t,c) => { const e=document.createElement(t); if(c) e.className=c; return e; };
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function catName(id){
  if(id==='__all'||id==='all') return 'Все вопросы';
  if(id==='__exam') return curSubj().name;
  const c=CATEGORIES.find(x=>x.id===id); return c?c.name:id;
}
function bestKey(m,c){ return 'subp_best_'+m+'_'+c; }
function getBest(m,c){ return Number(localStorage.getItem(bestKey(m,c))||0); }
function setBest(m,c,p){ if(p>getBest(m,c)) localStorage.setItem(bestKey(m,c),String(p)); }
function fmt(s){ const m=Math.floor(s/60), x=s%60; return m+':'+String(x).padStart(2,'0'); }
function show(id){ ['subj','home','id','quiz','res','log'].forEach(s=>$('#screen-'+s).classList.toggle('hidden', s!==id)); }
function setBack(label, fn){ const b=$('#btn-home'); b.textContent=label; b.classList.remove('hidden'); b.onclick=()=>{ stopTimer(); fn(); }; }

/* ---------- История ---------- */
function loadHist(){ try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); }catch(e){ return []; } }
function saveHist(rec){ const h=loadHist(); h.unshift(rec); if(h.length>HIST_MAX) h.length=HIST_MAX; localStorage.setItem(HIST_KEY, JSON.stringify(h)); }

/* ---------- Экран выбора предмета ---------- */
function renderSubjects(){
  state.subject=null; state.cat=null; stopTimer();
  show('subj'); $('#btn-home').classList.add('hidden');
  $('#brand-sub').textContent='СУБП · Человеческий фактор';
  const wrap=$('#subjects'); wrap.innerHTML='';
  SUBJECTS.forEach(s=>{
    const total=s.cats.reduce((n,k)=>n+QUESTIONS[k].length,0);
    const b=el('button','cat');
    b.innerHTML='<span class="ic">'+SVG[s.icon]+'</span><span><span class="nm">'+s.name+'</span><br>'+
      '<span class="ds">'+s.sub+'</span></span><span class="meta"><span class="cnt">'+total+' вопр.</span></span>';
    b.onclick=()=>{ state.subject=s.id; renderHome(); };
    wrap.appendChild(b);
  });
}

/* ---------- Главный экран предмета ---------- */
function renderHome(){
  if(!state.subject){ renderSubjects(); return; }
  const subj=curSubj();
  state.cat=null; stopTimer();
  show('home'); setBack('← Предметы', renderSubjects);
  $('#brand-sub').textContent=subj.name;
  $('#lead-home').textContent=subj.lead;
  $('#sec-title').textContent = (subj.id==='subp') ? 'Категория персонала' : 'Раздел';
  $('#mode-train').classList.toggle('on',state.mode==='train');
  $('#mode-exam').classList.toggle('on',state.mode==='exam');
  // Бейдж «в разработке» на кнопке экзамена, пока режим отключён
  $('#mode-exam').innerHTML = 'Экзамен' + (EXAM_ENABLED ? '' :
    ' <span style="font-size:10px;font-weight:600;color:#e0a02a;border:1px solid #e0a02a;border-radius:6px;padding:1px 5px;vertical-align:middle">в разработке</span>');

  const examOff = (state.mode==='exam' && !EXAM_ENABLED);
  $('#mode-hint').textContent = examOff
    ? 'Экзамен на стадии разработки и будет подключён позже. Сейчас доступен режим «Тренажёр».'
    : (state.mode==='train'
        ? 'Практика: вопросы выбранного раздела с мгновенным пояснением. Без ограничений и таймера.'
        : (subj.general
            ? 'Экзамен: '+EXAM_SPECIAL+' профильных + '+EXAM_GENERAL+' общих = 25 вопросов · лимит '+(EXAM_TIME/60)+' мин · проходной 75% · справка.'
            : 'Экзамен: 25 вопросов по всему курсу · лимит '+(EXAM_TIME/60)+' мин · проходной 75% · справка.'));

  const wrap=$('#cats'); wrap.innerHTML='';

  // Экзамен на стадии разработки — заглушка вместо категорий (для обоих предметов)
  if(examOff){
    const c=el('div','card');
    c.style.textAlign='center';
    c.innerHTML='<div style="font-size:34px;margin-bottom:6px">🛠️</div>'+
      '<b style="color:var(--txt)">Экзамен на стадии разработки</b>'+
      '<p style="color:var(--muted);margin-top:6px;line-height:1.5">Режим экзамена с таймером и справкой будет подключён позже. '+
      'Пока доступна подготовка в режиме «Тренажёр».</p>';
    wrap.appendChild(c);
    return;
  }

  // ЧФ в режиме экзамена — единый итоговый экзамен по всему предмету
  if(state.mode==='exam' && !subj.general){
    const best=getBest('exam','__exam');
    const b=el('button','cat');
    b.innerHTML='<span class="ic">'+SVG[subj.icon]+'</span><span><span class="nm">Итоговый экзамен</span><br>'+
      '<span class="ds">25 вопросов по всему курсу ЧФ</span></span><span class="meta"><span class="cnt">25 вопр.</span>'+
      (best?'<br><span class="best">рекорд '+best+'%</span>':'')+'</span>';
    b.onclick=()=>pick('__exam');
    wrap.appendChild(b);
    return;
  }

  subj.cats.forEach(id=>{
    if(state.mode==='exam' && subj.general && id===subj.general) return;
    const c=CATEGORIES.find(x=>x.id===id);
    const cnt = state.mode==='exam' ? 25 : QUESTIONS[id].length;
    const best=getBest(state.mode,id);
    const b=el('button','cat');
    b.innerHTML='<span class="ic">'+SVG[c.icon]+'</span><span><span class="nm">'+c.name+'</span><br>'+
      '<span class="ds">'+c.sub+'</span></span><span class="meta"><span class="cnt">'+cnt+' вопр.</span>'+
      (best?'<br><span class="best">рекорд '+best+'%</span>':'')+'</span>';
    b.onclick=()=>pick(id);
    wrap.appendChild(b);
  });
  if(state.mode==='train'){
    const total=subj.cats.reduce((n,k)=>n+QUESTIONS[k].length,0);
    const all=el('button','cat');
    all.innerHTML='<span class="ic">'+SVG.shield+'</span><span><span class="nm">Все вопросы</span><br>'+
      '<span class="ds">Полный банк предмета</span></span><span class="meta"><span class="cnt">'+total+' вопр.</span></span>';
    all.onclick=()=>pick('__all');
    wrap.appendChild(all);
  }
}

/* ---------- Выбор категории ---------- */
function pick(cat){
  state.cat=cat;
  if(state.mode==='exam'){
    $('#id-cat').textContent=(curSubj().id==='subp'?'Категория: ':'Предмет: ')+catName(cat);
    $('#in-name').value=state.name; $('#in-unit').value=state.unit;
    validateId();
    show('id'); setBack('← Меню', renderHome);
  } else startQuiz();
}
function validateId(){
  $('#id-start').disabled = !($('#in-name').value.trim() && $('#in-unit').value.trim() && $('#in-approve').value.trim());
}

/* ---------- Одобрение экзамена администратором ---------- */
function hashCode(s){ let h=5381; for(let i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))>>>0; } return String(h); }
function examCodeSet(){ return !!localStorage.getItem('subp_exam_code'); }
function setupExamCode(){
  const cur=examCodeSet();
  const v=prompt('Локальный ОФЛАЙН-резерв кода одобрения (только для этого устройства при отсутствии связи).\nОсновной код задаётся на сервере (свойство EXAM_CODE) и действует на всех устройствах.\n'+(cur?'Изменить':'Задать')+' офлайн-код (пусто — снять):', '');
  if(v===null) return;
  const t=v.trim();
  if(t){ localStorage.setItem('subp_exam_code', hashCode(t)); alert('Офлайн-резервный код сохранён на этом устройстве.'); }
  else { localStorage.removeItem('subp_exam_code'); alert('Офлайн-резервный код снят.'); }
}
async function approveExam(code){
  const r=await fetch(aiUrl(), { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({ action:'approve', code }) });
  if(!r.ok) throw new Error('http '+r.status);
  const d=await r.json();
  if(d.error) throw new Error(d.error);
  return d.ok===true;
}
async function startExam(){
  const code=$('#in-approve').value.trim();
  if(!code) return;
  const btn=$('#id-start'), label=btn.textContent;
  btn.disabled=true; btn.textContent='Проверка одобрения…';
  let ok=null;
  try{ ok=await approveExam(code); }        // серверная проверка (все устройства)
  catch(e){ ok=null; }
  if(ok===null){                             // сервер недоступен → локальный офлайн-резерв
    const stored=localStorage.getItem('subp_exam_code');
    if(!stored){ alert('Нет связи для проверки одобрения, а офлайн-код на этом устройстве не задан. Проверьте интернет.'); btn.disabled=false; btn.textContent=label; return; }
    ok = (hashCode(code)===stored);
  }
  if(ok){ $('#in-approve').value=''; startQuiz(); }
  else { alert('Неверный код одобрения. Экзамен не начат.'); $('#in-approve').value=''; btn.textContent=label; validateId(); }
}

/* ---------- Запуск ---------- */
function buildList(cat){
  const subj=curSubj();
  const mc=arr=>arr.filter(x=>x.type!=='open');   // экзамен — только закрытые вопросы
  const union=()=>{ let a=[]; subj.cats.forEach(k=>a=a.concat(QUESTIONS[k])); return a; };
  if(state.mode==='exam'){
    // Предмет без общего блока (ЧФ) — единый экзамен по всему банку предмета
    if(!subj.general || cat==='__exam') return shuffle(mc(union())).slice(0, EXAM_GENERAL+EXAM_SPECIAL);
    // СУБП — профильные + общий блок
    const spec=shuffle(mc(QUESTIONS[cat])).slice(0,EXAM_SPECIAL);
    const gen=shuffle(mc(QUESTIONS[subj.general])).slice(0,EXAM_GENERAL);
    return shuffle(spec.concat(gen));
  }
  if(cat==='__all'||cat==='all'){ return shuffle(union()); }
  return shuffle(QUESTIONS[cat]);
}
function startQuiz(){
  if(state.mode==='exam'){ state.name=$('#in-name').value.trim(); state.unit=$('#in-unit').value.trim(); }
  state.list=buildList(state.cat); state.i=0; state.correct=0; state.wrong=[]; state.answered=false; state.finished=false;
  state.startTs=Date.now(); state.elapsed=0;
  show('quiz'); setBack('← Меню', renderHome);
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
  $('#q-count').textContent=(state.i+1)+' / '+state.list.length;
  $('#q-score').innerHTML='<b>'+state.correct+'</b> верно';
  $('#q-bar').style.width=(state.i/state.list.length*100)+'%';
  $('#q-text').textContent=q.q;
  const opts=$('#q-opts'); opts.innerHTML='';
  $('#q-expl').classList.add('hidden'); $('#q-expl').innerHTML='';
  const nb=$('#q-next'); nb.classList.add('hidden');
  nb.textContent = state.i===state.list.length-1 ? 'Завершить' : 'Следующий вопрос';
  if(q.type==='open'){ renderOpen(q, opts); return; }
  q._order=shuffle(q.o.map((t,idx)=>({t,idx})));
  q._order.forEach((o,vis)=>{
    const b=el('button','opt');
    b.innerHTML='<span class="k">'+KEYS[vis]+'</span><span>'+o.t+'</span>';
    b.onclick=()=>answer(b,o.idx,q);
    opts.appendChild(b);
  });
}

/* ---------- Открытый вопрос (свободный ответ + проверка ИИ) ---------- */
function esc(s){ const d=document.createElement('div'); d.textContent=(s==null?'':String(s)); return d.innerHTML; }
// Встроенный ИИ-эндпоинт по умолчанию (GAS: Groq+Gemini, ключи на стороне сервера).
const AI_CHECK_URL='https://script.google.com/macros/s/AKfycbyB3ZvzC2olok3PMO3So9d10ViOID5Qcwnt0k6Yu-C_EZVgpolLI6w-r4CYz_FCSfZz/exec';
function aiUrl(){ return (localStorage.getItem('subp_ai_url')||AI_CHECK_URL).trim(); }

function renderOpen(q, opts){
  const badge=el('div','open-badge');
  badge.textContent = aiUrl() ? 'Развёрнутый ответ · проверка ИИ' : 'Развёрнутый ответ · локальная проверка';
  opts.appendChild(badge);
  const ta=el('textarea','open-input');
  ta.placeholder='Введите ответ своими словами…'; ta.rows=5;
  opts.appendChild(ta);
  const btn=el('button','btn'); btn.textContent='Проверить ответ';
  btn.onclick=()=>submitOpen(q, ta, btn);
  opts.appendChild(btn);
  setTimeout(()=>ta.focus(), 50);
}

async function submitOpen(q, ta, btn){
  if(state.answered) return;
  const answer=(ta.value||'').trim();
  if(answer.length<3){ ta.focus(); return; }
  state.answered=true; ta.disabled=true; btn.disabled=true; btn.textContent='Проверяю…';
  let res;
  try { res = await checkOpen(q, answer); }
  catch(e){ res = localCheck(q, answer); res._offline=true; }
  showOpenResult(q, answer, res);
  const ok = res.score>=60;
  if(ok) state.correct++; else state.wrong.push({q:q.q, your:answer, right:q.ref, e:(res.feedback||q.e||'')});
  $('#q-score').innerHTML='<b>'+state.correct+'</b> верно';
  $('#q-bar').style.width=((state.i+1)/state.list.length*100)+'%';
  $('#q-next').classList.remove('hidden');
}

async function checkOpen(q, answer){
  const url=aiUrl();
  if(!url) return localCheck(q, answer);
  const body=JSON.stringify({ action:'check', subject:curSubj().name, q:q.q, ref:q.ref, crit:q.crit||[], answer });
  const r=await fetch(url, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body });
  if(!r.ok) throw new Error('http '+r.status);
  const d=await r.json();
  if(d && d.error) throw new Error(d.error);
  return { score:Math.max(0,Math.min(100, Math.round(Number(d.score)||0))),
           verdict:d.verdict||'', feedback:d.feedback||'', missing:Array.isArray(d.missing)?d.missing:[], _ai:true };
}

/* Локальная проверка без ИИ: доля ключевых слов эталона, найденных в ответе */
function localCheck(q, answer){
  const norm=s=>(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9 ]/g,' ');
  const stop=new Set(('и в во не на с со что а то как по из у за от о об для при или это его ее к до же бы был быть есть их они она он мы вы я но да чтобы если так уже еще нет ли бо про над под без через между').split(' '));
  const terms=[...new Set(norm(q.ref).split(/\s+/).filter(w=>w.length>3 && !stop.has(w)))];
  const ans=norm(answer);
  const hit=terms.filter(t=>ans.indexOf(t)>=0);
  const score=terms.length ? Math.round(hit.length/terms.length*100) : 0;
  return { score,
    verdict: score>=60?'зачтено (локально)':'сверьте с эталоном',
    feedback:'Локальная проверка по ключевым словам эталона (ИИ-эндпоинт не задан или недоступен). Сверьте свой ответ с эталоном ниже.',
    missing: terms.filter(t=>ans.indexOf(t)<0).slice(0,8), _local:true };
}

function showOpenResult(q, answer, res){
  const ok=res.score>=60;
  const ex=$('#q-expl'); ex.className='expl '+(ok?'ok':'bad');
  let h='<div class="tag">'+(ok?'✓ ':'✕ ')+'Оценка: '+res.score+'/100'+(res.verdict?' · '+esc(res.verdict):'')+'</div>';
  if(res.feedback) h+='<p>'+esc(res.feedback)+'</p>';
  if(res.missing && res.missing.length) h+='<p style="margin-top:6px"><b>Стоит добавить:</b> '+res.missing.map(esc).join(', ')+'</p>';
  h+='<div class="ref-ans"><b>Эталонный ответ:</b><br>'+esc(q.ref)+'</div>';
  if(res._local||res._offline) h+='<p class="ai-note">Оценка локальная (без ИИ). Включите ИИ-проверку кнопкой «⚙ ИИ-проверка» на экране выбора предмета.</p>';
  ex.innerHTML=h;
  ex.classList.remove('hidden');
}

function setupAI(){
  const cur=(localStorage.getItem('subp_ai_url')||'').trim();
  const v=prompt('URL эндпоинта ИИ-проверки (Apps Script, оканчивается на /exec).\nОставьте пустым — использовать встроенный эндпоинт по умолчанию:', cur);
  if(v===null) return;
  const t=v.trim();
  if(t) localStorage.setItem('subp_ai_url', t); else localStorage.removeItem('subp_ai_url');
  alert(t?'Свой ИИ-эндпоинт сохранён.':'Будет использован встроенный ИИ-эндпоинт по умолчанию.');
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
  if(q.img==='matrix') ex.insertAdjacentHTML('beforeend', matrixSVG());
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
  show('res'); setBack('← Меню', renderHome);
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
    $('#cert-org').textContent=curSubj().certOrg;
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
    state.wrong.forEach(w=>{ h+='<div class="rev-item"><div class="q">'+esc(w.q)+'</div>'+
      '<div class="a">Ваш ответ: '+esc(w.your)+'<br>Верно: <b>'+esc(w.right)+'</b><br>'+esc(w.e)+'</div></div>'; });
    rev.innerHTML=h;
  } else rev.innerHTML='<h3>Ошибок нет — отличная работа!</h3>';
}

/* ---------- Журнал ---------- */
function renderLog(){
  show('log'); setBack('← Назад', state.subject?renderHome:renderSubjects);
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
  $('#in-name').oninput=validateId; $('#in-unit').oninput=validateId; $('#in-approve').oninput=validateId;
  $('#id-start').onclick=startExam; $('#id-cancel').onclick=renderHome;
  $('#q-next').onclick=next;
  $('#res-retry').onclick=()=>{ if(state.mode==='exam') pick(state.cat); else startQuiz(); };
  $('#res-home').onclick=renderHome;
  $('#res-print').onclick=()=>window.print();
  $('#open-log').onclick=renderLog; $('#subj-log').onclick=renderLog;
  $('#subj-ai').onclick=setupAI;
  $('#subj-code').onclick=setupExamCode;
  $('#log-back').onclick=()=>{ state.subject?renderHome():renderSubjects(); };
  $('#log-clear').onclick=()=>{ if(confirm('Очистить журнал прохождений на этом устройстве?')){ localStorage.removeItem(HIST_KEY); renderLog(); } };
  renderSubjects();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
document.addEventListener('DOMContentLoaded',init);
