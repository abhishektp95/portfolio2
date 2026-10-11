document.addEventListener('DOMContentLoaded',()=>{
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const cards=$$('.project'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

 // Reveal sections and project cards with restrained stagger.
 if(!reduce && 'IntersectionObserver' in window){
   const io=new IntersectionObserver(entries=>{
     entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
   },{threshold:.1,rootMargin:'0px 0px -8% 0px'});
   $$('section,.project').forEach((el,i)=>{el.classList.add('reveal');el.style.transitionDelay=Math.min(i*35,180)+'ms';io.observe(el)});
 }else $$('section,.project').forEach(el=>el.classList.add('in'));

 // Video hover previews.
 cards.forEach(card=>{
   const v=$('video',card);
   if(!v)return;
   card.addEventListener('mouseenter',()=>v.play().catch(()=>{}));
   card.addEventListener('mouseleave',()=>{v.pause();v.currentTime=0});
 });

 // Filtering.
 const filters=$$('.filter'), gridCards=$$('.work-grid .project'), empty=$('.empty');
 filters.forEach(btn=>btn.addEventListener('click',()=>{
   filters.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
   let count=0;
   gridCards.forEach(card=>{
     const show=btn.dataset.filter==='all'||card.dataset.category===btn.dataset.filter;
     card.style.display=show?'':'none'; if(show)count++;
   });
   empty.hidden=count!==0;
 }));

 // Project viewer.
 const dialog=$('#viewer'), player=$('.viewer-video video',dialog);
 const open=card=>{
   const src=card.dataset.src;
   player.src=src; $('#vCat').textContent=card.dataset.cat; $('#vTitle').textContent=card.dataset.title; $('#vDesc').textContent=card.dataset.desc;
   dialog.showModal(); player.play().catch(()=>{});
 };
 cards.forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,a'))return;open(card)}));
 const close=()=>{player.pause();player.removeAttribute('src');player.load();if(dialog.open)dialog.close()};
 $('.close',dialog).addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 $('#viewer .viewer-link').addEventListener('click',close);

 // Active nav based on section position.
 const links=$$('.nav nav a'), sections=links.map(a=>$(a.getAttribute('href')));
 addEventListener('scroll',()=>{
   let active=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<160)active=i});
   links.forEach((a,i)=>a.style.color=i===active?'#fff':'');
 },{passive:true});
});