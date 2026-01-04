import { makeSchema, State } from '@livestore/livestore'
import { authEvents, authTables, authMaterializers } from './auth'
import { ordersEvents, ordersMaterializers, ordersTable } from './orders'

export const tables = {
  orders: ordersTable,
}

export const events = {
  ...ordersEvents
}


export const materializers = {
  ...ordersMaterializers

}

const state = State.SQLite.makeState({ tables, materializers })
export const schema = makeSchema({ events, state })
