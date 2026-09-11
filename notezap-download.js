(function () {
  'use strict';
  var buttons = Array.from(document.querySelectorAll('[data-notezap-download]'));
  var status = document.getElementById('notezap-status');
  if (!buttons.length || !status) return;

  function setLabel(id, text) {
    var element = document.getElementById(id);
    if (element) element.textContent = text;
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function (event) {
      if (button.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });
  });

  fetch('version_notezap.json', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('Manifesto indisponível');
      return response.json();
    })
    .then(function (data) {
      var version = String(data.version || '').trim();
      var hash = String(data.sha256Instalador || '').toLowerCase();
      var tag = 'notezap-v' + version;
      var name = 'NoteZap_Setup_v' + version + '.exe';
      var url = 'https://github.com/hetoandrade/hetoandrade.github.io/releases/download/' + tag + '/' + name;
      if (!/^\d+\.\d{1,2}\.\d{4}$/.test(version) || !/^[a-f0-9]{64}$/.test(hash) || data.urlInstalador !== url) {
        throw new Error('Manifesto inválido');
      }
      return fetch('https://api.github.com/repos/hetoandrade/hetoandrade.github.io/releases/tags/' + tag, { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('Release indisponível');
          return response.json();
        })
        .then(function (release) {
          var asset = (release.assets || []).find(function (item) {
            return item.name === name && item.browser_download_url === url && item.size > 0 &&
              String(item.digest || '').toLowerCase() === 'sha256:' + hash;
          });
          if (release.draft || release.prerelease || !asset) throw new Error('Instalador não confirmado');
          status.textContent = 'Disponível · versão ' + version;
          setLabel('notezap-versao-badge', 'Disponível · v' + version);
          setLabel('notezap-versao-download', 'Disponível · v' + version);
          setLabel('notezap-versao-desktop', '💻 Windows 10/11 · v' + version);
          setLabel('notezap-versao-tag', version);
          setLabel('card-notezap-tag', 'Disponível');
          setLabel('notezap-disponibilidade', 'Disponível no navegador e Windows. Entre com sua conta Google para acessar suas anotações.');
          buttons.forEach(function (button) {
            button.href = url;
            button.textContent = '⬇️ Baixar para Windows';
            button.classList.remove('is-disabled');
            button.removeAttribute('aria-disabled');
            button.removeAttribute('tabindex');
          });
        });
    })
    .catch(function () {
      status.textContent = 'Não foi possível conferir o download agora. Tente novamente em alguns instantes ou use a versão Web.';
      setLabel('notezap-versao-badge', 'Versão web disponível');
      setLabel('notezap-versao-download', 'Download não confirmado');
      setLabel('notezap-versao-desktop', '💻 Windows 10/11 · download não confirmado');
      setLabel('notezap-versao-tag', 'Não confirmada');
      setLabel('card-notezap-tag', 'Web disponível');
      setLabel('notezap-disponibilidade', 'Versão web disponível. Entre com sua conta Google. O download para Windows não pôde ser confirmado agora.');
      buttons.forEach(function (button) { button.textContent = 'Download temporariamente indisponível'; });
    });
})();
