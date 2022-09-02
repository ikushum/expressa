const util = require('../../util')

exports.permissions = function () {
  return ['view errors', 'schemas: view', 'view server details']
}

exports.settingSchema = {
  jwt_secret: {
    type: 'string',
    description: 'The secret key used to encode your json web tokens. It\'s important this is kept unique and secret.'
  },
  jwt_expires_in: {
    type: 'string',
    description: 'JWT expires after - expressed in seconds or a string describing a time span eg 60, "2 days", "10h", "7d", if undefined tokens wont expire'
  },
  jwt_expire_on_password_change: {
    description: 'Whether to expire jwt on password change. Defaults to true',
    type: 'boolean',
    default: true,
  },
  postgresql_uri: {
    type: 'string',
    description: 'The full path to your postgres database. E.g. postgres://username:password@host/db'
  },
  mongodb_uri: {
    type: 'string',
    description: 'The full path to your mongo database.'
  },
  installed: {
    type: 'boolean',
    description: 'Whether the site has gone through the install process',
    format: 'checkbox',
  },
  installed_modules: {
    type: 'array',
    description: 'List of installed modules with relevant info',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        }
      }
    }
  },
  body_limit: {
    type: 'string',
    description: 'Max incoming body size for requests, defaults to 1mb.',
    default: '1mb',
  }
}

exports.collections = async function(app) {
  const settingsProperties = {}

  for (const name of Object.keys(app.modules)) {
    const module = app.modules[name]
    const moduleSettings = await util.resolve(module.settingSchema, app) || {}
    Object.assign(settingsProperties, moduleSettings)
  }

  const settings = {
    _id: 'settings',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: settingsProperties,
    },
    documentsHaveOwners: false
  }

  const users = {
    _id: 'users',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        email: {
          type: 'string'
        },
        password: {
          type: 'string',
          description: 'hashed password and salt'
        },
        fullName: {
          type: 'string'
        },
        roles: {
          items: {
            type: 'string',
            enum: [
              'Admin',
              'Anonymous',
              'Authenticated',
              'Test'
            ] // TODO (make this list automatic)
          },
          uniqueItems: true,
          type: 'array',
          format: 'checkbox'
        }
      },
      required: [
        'email',
        'password',
      ]
    },
    admin: {
      columns: ['email', 'roles']
    },
    storage: 'file',
    documentsHaveOwners: true
  }

  const collections = {
    _id: 'collection',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        _id: {
          type: 'string'
        },
        schema: {
          type: 'object',
          format: 'schema',
          properties: {},
          description: 'JSON Schema used for validating the data and generating the admin editor.'
        },
        storage: {
          type: 'string',
          enum: [
            'file',
            'postgres',
            'mongo',
            'memory'
          ],
          // TODO: populate this list automatically
          description: 'Method for persisting the data in this collection.'
        },
        documentsHaveOwners: {
          type: 'boolean',
          format: 'checkbox'
        },
        cacheInMemory: {
          type: 'boolean',
          format: 'checkbox',
          description: 'If set, a full copy of this collection will be stored in memory.'
        },
        allowHTTPCaching: {
          type: 'boolean',
          format: 'checkbox',
          description: 'If unset, headers will be sent to prevent caching'
        },
        plainStringIds: {
          type: 'boolean',
          format: 'checkbox',
          description: 'If set, collection will use a string id instead of PostgreSQL uuid'
        },
        enableLogin: {
          type: 'boolean',
          format: 'checkbox',
          description: 'set true if collection is used to facilitate login, requires collection to have email and password properties'
        },
        admin: {
          type: 'object',
          additionalProperties: false,
          properties: {
            columns: {
              items: {
                type: 'string'
              },
              type: 'array'
            }
          },
          required: [
            'columns'
          ]
        }
      },
      required: [
        '_id',
        'storage',
        'documentsHaveOwners',
        'schema',
      ]
    },
    admin: {
      columns: ['_id', 'storage', 'documentsHaveOwners']
    },
    storage: 'file',
    cacheInMemory: false, // TODO: figure out why tests fail when this is true
    documentsHaveOwners: false
  }

  return [settings, users, collections]
}
