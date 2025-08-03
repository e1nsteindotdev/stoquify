import { makePersistedAdapter } from '@livestore/adapter-expo'
import { nanoid } from '@livestore/livestore'
import { LiveStoreProvider } from '@livestore/react'
import { makeCfSync } from '@livestore/sync-cf'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Button, StyleSheet, Text, unstable_batchedUpdates as batchUpdates, View } from 'react-native'

import { Filters } from './components/Filters.tsx'
import { ListTodos } from './components/ListTodos.tsx'
import { Meta } from './components/Meta.tsx'
import { NewTodo } from './components/NewTodo.tsx'
import { events, schema, tables } from './livestore/schema.ts'

const storeId = "store-id-2"

const adapter = makePersistedAdapter({
  sync: {
    backend: makeCfSync({ url: "http://localhost:8787" }),
    onSyncError: 'shutdown'
  },
})

export const Root = () => {
  const [, rerender] = React.useState({})

  return (
    <View style={styles.container}>
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        storeId={storeId}
        syncPayload={{ authToken: 'insecure-token-change-me' }}
        renderLoading={(_) => <Text>Loading LiveStore ({_.stage})...</Text>}
        renderError={(error: any) => <Text>Error: {error.toString()}</Text>}
        renderShutdown={() => {
          return (
            <View>
              <Text>LiveStore Shutdown</Text>
              <Button title="Reload" onPress={() => rerender({})} />
            </View>
          )
        }}
        boot={(store) => {
          if (store.query(tables.todos.count()) === 0) {
            store.commit(events.todoCreated({ id: nanoid(), text: 'Make coffee' }))
          }
        }}
        batchUpdates={batchUpdates}
      >
        <InnerApp />
      </LiveStoreProvider>
      <StatusBar style="auto" />
    </View>
  )
}

const InnerApp = () => (
  <>
    <NewTodo />
    <Meta />
    <ListTodos />
    <Filters />
  </>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
  },
})
