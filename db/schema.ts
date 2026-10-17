import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const quotas=sqliteTable('quotas',{
  key:text('key').primaryKey(),
  count:integer('count').notNull().default(0),
  expires:integer('expires').notNull(),
});
