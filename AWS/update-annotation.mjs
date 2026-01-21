import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
   
    const body = JSON.parse(event.body);

    if (!body.id || !body.cordinates || !body.title || !body.description ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }

    const item = {
      "id" : body.id
    };

    const updateItem = {
      cordinates: {value: body.cordinates , action: "PUT"},
      title: {value: body.title , action: "PUT"},
      description: {value: body.description , action: "PUT"}
    }

    console.log(body);

    await docClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: item,
        ExpressionAttributeNames: {
          "#t" : "title",
          "#d" : "description",
          "#c" : "cordinates"
        },
        ExpressionAttributeValues: {
          ":t": body.title,
          ":d" : body.description,
          ":c" : body.cordinates
        },
        UpdateExpression: "SET #t = :t, #d = :d, #c = :c",
        ReturnValues: "UPDATED_NEW"
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Item Updated" })
    };

  } catch (error) {
    console.log("Below is Error");
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
