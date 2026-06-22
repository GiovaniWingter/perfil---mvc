var express = require("express");
var router = express.Router();

const {
  verificarUsuAutenticado,
  limparSessao,
  gravarUsuAutenticado,
  verificarUsuAutorizado,
} = require("../middlewares/autenticadorMiddleware");

const {usuarioController} = require("../controllers/usuarioController");

const uploadFile = require("../util/uploader")("./app/public/imagem/perfil/");
// const uploadFile = require("../util/uploader")();

router.get(
  "/perfil",
  inicializarSessao,
  verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
  usuarioController.mostrarPerfil
);

router.post(
  "/perfil",
  uploadFile("imagem-perfil_usu"),
  usuarioController.regrasValidacaoFormPerfil,
  verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
  usuarioController.gravarPerfil
);


router.get("/", inicializarSessao, function (req, res) {
  res.render("pages/index", { autenticado: req.session.autenticado });
});

router.get("/sair", limparSessao, function (req, res) {
  res.redirect("/");
});

router.get("/login", function (req, res) {
  res.render("pages/login", { listaErros: null });
});

router.post(
  "/login",
  usuarioController.regrasValidacaoFormLogin,
  gravarUsuAutenticado,
  usuarioController.logar
);


router.get("/cadastro", usuarioController.formCadastro);

router.post("/cadastro",
  usuarioController.regrasValidacaoFormCad,
  usuarioController.cadastrar
);

router.get(
  "/adm",
  verificarUsuAutorizado([2, 3], "pages/restrito"),
  function (req, res) {
    res.render("pages/adm", { autenticado: req.session.autenticado });
  });




module.exports = router;
