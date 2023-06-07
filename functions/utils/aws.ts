// Load the AWS SDK for JS
import AWS from 'aws-sdk';
import { Converter } from 'aws-sdk/clients/dynamodb';

AWS.config.update({
  region: 'ca-central-1',
  accessKeyId: process.env.LB_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.LB_AWS_SECRET_KEY,
});

const tableName = 'laurence-belzile-website-email-list';

const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const ddbDocumentClient = new AWS.DynamoDB.DocumentClient();

const cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

export const addEmail = async (email: string) => {
  const params = {
    Item: Converter.marshall({ email, createdAt: new Date().toISOString() }),
    TableName: tableName,
  };
  return await dynamodb.putItem(params).promise();
};

export enum Metric {
  EmailSubscribeSuccess = 'EmailSubscribeSuccess',
  EmailSubscribeFailed = 'EmailSubscribeFailed',
}

export const publishMetric = async (metric: Metric, value: number = 1) => {
  const params = {
    MetricData: [
      {
        MetricName: metric,
        Unit: 'Count',
        Value: value,
      },
    ],
    Namespace: 'LaurenceBelzileWebsite',
  };
  await cloudwatch.putMetricData(params).promise();
};
