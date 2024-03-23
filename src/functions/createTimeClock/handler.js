const { dynamoDbClient, PutCommand, GetCommand } = require('../../infra/dynamoDbClient'); // Ajuste o caminho conforme a estrutura do seu projeto
const jwt = require('jsonwebtoken'); 
const { v4: uuidv4 } = require('uuid');


const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});

module.exports.createTimeClock = async (event, context, cb) => {
    console.log("event no inicio:", JSON.stringify(event, null, 2));
    const token = event.headers.Authorization || event.headers.authorization; 
    console.log("token:", token);

    if (!token) {
        return send(401, { error: "No token provided" });
    }

    let employeeId = null;
    try {
        const decodedToken = jwt.decode(token.split(" ")[1]); // Decodifica o token (considerando que está no formato 'Bearer token')
        employeeId = decodedToken.employeeId; 
    } catch (error) {
        console.log(error);
        return send(400, { error: "Invalid token" });
    }


    if (typeof employeeId !== "string") return res.status(400).json({ error: '"employeeId" must be a string' });

    const now = new Date();
    const date = now.toISOString().split('T')[0]; 
    const time = now.toISOString().split('T')[1].slice(0, -5); 
    
    const timeClockId = `TIMECLOCK#${uuidv4()}`;
    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        Item: {
            employeeId: `EMPLOYEE#${employeeId}`,
            PK: `EMPLOYEE#${employeeId}`,
            SK: timeClockId,
            date: date,
            time: time,
        },
    };

    
    try {
        await dynamoDbClient.send(new PutCommand(params));
        
        const getParams = {
            TableName: params.TableName,
            Key: {
                PK: params.Item.PK,
                SK: params.Item.SK
            }
        };

        const result = await dynamoDbClient.send(new GetCommand(getParams));

        // Obter os dados adicionais do usuário
        const userParams = {
            TableName: params.TableName,
            Key: {
                PK: params.Item.PK,
                SK: `EMPLOYEE#${employeeId}`
            }
        };

        const userResult = await dynamoDbClient.send(new GetCommand(userParams));

        // Adicionar os dados do usuário ao resultado
        result.Item = { ...result.Item, ...userResult.Item };

        cb(null, send(200, { data: result.Item }));

    } catch (error) {
        console.log(error);
        cb(null,send(500, { error: "Could not create timeClock" }));
    }

};
