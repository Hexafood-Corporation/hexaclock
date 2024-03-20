const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");


const app = express();

const EMPLOYEES_TABLE = process.env.EMPLOYEES_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/employees/:employeeId", async function (req, res) {
  const params = {
    TableName: EMPLOYEES_TABLE,
    Key: {
      employeeId: req.params.employeeId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { employeeId, name } = Item;
      res.json({ employeeId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find employee with provided "employeeId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive employee" });
  }
});

app.post("/employees", async function (req, res) {
  const { employeeId, name } = req.body;
  if (typeof employeeId !== "string") {
    return res.status(400).json({ error: '"employeeId" must be a string' });
  } else if (typeof name !== "string") {
    return res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: EMPLOYEES_TABLE,
    Item: {
      employeeId: employeeId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    return res.json({ employeeId, name });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not create employee" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
