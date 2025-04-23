import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database Configuration schema (new)
export const databaseConfigs = pgTable("database_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  connectionString: text("connection_string").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  metadata: jsonb("metadata"), // Additional connection info or stats
});

export const insertDatabaseConfigSchema = createInsertSchema(databaseConfigs).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

// Content Duplicate Prevention schema (new)
export const contentHashes = pgTable("content_hashes", {
  id: serial("id").primaryKey(),
  contentHash: varchar("content_hash", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 100 }).notNull(), // 'wordpress', 'instagram', 'linkedin', etc.
  sourceUrl: text("source_url"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  lastCheckedAt: timestamp("last_checked_at"),
});

export const insertContentHashSchema = createInsertSchema(contentHashes).omit({
  id: true,
  createdAt: true,
  lastCheckedAt: true,
});

// SEO Rules schema (new)
export const seoRules = pgTable("seo_rules", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 100 }).notNull(), // 'wordpress', 'instagram', 'linkedin', etc.
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleContent: text("rule_content").notNull(),
  importance: varchar("importance", { length: 50 }), // 'high', 'medium', 'low'
  category: varchar("category", { length: 100 }), // 'title', 'content', 'hashtags', etc.
  lastUpdated: timestamp("last_updated").defaultNow(),
  source: text("source"), // Where this rule was found
  isActive: boolean("is_active").default(true),
});

export const insertSeoRuleSchema = createInsertSchema(seoRules).omit({
  id: true,
  lastUpdated: true,
});

// API Settings schema
export const apiSettings = pgTable("api_settings", {
  id: serial("id").primaryKey(),
  perplexityApiKey: text("perplexity_api_key"),
  deepseekApiKey: text("deepseek_api_key"),
  deeplApiKey: text("deepl_api_key"),
  wordpressApiUrl: text("wordpress_api_url"),
  wordpressUsername: text("wordpress_username"),
  wordpressPassword: text("wordpress_password"),
  instagramAccessToken: text("instagram_access_token"),
  linkedinClientId: text("linkedin_client_id"),
  linkedinClientSecret: text("linkedin_client_secret"),
  facebookAccessToken: text("facebook_access_token"),
  pexelsApiKey: text("pexels_api_key"),
});

export const insertApiSettingsSchema = createInsertSchema(apiSettings).omit({
  id: true,
});

// Content Preferences schema
export const contentPreferences = pgTable("content_preferences", {
  id: serial("id").primaryKey(),
  defaultArticleLength: text("default_article_length").default("Medium (800-1200 words)"),
  defaultArticleStyle: text("default_article_style").default("Balanced"),
  generateHtmlArticles: boolean("generate_html_articles").default(true),
  autoPublishToWordPress: boolean("auto_publish_to_wordpress").default(true),
  autoPublishToSocialMedia: boolean("auto_publish_to_social_media").default(false),
  instagramHashtags: text("instagram_hashtags").default("#logistics, #supplychain, #transportation, #warehousing, #ecommerce, #shipping"),
  linkedinHashtags: text("linkedin_hashtags").default("#logistics, #supplychain, #businessstrategy"),
});

export const insertContentPreferencesSchema = createInsertSchema(contentPreferences).omit({
  id: true,
});

// Research Parameters schema
export const researchParameters = pgTable("research_parameters", {
  id: serial("id").primaryKey(),
  primaryTopic: text("primary_topic").default("Logistics Management"),
  contentFocus: text("content_focus").default("Industry Trends"),
  keywords: text("keywords").default("logistics automation, last mile delivery, inventory management, AI in logistics"),
  contentDepth: text("content_depth").default("Standard Article (800-1000 words)"),
  geoFocus: text("geo_focus").default("Europe"),
});

export const insertResearchParametersSchema = createInsertSchema(researchParameters).omit({
  id: true,
});

// Content Items schema (updated with new fields)
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // WordPress, HTML, Instagram, LinkedIn
  content: text("content").notNull(),
  images: jsonb("images").default([]),
  status: text("status").default("draft"), // draft, published, scheduled
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  // New fields
  contentHash: varchar("content_hash", { length: 255 }), // For duplicate detection
  seoScore: jsonb("seo_score"), // Track SEO score improvements over time
  appliedSeoRules: jsonb("applied_seo_rules"), // Which SEO rules were applied
  previousVersions: jsonb("previous_versions"), // Track content improvements
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  contentHash: true,
  seoScore: true,
  appliedSeoRules: true,
  previousVersions: true,
});

// Types
export type DatabaseConfig = typeof databaseConfigs.$inferSelect;
export type InsertDatabaseConfig = z.infer<typeof insertDatabaseConfigSchema>;

export type ContentHash = typeof contentHashes.$inferSelect;
export type InsertContentHash = z.infer<typeof insertContentHashSchema>;

export type SeoRule = typeof seoRules.$inferSelect;
export type InsertSeoRule = z.infer<typeof insertSeoRuleSchema>;

export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;

export type ContentPreferences = typeof contentPreferences.$inferSelect;
export type InsertContentPreferences = z.infer<typeof insertContentPreferencesSchema>;

export type ResearchParameters = typeof researchParameters.$inferSelect;
export type InsertResearchParameters = z.infer<typeof insertResearchParametersSchema>;

export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
