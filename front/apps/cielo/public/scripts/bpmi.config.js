var env = getQueryString("env");

function bpmpi_config() {
  return {
    onReady: function () {
      // Evento indicando quando a inicialização do script terminou.
      console.log("ready");
    },
    onSuccess: function (e) {
      // Cartão elegível para autenticação, e portador autenticou com sucesso.
      onSucessHandler(e);
      var cavv = e.Cavv;
      var xid = e.Xid;
      var eci = e.Eci;
      var version = e.Version;
      var referenceId = e.ReferenceId;
    },
    onFailure: function (e) {
      // Cartão elegível para autenticação, porém o portador finalizou com falha.
      var xid = e.Xid;
      var eci = e.Eci;
      var version = e.Version;
      var referenceId = e.ReferenceId;
    },
    onUnenrolled: function (e) {
      // Cartão não elegível para autenticação (não autenticável).
      var xid = e.Xid;
      var eci = e.Eci;
      var version = e.Version;
      var referenceId = e.ReferenceId;
    },
    onDisabled: function () {
      // Loja não requer autenticação do portador (classe "bpmpi_auth" false -> autenticação desabilitada).
    },
    onError: function (e) {
      // Erro no processo de autenticação.
      var xid = e.Xid;
      var eci = e.Eci;
      var returnCode = e.ReturnCode;
      var returnMessage = e.ReturnMessage;
      var referenceId = e.ReferenceId;
    },
    onUnsupportedBrand: function (e) {
      // Bandeira não suportada para autenticação.
      var returnCode = e.ReturnCode;
      var returnMessage = e.ReturnMessage;
    },
    Environment: env ? env : "SDB",
    Debug: true,
  };
}

function getQueryString(field) {
  var href = window.location.href;
  var reg = new RegExp("[?&]" + field + "=([^&#]*)", "i");
  var string = reg.exec(href);
  console.log("string", string);
  return string ? string[1] : null;
}
