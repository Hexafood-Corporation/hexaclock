
module.exports.preSignUp= async (event) => {
    event.response.autoConfirmUser = true;

    // Optional: Set the email as verified if it is in the request
    if (event.request.userAttributes.hasOwnProperty("email")) {
        event.response.autoVerifyEmail = true;
    }

    console.log("event antes do retorno:", JSON.stringify(event, null, 2));

    // Return to Amazon Cognito
    return event;
};
