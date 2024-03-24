const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" }); 
const jwt = require('jsonwebtoken'); 

const queueUrl = process.env.SQS_REPORT_URL; 

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


async function sendToSQS(queueUrl, mensagem) {
    const params = {
      MessageBody: JSON.stringify(mensagem),
      QueueUrl: queueUrl,
    };

    try {
      const data = await sqsClient.send(new SendMessageCommand(params));
      console.log('Sucesso, ID da mensagem:', data.MessageId);
      return data;
    } catch (erro) {
      console.error('Erro ao enviar mensagem:', erro);
      throw erro;
    }
  }

module.exports.createMonthlyTimeReportRequest = async (event, context, cb) => {
    
    const token = event.headers.Authorization || event.headers.authorization; 
    if (!token) {
        return send(401, { error: "No token provided" });
    }

    let employeeId;
    let email;    
    try {
        const decodedToken = jwt.decode(token.split(" ")[1]); // Decodifica o token (considerando que está no formato 'Bearer token')

        employeeId = decodedToken.employeeId; 
        email = decodedToken.email;
        console.log("employeeId:", employeeId);
    } catch (error) {
        console.log(error);
        return send(400, { error: "Invalid token" });
    }

    const { date } = event.pathParameters;

    const [year, month] = date.split('-').map(Number); // Divide a string por "-" e converte para números

    const messageBody = { employeeId, email, year, month }; 

    try {
        const data = await sendToSQS(queueUrl, messageBody);
        console.log(data);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Request submitted successfully', messageId: data.MessageId })
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to submit request' })
        };
    }
};