const { dynamoDbClient, QueryCommand , PutCommand} = require('../../../infra/dynamoDbClient');
const { v4: uuidv4 } = require('uuid');

module.exports.preTokenGeneration = async (event) => {
    const username = event.userName;

    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        }
    };

    try {
        const result = await dynamoDbClient.send(new QueryCommand(params));
        console.log("result:", JSON.stringify(result, null, 2));
        let employeeId = null;

        if (result.Items.length > 0) {
            employeeId = result.Items[0].PK; 
            console.log(`Employee ID: ${employeeId}`);

            
        } else {
            const name = event.request.userAttributes.name;
            const registry = event.request.userAttributes.profile;
            employeeId = uuidv4();
            const email = event.request.userAttributes.email;

            const params = {
                TableName: process.env.EMPLOYEES_TABLE,
                Item: {
                    PK: `EMPLOYEE#${employeeId}`,
                    SK: `EMPLOYEE`,
                    name: name,
                    username: username,
                    registry: registry,
                    email: email
                },
            };

            try {
                await dynamoDbClient.send(new PutCommand(params));
            } catch (error) {
                console.log("Error ao criar novo employee:", error);
            }
        }

        if (employeeId != null) {
            event.response = {
                claimsOverrideDetails: {
                    claimsToAddOrOverride: {
                        employeeId: employeeId,
                    },
                },
            };
        }
    } catch (error) {
        console.log("Erro ao consultar o DynamoDB usando GSI:", error);
        throw error;
    }

    console.log("event.response antes do retorno:", JSON.stringify(event.response, null, 2));

    return event;

};

