  import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
  import {
    DynamoDBDocumentClient,
    PutCommand
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
        "id" : body.id,
        "cordinates" : body.cordinates,
        "title" : body.title,
        "description" : body.description,
        "createdAt" : new Date().toISOString()
      };
      await docClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME,
          Item: item,
          ConditionExpression: "attribute_not_exists(id)"
        })
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Item Created" })
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
