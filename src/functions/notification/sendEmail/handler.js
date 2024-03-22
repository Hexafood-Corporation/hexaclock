// Importar as dependências necessárias
const formData = require('form-data');
const Mailgun = require('mailgun.js');

// Configurar o cliente do Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

module.exports.sendEmail = async (event) => {
    console.log(process.env.MAILGUN_API_KEY);

    // O evento SNS contém um array 'Records'. Cada registro representa uma mensagem SNS.
    const snsMessage = event.Records[0].Sns.Message;

    // Parse da mensagem JSON para obter o objeto
    const messageData = JSON.parse(snsMessage);

    // Agora você pode acessar destinatário, assunto, conteúdo e o conteúdo HTML da mensagem
    const { destinatario, assunto, conteudo } = messageData;

    // Aqui você adicionaria o código para enviar o e-mail usando o destinatário, assunto e conteúdo capturados
    console.log(`Enviando e-mail para: ${destinatario}, Assunto: ${assunto}, Conteúdo: ${conteudo}`);

    try {
        const msg = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
            from: "Hexaclock <mailgun@sandbox-123.mailgun.org>",
            to: [destinatario],
            subject: assunto,
            text: conteudo,
            html: `<h1>${conteudo}</h1>`
        });
        console.log(msg);
    } catch (err) {
        console.error("Erro ao enviar e-mail:", err);
    }
};