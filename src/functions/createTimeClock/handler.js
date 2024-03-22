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

    const { employeeId } = body;
    if (typeof employeeId !== "string") return res.status(400).json({ error: '"employeeId" must be a string' });


    const date = new Date().toISOString().split('T')[0];
    const timeClockId = `TIMECLOCK#${Date.now()}`;
    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        Item: {
            employeeId: `EMPLOYEE#${employeeId}`,
            PK: `EMPLOYEE#${employeeId}`,
            SK: timeClockId,
            date: date,
        },
    };

    try {
        await dynamoDbClient.send(new PutCommand(params));
        
        const getParams = {
            TableName: params.TableName,
            Key: params.Item
        };

        const result = await dynamoDbClient.send(new GetCommand(getParams));

        cb(null, send(200, { data: result.Item }));
    } catch (error) {
        console.log(error);
        cb(null,send(500, { error: "Could not create timeClock" }));
    }

};
