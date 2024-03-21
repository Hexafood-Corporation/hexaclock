const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
import { NextFunction, Request, Response } from "express";

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const EMPLOYEES_TABLE = process.env.EMPLOYEES_TABLE;
const TIME_CLOCK_TABLE = process.env.TIME_CLOCK_TABLE;
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/employees/:employeeId", async function (req: Request, res: Response) {
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

app.post("/employees", async function (req: Request, res: Response) {
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

app.post("/timeClock", async function (req: Request, res: Response) {
  const { employeeId } = req.body;
  if (typeof employeeId !== "string")
    return res.status(400).json({ error: '"employeeId" must be a string' });

  const date = new Date().toISOString().split("T")[0];
  const params = {
    TableName: TIME_CLOCK_TABLE,
    Item: {
      employeeId: employeeId,
      date: date,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    return res.json({ employeeId, date });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Could not create timeClock" });
  }
});

app.get("/timeclock/:employeeId", async function (req: Request, res: Response) {
  // on last 30 days
  const params = {
    TableName: TIME_CLOCK_TABLE,
    Key: {
      employeeId: req.params.employeeId,
    },
    KeyConditionExpression: "employeeId = :employeeId",
    ExpressionAttributeValues: {
      ":employeeId": req.params.employeeId,
    },
  };

  try {
    const { Items } = await dynamoDbClient.send(new GetCommand(params));
    if (Items) {
      res.json(Items);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find timeClock with provided "employeeId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive timeClock" });
  }
});

app.use((req: Request, res: Response, next: NextFunction) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
