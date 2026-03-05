import * as Joi from 'joi';

/**
 * Schema for validating environment variables at bootstrap.
 * Required vars must be set; optional have defaults in the schema or in consuming code.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  // Database
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USERNAME: Joi.string().default('postgres'),
  DATABASE_PASSWORD: Joi.string().default('postgres'),
  DATABASE_NAME: Joi.string().default('secure_task_management'),

  // JWT (required in production; in dev/test a default is used)
  JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(16).required().messages({
      'string.min': 'JWT_SECRET must be at least 16 characters in production',
    }),
    otherwise: Joi.string().min(16).default('dev-jwt-secret-min-16-chars'),
  }),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Mail (optional – invitations work but emails not sent if missing)
  MAILTRAP_SMTP_HOST: Joi.string().optional().allow(''),
  MAILTRAP_SMTP_PORT: Joi.string().optional().allow(''),
  MAILTRAP_SMTP_USER: Joi.string().optional().allow(''),
  MAILTRAP_SMTP_PASS: Joi.string().optional().allow(''),
  APP_URL: Joi.string().uri().optional().allow(''),
  MAIL_FROM: Joi.string().email().optional().allow(''),
  MAIL_FROM_NAME: Joi.string().optional().allow(''),
}).options({ stripUnknown: true });
