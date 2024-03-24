
const { dynamoDbClient, QueryCommand } = require('../../infra/dynamoDbClient'); 
const { EmailNotificationMessage } = require('../../domain/emailNotificationMessage');
// const { snsClient } = require('../../infra/snsCliente');
// TODO
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: process.env.REGION });

const send = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
});


module.exports.getTimeClocksPerEmployeeInAMonth = async (event, context, cb) => {

    const body = JSON.parse(event.Records[0].body); // Assumindo que event.Records[0].body é uma string JSON
    const { employeeId, email, date } = body;

    const { startDate, endDate } = getPreviousMonthRange(body.date);

    const params = {
        TableName: process.env.EMPLOYEES_TABLE,
        IndexName: 'TimeClockDateIndex',
        KeyConditionExpression: 'PK = :pk and #dateAttr BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#dateAttr': 'date' 
        },
        ExpressionAttributeValues: {
            ':pk': `EMPLOYEE#${employeeId}`,
            ':startDate': startDate,
            ':endDate': endDate
        }
    };
    
    try {
        
        const { Items } = await dynamoDbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) {
            return cb(null, send(404, { error: "TimeClock not found" }));
        }
    
        const html = generateHtmlTable(Items);

        const message = new EmailNotificationMessage(email, "Relatório Mensal", "TESTE", html);
 
        const snsParams = {
        Message: JSON.stringify(message),
        TopicArn: process.env.TOPIC_ARN,
    };

    const publishCommand = new PublishCommand(snsParams);

    const data = await snsClient.send(publishCommand);

        cb(null, send(200, { items: Items }));

    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
    
    function getPreviousMonthRange(date) {
        const currentDate = new Date(date);
        currentDate.setDate(1);
        currentDate.setDate(currentDate.getDate() - 1);
        const firstDayPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayPreviousMonth = currentDate;
        const format = (date) => date.toISOString().split('T')[0];
    
        return {
            startDate: format(firstDayPreviousMonth),
            endDate: format(lastDayPreviousMonth)
        };
    }

    function generateHtmlTable(items) {
        // Agrupar horários por data
        const groupedByDate = {};
        items.forEach(item => {
            if (!groupedByDate[item.date]) {
                groupedByDate[item.date] = [];
            }
            groupedByDate[item.date].push(item.time);
        });
    
        for (const date in groupedByDate) {
            groupedByDate[date].sort();
        }
    
        let html = `
            <h2>Relatório de Horas</h2>
            <table border="1">
                <tr>
                    <th>DATA</th>
                    <th>ENTRADA 1</th>
                    <th>SAÍDA 1</th>
                    <th>ENTRADA 2</th>
                    <th>SAÍDA 2</th>
                </tr>`;
    
        for (const date in groupedByDate) {
            const times = groupedByDate[date];
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${times[0] || ''}</td>
                    <td>${times[1] || ''}</td>
                    <td>${times[2] || ''}</td>
                    <td>${times[3] || ''}</td>
                </tr>`;
        }
    
        html += `</table>`;
        return html;
    }
}