(function(){
const D=window.D, $=s=>document.querySelector(s), esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T=n=>'img/thumb/'+n+'.webp', F=n=>'img/full/'+n+'.webp';
const sh=n=>D.shots[n]||{site:n,page:''};
const cap=n=>{const s=sh(n);return s.site+' · '+s.page};
const img=(n,list,cls)=>`<img class="${cls||''}" loading="lazy" src="${T(n)}" alt="${esc(cap(n))}" data-lb="${n}" data-list="${(list||[n]).join(',')}">`;
const isTpl=t=>/^(new-api|sub2api)/.test(t);
const typeCat=t=>t==='官方'?'official':t==='不可达'?'down':isTpl(t)?'tpl':'custom';
const TIERC={A:'#059669',B:'#4f46e5',C:'#9ca3af',D:'#dc2626','官方':'#0284c7'};
// ---------- overview
const counts={};D.rank.forEach(r=>counts[r.tier]=(counts[r.tier]||0)+1);
const LBL={A:'A 级（≥75）',B:'B 级（60–74）',C:'C 级（45–59）',D:'D 级（<45）','官方':'官方基准'};
const maxc=Math.max(...Object.values(counts));
$('#tierStats').innerHTML=['A','B','C','D','官方'].map(t=>`<button class="stat" data-tier="${t}"><div class="n">${counts[t]||0}</div><div class="l">${LBL[t]} 站</div><div class="bar"><i style="width:${(counts[t]||0)/maxc*100}%;background:${TIERC[t]}"></i></div></button>`).join('');
$('#tplCount').textContent=D.rank.filter(r=>isTpl(r.type)).length;
$('#tierStats').addEventListener('click',e=>{const b=e.target.closest('.stat');if(!b)return;state.tier=b.dataset.tier;renderRank();location.hash='#ranking';});
const top3=[['openrouter_model-detail','OpenRouter：同模型多渠道表','openrouter'],['fal_model-playground','fal：模型页即 Playground','fal'],['aihubmix_retirements','AIHubMix：模型下线日历 + 分接口状态页','aihubmix']];
$('#top3').innerHTML=top3.map(([n,t,id])=>`<figure>${img(n,top3.map(x=>x[0]),'thumb')}<figcaption>${esc(t)} · <a href="#ref/${id}">看详情 →</a></figcaption></figure>`).join('');
// ---------- ranking
const state={tier:'全部',type:'',hide:false,q:'',sort:'idx',dir:1,open:null};
D.rank.forEach((r,i)=>r.idx=i+1);
const COLS=[['idx','#','num'],['name','站点',''],['tier','分级',''],['total','总分','num'],['type','类型',''],['age','域名注册',''],['A','A','num'],['B','B','num'],['C','C','num'],['D','D','num'],['E','E','num'],['F','F','num'],['note','红旗 / 备注','']];
$('#tierChips').innerHTML=['全部','A','B','C','D','官方'].map(t=>`<button class="chip" data-t="${t}">${t}</button>`).join('');
$('#tierChips').onclick=e=>{const b=e.target.closest('.chip');if(b){state.tier=b.dataset.t;renderRank();}};
$('#typeSel').onchange=e=>{state.type=e.target.value;renderRank();};
$('#hideTpl').onchange=e=>{state.hide=e.target.checked;renderRank();};
$('#rkSearch').oninput=e=>{state.q=e.target.value.trim().toLowerCase();renderRank();};
function renderRank(){
  document.querySelectorAll('#tierChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.t===state.tier));
  let rows=D.rank.filter(r=>(state.tier==='全部'||r.tier===state.tier)&&(!state.type||typeCat(r.type)===state.type)&&(!state.hide||!isTpl(r.type))&&(!state.q||(r.name+' '+r.url+' '+r.note).toLowerCase().includes(state.q)));
  const k=state.sort;rows=rows.slice().sort((a,b)=>{let x=a[k],y=b[k];if(typeof x==='number')return (x-y)*state.dir;return String(x).localeCompare(String(y),'zh')*state.dir;});
  $('#rkCount').textContent=rows.length;
  const head='<thead><tr>'+COLS.map(([k,l,c])=>`<th data-k="${k}" class="${c} ${k==='name'?'sticky1':''}" title="${{A:'域龄+主体 /20',B:'合规透明 /20',C:'产品文档 /25',D:'支付商务 /15',E:'社群口碑 /10',F:'红旗 0~−10'}[k]||''}">${l}${state.sort===k?`<span class="ar">${state.dir>0?' ↑':' ↓'}</span>`:''}</th>`).join('')+'</tr></thead>';
  const body=rows.map(r=>{
    const tr=`<tr class="row" data-id="${r.id}"><td class="num">${r.idx}</td><td class="sticky1"><b>${esc(r.name)}</b></td><td><span class="tag ${r.tier}">${r.tier}</span></td><td class="num"><b>${r.total}</b></td><td>${esc(r.type)}</td><td>${esc(r.age)}</td>${['A','B','C','D','E'].map(x=>`<td class="num">${r[x]}</td>`).join('')}<td class="num">${r.F<0?`<span class="tag neg">${r.F}</span>`:'0'}</td><td class="wrap">${esc(r.note)||'—'}</td></tr>`;
    if(state.open!==r.id)return tr;
    return tr+`<tr class="det"><td colspan="${COLS.length}"><div class="detbox"><div>${r.shot?img(r.shot):'<div class="noshot">无首页截图（站点不可达）</div>'}</div><div>
      <div><b>官网：</b><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></div>
      <div><b>首页可见要素：</b></div><div class="ev">${r.ev.length?r.ev.map(e=>`<span class="tag">${esc(e)}</span>`).join(''):'<span class="tag">未读到</span>'}</div>
      ${r.ent?`<div><b>页脚 / 主体（自述）：</b>${esc(r.ent)}</div>`:''}
      ${r.sysver?`<div><b>new-api 版本串：</b><code>${esc(r.sysver)}</code></div>`:''}
      <div style="margin-top:6px"><b>分项：</b>A 域龄主体 ${r.A}/20 · B 合规透明 ${r.B}/20 · C 产品文档 ${r.C}/25 · D 支付商务 ${r.D}/15 · E 社群口碑 ${r.E}/10 · F 红旗 ${r.F}</div>
      ${D.refs.find(x=>x.name.startsWith(r.name)||x.id===r.id)?`<div style="margin-top:6px"><a href="#ref/${D.refs.find(x=>x.name.startsWith(r.name)||x.id===r.id).id}">→ 查看设计参考详情</a></div>`:''}
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
// ---------- refs
$('#refCards').innerHTML=D.refs.map(r=>`<button class="card" data-ref="${r.id}"><img class="thumb" loading="lazy" src="${T(r.cover)}" alt="${esc(r.name)}"><div class="cb"><h3>${esc(r.name)}<span class="tag ${r.tier[0]==='库'?'':r.tier[0]}">${esc(r.tier)}</span></h3><div class="ty">${esc(r.type)}</div><p>${esc((r.f.find(f=>f.k==='借鉴')||r.f[0]).t)}</p></div></button>`).join('');
$('#refCards').onclick=e=>{const c=e.target.closest('.card');if(c)location.hash='#ref/'+c.dataset.ref;};
function shotsHTML(list){
  if(!list.length)return '<div class="noshot">该条没有对应截图（来自外部讨论，未复核）</div>';
  return '<div class="shots">'+list.map(n=>`<figure>${img(n,list)}<figcaption>${esc(sh(n).page)}${sh(n).red?' · 已打码':''}</figcaption></figure>`).join('')+'</div>';
}
function renderRef(id){
  const r=D.refs.find(x=>x.id===id);if(!r)return closeRef();
  $('#refTitle').textContent=r.name;
  const order={'借鉴':0,'信息架构':1,'避免':2};
  const fs=r.f.slice().sort((a,b)=>order[a.k]-order[b.k]);
  $('#refBody').innerHTML=`<h1>${esc(r.name)}</h1><div class="meta"><span><span class="tag ${r.tier[0]==='库'?'':r.tier[0]}">${esc(r.tier)}</span></span><span>${esc(r.type)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.url)}</a></div>
   <div class="callout"><span class="tag 视觉">视觉风格</span> ${esc(r.visual)}</div>
   <div>${fs.map(f=>`<div class="find"><div class="txt"><span class="tag ${f.k}">${f.k}</span><div>${esc(f.t)}</div></div>${shotsHTML(f.s)}</div>`).join('')}</div>
   <div class="refnav">${D.refs.map(x=>`<a class="chip ${x.id===id?'on':''}" href="#ref/${x.id}">${esc(x.name)}</a>`).join('')}</div>`;
  $('#refView').hidden=false;document.body.style.overflow='hidden';$('#refView').scrollTop=0;
}
function closeRef(){$('#refView').hidden=true;document.body.style.overflow='';}
$('#refView').addEventListener('click',e=>{if(e.target.closest('[data-close]')){if(history.length>1&&lastNonRef!==null)history.back();else{location.hash='#refs';}}});
let lastNonRef=null;
function route(){const h=decodeURIComponent(location.hash);if(h.startsWith('#ref/'))renderRef(h.slice(5));else{lastNonRef=h;if(!$('#refView').hidden)closeRef();}}
window.addEventListener('hashchange',route);
// ---------- console
$('#consoleBlocks').innerHTML=D.console.map(c=>{const all=c.f.flatMap(f=>f.s);return `<div class="cblock"><h3>${esc(c.name)}</h3><p class="hint">${esc(c.note)}</p><div class="cgrid">${c.f.map(f=>`<div class="cf"><div class="cimgs">${f.s.map(n=>img(n,all)).join('')}</div><div class="ct"><span class="tag">${esc(f.s.map(n=>sh(n).page.replace('控制台·','')).join(' / '))}</span> ${esc(f.t)}</div></div>`).join('')}</div></div>`}).join('');
// ---------- matrix
const sym={Y:['有','y'],L:['登录后','l'],'-':['—','n']};
$('#fmTable').innerHTML='<thead><tr><th class="sticky1">功能</th>'+D.fmSites.map((s,i)=>`<th class="site">${D.fmRefIds[i]?`<a href="#ref/${D.fmRefIds[i]}">${esc(s)}</a>`:`<a href="#console">${esc(s)}</a>`}</th>`).join('')+'</tr></thead><tbody>'+D.fm.map(([f,s])=>`<tr><td class="sticky1"><b>${esc(f)}</b></td>${s.split('').map(c=>`<td class="c ${sym[c][1]}">${sym[c][0]}</td>`).join('')}</tr>`).join('')+'</tbody>';
// ---------- feature map
const NAME2ID=[['OpenRouter','openrouter'],['fal','fal'],['WaveSpeed','wavespeed'],['AIHubMix','aihubmix'],['ZenMux','zenmux'],['EvoLink','evolink'],['硅基流动','siliconflow'],['万川','chuanapi'],['ToAPIs','toapis']];
function linkRefs(s){let out=esc(s);NAME2ID.forEach(([n,id])=>{out=out.replace(n,`<a href="#ref/${id}">${n}</a>`)});out=out.replace('Router One','<a href="#console">Router One</a>').replace('AIIDE','<a href="#console">AIIDE</a>');return out;}
let fmF='全部';
$('#fmapChips').innerHTML=['全部','必备','差异化','可选'].map(t=>`<button class="chip" data-t="${t}">${t}</button>`).join('');
$('#fmapChips').onclick=e=>{const b=e.target.closest('.chip');if(b){fmF=b.dataset.t;renderFmap();}};
function renderFmap(){document.querySelectorAll('#fmapChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.t===fmF));
  $('#fmapList').innerHTML=D.fmap.filter(r=>fmF==='全部'||r[0]===fmF).map(r=>`<div class="fitem"><div><div class="lvl">${esc(r[1])}</div><span class="tag">${esc(r[0])}</span> <span class="p ${r[4]}">${r[4]}</span></div><div><div>${esc(r[2])}</div><div class="refl">参考：${linkRefs(r[3])}</div></div></div>`).join('');}
renderFmap();
// ---------- visual directions
const DIRS=[
 {t:'方向一：极简开发者风',s:['chuanapi_models','openrouter_model-detail','aihubmix_models'],li:['参考：万川、OpenRouter、AIHubMix','白底、黑色或单一强调色、细边框，model id 用等宽字体','适合以 LLM 和 Claude Code 客户为主、强调专业和价格透明','风险：辨识度一般，要靠数据密度和细节取胜']},
 {t:'方向二：国内 SaaS 亲和风',s:['evolink_pricing','zenmux_pricing','toapis_market'],li:['参考：EvoLink、ZenMux、ToAPIs','暖白底、品牌色按钮、大圆角卡片，中文排版讲究','适合客户里有不少非开发者、要讲清计费和活动','风险：容易滑向弹窗和促销堆砌（ZenMux 首屏就是反例）']},
 {t:'方向三：媒体创作风',s:['fal_home','wavespeed_home','replicate_explore'],li:['参考：fal、WaveSpeed、Replicate','营销页用作品大图、深色或高饱和，控制台回到中性色','适合以 Seedance、GPT Image 等生图视频为卖点','风险：深色控制台看表格易疲劳，建议只用在营销页']}];
$('#dirs').innerHTML=DIRS.map(d=>`<div class="dir"><div class="strip">${d.s.map(n=>img(n,d.s)).join('')}</div><div class="db"><h3>${d.t}</h3><ul>${d.li.map(x=>`<li>${linkRefs(x)}</li>`).join('')}</ul></div></div>`).join('');
// ---------- priorities
const STEPS=[['P0','价格与模型广场','真实现金单价、类型 Tab、起价加分组、Base URL 置顶复制；“计费方式”说明页',['chuanapi_models','evolink_pricing']],
 ['P0','控制台骨架','首页三步引导、Key 管理（限额、白名单、绑定分组）、用量图、请求日志、异步任务日志、钱包流水',['routerone_console-overview','aiide_console-keys','aiide_console-tasklogs']],
 ['P0','信任要素','状态页（按接口类型）、更新日志、条款 / 隐私 / 退款、主体信息、失败不计费说明',['aihubmix_status','chuanapi_status']],
 ['P1','渠道对比表','同一模型多个分组并排比价格、延迟、7 日可用率，这是你们最大的差异化点',['openrouter_model-detail']],
 ['P1','媒体 Playground 与 B2B 分销','生图和视频页内试用；子账户、下游 Key 分配、对账导出',['fal_model-playground','wavespeed_model-playground']],
 ['P2','增长功能','公开排行、模型专题页、订阅和活动子页、邀请返佣、⌘K 搜索',['openrouter_rankings','wavespeed_models','zenmux_pricing']]];
$('#steps').innerHTML=STEPS.map(([p,t,d,s])=>`<li><span class="pp ${p}">${p}</span><div><b>${t}</b>${esc(d)}<div class="lk">参考截图：${s.map(n=>`<a href="#" data-lb="${n}" data-list="${s.join(',')}">${esc(cap(n))}</a>`).join('')}</div></div></li>`).join('');
// ---------- gallery
const ALL=Object.keys(D.shots);
const KINDS=[['all','全部'],['first','首屏'],['full','整页'],['console','控制台（已打码）'],['home','排名站首页']];
const kindOf=n=>{const s=D.shots[n];return s.group==='home'?'home':s.group==='console'||s.red&&!s.full?'console':s.full?'full':'first'};
let gk='first',gs='';
$('#galKind').innerHTML=KINDS.map(([k,l])=>`<button class="chip" data-k="${k}">${l}</button>`).join('');
$('#galKind').onclick=e=>{const b=e.target.closest('.chip');if(b){gk=b.dataset.k;gs='';renderGal();}};
$('#galSite').onchange=e=>{gs=e.target.value;renderGal();};
function renderGal(){
  document.querySelectorAll('#galKind .chip').forEach(c=>c.classList.toggle('on',c.dataset.k===gk));
  let list=ALL.filter(n=>gk==='all'||kindOf(n)===gk);
  const sites=[...new Set(list.map(n=>D.shots[n].site))].sort((a,b)=>a.localeCompare(b,'zh'));
  $('#galSite').innerHTML='<option value="">全部站点（'+sites.length+'）</option>'+sites.map(s=>`<option ${s===gs?'selected':''}>${esc(s)}</option>`).join('');
  if(gs)list=list.filter(n=>D.shots[n].site===gs);
  list.sort((a,b)=>(D.shots[a].site+a).localeCompare(D.shots[b].site+b,'zh'));
  $('#galCount').textContent=list.length;
  $('#galGrid').innerHTML=list.map(n=>`<figure class="gi">${img(n,list)}<figcaption><b>${esc(D.shots[n].site)}</b> <span>${esc(D.shots[n].page)}${D.shots[n].red?' · 已打码':''}</span></figcaption></figure>`).join('');
}
renderGal();
// ---------- lightbox
let lbList=[],lbI=0;
function openLB(list,i){lbList=list;lbI=i;showLB();$('#lb').hidden=false;document.body.style.overflow='hidden';}
function showLB(){const n=lbList[lbI],s=sh(n),st=$('#lbStage'),im=$('#lbImg');
  const tall=s.h&&s.h>s.w*1.05;st.className='lbstage '+(tall?'tall':'fit');im.src=F(n);im.alt=cap(n);st.scrollTop=0;
  $('#lbCap').innerHTML=`<b>${esc(s.site)}</b> · ${esc(s.page)}${s.red?' · 已打码':''} ${s.url?`· <a style="color:#a5b4fc" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">来源页</a>`:''} <span style="opacity:.6">${lbI+1}/${lbList.length}</span>`;
  $('#lbOpen').href=F(n);$('#lbPrev').style.visibility=lbList.length>1?'visible':'hidden';$('#lbNext').style.visibility=lbList.length>1?'visible':'hidden';}
function closeLB(){$('#lb').hidden=true;$('#lbImg').src='';if($('#refView').hidden)document.body.style.overflow='';}
const step=d=>{lbI=(lbI+d+lbList.length)%lbList.length;showLB();};
document.addEventListener('click',e=>{const t=e.target.closest('[data-lb]');if(!t)return;e.preventDefault();e.stopPropagation();const list=(t.dataset.list||t.dataset.lb).split(',');openLB(list,Math.max(0,list.indexOf(t.dataset.lb)));},true);
$('#lbClose').onclick=closeLB;$('#lbPrev').onclick=()=>step(-1);$('#lbNext').onclick=()=>step(1);
$('#lbStage').addEventListener('click',e=>{if(e.target.id==='lbStage')closeLB();});
document.addEventListener('keydown',e=>{if($('#lb').hidden){if(e.key==='Escape'&&!$('#refView').hidden)$('#refView [data-close]').click();return;}if(e.key==='Escape')closeLB();if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);});
let tx=null,ty=null;$('#lb').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
$('#lb').addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5&&lbList.length>1)step(dx<0?1:-1);tx=null;},{passive:true});
// ---------- nav highlight
const secs=[...document.querySelectorAll('main section')];const links=[...document.querySelectorAll('#nav a')];
const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id));const a=links.find(a=>a.classList.contains('on'));if(a)a.scrollIntoView({block:'nearest',inline:'center'});}})},{rootMargin:'-40% 0px -55% 0px'});
secs.forEach(s=>io.observe(s));
route();
})();
