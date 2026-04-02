/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/glurk_protocol.json`.
 */
export type GlurkProtocol = {
  "address": "5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ",
  "metadata": {
    "name": "glurkProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Glurk Protocol — reciprocal identity data exchange on Solana"
  },
  "instructions": [
    {
      "name": "deactivateIssuer",
      "docs": [
        "Protocol admin deactivates an issuer."
      ],
      "discriminator": [
        52,
        10,
        163,
        187,
        247,
        22,
        150,
        37
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "issuerAccount",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "registerCredential",
      "docs": [
        "Register a credential issued by an approved issuer to a user."
      ],
      "discriminator": [
        1,
        125,
        182,
        19,
        180,
        151,
        48,
        231
      ],
      "accounts": [
        {
          "name": "issuerAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "issuerAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuerAuthority"
              }
            ]
          }
        },
        {
          "name": "user"
        },
        {
          "name": "credentialAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "issuerAuthority"
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "slug"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "tier",
          "type": "string"
        },
        {
          "name": "score",
          "type": "u8"
        },
        {
          "name": "mintAddress",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerIssuer",
      "docs": [
        "Register a new issuer in the protocol.",
        "Only the protocol admin can call this."
      ],
      "discriminator": [
        145,
        117,
        52,
        59,
        189,
        27,
        127,
        18
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "issuerAuthority"
        },
        {
          "name": "issuerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "issuerAuthority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "requestAccess",
      "docs": [
        "Request access to a user's credentials.",
        "The requesting app MUST provide a data contribution in the same tx.",
        "The user MUST sign (consent)."
      ],
      "discriminator": [
        102,
        165,
        38,
        148,
        139,
        189,
        106,
        47
      ],
      "accounts": [
        {
          "name": "requesterAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "docs": [
            "The user MUST also sign — this is consent"
          ],
          "signer": true
        },
        {
          "name": "requesterIssuer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  115,
                  115,
                  117,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "requesterAuthority"
              }
            ]
          }
        },
        {
          "name": "contributionAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  101,
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "requesterAuthority"
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "contributionSlug"
              }
            ]
          }
        },
        {
          "name": "consentAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  115,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "requesterAuthority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contributionSlug",
          "type": "string"
        },
        {
          "name": "contributionTier",
          "type": "string"
        },
        {
          "name": "contributionScore",
          "type": "u8"
        }
      ]
    },
    {
      "name": "revokeAccess",
      "docs": [
        "User revokes an app's access."
      ],
      "discriminator": [
        106,
        128,
        38,
        169,
        103,
        238,
        102,
        147
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "consentAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  115,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "requester"
              }
            ]
          }
        },
        {
          "name": "requester"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "consentAccount",
      "discriminator": [
        129,
        26,
        32,
        122,
        68,
        134,
        146,
        154
      ]
    },
    {
      "name": "credentialAccount",
      "discriminator": [
        163,
        33,
        82,
        244,
        191,
        35,
        220,
        78
      ]
    },
    {
      "name": "issuerAccount",
      "discriminator": [
        126,
        234,
        14,
        239,
        71,
        204,
        88,
        61
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "issuerInactive",
      "msg": "Issuer is not active"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "unauthorized"
    }
  ],
  "types": [
    {
      "name": "consentAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "grantedAt",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "credentialAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "tier",
            "type": "string"
          },
          {
            "name": "score",
            "type": "u8"
          },
          {
            "name": "mintAddress",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "issuerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "trustScore",
            "type": "u8"
          },
          {
            "name": "credentialsIssued",
            "type": "u64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
