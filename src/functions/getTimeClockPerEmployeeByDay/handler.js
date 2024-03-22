

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


module.exports.getTimeClockPerEmployeeByDay = async (event, context, cb) => {
    const { employeeId, day } = event.pathParameters;
    console.log({
        employeeId,
        day,
    })

    if (typeof employeeId !== "string") {
        return cb(null, send(400, { error: '"employeeId" must be a string' }));
    } else if (typeof day !== "string") {
        return cb(null, send(400, { error: '"day" must be a string' }));
    }

    const params = {
        TableName: process.env.TABLE,
        KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `EMPLOYEE#${employeeId}`,
            ":sk": `TIMECLOCK#${day}`,
        },
    };

    try {
        const { Items } = await dynamoDbClient.send(new QueryCommand(params));
        cb(null, send(200, Items));
    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
};