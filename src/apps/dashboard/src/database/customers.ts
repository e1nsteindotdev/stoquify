import { convex } from "@/lib/convex-client"
import { api } from 'api/convex'
import { createCollection } from "@tanstack/db"
import { useLiveQuery } from "@tanstack/react-db"
import { addRxPlugin, createRxDatabase } from 'rxdb/plugins/core'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'

addRxPlugin(RxDBDevModePlugin)

// Create database
const db = await createRxDatabase({
  name: 'my-customers-db-v3',
  storage: wrappedValidateAjvStorage({
    storage: getRxStorageDexie()
  })
})

// Add collection with proper schema (not blob!)
await db.addCollections({
  customers: {
    schema: {
      title: 'customers',
      version: 0,
      type: 'object',
      primaryKey: '_id',
      properties: {
        _id: {
          type: 'string',
          maxLength: 100
        },
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        },
        phoneNumber: {
          type: 'number'
        },
        lastestAdressId: {
          type: 'string'
        },
        creationTime: {
          type: 'number'
        },
        address: {
          type: ['object', 'null'],
          properties: {
            address: { type: 'string' },
            wilaya: {
              type: ['object', 'null'],
              properties: {
                name: { type: 'string' }
              }
            }
          }
        },
        orderCount: {
          type: 'number'
        }
      },
      required: ['_id', 'firstName', 'lastName', 'phoneNumber'],
    },
  }
})

// Create TanStack DB collection with default handlers
const customersCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.customers,
    startSync: true,
    // Default handlers work automatically - they persist to RxDB
  })
)

// Setup replication with Convex
const replicationState = replicateRxCollection({
  collection: db.customers,
  replicationIdentifier: 'customers-convex-replication-v4', // Force reset (v4)
  live: true, // Enable continuous sync
  autoStart: true,

  pull: {
    async handler(checkpointOrNull, batchSize) {
      // First pull has no checkpoint
      if (!checkpointOrNull) {
        checkpointOrNull = {
          _id: '',
          updatedAt: 0
        }
      }

      console.log('Pulling from Convex')

      // Fetch all customers from Convex
      const customers = await convex.query(api.customers.listCustomers, {})

      // Since listCustomers returns all data, we must filter it client-side relative to the checkpoint
      // to avoid returning the same data in an infinite loop.
      const checkpoint = checkpointOrNull as { _id: string, updatedAt: number }

      const newDocuments = customers
        .filter(doc => {
          return (doc._creationTime || 0) > checkpoint.updatedAt
        })
        .map(doc => {
          // Strictly pick only fields defined in the schema to avoid validation errors
          // RxDB with strict schema will reject documents with extra fields like 'address' or 'orderCount'
          return {
            _id: doc._id,
            firstName: doc.firstName,
            lastName: doc.lastName,
            phoneNumber: doc.phoneNumber,
            lastestAdressId: doc.lastestAdressId,
            creationTime: doc._creationTime,
            address: doc.address || null, // Map address, ensure null if undefined
            orderCount: doc.orderCount // Also mapping orderCount as it's useful for UI
          }
        })

      console.log('Got from API:', customers.length, 'New for RxDB:', newDocuments.length)

      if (newDocuments.length > 0) {
        console.log('Sample Doc:', JSON.stringify(newDocuments[0], null, 2))
      }

      if (newDocuments.length === 0) {
        return {
          documents: [],
          checkpoint: checkpointOrNull
        }
      }

      // Determine new checkpoint from the last document
      // We sort by creation time to ensure consistent checkpointing if not already sorted
      newDocuments.sort((a, b) => (a.creationTime || 0) - (b.creationTime || 0))

      const lastDoc = newDocuments[newDocuments.length - 1];
      const newCheckpoint = {
        _id: lastDoc._id,
        updatedAt: lastDoc.creationTime || Date.now()
      }

      return {
        documents: newDocuments,
        checkpoint: newCheckpoint
      }
    }
  },

  push: {
    async handler(changeRows) {
      console.log('Pushing changes to Convex:', changeRows)

      for (const changeRow of changeRows) {
        try {
          await convex.mutation(api.customers.createOrUpdateCustomer, changeRow.newDocumentState)
        } catch (error) {
          console.error("Convex mutation failed, undoing optimistic update:", error)
          throw error
        }
      }
      return []
    }
  }
})



// Wait for initial sync to complete
await replicationState.awaitInitialReplication()
console.log('Initial replication complete!')


export const useGetCustomers = () => {
  const customers = useLiveQuery(q => q.from({ customers: customersCollection }))
  return customers

}
