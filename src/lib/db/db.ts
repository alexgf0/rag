import pg, { types } from 'pg'

const { Pool } = pg

export const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'rag'
})

export default function configureDatabase() {
    types.setTypeParser(
    1700,
    function(val) {
        return parseFloat(val);
    });
}

configureDatabase()