const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient();

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