const { dynamoDbClient, QueryCommand } = require('../../infra/dynamoDbClient'); 

module.exports.preTokenGeneration = async (event) => {
    const username = event.userName;

    // Ajuste os parâmetros para usar o GSI
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

        if (result.Items.length > 0) {
            const employeeId = result.Items[0].PK; // Assumindo que 'id' seja o PK do usuário.
            console.log(`Employee ID: ${employeeId}`);

            if (employeeId != null) {
                // Adiciona o PK do usuário como uma claim customizada no token
                event.response = {
                    claimsOverrideDetails: {
                        claimsToAddOrOverride: {
                            employeeId: employeeId,
                        },
                    },
                };
            }
        }
    } catch (error) {
        console.log("Erro ao consultar o DynamoDB usando GSI:", error);
        throw error;
    }

    console.log("event.response antes do retorno:", JSON.stringify(event.response, null, 2));

    return event;

};

