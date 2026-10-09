(function (global) {
  'use strict';

  var products = {
    notezap: 'notezap',
    printcerto: 'printcerto',
    copieecole: 'copieecole',
    voz: 'voz',
    driver: 'driver',
    teladesk: 'teladesk',
    officecerto: 'officecerto',
    ajustehd: 'ajustehd'
  };
  var publications = {};
  var calendar = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  var publicationFormat = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  function calendarDay(date) {
    var parts = {};
    calendar.formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  }

  function publicationDate(value) {
    if (typeof value !== 'string') return null;
    var text = value.trim();
    var match = /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(text);
    if (!match) return null;
    var day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (day.getUTCFullYear() !== Number(match[1]) || day.getUTCMonth() + 1 !== Number(match[2]) || day.getUTCDate() !== Number(match[3])) return null;
    if (text.length === 10) text += 'T00:00:00';
    if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(text)) text += '-03:00';
    var date = new Date(text);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function updateProduct(key, now) {
    var date = publications[key];
    var days = date ? (calendarDay(now) - calendarDay(date)) / 86400000 : -1;
    var recency = date && date <= now && days === 0 ? 'today' : date && date <= now && days === 1 ? 'yesterday' : date && date <= now && days > 1 ? 'older' : '';
    var label = recency === 'today' ? 'Atualizado hoje' : recency === 'yesterday' ? 'Atualizado ontem' : recency === 'older' ? publicationFormat.format(date) : '';
    var tag = document.getElementById('card-' + products[key] + '-tag');
    var card = tag && tag.closest('.app-card');
    var pageId = key === 'voz' ? 'vozdigitada' : key === 'driver' ? 'driverstatus' : products[key];
    var hero = document.querySelector('#page-' + pageId + ' .hero');
    var row = hero && hero.querySelector('.hero-publication-row');
    if (!row && hero && recency) {
      var versionBadge = hero.querySelector('.hero-badge');
      if (versionBadge) {
        row = document.createElement('div');
        row.className = 'hero-publication-row';
        versionBadge.before(row);
        row.appendChild(versionBadge);
      }
    }

    [card, row].forEach(function (container) {
      if (!container) return;
      container.setAttribute('data-publication-product', key);
      var indicator = container.querySelector('.publication-update');
      if (!indicator && !recency) return;
      if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = container === row ? 'hero-badge publication-update' : 'publication-update';
        container.appendChild(indicator);
      }
      indicator.textContent = label;
      indicator.hidden = !recency;
      if (recency) container.setAttribute('data-update-recency', recency);
      else container.removeAttribute('data-update-recency');
    });
  }

  function refresh() {
    var now = new Date();
    Object.keys(publications).forEach(function (key) { updateProduct(key, now); });
  }

  Object.keys(products).forEach(function (key) {
    var nav = document.getElementById('nav-' + products[key]);
    if (!nav) return;
    Array.from(nav.childNodes).forEach(function (node) {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      var name = document.createElement('span');
      name.className = 'nav-app-name';
      name.textContent = node.textContent.trim();
      node.replaceWith(name);
    });
  });

  global.HetoandradeSite = global.HetoandradeSite || {};
  global.HetoandradeSite.setPublicationDate = function (key, value) {
    if (!Object.prototype.hasOwnProperty.call(products, key)) return;
    publications[key] = publicationDate(value);
    updateProduct(key, new Date());
  };
  global.setInterval(refresh, 30000);
  global.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) refresh();
  });
})(window);
