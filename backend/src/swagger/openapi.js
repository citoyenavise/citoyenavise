/**
 * OpenAPI 3.0 Specification
 * Citoyen Avisé API Documentation
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Citoyen Avisé API',
    version: '1.0.0',
    description: 'API de participation civique — Pétitions, Élus, Actualités, Promesses',
    contact: {
      name: 'Citoyen Avisé Team',
      email: 'infocitoyenavise@gmail.com'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Développement'
    },
    {
      url: 'https://api.citoyenavise.org/api/v1',
      description: 'Production'
    }
  ],
  tags: [
    {
      name: 'Authentification',
      description: 'Magic Link & JWT Authentication'
    },
    {
      name: 'Élus',
      description: 'Gestion des élus (Députés, Sénateurs, Maires, Conseillers)'
    },
    {
      name: 'Pétitions',
      description: 'Créer, signer, commenter les pétitions citoyennes'
    },
    {
      name: 'Signatures',
      description: 'Gestion des signatures de pétitions'
    },
    {
      name: 'Actualités',
      description: 'Posts et idées des citoyens'
    },
    {
      name: 'Promesses',
      description: 'Engagements et promesses des élus'
    },
    {
      name: 'Circonscriptions',
      description: 'Districts électoraux et géolocalisation'
    }
  ],
  paths: {
    // ═══════════════════════════════════════════════════════════════════
    // AUTHENTIFICATION
    // ═══════════════════════════════════════════════════════════════════
    '/auth/request-login': {
      post: {
        tags: ['Authentification'],
        summary: 'Demander magic link',
        description: 'Envoie un lien magique par email pour se connecter/inscrire',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'citoyen@example.com'
                  }
                },
                required: ['email']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Email envoyé avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    userId: { type: 'integer' },
                    email: { type: 'string' }
                  }
                }
              }
            }
          },
          400: { description: 'Email invalide' }
        }
      }
    },
    '/auth/verify': {
      get: {
        tags: ['Authentification'],
        summary: 'Vérifier magic link',
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Token valide, JWT retourné',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        verified_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Token invalide ou expiré' }
        }
      }
    },
    '/auth/complete-profile': {
      post: {
        tags: ['Authentification'],
        summary: 'Compléter le profil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nomComplet: { type: 'string' },
                  province: { type: 'string' },
                  codePostal: { type: 'string' }
                },
                required: ['nomComplet']
              }
            }
          }
        },
        responses: {
          200: { description: 'Profil mis à jour' },
          400: { description: 'Données invalides' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Obtenir l\'utilisateur courant',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Informations utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        nom_complet: { type: 'string' },
                        province: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Non authentifié' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // ÉLUS
    // ═══════════════════════════════════════════════════════════════════
    '/élus': {
      get: {
        tags: ['Élus'],
        summary: 'Lister les élus',
        parameters: [
          { name: 'niveau', in: 'query', schema: { type: 'string' } },
          { name: 'région', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Liste des élus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          nom_complet: { type: 'string' },
                          titre: { type: 'string' },
                          région: { type: 'string' },
                          niveau: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/élus/{id}': {
      get: {
        tags: ['Élus'],
        summary: 'Obtenir un élu',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Détail de l\'élu' },
          404: { description: 'Élu non trouvé' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // PÉTITIONS
    // ═══════════════════════════════════════════════════════════════════
    '/pétitions': {
      get: {
        tags: ['Pétitions'],
        summary: 'Lister les pétitions',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Liste des pétitions' }
        }
      },
      post: {
        tags: ['Pétitions'],
        summary: 'Créer une pétition',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titre: { type: 'string' },
                  description: { type: 'string' },
                  elu_id: { type: 'integer' }
                },
                required: ['titre', 'description']
              }
            }
          }
        },
        responses: {
          201: { description: 'Pétition créée (draft)' },
          400: { description: 'Données invalides' }
        }
      }
    },
    '/pétitions/{id}': {
      get: {
        tags: ['Pétitions'],
        summary: 'Obtenir une pétition',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Détail de la pétition' },
          404: { description: 'Pétition non trouvée' }
        }
      },
      put: {
        tags: ['Pétitions'],
        summary: 'Mettre à jour une pétition (draft)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titre: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Pétition mise à jour' },
          403: { description: 'Non autorisé' }
        }
      }
    },
    '/pétitions/{id}/publish': {
      post: {
        tags: ['Pétitions'],
        summary: 'Publier une pétition',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Pétition publiée' },
          403: { description: 'Non autorisé' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // SIGNATURES
    // ═══════════════════════════════════════════════════════════════════
    '/signatures': {
      get: {
        tags: ['Signatures'],
        summary: 'Lister les signatures',
        parameters: [
          { name: 'petition_id', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Liste des signatures' }
        }
      }
    },
    '/pétitions/{id}/sign': {
      post: {
        tags: ['Signatures'],
        summary: 'Signer une pétition',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          201: { description: 'Pétition signée' },
          409: { description: 'Déjà signé' }
        }
      },
      delete: {
        tags: ['Signatures'],
        summary: 'Retirer sa signature',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Signature retirée' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // ACTUALITÉS (Posts)
    // ═══════════════════════════════════════════════════════════════════
    '/actualités': {
      get: {
        tags: ['Actualités'],
        summary: 'Lister les actualités',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Liste des actualités' }
        }
      },
      post: {
        tags: ['Actualités'],
        summary: 'Publier une actualité',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titre: { type: 'string' },
                  contenu: { type: 'string' },
                  petition_id: { type: 'integer' }
                },
                required: ['titre', 'contenu']
              }
            }
          }
        },
        responses: {
          201: { description: 'Actualité créée' }
        }
      }
    },
    '/actualités/{id}': {
      get: {
        tags: ['Actualités'],
        summary: 'Obtenir une actualité',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Détail de l\'actualité' }
        }
      },
      put: {
        tags: ['Actualités'],
        summary: 'Mettre à jour une actualité',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Actualité mise à jour' }
        }
      },
      delete: {
        tags: ['Actualités'],
        summary: 'Supprimer une actualité',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Actualité supprimée' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // PROMESSES (Elu Commitments)
    // ═══════════════════════════════════════════════════════════════════
    '/promesses': {
      get: {
        tags: ['Promesses'],
        summary: 'Lister les promesses',
        parameters: [
          { name: 'elu_id', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Liste des promesses' }
        }
      }
    },
    '/promesses/{id}': {
      get: {
        tags: ['Promesses'],
        summary: 'Obtenir une promesse',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Détail de la promesse' }
        }
      }
    },
    '/promesses/{id}/follow': {
      post: {
        tags: ['Promesses'],
        summary: 'Suivre une promesse',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          201: { description: 'Promesse suivie' }
        }
      },
      delete: {
        tags: ['Promesses'],
        summary: 'Arrêter de suivre',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Promesse non suivie' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token JWT (obtenu via /auth/verify)'
      }
    }
  }
};
