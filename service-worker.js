/* ================================================================
   SERVICE WORKER — Calculadora de Aprovação
   Estratégia: cache-first para os ficheiros essenciais, permitindo
   que a aplicação funcione offline após a primeira visita.
   ================================================================ */

// Aumentar este número sempre que os ficheiros essenciais mudarem,
// para forçar a atualização do cache dos utilizadores.
const CACHE_NAME = "calculadora-aprovacao-v1";

// Ficheiros essenciais para a aplicação funcionar offline
const ESSENTIAL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

/* ----------------------------------------------------------------
   INSTALL — guarda os ficheiros essenciais em cache
   ---------------------------------------------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_FILES))
      .then(() => self.skipWaiting())
  );
});

/* ----------------------------------------------------------------
   ACTIVATE — remove caches antigos de versões anteriores
   ---------------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomesCache) =>
        Promise.all(
          nomesCache
            .filter((nome) => nome !== CACHE_NAME)
            .map((nome) => caches.delete(nome))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------------------
   FETCH — cache-first, com atualização em segundo plano e
   fallback de rede quando o ficheiro ainda não está em cache
   ---------------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  // Ignora pedidos que não sejam GET (ex: chamadas a APIs externas)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      const pedidoRede = fetch(event.request)
        .then((respostaRede) => {
          // Atualiza o cache com a versão mais recente, se válida
          if (respostaRede && respostaRede.status === 200) {
            const copia = respostaRede.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respostaRede;
        })
        .catch(() => respostaCache); // sem rede: usa o que estiver em cache

      // Serve imediatamente do cache se existir, atualiza em segundo plano
      return respostaCache || pedidoRede;
    })
  );
});
