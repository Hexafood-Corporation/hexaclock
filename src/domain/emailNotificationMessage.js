class EmailNotificationMessage{
    constructor(destinatario, assunto, conteudo, html){
        this.destinatario = destinatario;
        this.assunto = assunto,
        this.conteudo = conteudo,
        this.html = html
    }
}

module.exports = { EmailNotificationMessage };
