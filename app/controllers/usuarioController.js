const { usuarioModel } = require("../models/usuarioModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(12);
const { removeImg } = require("../util/removeImg");
const https = require('https');

const usuarioController = {

    regrasValidacaoFormLogin: [
        body("nome_usu")
            .isLength({ min: 8, max: 45 })
            .withMessage("O nome de usuário/e-mail deve ter de 8 a 45 caracteres"),
        body("senha_usu")
            .isStrongPassword()
            .withMessage("A senha deve ter no mínimo 8 caracteres (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)")
    ],

    regrasValidacaoFormCad: [
        body("nome_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome deve ter de 3 a 45 caracteres!"),
        body("nomeusu_usu")
            .isLength({ min: 8, max: 45 }).withMessage("Nome de usuário deve ter de 8 a 45 caracteres!")
            .custom(async value => {
                if (value) {
                    const nomeUsu = await usuarioModel.findCampoCustom({ 'user_usuario': value });
                    if (nomeUsu > 0) {
                        throw new Error('Nome de usuário em uso!');
                    }
                }
            }),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!")
            .custom(async value => {
                if (value) {
                    const nomeUsu = await usuarioModel.findCampoCustom({ 'email_usuario': value });
                    if (nomeUsu > 0) {
                        throw new Error('E-mail em uso!');
                    }
                }
            }),
        body("senha_usu")
            .isStrongPassword()
            .withMessage("A senha deve ter no mínimo 8 caracteres (mínimo 1 letra maiúscula, 1 caractere especial e 1 número)")
    ],

    regrasValidacaoFormPerfil: [
        body("nome_usu")
            .isLength({ min: 3, max: 45 }).withMessage("Nome deve ter de 3 a 45 caracteres!"),
        body("nomeusu_usu")
            .isLength({ min: 8, max: 45 }).withMessage("Nome de usuário deve ter de 8 a 45 caracteres!"),
        body("email_usu")
            .isEmail().withMessage("Digite um e-mail válido!"),
        body("fone_usu")
            .isLength({ min: 12, max: 15 }).withMessage("Digite um telefone válido!"),
        body("cep")
            .isPostalCode('BR').withMessage("Digite um CEP válido!"),
        body("numero")
            .isNumeric().withMessage("Digite um número para o endereço!"),
        verificarUsuAutorizado([1, 2, 3], "pages/restrito"),
    ],

    logar: (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.render("pages/login", { listaErros: erros })
        }
        if (req.session.autenticado && req.session.autenticado.usuLogado != null) {
            req.session.flash = {
                type: 'success',
                message: `Usuário ${req.session.autenticado.usuLogado} autenticado com sucesso!`
            };
            res.redirect("/");
        } else {
            req.session.flash = {
                type: 'error',
                message: `Nome de usuário/e-mail ou senha inválidos!`
            };
            res.redirect("/login");

        }
    },

    cadastrar: async (req, res) => {
        const erros = validationResult(req);
        console.log(erros);
        var dadosForm = {
            user_usuario: req.body.nomeusu_usu,
            senha_usuario: bcrypt.hashSync(req.body.senha_usu, salt),
            nome_usuario: req.body.nome_usu,
            email_usuario: req.body.email_usu,
        };
        if (!erros.isEmpty()) {
            console.log(erros);
            return res.render("pages/cadastro", { listaErros: erros, valores: req.body })
        }
        try {
            let create = await usuarioModel.create(dadosForm);
            console.log(create);
            if (create == null) {
                req.session.flash = {
                    type: 'error',
                    message: `Erro ao cadastrar usuário: ${dadosForm.user_usuario}`
                };
                req.session.valoresForm = req.body;
                return res.redirect("/cadastro");
            } else {
                req.session.flash = {
                    type: 'success',
                    message: `Usuário: ${dadosForm.user_usuario}, cadastrado com sucesso!`
                };
                res.redirect("/");
            }
        } catch (e) {
            console.log(e);
            res.render("pages/cadastro", { listaErros: erros, valores: req.body })
        }
    },

    formCadastro: (req, res) => {
        const valoresForm = req.session.valoresForm || {}
        const valores = {
            nome_usu: valoresForm.nome_usu || "",
            nomeusu_usu: valoresForm.nomeusu_usu || "",
            email_usu: valoresForm.email_usu || "",
            senha_usu: valoresForm.senha_usu || ""
        }
        res.render("pages/cadastro", { listaErros: null, valores: valores });

    },


    mostrarPerfil: async (req, res) => {
        try {
            let results = await usuarioModel.findId(req.session.autenticado.id);
            if (results[0].cep_usuario != null) {
                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false,
                });
                const response = await fetch(`https://viacep.com.br/ws/${results[0].cep_usuario}/json/`,
                    { method: 'GET',  body: null, agent: httpsAgent, });
                var viaCep = await response.json();
                var cep = results[0].cep_usuario.slice(0, 5) + "-" + results[0].cep_usuario.slice(5)
            } else {
                var viaCep = { logradouro: "", bairro: "", localidade: "", uf: "" }
                var cep = null;
            }
            console.log(cep);
            let campos = {
                nome_usu: results[0].nome_usuario, email_usu: results[0].email_usuario,
                cep: cep,
                numero: results[0].numero_usuario,
                complemento: results[0].complemento_usuario, logradouro: viaCep.logradouro,
                bairro: viaCep.bairro, localidade: viaCep.localidade, uf: viaCep.uf,
                img_perfil_pasta: results[0].img_perfil_pasta,
                img_perfil_banco: results[0].img_perfil_banco != null ? `data:image/jpeg;base64,${results[0].img_perfil_banco.toString('base64')}` : null,
                nomeusu_usu: results[0].user_usuario, fone_usu: results[0].fone_usuario, senha_usu: ""
            }

            res.render("pages/perfil", { listaErros: null, valores: campos })
        } catch (e) {
            console.log(e);
            res.render("pages/perfil", {
                listaErros: null, valores: {
                    img_perfil_banco: "", img_perfil_pasta: "", nome_usu: "", email_usu: "",
                    nomeusu_usu: "", fone_usu: "", senha_usu: "", cep: "", numero: "", complemento: "",
                    logradouro: "", bairro: "", localidade: "", uf: ""
                }
            })
        }
    },

    gravarPerfil: async (req, res) => {
        const erros = validationResult(req);
        const erroMulter = req.session.erroMulter;
        if (!erros.isEmpty() || erroMulter != null) {
            lista = !erros.isEmpty() ? erros : { formatter: null, errors: [] };
            if (erroMulter != null) {
                lista.errors.push(erroMulter);
            }
            return res.render("pages/perfil", { listaErros: lista, valores: req.body })
        }
        try {
            var dadosForm = {
                user_usuario: req.body.nomeusu_usu,
                nome_usuario: req.body.nome_usu,
                email_usuario: req.body.email_usu,
                fone_usuario: req.body.fone_usu,
                cep_usuario: req.body.cep ? req.body.cep.replace("-", "") : null,
                numero_usuario: req.body.numero,
                complemento_usuario: req.body.complemento,
                img_perfil_banco: req.session.autenticado.img_perfil_banco,
                img_perfil_pasta: req.session.autenticado.img_perfil_pasta,
            };
            if (req.body.senha_usu != "") {
                dadosForm.senha_usuario = bcrypt.hashSync(req.body.senha_usu, salt);
            }
            if (!req.file) {
                console.log("Falha no carregamento");
            } else {
                //Armazenando o caminho do arquivo salvo na pasta do projeto 
                caminhoArquivo = "imagem/perfil/" + req.file.filename;
                //Se houve alteração de imagem de perfil apaga a imagem anterior
                if (dadosForm.img_perfil_pasta != caminhoArquivo) {
                    removeImg(dadosForm.img_perfil_pasta);
                }
                dadosForm.img_perfil_pasta = caminhoArquivo;
                dadosForm.img_perfil_banco = null;

                // //Armazenando o buffer de dados binários do arquivo 
                // dadosForm.img_perfil_banco = req.file.buffer;                
                // //Apagando a imagem armazenada na pasta
                // if(dadosForm.img_perfil_pasta != null ){
                //     removeImg(dadosForm.img_perfil_pasta);
                // }
                // dadosForm.img_perfil_pasta = null; 
            }
            let resultUpdate = await usuarioModel.update(dadosForm, req.session.autenticado.id);
            if (!resultUpdate.isEmpty) {
                if (resultUpdate.changedRows == 1) {
                    var result = await usuarioModel.findId(req.session.autenticado.id);
                    var autenticado = {
                        usuLogado: result[0].nome_usuario,
                        id: result[0].id_usuario,
                        tipo:result[0].tipo_usuario,
                        img_perfil_banco: result[0].img_perfil_banco != null ? `data:image/jpeg;base64,${result[0].img_perfil_banco.toString('base64')}` : null,
                        img_perfil_pasta: result[0].img_perfil_pasta
                    };
                    req.session.autenticado = autenticado;
                    req.session.flash = {
                        type: 'success',
                        message: `Perfil do usuário: ${dadosForm.user_usuario}, atualizado com sucesso!`
                    };
                    res.redirect("/perfil");
                } else {
                    console.log("3");
                    res.render("pages/perfil", { listaErros: null, valores: dadosForm });
                }
            }
        } catch (e) {
            console.log(e)
                    res.render("pages/perfil", { listaErros: erros, valores: req.body })
        }
    }
}

module.exports = usuarioController