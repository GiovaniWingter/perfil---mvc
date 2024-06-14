const multer = require('multer');
const path = require('path');

module.exports = (caminho = null) => {
    if (caminho == null) {
        // Versão com armazenamento em SGBD
        const storage = multer.memoryStorage();
        return multer({ storage: storage });
    } else {
        // Versão com armazenamento em diretório
        // Definindo o diretório de armazenamento das imagens
        var storagePasta = multer.diskStorage({
            destination: (req, file, callBack) => {
                callBack(null, caminho) // diretório de destino  
            },
            filename: (req, file, callBack) => {
                callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
                //renomeando o arquivo para evitar duplicidade de nomes
            }
        })
        return multer({ storage: storagePasta });
    }
}
