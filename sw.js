/* Bitácora Gym 0.4.1 — arranque offline-first y recuperación de red. */
const CACHE='bitacora-gym-v043-kiro-calendar';
const CORE=[
  './','./index.html','./styles.css','./extras.css','./catalog.js','./app.js',
  './extras.js','./kiro/poses.webp','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png',
  ...Array.from({length:12},(_,i)=>'./stickers/'+String(i+1).padStart(2,'0')+'.svg')
];

// No reemplaza la versión anterior si falta algún recurso esencial.
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await Promise.all((await caches.keys())
      .filter(key=>key.startsWith('bitacora-gym-')&&key!==CACHE)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

const fetchWithTimeout=async(request,ms=6000)=>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),ms);
  try{return await fetch(request,{signal:controller.signal})}
  finally{clearTimeout(timeout)}
};

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(req.mode==='navigate'){
      const saved=await cache.match('./index.html');
      if(saved)return saved;
      try{
        const fresh=await fetchWithTimeout(req);
        if(fresh.ok&&fresh.type!=='opaque')event.waitUntil(cache.put('./index.html',fresh.clone()));
        return fresh;
      }catch{
        return new Response('Bitácora Gym: conexión no disponible. Abre la app una vez con Wi-Fi.',
          {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    }
    const saved=await cache.match(req,{ignoreSearch:true});
    if(saved)return saved;
    try{
      const fresh=await fetchWithTimeout(req);
      if(fresh.ok&&fresh.type!=='opaque')event.waitUntil(cache.put(req,fresh.clone()));
      return fresh;
    }catch{
      return new Response('Archivo no disponible en este momento',
        {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});