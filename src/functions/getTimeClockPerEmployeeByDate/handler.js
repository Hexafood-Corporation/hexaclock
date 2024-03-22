
const { dynamoDbClient, GetCommand } = require('../../infra/dynamoDbClient'); // Ajuste o caminho conforme a estrutura do seu projeto

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


module.exports.getTimeClockPerEmployeeByDate = async (event, context, cb) => {
    const { employeeId, date } = event.pathParameters;
    console.log({
        employeeId,
        date,
    })
    if (typeof employeeId !== "string") {
        return cb(null, send(400, { error: '"employeeId" must be a string' }));
    } else if (typeof date !== "string") {
        return cb(null, send(400, { error: '"day" must be a string' }));
    }
    
    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        Key: {
            PK: `EMPLOYEE#${employeeId}`,
            SK: `TIMECLOCK#${date}`,
        },
    };

    try {
        const { Items } = await dynamoDbClient.send(new GetCommand(params));
        if (!Items) {
            return cb(null, send(404, { error: "TimeClock not found" }));
        }
        cb(null, send(200, {...Items}));
    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
};