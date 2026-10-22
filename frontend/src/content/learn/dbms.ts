import er from './dbms/01-er-models'
import keys from './dbms/02-relational-keys'
import sql from './dbms/03-sql-basics'
import joins from './dbms/04-joins-subqueries'
import normal from './dbms/05-normalisation'
import acid from './dbms/06-transactions-acid'
import isolation from './dbms/07-concurrency-isolation'
import indexing from './dbms/08-indexing'
import optimiser from './dbms/09-query-optimisation'
import nosql from './dbms/10-nosql-cap'
import type { Track } from './types'

export const DBMS: Track = {
  id: 'dbms',
  title: 'Database management systems',
  short: 'DBMS',
  summary: 'Design schemas, write SQL, and understand transactions, indexes and how a database runs your query.',
  projects: ['ecommerce-schema', 'kv-store', 'bplus-index'],
  modules: [er, keys, sql, joins, normal, acid, isolation, indexing, optimiser, nosql],
}
