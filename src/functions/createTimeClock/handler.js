const { dynamoDbClient, PutCommand, GetCommand } = require('../../infra/dynamoDbClient'); // Ajuste o caminho conforme a estrutura do seu projeto

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});

module.exports.createTimeClock = async (event, context, cb) => {
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        cb(null, send(400, { error: 'Invalid JSON' }));
    return;
}

    const { employeeId, name } = body;
    if (typeof employeeId !== "string") return res.status(400).json({ error: '"employeeId" must be a string' });

    const now = new Date();
    const date = now.toISOString().replace('T', ' ').slice(0, -5);

    const timeClockId = `TIMECLOCK#${date}`;
    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        Item: {
            employeeId: `EMPLOYEE#${employeeId}`,
            PK: `EMPLOYEE#${employeeId}`,
            SK: timeClockId,
            date: date,
            name: name,
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
