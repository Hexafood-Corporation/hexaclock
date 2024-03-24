const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: process.env.REGION }); // Substitua "REGION" pela região do seu tópico SNS

const sqsClient = new sendSNS();

module.exports = {
    dynamoDbClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    sqsClient,
    SendMessageCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand
};