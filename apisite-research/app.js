(function(){
'use strict';
const D=window.D||{}, PAGE=document.body.dataset.page;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=n=>'img/thumb/'+n+'.webp', F=n=>'img/full/'+n+'.webp';
const SH=D.shots||{};
const sh=n=>SH[n]||{site:n,page:''};
const cap=n=>{const s=sh(n);return s.site+' · '+s.page};
const shortUrl=u=>{try{const x=new URL(u);let p=x.pathname==='/'?'':x.pathname;return x.host+p+(x.search||'')}catch(e){return u}};
// thumb <img>: lazy, async decode, intrinsic size set (no layout shift)
const img=(n,list,cls,eager)=>{const s=sh(n);return `<img class="${cls||''}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async" src="${T(n)}" width="${s.tw||480}" height="${s.th||300}" alt="${esc(cap(n))}" data-lb="${n}" data-list="${(list||[n]).join(',')}">`};
// small "original page" link under a figure
const srcLink=n=>{const s=sh(n);if(!s.url)return '';return `<a class="src${s.uk==='home'?' home':''}" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${s.uk==='home'?'站点首页（截图页面地址未记录）':'截图时的原网页'}">↗ ${esc(s.uk==='home'?'站点首页 '+shortUrl(s.url):shortUrl(s.url))}</a>`};
const isTpl=t=>/^(new-api|sub2api)/.test(t);
const typeCat=t=>t==='官方'?'official':t==='不可达'?'down':isTpl(t)?'tpl':'custom';
const TIERC={A:'#059669',B:'#4f46e5',C:'#9ca3af',D:'#dc2626','官方':'#0284c7'};
const NAME2ID=[['OpenRouter','openrouter'],['fal','fal'],['WaveSpeed','wavespeed'],['AIHubMix','aihubmix'],['ZenMux','zenmux'],['EvoLink','evolink'],['硅基流动','siliconflow'],['万川','chuanapi'],['ToAPIs','toapis']];
function linkRefs(s){let out=esc(s);NAME2ID.forEach(([n,id])=>{out=out.replace(n,`<a href="refs.html#${id}">${n}</a>`)});return out.replace('Router One','<a href="design.html#console">Router One</a>').replace('AIIDE','<a href="design.html#console">AIIDE</a>');}

// ================= lightbox (shared) =================
let lb=null,lbList=[],lbI=0;const GAL={list:[]};
function buildLB(){
  const d=document.createElement('div');d.id='lb';d.className='lb';d.hidden=true;
  d.innerHTML=`<div class="lbbar"><div class="lbinfo"><div id="lbCap"></div><div id="lbUrl" class="lburl"></div></div><span class="lbbtns"><a id="lbOpen" target="_blank" rel="noopener noreferrer">原图</a><button id="lbClose" aria-label="关闭">✕</button></span></div>
  <div class="lbstage" id="lbStage"><img id="lbImg" alt="" decoding="async"></div>
  <button class="lbnav prev" id="lbPrev" aria-label="上一张">‹</button><button class="lbnav next" id="lbNext" aria-label="下一张">›</button>`;
  document.body.appendChild(d);lb=d;
  $('#lbClose').onclick=closeLB;$('#lbPrev').onclick=()=>step(-1);$('#lbNext').onclick=()=>step(1);
  $('#lbStage').addEventListener('click',e=>{if(e.target.id==='lbStage')closeLB();});
  let tx=null,ty=null;
  d.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  d.addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&lbList.length>1)step(dx<0?1:-1);tx=null;},{passive:true});
}
function openLB(list,i){if(!lb)buildLB();lbList=list;lbI=i;showLB();lb.hidden=false;document.documentElement.classList.add('noscroll');}
function showLB(){
  const n=lbList[lbI],s=sh(n),st=$('#lbStage'),im=$('#lbImg');
  const tall=s.h&&s.h>s.w*1.05;st.className='lbstage '+(tall?'tall':'fit');
  im.removeAttribute('src');im.width=s.w||1440;im.height=s.h||900;im.src=F(n);im.alt=cap(n);st.scrollTop=0;
  $('#lbCap').innerHTML=`<b>${esc(s.site)}</b> · ${esc(s.page)}${s.red?' · 已打码':''} <span class="cnt">${lbI+1}/${lbList.length}</span>`;
  let u='';
  if(s.url){
    u=s.uk==='home'
      ?`<span class="badge warn">站点首页</span> <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a> <span class="dim">（这张截图当时没记录具体页面地址）</span>`
      :`<span class="badge">原网页</span> <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a>${s.req?` <span class="dim">（抓取时请求 ${esc(s.req)}，跳转到此）</span>`:''}${s.group==='console'?' <span class="dim">（需登录）</span>':''}`;
  }else u='<span class="dim">未记录原网页地址</span>';
  $('#lbUrl').innerHTML=u;
  $('#lbOpen').href=F(n);
  const v=lbList.length>1?'visible':'hidden';$('#lbPrev').style.visibility=v;$('#lbNext').style.visibility=v;
  // warm the next image only (cheap, on demand)
  if(lbList.length>1){const nx=new Image();nx.decoding='async';nx.src=F(lbList[(lbI+1)%lbList.length]);}
}
function closeLB(){lb.hidden=true;$('#lbImg').removeAttribute('src');document.documentElement.classList.remove('noscroll');}
const step=d=>{lbI=(lbI+d+lbList.length)%lbList.length;showLB();};
document.addEventListener('click',e=>{const t=e.target.closest('[data-lb]');if(!t)return;e.preventDefault();const list=t.dataset.list==='@gal'?GAL.list:(t.dataset.list||t.dataset.lb).split(',');openLB(list,Math.max(0,list.indexOf(t.dataset.lb)));});
document.addEventListener('keydown',e=>{if(!lb||lb.hidden)return;if(e.key==='Escape')closeLB();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1);});

// ================= index: overview + ranking =================
function initIndex(){
  const counts={};D.rank.forEach(r=>counts[r.tier]=(counts[r.tier]||0)+1);
  const LBL={A:'A 级（≥75）',B:'B 级（60–74）',C:'C 级（45–59）',D:'D 级（<45）','官方':'官方基准'};
  const maxc=Math.max(...Object.values(counts));
  $('#tierStats').innerHTML=['A','B','C','D','官方'].map(t=>`<button class="stat" data-tier="${t}"><div class="n">${counts[t]||0}</div><div class="l">${LBL[t]} 站</div><div class="bar"><i style="width:${(counts[t]||0)/maxc*100}%;background:${TIERC[t]}"></i></div></button>`).join('');
  $('#tplCount').textContent=D.rank.filter(r=>isTpl(r.type)).length;
  $('#tierStats').addEventListener('click',e=>{const b=e.target.closest('.stat');if(!b)return;state.tier=b.dataset.tier;renderRank();$('#ranking').scrollIntoView();});
  const top3=[['openrouter_model-detail','OpenRouter：同模型多渠道表','openrouter'],['fal_model-playground','fal：模型页即 Playground','fal'],['aihubmix_retirements','AIHubMix：模型下线日历 + 分接口状态页','aihubmix']];
  $('#top3').innerHTML=top3.map(([n,t,id],i)=>`<figure>${img(n,top3.map(x=>x[0]),'thumb',true)}<figcaption>${esc(t)} · <a href="refs.html#${id}">看详情 →</a><br>${srcLink(n)}</figcaption></figure>`).join('');
  const state={tier:'全部',type:'',hide:false,q:'',sort:'idx',dir:1,open:null};
  D.rank.forEach((r,i)=>r.idx=i+1);
  const refOf=r=>D.refIds.find(([id,name])=>name.startsWith(r.name)||id===r.id);
  const COLS=[['idx','#','num'],['name','站点',''],['tier','分级',''],['total','总分','num'],['type','类型',''],['age','域名注册',''],['A','A','num'],['B','B','num'],['C','C','num'],['D','D','num'],['E','E','num'],['F','F','num'],['note','红旗 / 备注','']];
  $('#tierChips').innerHTML=['全部','A','B','C','D','官方'].map(t=>`<button class="chip" data-t="${t}">${t}</button>`).join('');
  $('#tierChips').onclick=e=>{const b=e.target.closest('.chip');if(b){state.tier=b.dataset.t;renderRank();}};
  $('#typeSel').onchange=e=>{state.type=e.target.value;renderRank();};
  $('#hideTpl').onchange=e=>{state.hide=e.target.checked;renderRank();};
  let qt=0;$('#rkSearch').oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{state.q=e.target.value.trim().toLowerCase();renderRank();},120);};
  function renderRank(){
    document.querySelectorAll('#tierChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.t===state.tier));
    let rows=D.rank.filter(r=>(state.tier==='全部'||r.tier===state.tier)&&(!state.type||typeCat(r.type)===state.type)&&(!state.hide||!isTpl(r.type))&&(!state.q||(r.name+' '+r.url+' '+r.note).toLowerCase().includes(state.q)));
    const k=state.sort;rows=rows.slice().sort((a,b)=>{let x=a[k],y=b[k];if(typeof x==='number')return (x-y)*state.dir;return String(x).localeCompare(String(y),'zh')*state.dir;});
    $('#rkCount').textContent=rows.length;
    const head='<thead><tr>'+COLS.map(([k,l,c])=>`<th data-k="${k}" class="${c} ${k==='name'?'sticky1':''}" title="${{A:'域龄+主体 /20',B:'合规透明 /20',C:'产品文档 /25',D:'支付商务 /15',E:'社群口碑 /10',F:'红旗 0~−10'}[k]||''}">${l}${state.sort===k?`<span class="ar">${state.dir>0?' ↑':' ↓'}</span>`:''}</th>`).join('')+'</tr></thead>';
    const body=rows.map(r=>{
      const tr=`<tr class="row" data-id="${r.id}"><td class="num">${r.idx}</td><td class="sticky1"><b>${esc(r.name)}</b></td><td><span class="tag ${r.tier}">${r.tier}</span></td><td class="num"><b>${r.total}</b></td><td>${esc(r.type)}</td><td>${esc(r.age)}</td>${['A','B','C','D','E'].map(x=>`<td class="num">${r[x]}</td>`).join('')}<td class="num">${r.F<0?`<span class="tag neg">${r.F}</span>`:'0'}</td><td class="wrap">${esc(r.note)||'—'}</td></tr>`;
      if(state.open!==r.id)return tr;
      const ref=refOf(r);
      return tr+`<tr class="det"><td colspan="${COLS.length}"><div class="detbox"><div>${r.shot?img(r.shot)+'<div class="srcline">'+srcLink(r.shot)+'</div>':'<div class="noshot">无首页截图（站点不可达）</div>'}</div><div>
        <div><b>官网：</b><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></div>
        <div><b>首页可见要素：</b></div><div class="ev">${r.ev.length?r.ev.map(e=>`<span class="tag">${esc(e)}</span>`).join(''):'<span class="tag">未读到</span>'}</div>
        ${r.ent?`<div><b>页脚 / 主体（自述）：</b>${esc(r.ent)}</div>`:''}
        ${r.sysver?`<div><b>new-api 版本串：</b><code>${esc(r.sysver)}</code></div>`:''}
        <div style="margin-top:6px"><b>分项：</b>A 域龄主体 ${r.A}/20 · B 合规透明 ${r.B}/20 · C 产品文档 ${r.C}/25 · D 支付商务 ${r.D}/15 · E 社群口碑 ${r.E}/10 · F 红旗 ${r.F}</div>
        ${ref?`<div style="margin-top:6px"><a href="refs.html#${ref[0]}">→ 查看设计参考详情</a></div>`:''}
      </div></div></td></tr>`;
    }).join('');
    $('#rankTable').innerHTML=head+'<tbody>'+body+'</tbody>';
  }
  $('#rankTable').addEventListener('click',e=>{
    if(e.target.closest('img,a'))return;
    const th=e.target.closest('th');if(th){const k=th.dataset.k;if(state.sort===k)state.dir*=-1;else{state.sort=k;state.dir=(['total','A','B','C','D','E','F'].includes(k)?-1:1);}renderRank();return;}
    const tr=e.target.closest('tr.row');if(tr){state.open=state.open===tr.dataset.id?null:tr.dataset.id;renderRank();}
  });
  renderRank();
}

// ================= refs: 12 cards + in-page detail =================
function initRefs(){
  $('#refCards').innerHTML=D.refs.map((r,i)=>`<div class="card"><a class="cardlink" href="#${r.id}" aria-label="${esc(r.name)} 详情"></a><img class="thumb" ${i<4?'':'loading="lazy"'} decoding="async" src="${T(r.cover)}" width="${sh(r.cover).tw||480}" height="${sh(r.cover).th||300}" alt="${esc(r.name)}"><div class="cb"><h3>${esc(r.name)}<span class="tag ${r.tier[0]==='库'?'':r.tier[0]}">${esc(r.tier)}</span></h3><div class="ty">${esc(r.type)}</div><p>${esc((r.f.find(f=>f.k==='借鉴')||r.f[0]).t)}</p>
    <div class="urls"><div>官网：<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(shortUrl(r.url))}</a></div><div>封面截图原网页：${srcLink(r.cover)||'—'}</div></div></div></div>`).join('');
  const order={'借鉴':0,'信息架构':1,'避免':2};
  function shotsHTML(list){
    if(!list.length)return '<div class="noshot">该条没有对应截图（来自外部讨论，未复核）</div>';
    return '<div class="shots">'+list.map(n=>`<figure>${img(n,list)}<figcaption>${esc(sh(n).page)}${sh(n).red?' · 已打码':''}<br>${srcLink(n)}</figcaption></figure>`).join('')+'</div>';
  }
  function route(){
    const id=decodeURIComponent(location.hash.slice(1));const r=D.refs.find(x=>x.id===id);
    const det=$('#refDetail'),list=$('#refs');
    if(!r){det.hidden=true;det.innerHTML='';list.hidden=false;return;}
    const fs=r.f.slice().sort((a,b)=>order[a.k]-order[b.k]);
    det.innerHTML=`<div class="dethead"><a class="back" href="#">← 返回 12 站列表</a></div><h1>${esc(r.name)}</h1><div class="meta"><span><span class="tag ${r.tier[0]==='库'?'':r.tier[0]}">${esc(r.tier)}</span></span><span>${esc(r.type)}</span><span>官网：<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></span></div>
      <div class="callout"><span class="tag 视觉">视觉风格</span> ${esc(r.visual)}</div>
      <div>${fs.map(f=>`<div class="find"><div class="txt"><span class="tag ${f.k}">${f.k}</span><div>${esc(f.t)}</div></div>${shotsHTML(f.s)}</div>`).join('')}</div>
      <div class="refnav">${D.refs.map(x=>`<a class="chip ${x.id===id?'on':''}" href="#${x.id}">${esc(x.name)}</a>`).join('')}</div>`;
    list.hidden=true;det.hidden=false;window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',route);route();
}

// ================= design: console / matrix / fmap / visual / priority =================
function initDesign(){
  $('#consoleBlocks').innerHTML=D.console.map(c=>{const all=c.f.flatMap(f=>f.s);return `<div class="cblock cv"><h3>${esc(c.name)}</h3><p class="hint">${esc(c.note)}</p><div class="cgrid">${c.f.map(f=>`<div class="cf"><div class="cimgs">${f.s.map(n=>img(n,all)).join('')}</div><div class="ct"><span class="tag">${esc(f.s.map(n=>sh(n).page.replace('控制台·','')).join(' / '))}</span> ${esc(f.t)}<div class="srcline">${f.s.map(srcLink).join(' ')}</div></div></div>`).join('')}</div></div>`}).join('');
  const sym={Y:['有','y'],L:['登录后','l'],'-':['—','n']};
  $('#fmTable').innerHTML='<thead><tr><th class="sticky1">功能</th>'+D.fmSites.map((s,i)=>`<th class="site">${D.fmRefIds[i]?`<a href="refs.html#${D.fmRefIds[i]}">${esc(s)}</a>`:`<a href="#console">${esc(s)}</a>`}</th>`).join('')+'</tr></thead><tbody>'+D.fm.map(([f,s])=>`<tr><td class="sticky1"><b>${esc(f)}</b></td>${s.split('').map(c=>`<td class="c ${sym[c][1]}">${sym[c][0]}</td>`).join('')}</tr>`).join('')+'</tbody>';
  let fmF='全部';
  $('#fmapChips').innerHTML=['全部','必备','差异化','可选'].map(t=>`<button class="chip" data-t="${t}">${t}</button>`).join('');
  $('#fmapChips').onclick=e=>{const b=e.target.closest('.chip');if(b){fmF=b.dataset.t;renderFmap();}};
  function renderFmap(){document.querySelectorAll('#fmapChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.t===fmF));
    $('#fmapList').innerHTML=D.fmap.filter(r=>fmF==='全部'||r[0]===fmF).map(r=>`<div class="fitem"><div><div class="lvl">${esc(r[1])}</div><span class="tag">${esc(r[0])}</span> <span class="p ${r[4]}">${r[4]}</span></div><div><div>${esc(r[2])}</div><div class="refl">参考：${linkRefs(r[3])}</div></div></div>`).join('');}
  renderFmap();
  const DIRS=[
   {t:'方向一：极简开发者风',s:['chuanapi_models','openrouter_model-detail','aihubmix_models'],li:['参考：万川、OpenRouter、AIHubMix','白底、黑色或单一强调色、细边框，model id 用等宽字体','适合以 LLM 和 Claude Code 客户为主、强调专业和价格透明','风险：辨识度一般，要靠数据密度和细节取胜']},
   {t:'方向二：国内 SaaS 亲和风',s:['evolink_pricing','zenmux_pricing','toapis_market'],li:['参考：EvoLink、ZenMux、ToAPIs','暖白底、品牌色按钮、大圆角卡片，中文排版讲究','适合客户里有不少非开发者、要讲清计费和活动','风险：容易滑向弹窗和促销堆砌（ZenMux 首屏就是反例）']},
   {t:'方向三：媒体创作风',s:['fal_home','wavespeed_home','replicate_explore'],li:['参考：fal、WaveSpeed、Replicate','营销页用作品大图、深色或高饱和，控制台回到中性色','适合以 Seedance、GPT Image 等生图视频为卖点','风险：深色控制台看表格易疲劳，建议只用在营销页']}];
  $('#dirs').innerHTML=DIRS.map(d=>`<div class="dir"><div class="strip">${d.s.map(n=>img(n,d.s)).join('')}</div><div class="db"><h3>${d.t}</h3><ul>${d.li.map(x=>`<li>${linkRefs(x)}</li>`).join('')}</ul></div></div>`).join('');
  const STEPS=[['P0','价格与模型广场','真实现金单价、类型 Tab、起价加分组、Base URL 置顶复制；“计费方式”说明页',['chuanapi_models','evolink_pricing']],
   ['P0','控制台骨架','首页三步引导、Key 管理（限额、白名单、绑定分组）、用量图、请求日志、异步任务日志、钱包流水',['routerone_console-overview','aiide_console-keys','aiide_console-tasklogs']],
   ['P0','信任要素','状态页（按接口类型）、更新日志、条款 / 隐私 / 退款、主体信息、失败不计费说明',['aihubmix_status','chuanapi_status']],
   ['P1','渠道对比表','同一模型多个分组并排比价格、延迟、7 日可用率，这是你们最大的差异化点',['openrouter_model-detail']],
   ['P1','媒体 Playground 与 B2B 分销','生图和视频页内试用；子账户、下游 Key 分配、对账导出',['fal_model-playground','wavespeed_model-playground']],
   ['P2','增长功能','公开排行、模型专题页、订阅和活动子页、邀请返佣、⌘K 搜索',['openrouter_rankings','wavespeed_models','zenmux_pricing']]];
  $('#steps').innerHTML=STEPS.map(([p,t,d,s])=>`<li><span class="pp ${p}">${p}</span><div><b>${t}</b>${esc(d)}<div class="lk">参考截图：${s.map(n=>`<a href="#" data-lb="${n}" data-list="${s.join(',')}">${esc(cap(n))}</a>`).join('')}</div></div></li>`).join('');
}

// ================= gallery: filtered + rendered in batches =================
function initGallery(){
  const ALL=Object.keys(SH);
  const KINDS=[['all','全部'],['first','首屏'],['full','整页'],['console','控制台（已打码）'],['home','排名站首页']];
  const kindOf=n=>{const s=SH[n];return s.group==='home'?'home':s.group==='console'||s.red&&!s.full?'console':s.full?'full':'first'};
  const BATCH=24;let gk='first',gs='',list=[],shown=0;
  $('#galKind').innerHTML=KINDS.map(([k,l])=>`<button class="chip" data-k="${k}">${l}</button>`).join('');
  $('#galKind').onclick=e=>{const b=e.target.closest('.chip');if(b){gk=b.dataset.k;gs='';renderGal();}};
  $('#galSite').onchange=e=>{gs=e.target.value;renderGal();};
  const grid=$('#galGrid'),more=$('#galMore');
  function fig(n){const s=SH[n];return `<figure class="gi">${img(n,['@gal'])}<figcaption><b>${esc(s.site)}</b> <span>${esc(s.page)}${s.red?' · 已打码':''}</span><br>${srcLink(n)}</figcaption></figure>`}
  function addBatch(){if(shown>=list.length)return;grid.insertAdjacentHTML('beforeend',list.slice(shown,shown+BATCH).map(fig).join(''));shown=Math.min(list.length,shown+BATCH);
    more.innerHTML=shown<list.length?`<button class="chip" id="moreBtn">再显示 ${Math.min(BATCH,list.length-shown)} 张（已显示 ${shown}/${list.length}）</button>`:(list.length>BATCH?`<span class="hint">已全部显示 ${list.length} 张</span>`:'');}
  more.addEventListener('click',e=>{if(e.target.id==='moreBtn')addBatch();});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{if(es[0].isIntersecting)addBatch();},{rootMargin:'600px 0px'}).observe(more);
  function renderGal(){
    document.querySelectorAll('#galKind .chip').forEach(c=>c.classList.toggle('on',c.dataset.k===gk));
    list=ALL.filter(n=>gk==='all'||kindOf(n)===gk);
    const sites=[...new Set(list.map(n=>SH[n].site))].sort((a,b)=>a.localeCompare(b,'zh'));
    $('#galSite').innerHTML='<option value="">全部站点（'+sites.length+'）</option>'+sites.map(s=>`<option ${s===gs?'selected':''}>${esc(s)}</option>`).join('');
    if(gs)list=list.filter(n=>SH[n].site===gs);
    list.sort((a,b)=>(SH[a].site+a).localeCompare(SH[b].site+b,'zh'));
    GAL.list=list;$('#galCount').textContent=list.length;
    grid.innerHTML='';shown=0;addBatch();
  }
  renderGal();
}
// legacy single-page anchors (old links like #ref/openrouter, #gallery) -> new pages
if(PAGE==='index'){const h=decodeURIComponent(location.hash);const M={'#refs':'refs.html','#console':'design.html#console','#matrix':'design.html#matrix','#fmap':'design.html#fmap','#visual':'design.html#visual','#priority':'design.html#priority','#gallery':'gallery.html','#scoring':'method.html#scoring','#caveats':'method.html#caveats'};
  if(h.startsWith('#ref/')){location.replace('refs.html#'+encodeURIComponent(h.slice(5)));return;} if(M[h]){location.replace(M[h]);return;}}
({index:initIndex,refs:initRefs,design:initDesign,gallery:initGallery}[PAGE]||(()=>{}))();
})();
