import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // generate не подключается к базе, поэтому пустое значение допустимо без DATABASE_URL
    url: process.env['DATABASE_URL'] ?? '',
  },
});
