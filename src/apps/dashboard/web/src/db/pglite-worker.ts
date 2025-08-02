import { worker } from '@electric-sql/pglite/worker'
import { PGlite } from '@electric-sql/pglite'
import { OpfsAhpFS } from '@electric-sql/pglite/opfs-ahp'

worker({
  async init() {
    return new PGlite({ fs: new OpfsAhpFS("'opfs-ahp://polynome_pglite/v1/'") }
    )
  },
})
