/**
 * Swagger Configuration
 * OpenAPI 3.0 Documentation Setup
 */

import swaggerUi from 'swagger-ui-express';
import { swaggerDefinition } from './openapi.js';

export function setupSwagger(app) {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve);
  app.get(
    '/api-docs',
    swaggerUi.setup(swaggerDefinition, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        displayOperationDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
      },
      customCss: `
      .topbar { display: none; }
      .swagger-ui .topbar-wrapper { display: none; }
      .swagger-ui .model-container { background: #f5f5f5; }
      .swagger-ui .btn { border-radius: 4px; }
    `,
      customSiteTitle: 'Citoyen Avisé API',
    })
  );

  // JSON spec endpoint
  app.get('/api/v1/openapi.json', (req, res) => {
    res.json(swaggerDefinition);
  });

  console.log(
    `✅ Swagger UI available at http://localhost:${process.env.PORT || 3000}/api-docs`
  );
}

export default setupSwagger;
