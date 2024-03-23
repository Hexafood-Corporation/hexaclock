
const { dynamoDbClient, QueryCommand } = require('../../infra/dynamoDbClient');
const jwt = require('jsonwebtoken'); 


const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


module.exports.getTimeClockPerEmployeeByDate = async (event, context, cb) => {
    const token = event.headers.Authorization || event.headers.authorization; 
    if (!token) {
        return send(401, { error: "No token provided" });
    }

    let employeeId;
    try {
        const decodedToken = jwt.decode(token.split(" ")[1]); // Decodifica o token (considerando que está no formato 'Bearer token')
        employeeId = decodedToken.employeeId; 
        console.log("employeeId:", employeeId);
    } catch (error) {
        console.log(error);
        return send(400, { error: "Invalid token" });
    }

    const { date } = event.pathParameters;
 
    if (typeof employeeId !== "string") {
        return cb(null, send(400, { error: '"employeeId" must be a string' }));
    } else if (typeof date !== "string") {
        return cb(null, send(400, { error: '"day" must be a string' }));
    }

    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        IndexName: 'TimeClockDateIndex',
        KeyConditionExpression: 'PK = :pk and #dateAttr = :dateStart',
        ExpressionAttributeNames: {
            '#dateAttr': 'date' 
        },
        ExpressionAttributeValues: {
            ':pk': `EMPLOYEE#${employeeId}`,
            ':dateStart': date
        }
    };
        
    try {

        const { Items } = await dynamoDbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) {
            return cb(null, send(404, { error: "TimeClock not found" }));
        }
        cb(null, send(200, { items: Items }));
    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
};