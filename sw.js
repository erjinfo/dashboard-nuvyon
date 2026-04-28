const CACHE_NAME = 'nuvyon-cache-v2'; // Mudei para v2 para forçar atualização
const assets = [
  './',              // Raiz do site
  './index.html',
  './bi-comercial.html',
  './analisefrota.html',
  './techfeedback.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalação: o ponto chave é usar caminhos relativos ./
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o SW a se tornar ativo imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usamos um map para capturar erros se algum arquivo falhar
      return Promise.all(
        assets.map(url => {
          return cache.add(url).catch(err => console.warn('Falha ao cachear:', url));
        })
      );
    })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch: Estratégia de rede primeiro, cai para o cache se falhar (melhor para dashboards)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});