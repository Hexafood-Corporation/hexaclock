
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
    const { employeeId, email, year, month } = body;

    const { startDate, endDate } = getMonthDateRange(year, month);

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

        const monthName = getMonthName(month);

        const emailSubject = `Relatório Mensal de ${monthName}` ;
        let html;

        const emailContent = Items && Items.length > 0 
        ? html = generateHtmlTable(Items) 
        : "Não há registros para o mês solicitado"; 
    
    const message = new EmailNotificationMessage(email, emailSubject, emailContent, html);

    const snsParams = {
        Message: JSON.stringify(message),
        TopicArn: process.env.TOPIC_ARN,
    };

    // Envia a mensagem
    await snsClient.send(new PublishCommand(snsParams));

    // Responde com 404 se não houver itens, mas após enviar o email
    if (!Items || Items.length === 0) {
        return cb(null, send(404, { error: "TimeClock not found" }));
    }

    // Se houver itens, retorna sucesso com os dados
    return cb(null, send(200, { items: Items }));

    } catch (error) {
        console.log(error);
        cb(null, send(500, { error: "Could not get timeClock" }));
    }
    
    function getMonthName(month){

        const monthNames = [
            "Janeiro", "Fevereiro", "Março",
            "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro",
            "Outubro", "Novembro", "Dezembro"
        ];
    
        return  monthNames[month - 1];
    }

    function getMonthDateRange(year, month) {
        // O mês no objeto Date do JavaScript é base 0, então subtraímos 1
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // O dia 0 do próximo mês é o último dia do mês atual
    
        // Formata para string no formato ISO sem horário
        const startDateFormatISO = startDate.toISOString().split('T')[0];
        const endDateFormatISO = endDate.toISOString().split('T')[0];
    
        return { startDate: startDateFormatISO, endDate: endDateFormatISO };
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
    
        let totalMinutes = 0; // Total de minutos trabalhados
    
        let html = `
            <h2>Relatório de Horas</h2>
            <table border="1">
                <tr>
                    <th>DATA</th>
                    <th>ENTRADA 1</th>
                    <th>SAÍDA 1</th>
                    <th>ENTRADA 2</th>
                    <th>SAÍDA 2</th>
                    <th>TOTAL DE HORAS</th>
                </tr>`;
    
        for (const date in groupedByDate) {
            const times = groupedByDate[date];
            let dayTotalMinutes = 0; // Total de minutos por dia
    
            // Calcula a duração trabalhada no dia
            if (times[0] && times[1]) {
                dayTotalMinutes += calculateMinutesDifference(times[0], times[1]);
            }
            if (times[2] && times[3]) {
                dayTotalMinutes += calculateMinutesDifference(times[2], times[3]);
            }
    
            totalMinutes += dayTotalMinutes; // Adiciona ao total geral
    
            const totalHours = Math.floor(dayTotalMinutes / 60); // Converte minutos em horas
            const totalMinutesRemainder = dayTotalMinutes % 60; // Calcula os minutos restantes
    
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${times[0] || ''}</td>
                    <td>${times[1] || ''}</td>
                    <td>${times[2] || ''}</td>
                    <td>${times[3] || ''}</td>
                    <td>${totalHours}h ${totalMinutesRemainder}min</td>
                </tr>`;
        }
    
        // Adiciona uma linha final com o total de horas
        const grandTotalHours = Math.floor(totalMinutes / 60);
        const grandTotalMinutes = totalMinutes % 60;
        html += `
            <tr>
                <td colspan="5">Total Geral de Horas</td>
                <td>${grandTotalHours}h ${grandTotalMinutes}min</td>
            </tr>
        </table>`;
    
        return html;
    }
    
    // Função auxiliar para calcular a diferença em minutos entre dois horários
    function calculateMinutesDifference(startTime, endTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
    
        return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    }
}