import { DynamoDBClient,DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
   
    const body = JSON.parse(event.body);

    if (!body.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }

    const item = {
      "id" : {
        S : body.id
      }
    };

    await docClient.send(
      new DeleteItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: item
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Item Delelted" })
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
