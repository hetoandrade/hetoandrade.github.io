(function (global) {
  'use strict';

  var calendario = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function diaDoCalendario(data) {
    var partes = {};
    calendario.formatToParts(data).forEach(function (parte) { partes[parte.type] = parte.value; });
    return Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day));
  }

  function adicionarMeses(dia, meses) {
    var origem = new Date(dia);
    var destino = new Date(Date.UTC(origem.getUTCFullYear(), origem.getUTCMonth() + meses, 1));
    var ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
    return Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth(), Math.min(origem.getUTCDate(), ultimoDia));
  }

  class HFormatador {
    static tempoDecorrido(data, referencia = new Date()) {
      if (!(data instanceof Date) || !(referencia instanceof Date) ||
          !Number.isFinite(data.getTime()) || !Number.isFinite(referencia.getTime()) || data > referencia) return '';

      var inicio = diaDoCalendario(data);
      var fim = diaDoCalendario(referencia);
      var dias = (fim - inicio) / 86400000;
      if (dias === 0) return 'hoje';
      if (dias === 1) return 'ontem';

      var origem = new Date(inicio);
      var destino = new Date(fim);
      var meses = (destino.getUTCFullYear() - origem.getUTCFullYear()) * 12 + destino.getUTCMonth() - origem.getUTCMonth();
      var marco = adicionarMeses(inicio, meses);
      if (marco > fim) {
        meses -= 1;
        marco = adicionarMeses(inicio, meses);
      }

      if (meses > 0) {
        var partes = [meses + (meses === 1 ? ' mês' : ' meses')];
        var semanasRestantes = Math.floor((fim - marco) / 86400000 / 7);
        if (semanasRestantes > 0) partes.push(semanasRestantes + (semanasRestantes === 1 ? ' semana' : ' semanas'));
        return 'há ' + partes.join(' ');
      }

      if (dias < 14) return 'há ' + dias + ' dias';
      var semanas = Math.floor(dias / 7);
      return 'há ' + semanas + ' semanas';
    }
  }

  global.HFormatador = HFormatador;
})(window);
