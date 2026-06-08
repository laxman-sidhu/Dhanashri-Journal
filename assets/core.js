/* ===== Dhanashri Journal — shared core ===== */
window.JOURNAL = (function(){
  const CONFIG = { USERNAME:"laxman-sidhu", REPO:"Dhanashri-Journal" };
  const PAGE_W = 760;

  // font key -> css family (labels used by editor)
  const FONTS = {
    gaegu:   { css:"'Gaegu', cursive",          label:"Gaegu (cute)" },
    caveat:  { css:"'Caveat', cursive",         label:"Caveat (hand)" },
    patrick: { css:"'Patrick Hand', cursive",   label:"Patrick Hand" },
    indie:   { css:"'Indie Flower', cursive",   label:"Indie Flower" },
    shadows: { css:"'Shadows Into Light', cursive", label:"Shadows" },
    dancing: { css:"'Dancing Script', cursive", label:"Dancing Script" },
    quicksand:{css:"'Quicksand', sans-serif",   label:"Quicksand" },
    nunito:  { css:"'Nunito', sans-serif",      label:"Nunito (clean)" }
  };

  function uid(){ return Math.random().toString(36).slice(2,9); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function slugify(s){ let v=(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); return v || ('story-'+uid()); }
  function formatDate(iso){ if(!iso) return ''; try{ const [y,m,d]=iso.split('-'); const mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return parseInt(d)+' '+mn[parseInt(m)-1]+' '+y; }catch(e){ return iso; } }

  function compress(file, maxW, q, type){
    maxW=maxW||1100; q=(q==null?0.82:q); type=type||'image/jpeg';
    return new Promise((res,rej)=>{
      const reader=new FileReader();
      reader.onload=()=>{ const img=new Image();
        img.onload=()=>{ let w=img.width,h=img.height; if(w>maxW){ h=Math.round(h*maxW/w); w=maxW; }
          const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h);
          res(c.toDataURL(type,q)); };
        img.onerror=rej; img.src=reader.result; };
      reader.onerror=rej; reader.readAsDataURL(file);
    });
  }

  function applyTextStyle(body, d){
    body.style.fontFamily = (FONTS[d.font]||FONTS.gaegu).css;
    body.style.fontSize   = (d.size||20)+'px';
    body.style.fontWeight = d.bold? '700':'400';
    body.style.fontStyle  = d.italic? 'italic':'normal';
    body.style.textDecoration = d.underline? 'underline':'none';
    body.style.textAlign  = d.align||'left';
    if(d.color) body.style.color = d.color;
  }

  function buildElementRO(d){
    const el=document.createElement('div'); el.className='el el-'+d.type;
    el.style.left=(d.x||40)+'px'; el.style.top=(d.y||120)+'px'; if(d.w) el.style.width=d.w+'px';
    if(d.type==='text'){
      const b=document.createElement('div'); b.className='text-body'; b.textContent=d.content||''; applyTextStyle(b,d); el.appendChild(b);
    } else if(d.type==='photo'){
      const img=document.createElement('img'); img.src=d.src; img.draggable=false; el.appendChild(img);
      if(d.caption){ const cap=document.createElement('div'); cap.className='cap'; cap.textContent=d.caption; el.appendChild(cap); }
      el.style.transform='rotate('+(d.rot||-1.4)+'deg)';
    } else if(d.type==='sticker'){
      const s=document.createElement('span'); s.className='s-emoji'; s.textContent=d.emoji; if(d.size) s.style.fontSize=d.size+'px'; el.appendChild(s);
      if(d.rot) el.style.transform='rotate('+d.rot+'deg)';
    } else if(d.type==='imgsticker'){
      const img=document.createElement('img'); img.src=d.src; img.draggable=false; el.appendChild(img); el.style.transform='rotate('+(d.rot||0)+'deg)';
    } else if(d.type==='washi'){
      const t=document.createElement('div'); t.className='tape'; t.style.background=d.color||'#b9a7e3'; if(d.w) t.style.width=d.w+'px';
      el.style.transform='rotate('+(d.rot||-3)+'deg)'; el.appendChild(t);
    }
    return el;
  }

  // render one page read-only. opts = {title, date} to draw a header (first page).
  function renderPageRO(mount, page, opts){
    const scaler=document.createElement('div'); scaler.className='page-scaler';
    const pg=document.createElement('div'); pg.className='page '+(page.paper||'grid');
    if(opts){ const head=document.createElement('div'); head.className='page-head';
      head.innerHTML='<div class="date-stamp"><span class="date-pin"></span><span class="d-text">'+escapeHtml(formatDate(opts.date))+'</span></div>'+
                     '<div class="page-title">'+escapeHtml(opts.title||'')+'</div>';
      pg.appendChild(head); }
    (page.elements||[]).forEach(d=> pg.appendChild(buildElementRO(d)));
    scaler.appendChild(pg); mount.appendChild(scaler);
    const fit=()=>{ const avail=Math.min(mount.clientWidth, 800)-12; const sc=Math.min(1, avail/PAGE_W);
      scaler.style.transform='scale('+sc+')'; scaler.style.width=PAGE_W+'px'; scaler.style.height=(pg.offsetHeight*sc)+'px'; };
    requestAnimationFrame(fit); window.addEventListener('resize', fit);
    return pg;
  }

  function b64encode(str){ const bytes=new TextEncoder().encode(str); let bin=''; const ch=0x8000;
    for(let i=0;i<bytes.length;i+=ch){ bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+ch)); } return btoa(bin); }
  function b64decode(b64){ const bin=atob((b64||'').replace(/\n/g,'')); const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }

  return { CONFIG, PAGE_W, FONTS, uid, today, escapeHtml, slugify, formatDate, compress, applyTextStyle, buildElementRO, renderPageRO, b64encode, b64decode };
})();
