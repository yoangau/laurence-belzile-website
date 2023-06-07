import { Handler } from '@netlify/functions';
import { statusCodes } from '../utils/status';
import { Metric, publishMetric, addEmail } from '../utils/aws';

export const handler: Handler = async (event, context) => {
  try {
    if (event.httpMethod === 'OPTIONS') return statusCodes.OK;
    if (!event || !event.body) throw new Error('No body');
    const { email } = JSON.parse(event.body);
    if (!email || !email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/))
      throw new Error('Invalid email');
    const result = await addEmail(email);
    if (result.$response.error) throw result.$response.error;
    publishMetric(Metric.EmailSubscribeSuccess);
    return statusCodes.OK;
  } catch (error) {
    publishMetric(Metric.EmailSubscribeFailed);
    console.error(error);
    return { ...statusCodes.BAD_REQUEST, statusMessage: JSON.stringify(error) };
  }
};
