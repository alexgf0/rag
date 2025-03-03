import pg, { types } from 'pg';

const { Pool } = pg;

// Read database configuration from environment variables
export const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'db', // Use 'db' to match the service name in Docker Compose
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'rag'
});

export default function configureDatabase() {
    types.setTypeParser(
        1700,
        function (val) {
            return parseFloat(val);
        }
    );
}

configureDatabase();
