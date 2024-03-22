const { dynamoDbClient, PutCommand } = require('../../infra/dynamoDbClient'); // Ajuste o caminho conforme a estrutura do seu projeto

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});

module.exports.createEmployee = async (event, context, cb) => {
    const { employeeId, name, username, registry } = JSON.parse(event.body);
    if (typeof employeeId !== "string") {
        return res.status(400).json({ error: '"employeeId" must be a string' });
    } else if (typeof name !== "string") {
        return res.status(400).json({ error: '"name" must be a string' });
    }

    const params = {
        TableName: process.env.TABLE,
        Item: {
            PK: `EMPLOYEE#${employeeId}`,
            SK: `EMPLOYEE`,
            name: name,
            username: username,
            registry: registry
        },
    };

    try {
        await dynamoDbClient.send(new PutCommand(params));
        cb(null, send(200, { employeeId, name, username, registry }));
    } catch (error) {
        console.log(error);
        cb(null,send(500, { error: "Could not create timeClock" }));
    }

};