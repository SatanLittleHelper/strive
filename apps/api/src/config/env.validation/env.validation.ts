import Joi from 'joi';

const DATABASE_SCHEMES = ['postgres', 'postgresql'];

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().default('127.0.0.1'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  LOG_PRETTY: Joi.string().valid('true', 'false').default('false'),
  DATABASE_URL: Joi.string().uri({ scheme: DATABASE_SCHEMES }).required(),
});
