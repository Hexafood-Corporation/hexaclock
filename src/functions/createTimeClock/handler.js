const { dynamoDbClient, PutCommand } = require('../../infra/dynamoDbClient'); // Ajuste o caminho conforme a estrutura do seu projeto

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});

module.exports.createTimeClock = async (event, context, cb) => {
    const { employeeId } = JSON.parse(event.body);
    if (typeof employeeId !== "string") return res.status(400).json({ error: '"employeeId" must be a string' });


    const date = new Date().toISOString().split('T')[0];
    const timeClockId = `TIMECLOCK#${Date.now()}`; // Supondo que você queira um identificador único
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

        cb(null, send(200, { employeeId, date }));
    } catch (error) {
        console.log(error);
        cb(null,send(500, { error: "Could not create timeClock" }));
    }

};
