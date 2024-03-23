const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" }); 

// TODO 
const queueUrl = 'https://sqs.us-east-1.amazonaws.com/637423636452/reports-monthly-dev'; 

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
   
    const { employeeId, month } = JSON.parse(event.body);

    if (typeof employeeId !== "string") {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '"employeeId" must be a string' })
        };
    } else if (typeof month !== "string") {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '"date" must be a string' })
        };
    }

    const monthFormated = month.toString().padStart(2, '0');
    const messageBody = { employeeId, monthFormated }; 

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