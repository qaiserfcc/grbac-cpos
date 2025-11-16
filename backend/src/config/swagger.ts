import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GRBAC Cloud POS API',
      version: '1.0.0',
      description:
        'API documentation for the GRBAC Cloud POS system with Role-Based Access Control',
      contact: {
        name: 'API Support',
        email: 'support@grbac-cpos.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.grbac-cpos.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            fullName: {
              type: 'string',
              description: 'Full name',
            },
            isEnabled: {
              type: 'boolean',
              description: 'Whether the user is enabled',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            roles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Role',
              },
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'User permissions',
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Role ID',
            },
            name: {
              type: 'string',
              description: 'Role name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Permission ID',
            },
            name: {
              type: 'string',
              description: 'Permission name',
            },
            description: {
              type: 'string',
              description: 'Permission description',
            },
            resource: {
              type: 'string',
              description: 'Resource name',
            },
            action: {
              type: 'string',
              description: 'Action name',
            },
          },
        },
        Widget: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Widget ID',
            },
            name: {
              type: 'string',
              description: 'Widget name',
            },
            description: {
              type: 'string',
              description: 'Widget description',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Username or email',
              minLength: 3,
            },
            password: {
              type: 'string',
              description: 'Password',
              minLength: 8,
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'fullName', 'roles'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              minLength: 3,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            password: {
              type: 'string',
              description: 'Password',
              minLength: 8,
            },
            fullName: {
              type: 'string',
              description: 'Full name',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Role names to assign',
              minItems: 1,
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token',
              minLength: 20,
            },
          },
        },
        UpdateUserRolesRequest: {
          type: 'object',
          required: ['roles'],
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              description: 'Role IDs to assign',
            },
          },
        },
        UpdateUserStatusRequest: {
          type: 'object',
          required: ['isEnabled'],
          properties: {
            isEnabled: {
              type: 'boolean',
              description: 'Whether to enable or disable the user',
            },
          },
        },
        CreateRoleRequest: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: {
              type: 'string',
              description: 'Role name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
          },
        },
        UpdateRoleRequest: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: {
              type: 'string',
              description: 'Role name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
          },
        },
        AssignRoleRequest: {
          type: 'object',
          required: ['userId', 'roleId'],
          properties: {
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            roleId: {
              type: 'string',
              format: 'uuid',
              description: 'Role ID',
            },
          },
        },
        UpdateRolePermissionsRequest: {
          type: 'object',
          required: ['permissions'],
          properties: {
            permissions: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              description: 'Permission IDs to assign',
            },
          },
        },
        UpdateRoleWidgetsRequest: {
          type: 'object',
          required: ['widgets'],
          properties: {
            widgets: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              description: 'Widget IDs to assign',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Paths to files containing OpenAPI definitions
};

export const specs = swaggerJSDoc(options);
