
const { dynamoDbClient, QueryCommand } = require('../../infra/dynamoDbClient'); 

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


module.exports.getTimeClocksPerEmployeeInAMonth = async (event, context, cb) => {
    const { employeeId, month } = event.pathParameters;

    if (typeof employeeId !== "string") {
        return cb(null, send(400, { error: '"employeeId" must be a string' }));
    } else if (typeof month !== "string") {
        return cb(null, send(400, { error: '"month" must be a string' }));
    }

    const monthFormated = month.toString().padStart(2, '0')

    console.log(`EMPLOYEE#${employeeId}`)
    console.log(`TIMECLOCK#2024-${monthFormated}`)

    const params = {
      TableName: process.env.EMPLOYEES_TABLE,
      KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
      ExpressionAttributeValues: {
          ':pk': `EMPLOYEE#${employeeId}`,
          ':sk': `TIMECLOCK#2024-${monthFormated}`
      }
    };
        
    try {

        const { Items } = await dynamoDbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) {
            return cb(null, send(404, { error: "TimeClock not found" }));
        }


        // TODO ENVIAR EMAIL

        cb(null, send(200, { items: Items }));

    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
}