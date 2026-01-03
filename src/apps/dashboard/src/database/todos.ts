import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
addRxPlugin(RxDBDevModePlugin)

import { createCollection, useLiveQuery } from '@tanstack/react-db'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'


export const db = await createRxDatabase({
  name: 'todos',
  storage: wrappedValidateAjvStorage({
    storage: getRxStorageLocalstorage()
  })
})

await db.addCollections({
  todos: {
    schema: {
      title: 'todos',
      version: 0,
      type: 'object',
      primaryKey: 'id',
      properties: {
        id: { type: 'string', maxLength: 100 },
        text: { type: 'string' },
        completed: { type: 'boolean' },
      },
      required: ['id', 'text', 'completed'],
    },
  },
})



const replicationState = replicateRxCollection({
  replicationIdentifier: "zbi",
  collection: db.todos,
  pull: {
    handler: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/todosPull`)
      const todos = await res.json()
      const result = todos.map(todo => ({ id: todo._id as string, text: todo.text, completed: todo.completed }))
      return { documents: result, checkpoint: null }
    }
  },
  push: {
    async handler(changeRows) {
      console.log('change rows :', changeRows)
      await Promise.all(
        changeRows.map(row =>
          fetch(`${import.meta.env.VITE_API_URL}/todosPush`, {
            body: JSON.stringify({ id: row.newDocumentState.id, text: row.newDocumentState.text, completed: row.newDocumentState.completed, _deleted: row.newDocumentState._deleted })
          })
        )
      )
      return []
    }
  },
})


await replicationState.start()

export const todosCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.todos,
    startSync: true, // start ingesting RxDB data immediately
  })
)


export const useGetTodos = () => useLiveQuery(q => q.from({ todos: todosCollection }))
