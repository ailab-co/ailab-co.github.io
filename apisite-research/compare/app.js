(function(){'use strict';
var S=window.SHOTS||{},lb,img,cap,url,open,list=[],i=0;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function build(){lb=document.createElement('div');lb.className='lb';lb.hidden=true;lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
lb.innerHTML='<div class="lbbar"><div class="lbinfo"><div id="lbCap"></div><div id="lbUrl" class="lburl"></div></div><span class="lbbtns"><a id="lbOpen" target="_blank" rel="noopener">原图</a><button type="button" id="lbClose" aria-label="关闭">✕</button></span></div><div class="lbstage" id="lbStage"><img id="lbImg" alt="" decoding="async"></div><button type="button" class="lbnav prev" id="lbPrev" aria-label="上一张">‹</button><button type="button" class="lbnav next" id="lbNext" aria-label="下一张">›</button>';
document.body.appendChild(lb);img=lb.querySelector('#lbImg');cap=lb.querySelector('#lbCap');url=lb.querySelector('#lbUrl');open=lb.querySelector('#lbOpen');
lb.querySelector('#lbClose').onclick=close;lb.querySelector('#lbPrev').onclick=function(){step(-1)};lb.querySelector('#lbNext').onclick=function(){step(1)};
lb.querySelector('#lbStage').addEventListener('click',function(e){if(e.target.id==='lbStage')close()});
var tx=null;lb.addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',function(e){if(tx==null)return;var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>60)step(d<0?1:-1);tx=null},{passive:true});}
function show(){var id=list[i],s=S[id]||{};img.removeAttribute('src');img.width=s.w||1440;img.height=s.h||900;img.src='img/full/'+id+'.webp';img.alt=s.t||id;
cap.innerHTML='<b>'+esc(s.t||id)+'</b>'+(list.length>1?' · '+(i+1)+'/'+list.length:'')+'<br>'+esc(s.c||'');
url.innerHTML=s.u?'<a href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">↗ 原网页 '+esc(s.u.replace('https://',''))+'</a>'+(s.uk==='login'?'<span class="rt">需登录</span>':'<span class="rt pub">公开</span>'):'';
open.href='img/full/'+id+'.webp';var multi=list.length>1;lb.querySelector('#lbPrev').hidden=!multi;lb.querySelector('#lbNext').hidden=!multi;lb.querySelector('#lbStage').scrollTop=0}
function step(d){i=(i+d+list.length)%list.length;show()}
function close(){lb.hidden=true;document.documentElement.style.overflow='';img.removeAttribute('src')}
document.addEventListener('click',function(e){var b=e.target.closest('[data-lb]');if(!b)return;e.preventDefault();if(!lb)build();list=(b.dataset.list||b.dataset.lb).split(',');i=Math.max(0,list.indexOf(b.dataset.lb));lb.hidden=false;document.documentElement.style.overflow='hidden';show();lb.querySelector('#lbClose').focus()});
document.addEventListener('keydown',function(e){if(!lb||lb.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1)});
})();
