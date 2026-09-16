(function (global) {
  'use strict';

  var VERSION_PATTERN = /^\d+\.\d{1,2}\.\d{4}$/;
  var SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;
  var RELEASES_PATH = '/hetoandrade/hetoandrade.github.io/releases/download/';
  var applications = [
    { name: 'NoteZap', manifest: 'version_notezap.json', tagPrefix: 'notezap-v', asset: function (version) { return 'NoteZap_Setup_v' + version + '.exe'; } },
    { name: 'PrintCerto', manifest: 'version_printcerto.json', tagPrefix: 'printcerto-v', asset: function (version) { return 'PrintCerto_Setup_v' + version + '.exe'; } },
    { name: 'CopieECole', manifest: 'version_copieecole.json', tagPrefix: 'copieecole-v', asset: function (version) { return 'CopieECole_Setup_v' + version + '.exe'; } },
    { name: 'VozDigitada', manifest: 'version.json', tagPrefix: 'vozdigitada-v', asset: function (version) { return 'VozDigitada_Setup_v' + version + '.exe'; } },
    { name: 'DriverStatus', manifest: 'version_driverstatus.json', tagPrefix: 'driverstatus-v', asset: function (version) { return 'DriverStatus_Setup_v' + version + '.exe'; } },
    { name: 'TelaDesk', manifest: 'version_teladesk.json', tagPrefix: 'teladesk-v', asset: function (version) { return 'TelaDesk-Setup-' + version + '.exe'; } },
    { name: 'AjusteHD', manifest: 'version_ajustehd.json', tagPrefix: 'ajustehd-v', asset: function (version) { return 'AjusteHD_Setup_v' + version + '.exe'; } }
  ];

  function validarManifesto(application, data) {
    var version = String(data.version || '').trim();
    var hash = String(data.sha256Instalador || data.sha256 || '').trim();
    var installerUrl = String(data.urlInstalador || '').trim();
    var assetName = application.asset(version);
    var expectedPath = RELEASES_PATH + application.tagPrefix + version + '/' + assetName;
    var parsedUrl;

    try {
      parsedUrl = new URL(installerUrl);
    } catch (error) {
      throw new Error('URL de instalador inválida para ' + application.name);
    }

    if (!VERSION_PATTERN.test(version) ||
        !SHA256_PATTERN.test(hash) ||
        /^0{64}$/.test(hash) ||
        parsedUrl.protocol !== 'https:' ||
        parsedUrl.hostname !== 'github.com' ||
        parsedUrl.pathname !== expectedPath) {
      throw new Error('Manifesto inválido para ' + application.name);
    }

    return {
      name: application.name,
      fileName: assetName,
      url: parsedUrl.href
    };
  }

  function carregarInstaladores(fetchFunction, manifestUrl) {
    return Promise.all(applications.map(function (application) {
      return fetchFunction(manifestUrl(application.manifest), { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('Manifesto indisponível para ' + application.name);
          return response.json();
        })
        .then(function (data) {
          return validarManifesto(application, data);
        });
    }));
  }

  function iniciarDownloads(document, installers) {
    installers.forEach(function (installer) {
      var link = document.createElement('a');
      link.href = installer.url;
      link.download = installer.fileName;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  function inicializar() {
    var document = global.document;
    var button = document && document.getElementById('btn-download-all');
    var status = document && document.getElementById('download-all-status');
    var manifestUrl = global.HetoandradeSite && global.HetoandradeSite.manifestUrl;
    var installers = [];
    var downloadInProgress = false;

    if (!button || !status || typeof global.fetch !== 'function' || typeof manifestUrl !== 'function') return;

    function mostrarCarregamento() {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Verificando instaladores...';
      status.textContent = 'Preparando os sete downloads.';
    }

    function prepararDownloads(downloadAfterLoad) {
      mostrarCarregamento();
      return carregarInstaladores(global.fetch.bind(global), manifestUrl)
        .then(function (loadedInstallers) {
          installers = loadedInstallers;
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = '⬇️ Baixar todos os instaladores';
          status.textContent = '7 instaladores prontos · Windows 10/11';
          if (downloadAfterLoad) baixarTodos();
        })
        .catch(function () {
          installers = [];
          button.disabled = false;
          button.removeAttribute('aria-busy');
          button.textContent = 'Tentar novamente';
          status.textContent = 'Não foi possível preparar todos os instaladores agora.';
        });
    }

    function baixarTodos() {
      if (downloadInProgress) return;

      if (installers.length !== applications.length) {
        prepararDownloads(true);
        return;
      }

      downloadInProgress = true;
      button.disabled = true;
      button.textContent = 'Iniciando os sete downloads...';

      try {
        iniciarDownloads(document, installers);
        status.textContent = 'Downloads iniciados. Se o navegador perguntar, permita vários downloads.';
        global.setTimeout(function () {
          downloadInProgress = false;
          button.disabled = false;
          button.textContent = '⬇️ Baixar novamente';
        }, 2000);
      } catch (error) {
        downloadInProgress = false;
        button.disabled = false;
        button.textContent = 'Tentar novamente';
        status.textContent = 'Não foi possível iniciar todos os downloads. Tente novamente.';
      }
    }

    button.addEventListener('click', baixarTodos);
    prepararDownloads(false);
  }

  global.HetoandradeSite = global.HetoandradeSite || {};
  global.HetoandradeSite.downloadAll = {
    applications: applications,
    validarManifesto: validarManifesto,
    carregarInstaladores: carregarInstaladores,
    iniciarDownloads: iniciarDownloads,
    inicializar: inicializar
  };

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', inicializar, { once: true });
    } else {
      inicializar();
    }
  }
})(window);
