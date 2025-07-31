import { worker } from '@electric-sql/pglite/worker'
import { PGlite } from '@electric-sql/pglite'

worker({
  async init() {
    const pg = await PGlite.create({
      dataDir: 'idb://polynome_sqlite_db',
      relaxedDurability: true,
    })
    // Migrate the database to the latest schema
    return pg
  },
})
