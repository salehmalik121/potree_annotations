terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  required_version = ">= 1.2"
}

provider "aws" {
  region = "ap-southeast-2"
}

// create DynamoDB Table

resource "aws_dynamodb_table" "Unleash-Project-Table" {
  name         = "Annotations-Table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
}

// create New Role For Lamda Function to Assume the Role of Accessing DynomoDB
resource "aws_iam_role" "Lambda-DynomoDB-Role" {
  name = "Lambda-DynamoDB-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name = "Lambda-DynamoDB-Policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:PutItem",
          "dynamodb:DescribeTable",
          "dynamodb:ListTables",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:UpdateTable"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_dynamodb" {
  role       = aws_iam_role.Lambda-DynomoDB-Role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}



// create Lamda Functions 
// add anotation
resource "aws_lambda_function" "add-annotation" {
  function_name = "add-annotation"
  role          = aws_iam_role.Lambda-DynomoDB-Role.arn
  runtime       = "nodejs20.x"
  handler       = "add-annotation.handler"
  timeout       = 10
  memory_size   = 128

  filename         = "${path.module}/AWS/add-annotation.zip"
  source_code_hash = filebase64sha256("${path.module}/AWS/add-annotation.zip")
  # Required when using inline code
  package_type = "Zip"
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.Unleash-Project-Table.name
    }
  }
}

// update annotation
resource "aws_lambda_function" "update-annotation" {
  function_name = "update-annotation"
  role          = aws_iam_role.Lambda-DynomoDB-Role.arn
  runtime       = "nodejs20.x"
  handler       = "update-annotation.handler"
  timeout       = 10
  memory_size   = 128

  # Inline code converted to Base64
  filename         = "${path.module}/AWS/update-annotation.zip"
  source_code_hash = filebase64sha256("${path.module}/AWS/update-annotation.zip")

  # Required when using inline code
  package_type = "Zip"
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.Unleash-Project-Table.name
    }
  }
}

// Delete annotation 
resource "aws_lambda_function" "delete-annotation" {
  function_name = "delete-annotation"
  role          = aws_iam_role.Lambda-DynomoDB-Role.arn
  runtime       = "nodejs20.x"
  handler       = "delete-annotation.handler"
  timeout       = 10
  memory_size   = 128

  filename         = "${path.module}/AWS/delete-annotation.zip"
  source_code_hash = filebase64sha256("${path.module}/AWS/delete-annotation.zip")

  # Required when using inline code
  package_type = "Zip"
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.Unleash-Project-Table.name
    }
  }
}

// get Annotations

resource "aws_lambda_function" "get-annotation" {
  function_name = "get-annotation"
  role          = aws_iam_role.Lambda-DynomoDB-Role.arn
  runtime       = "nodejs20.x"
  handler       = "get-annotation.handler"
  timeout       = 10
  memory_size   = 128

  # Inline code converted to Base64
  filename         = "${path.module}/AWS/get-annotation.zip"
  source_code_hash = filebase64sha256("${path.module}/AWS/get-annotation.zip")

  # Required when using inline code
  package_type = "Zip"
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.Unleash-Project-Table.name
    }
  }
}


// api gateway

resource "aws_apigatewayv2_api" "unleash_annotations_api" {
  name          = "unleash-annotations-http-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["*"]
    allow_origins = ["*"]
    expose_headers = ["*"]
    max_age = 3600 
  }
}

resource "aws_apigatewayv2_integration" "add-annotation" {
  api_id                  = aws_apigatewayv2_api.unleash_annotations_api.id
  integration_type        = "AWS_PROXY"
  integration_uri         = aws_lambda_function.add-annotation.invoke_arn
  integration_method      = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get-annotation" {
  api_id                  = aws_apigatewayv2_api.unleash_annotations_api.id
  integration_type        = "AWS_PROXY"
  integration_uri         = aws_lambda_function.get-annotation.invoke_arn
  integration_method      = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "delete-annotation" {
  api_id                  = aws_apigatewayv2_api.unleash_annotations_api.id
  integration_type        = "AWS_PROXY"
  integration_uri         = aws_lambda_function.delete-annotation.invoke_arn
  integration_method      = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "update-annotation" {
  api_id                  = aws_apigatewayv2_api.unleash_annotations_api.id
  integration_type        = "AWS_PROXY"
  integration_uri         = aws_lambda_function.update-annotation.invoke_arn
  integration_method      = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "delete_route" {
  api_id    = aws_apigatewayv2_api.unleash_annotations_api.id
  route_key = "DELETE /deleteAnnotation"
  target    = "integrations/${aws_apigatewayv2_integration.delete-annotation.id}"
}

resource "aws_apigatewayv2_route" "get_route" {
  api_id    = aws_apigatewayv2_api.unleash_annotations_api.id
  route_key = "GET /getAnnotation"
  target    = "integrations/${aws_apigatewayv2_integration.get-annotation.id}"
}

resource "aws_apigatewayv2_route" "add_route" {
  api_id    = aws_apigatewayv2_api.unleash_annotations_api.id
  route_key = "PUT /addAnnotation"
  target    = "integrations/${aws_apigatewayv2_integration.add-annotation.id}"
}

resource "aws_apigatewayv2_route" "update_route" {
  api_id    = aws_apigatewayv2_api.unleash_annotations_api.id
  route_key = "POST /updateAnnotation"
  target    = "integrations/${aws_apigatewayv2_integration.update-annotation.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.unleash_annotations_api.id
  name        = "$default"
  auto_deploy = true
}


resource "aws_lambda_permission" "add" {
  statement_id  = "AllowHttpApiAdd"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add-annotation.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.unleash_annotations_api.execution_arn}/*/*/addAnnotation"
}

resource "aws_lambda_permission" "update" {
  statement_id  = "AllowHttpApiUpdate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update-annotation.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.unleash_annotations_api.execution_arn}/*/*/updateAnnotation"
}

resource "aws_lambda_permission" "get" {
  statement_id  = "AllowHttpApiGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get-annotation.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.unleash_annotations_api.execution_arn}/*/*/getAnnotation"
}

resource "aws_lambda_permission" "delete" {
  statement_id  = "AllowHttpApiDelete"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete-annotation.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.unleash_annotations_api.execution_arn}/*/*/deleteAnnotation"
}
