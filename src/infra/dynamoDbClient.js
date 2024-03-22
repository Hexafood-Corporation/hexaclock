const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand
  } = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

module.exports = { dynamoDbClient, GetCommand, PutCommand, QueryCommand };
