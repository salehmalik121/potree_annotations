import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {


    const data = await docClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Success" , data : data.Items })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};
