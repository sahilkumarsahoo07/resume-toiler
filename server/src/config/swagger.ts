import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume Tailor AI Studio API',
      version: '1.0.0',
      description: 'API documentation for the Resume Tailor AI Studio backend services',
    },
    servers: [
      {
        url: '/',
        description: 'Current Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger documentation configured at http://localhost:5000/docs');
}
