import { worker } from '@electric-sql/pglite/worker'
import { PGlite, IdbFs } from '@electric-sql/pglite'
import { OpfsAhpFS } from '@electric-sql/pglite/opfs-ahp'
import { MemoryFS } from '@electric-sql/pglite'

//return new PGlite({ fs: new OpfsAhpFS("'opfs-ahp://polynome_pglite/v1/'") }
worker({
  async init() {
    return new PGlite()
  },
})
