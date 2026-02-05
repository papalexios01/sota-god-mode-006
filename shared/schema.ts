import { pgTable, text, integer, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const generatedBlogPosts = pgTable("generated_blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: text("item_id").unique().notNull(),
  title: text("title").notNull(),
  seoTitle: text("seo_title"),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  slug: text("slug"),
  primaryKeyword: text("primary_keyword").notNull(),
  secondaryKeywords: jsonb("secondary_keywords").default([]),
  wordCount: integer("word_count").default(0),
  qualityScore: jsonb("quality_score").default({}),
  internalLinks: jsonb("internal_links").default([]),
  schema: jsonb("schema"),
  serpAnalysis: jsonb("serp_analysis"),
  neuronwriterQueryId: text("neuronwriter_query_id"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  model: text("model"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_blog_posts_item_id").on(table.itemId),
  index("idx_blog_posts_keyword").on(table.primaryKeyword),
  index("idx_blog_posts_generated_at").on(table.generatedAt),
]);

export type GeneratedBlogPost = typeof generatedBlogPosts.$inferSelect;
export type InsertBlogPost = typeof generatedBlogPosts.$inferInsert;
