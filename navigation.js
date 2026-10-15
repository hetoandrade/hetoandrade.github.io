(function (global) {
  'use strict';

  var routes = {
    "home": { "path": "/", "title": "Hetoandrade Apps — Site oficial de aplicativos gratuitos", "description": "Site oficial da Hetoandrade Apps. Conheça aplicativos gratuitos como NoteZap, PrintCerto, CopieECole, VozDigitada, DriverStatus, TelaDesk, AjusteHD e OfficeCerto." },
    "notezap": { "path": "/notezap/", "nav": "nav-notezap", "title": "NoteZap — Anotações no Windows e na Web | Hetoandrade Apps", "description": "Organize suas anotações por assunto com o NoteZap. Acesse pela Web ou baixe para Windows, com textos, códigos, imagens e arquivos na mesma conta." },
    "printcerto": { "path": "/printcerto/", "nav": "nav-printcerto", "title": "PrintCerto — Captura e edição de imagens | Hetoandrade Apps", "description": "Aplicativo gratuito para capturar áreas da tela, fazer anotações e copiar ou salvar imagens em PNG." },
    "copieecole": { "path": "/copieecole/", "nav": "nav-copieecole", "title": "CopieECole — Compartilhe entre dispositivos | Hetoandrade Apps", "description": "Compartilhamento temporário de textos, links, fotos e arquivos entre dispositivos, sem cadastro." },
    "vozdigitada": { "path": "/vozdigitada/", "nav": "nav-voz", "title": "VozDigitada — Digite com sua voz | Hetoandrade Apps", "description": "Aplicativo gratuito que captura sua voz e digita automaticamente em qualquer programa." },
    "driverstatus": { "path": "/driverstatus/", "nav": "nav-driver", "title": "DriverStatus — Diagnóstico de drivers | Hetoandrade Apps", "description": "Diagnostica drivers do PC, identifica problemas, integra Windows Update, backup de drivers e assistência por IA." },
    "teladesk": { "path": "/teladesk/", "nav": "nav-teladesk", "title": "TelaDesk — Acesso remoto | Hetoandrade Apps", "description": "Acesso remoto gratuito com conexão por código, convites temporários, permissões explícitas e transferência de arquivos." },
    "officecerto": { "path": "/officecerto/", "nav": "nav-officecerto", "title": "OfficeCerto — Documentos, planilhas e PDFs | Hetoandrade Apps", "description": "Trabalhe com documentos, planilhas e PDFs no computador com o OfficeCerto." },
    "ajustehd": { "path": "/ajustehd/", "nav": "nav-ajustehd", "title": "AjusteHD — Gerenciador de partições | Hetoandrade Apps", "description": "Gerenciador gratuito para visualizar, redimensionar, criar e remover partições com revisão antes de aplicar." },
    "ajuda": { "path": "/ajuda/", "nav": "nav-ajuda", "title": "Ajuda e sugestões | Hetoandrade Apps", "description": "Conte o que aconteceu ou envie uma sugestão para a Hetoandrade Apps." },
    "terceiros": { "path": "/terceiros/", "nav": "nav-terceiros", "title": "Ferramentas de terceiros | Hetoandrade Apps", "description": "Conheça as ferramentas de terceiros apresentadas no site Hetoandrade Apps." }
  };

  var main = document.querySelector('.main');
  var sectionHashes = ['#historia', '#apoiar', '#contato'];

  function pageAt(url) {
    var pathname = url.pathname.replace(/index\.html$/, '');
    if (pathname === '/notezap.html') return 'notezap';
    return Object.keys(routes).find(function (key) { return routes[key].path === pathname; });
  }

  function legacyPage(url) {
    var key = url.hash.slice(1).toLowerCase();
    return (url.pathname === '/' || url.pathname === '/index.html') && routes[key] ? key : null;
  }

  function setMeta(selector, value) {
    var element = document.querySelector(selector);
    if (element) element.setAttribute(element.tagName === 'LINK' ? 'href' : 'content', value);
  }

  function render(page, hash, scroll, behavior) {
    var route = routes[page];
    if (!route) return;
    document.querySelectorAll('.page').forEach(function (element) {
      element.classList.toggle('active', element.id === 'page-' + page);
    });
    document.querySelectorAll('.nav-item').forEach(function (element) {
      element.classList.toggle('active', element.id === route.nav);
    });
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.title = route.title;
    setMeta('link[rel="canonical"]', 'https://hetoandrade.com.br' + route.path);
    setMeta('meta[property="og:url"]', 'https://hetoandrade.com.br' + route.path);
    ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach(function (selector) { setMeta(selector, route.description); });
    ['meta[property="og:title"]', 'meta[name="twitter:title"]'].forEach(function (selector) { setMeta(selector, route.title); });
    var target = hash && document.getElementById(hash.slice(1));
    if (scroll !== undefined && scroll !== null) main.scrollTo({top: scroll, behavior: 'instant'});
    else if (target && document.getElementById('page-' + page).contains(target)) target.scrollIntoView({behavior: behavior || 'instant'});
    else main.scrollTo({top: 0, behavior: behavior || 'instant'});
  }

  function rememberScroll() {
    var state = Object.assign({}, history.state, {siteScroll: main.scrollTop});
    history.replaceState(state, '', global.location.href);
  }

  function navigate(page, hash, search) {
    if (!routes[page]) return;
    rememberScroll();
    var target = routes[page].path + (search === undefined ? global.location.search : search) + (hash || '');
    if (target !== global.location.pathname + global.location.search + global.location.hash) {
      history.pushState({siteScroll: null}, '', target);
    }
    render(page, hash, null, 'smooth');
  }

  global.showPage = function (page) { navigate(page); };

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    if (anchor.getAttribute('aria-disabled') === 'true') return;
    var url = new URL(anchor.href, global.location.href);
    if (url.origin !== global.location.origin) return;
    var page = pageAt(url);
    if (!page) return;
    var hashOnly = anchor.getAttribute('href').charAt(0) === '#';
    if (hashOnly && !sectionHashes.includes(url.hash)) return;
    event.preventDefault();
    navigate(page, url.hash, url.search || global.location.search);
  });

  function restore() {
    var url = new URL(global.location.href);
    var page = legacyPage(url) || pageAt(url);
    if (page) render(page, url.hash, history.state && history.state.siteScroll);
  }

  global.addEventListener('popstate', restore);
  global.addEventListener('hashchange', restore);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  restore();
})(window);
