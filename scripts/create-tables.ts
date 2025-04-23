import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    console.log("Creating tables...");
    
    // Create tables for API settings
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_settings (
        id SERIAL PRIMARY KEY,
        perplexity_api_key TEXT,
        deepseek_api_key TEXT,
        deepl_api_key TEXT,
        wordpress_api_url TEXT,
        wordpress_username TEXT,
        wordpress_password TEXT,
        instagram_access_token TEXT,
        linkedin_client_id TEXT,
        linkedin_client_secret TEXT,
        facebook_access_token TEXT,
        pexels_api_key TEXT
      );
    `);
    console.log("api_settings table created");
    
    // Create tables for content preferences
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_preferences (
        id SERIAL PRIMARY KEY,
        default_article_length TEXT DEFAULT 'Medium (800-1200 words)',
        default_article_style TEXT DEFAULT 'Balanced',
        generate_html_articles BOOLEAN DEFAULT TRUE,
        auto_publish_to_wordpress BOOLEAN DEFAULT TRUE,
        auto_publish_to_social_media BOOLEAN DEFAULT FALSE,
        instagram_hashtags TEXT DEFAULT '#logistics, #supplychain, #transportation, #warehousing, #ecommerce, #shipping',
        linkedin_hashtags TEXT DEFAULT '#logistics, #supplychain, #businessstrategy'
      );
    `);
    console.log("content_preferences table created");
    
    // Create tables for research parameters
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS research_parameters (
        id SERIAL PRIMARY KEY,
        primary_topic TEXT DEFAULT 'Logistics Management',
        content_focus TEXT DEFAULT 'Industry Trends',
        keywords TEXT DEFAULT 'logistics automation, last mile delivery, inventory management, AI in logistics',
        content_depth TEXT DEFAULT 'Standard Article (800-1000 words)',
        geo_focus TEXT DEFAULT 'Europe'
      );
    `);
    console.log("research_parameters table created");
    
    // Create tables for content items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        images JSONB DEFAULT '[]',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMP,
        content_hash VARCHAR(255),
        seo_score JSONB,
        applied_seo_rules JSONB,
        previous_versions JSONB
      );
    `);
    console.log("content_items table created");
    
    // Create tables for database configs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS database_configs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        connection_string TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP,
        metadata JSONB
      );
    `);
    console.log("database_configs table created");
    
    // Create tables for content hashes
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_hashes (
        id SERIAL PRIMARY KEY,
        content_hash VARCHAR(255) NOT NULL UNIQUE,
        source VARCHAR(100) NOT NULL,
        source_url TEXT,
        title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_checked_at TIMESTAMP
      );
    `);
    console.log("content_hashes table created");
    
    // Create tables for SEO rules
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS seo_rules (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        rule_name VARCHAR(255) NOT NULL,
        rule_content TEXT NOT NULL,
        importance VARCHAR(50),
        category VARCHAR(100),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source TEXT,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    console.log("seo_rules table created");
    
    // Insert default database config (current database)
    const [existingConfig] = await db.select().from(schema.databaseConfigs).limit(1);
    
    if (!existingConfig) {
      await db.insert(schema.databaseConfigs).values({
        name: "Database Predefinito",
        connectionString: process.env.DATABASE_URL || "",
        isActive: true,
        metadata: { type: "PostgreSQL", provider: "Replit" }
      });
      console.log("Default database config created");
    }
    
    // Insert default API settings if not exist
    const [existingSettings] = await db.select().from(schema.apiSettings).limit(1);
    
    if (!existingSettings) {
      await db.insert(schema.apiSettings).values({
        perplexityApiKey: process.env.PERPLEXITY_API_KEY || "",
        deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
        deeplApiKey: process.env.DEEPL_API_KEY || "",
        wordpressApiUrl: "",
        wordpressUsername: "",
        wordpressPassword: "",
        instagramAccessToken: "",
        linkedinClientId: "",
        linkedinClientSecret: "",
        facebookAccessToken: "",
        pexelsApiKey: ""
      });
      console.log("Default API settings created");
    }
    
    // Insert default content preferences if not exist
    const [existingPreferences] = await db.select().from(schema.contentPreferences).limit(1);
    
    if (!existingPreferences) {
      await db.insert(schema.contentPreferences).values({
        defaultArticleLength: "Medium (800-1200 words)",
        defaultArticleStyle: "Balanced",
        generateHtmlArticles: true,
        autoPublishToWordPress: false,
        autoPublishToSocialMedia: false,
        instagramHashtags: "#logistics, #supplychain, #transportation, #warehousing, #ecommerce, #shipping",
        linkedinHashtags: "#logistics, #supplychain, #businessstrategy"
      });
      console.log("Default content preferences created");
    }
    
    // Insert default research parameters if not exist
    const [existingParameters] = await db.select().from(schema.researchParameters).limit(1);
    
    if (!existingParameters) {
      await db.insert(schema.researchParameters).values({
        primaryTopic: "Logistics Management",
        contentFocus: "Industry Trends",
        keywords: "logistics automation, last mile delivery, inventory management, AI in logistics",
        contentDepth: "Standard Article (800-1000 words)",
        geoFocus: "Europe"
      });
      console.log("Default research parameters created");
    }
    
    console.log("All tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
}

createTables();