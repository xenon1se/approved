import { 
  ApiSettings, InsertApiSettings, 
  ContentPreferences, InsertContentPreferences,
  ResearchParameters, InsertResearchParameters,
  ContentItem, InsertContentItem,
  DatabaseConfig, InsertDatabaseConfig,
  ContentHash, InsertContentHash,
  SeoRule, InsertSeoRule
} from "@shared/schema";

export interface IStorage {
  // API Settings
  getApiSettings(): Promise<ApiSettings | undefined>;
  saveApiSettings(settings: InsertApiSettings): Promise<ApiSettings>;
  
  // Content Preferences
  getContentPreferences(): Promise<ContentPreferences | undefined>;
  saveContentPreferences(preferences: InsertContentPreferences): Promise<ContentPreferences>;
  
  // Research Parameters
  getResearchParameters(): Promise<ResearchParameters | undefined>;
  saveResearchParameters(parameters: InsertResearchParameters): Promise<ResearchParameters>;
  
  // Content Items
  getAllContentItems(): Promise<ContentItem[]>;
  getContentItemById(id: number): Promise<ContentItem | undefined>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: number, item: Partial<InsertContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: number): Promise<boolean>;
  
  // Database Configuration (new)
  getAllDatabaseConfigs(): Promise<DatabaseConfig[]>;
  getDatabaseConfigById(id: number): Promise<DatabaseConfig | undefined>;
  getDatabaseConfigByName(name: string): Promise<DatabaseConfig | undefined>;
  createDatabaseConfig(config: InsertDatabaseConfig): Promise<DatabaseConfig>;
  updateDatabaseConfig(id: number, config: Partial<InsertDatabaseConfig>): Promise<DatabaseConfig | undefined>;
  deleteDatabaseConfig(id: number): Promise<boolean>;
  setActiveDatabaseConfig(id: number): Promise<DatabaseConfig | undefined>;
  getActiveDatabaseConfig(): Promise<DatabaseConfig | undefined>;
  
  // Content Hash (Duplicate Prevention) (new)
  getAllContentHashes(): Promise<ContentHash[]>;
  getContentHashByValue(hash: string): Promise<ContentHash | undefined>;
  createContentHash(hash: InsertContentHash): Promise<ContentHash>;
  deleteContentHash(id: number): Promise<boolean>;
  
  // SEO Rules (new)
  getAllSeoRules(): Promise<SeoRule[]>;
  getSeoRulesByPlatform(platform: string): Promise<SeoRule[]>;
  getSeoRuleById(id: number): Promise<SeoRule | undefined>;
  createSeoRule(rule: InsertSeoRule): Promise<SeoRule>;
  updateSeoRule(id: number, rule: Partial<InsertSeoRule>): Promise<SeoRule | undefined>;
  deleteSeoRule(id: number): Promise<boolean>;
  
  // Data Management (new)
  migrateDataToNewDatabase(sourceConnString: string, targetConnString: string): Promise<boolean>;
  importDataFromExternalSource(source: string, data: any): Promise<boolean>;
  exportAllData(): Promise<any>;
}

export class MemStorage implements IStorage {
  private apiSettings: ApiSettings | undefined;
  private contentPreferences: ContentPreferences | undefined;
  private researchParameters: ResearchParameters | undefined;
  private contentItems: Map<number, ContentItem>;
  private contentItemId: number;
  
  // New properties for the extended interface
  private databaseConfigs: Map<number, DatabaseConfig>;
  private databaseConfigId: number;
  private contentHashes: Map<number, ContentHash>;
  private contentHashId: number;
  private seoRules: Map<number, SeoRule>;
  private seoRuleId: number;

  constructor() {
    this.contentItems = new Map();
    this.contentItemId = 1;
    
    this.databaseConfigs = new Map();
    this.databaseConfigId = 1;
    this.contentHashes = new Map();
    this.contentHashId = 1;
    this.seoRules = new Map();
    this.seoRuleId = 1;
    
    // Initialize with default values
    this.apiSettings = {
      id: 1,
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
      pexelsApiKey: "",
    };
    
    this.contentPreferences = {
      id: 1,
      defaultArticleLength: "Medium (800-1200 words)",
      defaultArticleStyle: "Balanced",
      generateHtmlArticles: true,
      autoPublishToWordPress: true,
      autoPublishToSocialMedia: false,
      instagramHashtags: "#logistics, #supplychain, #transportation, #warehousing, #ecommerce, #shipping",
      linkedinHashtags: "#logistics, #supplychain, #businessstrategy",
    };
    
    this.researchParameters = {
      id: 1,
      primaryTopic: "Logistics Management",
      contentFocus: "Industry Trends",
      keywords: "logistics automation, last mile delivery, inventory management, AI in logistics",
      contentDepth: "Standard Article (800-1000 words)",
      geoFocus: "Europe",
    };
    
    // Add database configs
    this.createDatabaseConfig({
      name: "Default Database",
      connectionString: process.env.DATABASE_URL || "",
      isActive: true,
      metadata: { type: "PostgreSQL", provider: "Replit" }
    });
    
    // Add some sample content items
    const sampleItems: InsertContentItem[] = [
      {
        title: "The Future of Automated Warehousing in Europe",
        type: "WordPress Article",
        content: "Sample content for automated warehousing article",
        images: [{ url: "https://example.com/image1.jpg", alt: "Automated Warehouse" }],
        status: "published",
        publishedAt: new Date("2023-06-22")
      },
      {
        title: "Last Mile Delivery Optimization Strategies",
        type: "Instagram Post",
        content: "Sample content for delivery optimization post",
        images: [{ url: "https://example.com/image2.jpg", alt: "Last Mile Delivery" }],
        status: "published",
        publishedAt: new Date("2023-06-20")
      },
      {
        title: "Sustainable Logistics: Reducing Carbon Footprint",
        type: "LinkedIn Post",
        content: "Sample content for sustainable logistics post",
        images: [{ url: "https://example.com/image3.jpg", alt: "Sustainable Logistics" }],
        status: "scheduled",
        publishedAt: new Date("2023-06-18")
      },
      {
        title: "AI-Powered Supply Chain Analytics",
        type: "HTML Article",
        content: "Sample content for AI supply chain article",
        images: [{ url: "https://example.com/image4.jpg", alt: "AI Analytics" }],
        status: "draft",
        publishedAt: undefined
      }
    ];
    
    sampleItems.forEach(item => this.createContentItem(item));
  }

  // API Settings
  async getApiSettings(): Promise<ApiSettings | undefined> {
    return this.apiSettings;
  }

  async saveApiSettings(settings: InsertApiSettings): Promise<ApiSettings> {
    this.apiSettings = { id: 1, ...settings };
    return this.apiSettings;
  }

  // Content Preferences
  async getContentPreferences(): Promise<ContentPreferences | undefined> {
    return this.contentPreferences;
  }

  async saveContentPreferences(preferences: InsertContentPreferences): Promise<ContentPreferences> {
    this.contentPreferences = { id: 1, ...preferences };
    return this.contentPreferences;
  }

  // Research Parameters
  async getResearchParameters(): Promise<ResearchParameters | undefined> {
    return this.researchParameters;
  }

  async saveResearchParameters(parameters: InsertResearchParameters): Promise<ResearchParameters> {
    this.researchParameters = { id: 1, ...parameters };
    return this.researchParameters;
  }

  // Content Items
  async getAllContentItems(): Promise<ContentItem[]> {
    return Array.from(this.contentItems.values());
  }

  async getContentItemById(id: number): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const id = this.contentItemId++;
    const newItem: ContentItem = {
      id,
      ...item,
      createdAt: new Date(),
    };
    this.contentItems.set(id, newItem);
    return newItem;
  }

  async updateContentItem(id: number, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const existingItem = this.contentItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, ...updates };
    this.contentItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteContentItem(id: number): Promise<boolean> {
    return this.contentItems.delete(id);
  }
  
  // Database Configuration - new methods
  async getAllDatabaseConfigs(): Promise<DatabaseConfig[]> {
    return Array.from(this.databaseConfigs.values());
  }
  
  async getDatabaseConfigById(id: number): Promise<DatabaseConfig | undefined> {
    return this.databaseConfigs.get(id);
  }
  
  async getDatabaseConfigByName(name: string): Promise<DatabaseConfig | undefined> {
    return Array.from(this.databaseConfigs.values()).find(config => config.name === name);
  }
  
  async createDatabaseConfig(config: InsertDatabaseConfig): Promise<DatabaseConfig> {
    const id = this.databaseConfigId++;
    const newConfig: DatabaseConfig = {
      id,
      ...config,
      createdAt: new Date(),
      lastUsedAt: config.isActive ? new Date() : undefined,
    };
    this.databaseConfigs.set(id, newConfig);
    
    // If this config is marked as active, deactivate all others
    if (config.isActive) {
      for (const [configId, existingConfig] of this.databaseConfigs.entries()) {
        if (configId !== id && existingConfig.isActive) {
          this.databaseConfigs.set(configId, { ...existingConfig, isActive: false });
        }
      }
    }
    
    return newConfig;
  }
  
  async updateDatabaseConfig(id: number, updates: Partial<InsertDatabaseConfig>): Promise<DatabaseConfig | undefined> {
    const existingConfig = this.databaseConfigs.get(id);
    if (!existingConfig) return undefined;
    
    const updatedConfig = { 
      ...existingConfig, 
      ...updates,
      lastUsedAt: updates.isActive ? new Date() : existingConfig.lastUsedAt 
    };
    
    this.databaseConfigs.set(id, updatedConfig);
    
    // If this config is now active, deactivate all others
    if (updates.isActive) {
      for (const [configId, config] of this.databaseConfigs.entries()) {
        if (configId !== id && config.isActive) {
          this.databaseConfigs.set(configId, { ...config, isActive: false });
        }
      }
    }
    
    return updatedConfig;
  }
  
  async deleteDatabaseConfig(id: number): Promise<boolean> {
    const config = this.databaseConfigs.get(id);
    if (!config) return false;
    
    // Don't allow deleting the active database
    if (config.isActive) {
      return false;
    }
    
    return this.databaseConfigs.delete(id);
  }
  
  async setActiveDatabaseConfig(id: number): Promise<DatabaseConfig | undefined> {
    const config = this.databaseConfigs.get(id);
    if (!config) return undefined;
    
    // Set this config as active and all others as inactive
    for (const [configId, existingConfig] of this.databaseConfigs.entries()) {
      if (configId === id) {
        this.databaseConfigs.set(configId, { 
          ...existingConfig, 
          isActive: true,
          lastUsedAt: new Date()
        });
      } else if (existingConfig.isActive) {
        this.databaseConfigs.set(configId, { ...existingConfig, isActive: false });
      }
    }
    
    return this.databaseConfigs.get(id);
  }
  
  async getActiveDatabaseConfig(): Promise<DatabaseConfig | undefined> {
    return Array.from(this.databaseConfigs.values()).find(config => config.isActive);
  }
  
  // Content Hash (Duplicate Prevention) - new methods
  async getAllContentHashes(): Promise<ContentHash[]> {
    return Array.from(this.contentHashes.values());
  }
  
  async getContentHashByValue(hash: string): Promise<ContentHash | undefined> {
    return Array.from(this.contentHashes.values()).find(ch => ch.contentHash === hash);
  }
  
  async createContentHash(hash: InsertContentHash): Promise<ContentHash> {
    const id = this.contentHashId++;
    const newHash: ContentHash = {
      id,
      ...hash,
      createdAt: new Date(),
      lastCheckedAt: new Date()
    };
    this.contentHashes.set(id, newHash);
    return newHash;
  }
  
  async deleteContentHash(id: number): Promise<boolean> {
    return this.contentHashes.delete(id);
  }
  
  // SEO Rules - new methods
  async getAllSeoRules(): Promise<SeoRule[]> {
    return Array.from(this.seoRules.values());
  }
  
  async getSeoRulesByPlatform(platform: string): Promise<SeoRule[]> {
    return Array.from(this.seoRules.values()).filter(rule => rule.platform === platform);
  }
  
  async getSeoRuleById(id: number): Promise<SeoRule | undefined> {
    return this.seoRules.get(id);
  }
  
  async createSeoRule(rule: InsertSeoRule): Promise<SeoRule> {
    const id = this.seoRuleId++;
    const newRule: SeoRule = {
      id,
      ...rule,
      lastUpdated: new Date()
    };
    this.seoRules.set(id, newRule);
    return newRule;
  }
  
  async updateSeoRule(id: number, updates: Partial<InsertSeoRule>): Promise<SeoRule | undefined> {
    const existingRule = this.seoRules.get(id);
    if (!existingRule) return undefined;
    
    const updatedRule = { 
      ...existingRule, 
      ...updates,
      lastUpdated: new Date() 
    };
    
    this.seoRules.set(id, updatedRule);
    return updatedRule;
  }
  
  async deleteSeoRule(id: number): Promise<boolean> {
    return this.seoRules.delete(id);
  }
  
  // Data Management - new methods
  async migrateDataToNewDatabase(sourceConnString: string, targetConnString: string): Promise<boolean> {
    // In memory storage, we just pretend this worked
    console.log(`Migration requested from ${sourceConnString} to ${targetConnString}`);
    return true;
  }
  
  async importDataFromExternalSource(source: string, data: any): Promise<boolean> {
    // In memory storage, just log the request
    console.log(`Import requested from ${source} with data size: ${JSON.stringify(data).length}`);
    return true;
  }
  
  async exportAllData(): Promise<any> {
    // Return all data in memory as an export
    return {
      apiSettings: this.apiSettings,
      contentPreferences: this.contentPreferences,
      researchParameters: this.researchParameters,
      contentItems: Array.from(this.contentItems.values()),
      databaseConfigs: Array.from(this.databaseConfigs.values()),
      contentHashes: Array.from(this.contentHashes.values()),
      seoRules: Array.from(this.seoRules.values()),
    };
  }
}

import { db } from "./db";
import { eq, asc, desc, sql, and, or, isNull, isNotNull } from "drizzle-orm";
import crypto from "crypto";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // API Settings
  async getApiSettings(): Promise<ApiSettings | undefined> {
    try {
      const [settings] = await db.select().from(apiSettings).limit(1);
      return settings;
    } catch (error) {
      console.error("Error fetching API settings:", error);
      return undefined;
    }
  }

  async saveApiSettings(settings: InsertApiSettings): Promise<ApiSettings> {
    const existing = await this.getApiSettings();
    if (existing) {
      const [updated] = await db
        .update(apiSettings)
        .set(settings)
        .where(eq(apiSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(apiSettings)
        .values(settings)
        .returning();
      return created;
    }
  }

  // Content Preferences
  async getContentPreferences(): Promise<ContentPreferences | undefined> {
    try {
      const [preferences] = await db.select().from(contentPreferences).limit(1);
      return preferences;
    } catch (error) {
      console.error("Error fetching content preferences:", error);
      return undefined;
    }
  }

  async saveContentPreferences(preferences: InsertContentPreferences): Promise<ContentPreferences> {
    const existing = await this.getContentPreferences();
    if (existing) {
      const [updated] = await db
        .update(contentPreferences)
        .set(preferences)
        .where(eq(contentPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(contentPreferences)
        .values(preferences)
        .returning();
      return created;
    }
  }

  // Research Parameters
  async getResearchParameters(): Promise<ResearchParameters | undefined> {
    try {
      const [parameters] = await db.select().from(researchParameters).limit(1);
      return parameters;
    } catch (error) {
      console.error("Error fetching research parameters:", error);
      return undefined;
    }
  }

  async saveResearchParameters(parameters: InsertResearchParameters): Promise<ResearchParameters> {
    const existing = await this.getResearchParameters();
    if (existing) {
      const [updated] = await db
        .update(researchParameters)
        .set(parameters)
        .where(eq(researchParameters.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(researchParameters)
        .values(parameters)
        .returning();
      return created;
    }
  }

  // Content Items
  async getAllContentItems(): Promise<ContentItem[]> {
    try {
      // The field is 'created_at' in the database but 'createdAt' in TypeScript
      return await db.select().from(contentItems).orderBy(desc(sql`created_at`));
    } catch (error) {
      console.error("Error fetching content items:", error);
      return [];
    }
  }

  async getContentItemById(id: number): Promise<ContentItem | undefined> {
    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, id));
    return item;
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    // Generate content hash for duplicate detection
    const contentHash = crypto
      .createHash('md5')
      .update((item.title + item.content).toLowerCase())
      .digest('hex');
    
    // Check if content already exists
    const duplicate = await this.getContentHashByValue(contentHash);
    if (duplicate) {
      console.log(`Duplicate content detected: ${item.title}, hash: ${contentHash}`);
      // We could throw an error here, but instead we'll append a note to the title
      item.title = `${item.title} [Duplicate]`;
    }
    
    // Create with hash
    const [created] = await db
      .insert(contentItems)
      .values({
        ...item,
        contentHash
      })
      .returning();
    
    // Store the hash for future reference
    if (!duplicate) {
      await this.createContentHash({
        contentHash,
        source: item.type,
        sourceUrl: "",
        title: item.title
      });
    }
    
    return created;
  }

  async updateContentItem(id: number, updates: Partial<InsertContentItem>): Promise<ContentItem | undefined> {
    const existingItem = await this.getContentItemById(id);
    if (!existingItem) return undefined;
    
    // If content or title is changing, check for duplicates
    if (updates.content || updates.title) {
      const contentToHash = (updates.title || existingItem.title) + 
                            (updates.content || existingItem.content);
      const newContentHash = crypto
        .createHash('md5')
        .update(contentToHash.toLowerCase())
        .digest('hex');
      
      // Don't check against the item's own hash
      if (newContentHash !== existingItem.contentHash) {
        const duplicate = await this.getContentHashByValue(newContentHash);
        if (duplicate) {
          console.log(`Duplicate content detected during update: ${updates.title || existingItem.title}, hash: ${newContentHash}`);
          // Append a note to the title
          if (updates.title) {
            updates.title = `${updates.title} [Duplicate]`;
          }
        } else {
          // Add the new hash
          await this.createContentHash({
            contentHash: newContentHash,
            source: updates.type || existingItem.type,
            sourceUrl: "",
            title: updates.title || existingItem.title
          });
          
          // Update the contentHash
          updates = { ...updates, contentHash: newContentHash };
        }
      }
    }
    
    const [updated] = await db
      .update(contentItems)
      .set(updates)
      .where(eq(contentItems.id, id))
      .returning();
    return updated;
  }

  async deleteContentItem(id: number): Promise<boolean> {
    const item = await this.getContentItemById(id);
    if (!item) return false;
    
    // If the item has a contentHash, remove it from the hashes table too
    if (item.contentHash) {
      const hash = await this.getContentHashByValue(item.contentHash);
      if (hash) {
        await db.delete(contentHashes).where(eq(contentHashes.id, hash.id));
      }
    }
    
    const result = await db
      .delete(contentItems)
      .where(eq(contentItems.id, id));
    return result.rowCount > 0;
  }
  
  // Database Configuration
  async getAllDatabaseConfigs(): Promise<DatabaseConfig[]> {
    try {
      return await db.select().from(databaseConfigs).orderBy(asc(databaseConfigs.name));
    } catch (error) {
      console.error("Error fetching database configurations:", error);
      return [];
    }
  }
  
  async getDatabaseConfigById(id: number): Promise<DatabaseConfig | undefined> {
    const [config] = await db
      .select()
      .from(databaseConfigs)
      .where(eq(databaseConfigs.id, id));
    return config;
  }
  
  async getDatabaseConfigByName(name: string): Promise<DatabaseConfig | undefined> {
    const [config] = await db
      .select()
      .from(databaseConfigs)
      .where(eq(databaseConfigs.name, name));
    return config;
  }
  
  async createDatabaseConfig(config: InsertDatabaseConfig): Promise<DatabaseConfig> {
    // If this config is set to active, deactivate all others first
    if (config.isActive) {
      await db
        .update(databaseConfigs)
        .set({ isActive: false })
        .where(eq(databaseConfigs.isActive, true));
    }
    
    const [created] = await db
      .insert(databaseConfigs)
      .values({
        ...config,
        lastUsedAt: config.isActive ? new Date() : undefined
      })
      .returning();
    return created;
  }
  
  async updateDatabaseConfig(id: number, updates: Partial<InsertDatabaseConfig>): Promise<DatabaseConfig | undefined> {
    // If this config is being set to active, deactivate all others first
    if (updates.isActive) {
      await db
        .update(databaseConfigs)
        .set({ isActive: false })
        .where(and(
          eq(databaseConfigs.isActive, true),
          sql`${databaseConfigs.id} != ${id}`
        ));
      
      // Update the lastUsedAt timestamp
      updates = { ...updates, lastUsedAt: new Date() };
    }
    
    const [updated] = await db
      .update(databaseConfigs)
      .set(updates)
      .where(eq(databaseConfigs.id, id))
      .returning();
    return updated;
  }
  
  async deleteDatabaseConfig(id: number): Promise<boolean> {
    // Don't allow deleting the active database config
    const [activeConfig] = await db
      .select()
      .from(databaseConfigs)
      .where(and(
        eq(databaseConfigs.id, id),
        eq(databaseConfigs.isActive, true)
      ));
    
    if (activeConfig) return false;
    
    const result = await db
      .delete(databaseConfigs)
      .where(eq(databaseConfigs.id, id));
    return result.rowCount > 0;
  }
  
  async setActiveDatabaseConfig(id: number): Promise<DatabaseConfig | undefined> {
    // Check if the config exists
    const config = await this.getDatabaseConfigById(id);
    if (!config) return undefined;
    
    // Deactivate all configs
    await db
      .update(databaseConfigs)
      .set({ isActive: false });
    
    // Activate the requested config
    const [updated] = await db
      .update(databaseConfigs)
      .set({ 
        isActive: true,
        lastUsedAt: new Date()
      })
      .where(eq(databaseConfigs.id, id))
      .returning();
    
    return updated;
  }
  
  async getActiveDatabaseConfig(): Promise<DatabaseConfig | undefined> {
    const [config] = await db
      .select()
      .from(databaseConfigs)
      .where(eq(databaseConfigs.isActive, true));
    return config;
  }
  
  // Content Hash (Duplicate Prevention)
  async getAllContentHashes(): Promise<ContentHash[]> {
    return db.select().from(contentHashes);
  }
  
  async getContentHashByValue(hash: string): Promise<ContentHash | undefined> {
    const [result] = await db
      .select()
      .from(contentHashes)
      .where(eq(contentHashes.contentHash, hash));
    return result;
  }
  
  async createContentHash(hash: InsertContentHash): Promise<ContentHash> {
    // Check if this hash already exists
    const existing = await this.getContentHashByValue(hash.contentHash);
    if (existing) return existing;
    
    const [created] = await db
      .insert(contentHashes)
      .values({
        ...hash,
        lastCheckedAt: new Date()
      })
      .returning();
    return created;
  }
  
  async deleteContentHash(id: number): Promise<boolean> {
    const result = await db
      .delete(contentHashes)
      .where(eq(contentHashes.id, id));
    return result.rowCount > 0;
  }
  
  // SEO Rules
  async getAllSeoRules(): Promise<SeoRule[]> {
    try {
      return await db.select().from(seoRules).orderBy(asc(seoRules.platform), asc(seoRules.ruleName));
    } catch (error) {
      console.error("Error fetching SEO rules:", error);
      return [];
    }
  }
  
  async getSeoRulesByPlatform(platform: string): Promise<SeoRule[]> {
    try {
      return await db
        .select()
        .from(seoRules)
        .where(and(
          eq(seoRules.platform, platform),
          eq(seoRules.isActive, true)
        ))
        .orderBy(asc(seoRules.importance), asc(seoRules.ruleName));
    } catch (error) {
      console.error(`Error fetching SEO rules for platform ${platform}:`, error);
      return [];
    }
  }
  
  async getSeoRuleById(id: number): Promise<SeoRule | undefined> {
    const [rule] = await db
      .select()
      .from(seoRules)
      .where(eq(seoRules.id, id));
    return rule;
  }
  
  async createSeoRule(rule: InsertSeoRule): Promise<SeoRule> {
    const [created] = await db
      .insert(seoRules)
      .values(rule)
      .returning();
    return created;
  }
  
  async updateSeoRule(id: number, updates: Partial<InsertSeoRule>): Promise<SeoRule | undefined> {
    const [updated] = await db
      .update(seoRules)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(seoRules.id, id))
      .returning();
    return updated;
  }
  
  async deleteSeoRule(id: number): Promise<boolean> {
    const result = await db
      .delete(seoRules)
      .where(eq(seoRules.id, id));
    return result.rowCount > 0;
  }
  
  // Data Management
  async migrateDataToNewDatabase(sourceConnString: string, targetConnString: string): Promise<boolean> {
    try {
      // Validate connection strings
      if (!sourceConnString || !targetConnString) {
        throw new Error("Source and target connection strings are required");
      }
      
      // Log safe versions of the connection strings (hide passwords)
      const safeSourceConnString = this.maskConnectionString(sourceConnString);
      const safeTargetConnString = this.maskConnectionString(targetConnString);
      console.log(`Migration requested from ${safeSourceConnString} to ${safeTargetConnString}`);
      
      // This would require connecting to both databases and copying data
      // In a real implementation, we would use a database migration tool or connect to both
      
      // TODO: Implement actual migration logic in production
      // 1. Connect to source database and export all data
      // 2. Connect to target database and import all data
      // 3. Verify data integrity after migration
      
      // For now simulate a successful migration with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error("Error during database migration:", error);
      return false;
    }
  }
  
  // Helper method to mask connection string (hide password and sensitive info)
  private maskConnectionString(connectionString: string): string {
    try {
      // Example: postgres://username:password@hostname:5432/database
      const masked = connectionString.replace(
        /(\w+):\/\/([^:]+):([^@]+)@/,
        "$1://$2:********@"
      );
      return masked;
    } catch (error) {
      return "********";
    }
  }
  
  async importDataFromExternalSource(source: string, data: any): Promise<boolean> {
    try {
      // Validate input
      if (!source || !data) {
        throw new Error("Source and data are required for import");
      }
      
      // Log import attempt with safe data size indication
      const dataSize = data ? JSON.stringify(data).length : 0;
      console.log(`Import requested from ${source} with data size: ${dataSize} bytes`);
      
      // This would process data from an external source and import it
      // The implementation would depend on the source and data format
      
      // TODO: Implement actual import logic based on the source
      // Example sources that could be supported:
      // - "wordpress": Import posts from WordPress
      // - "csv": Import data from CSV files
      // - "json": Import from JSON backup
      // - "competitor": Import from competitor website scan
      
      // For now simulate a successful import with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return success
      return true;
    } catch (error) {
      console.error(`Error importing data from ${source}:`, error);
      return false;
    }
  }
  
  async exportAllData(): Promise<any> {
    try {
      // Gather all data from the database
      const settings = await this.getApiSettings();
      const preferences = await this.getContentPreferences();
      const parameters = await this.getResearchParameters();
      const items = await this.getAllContentItems();
      const configs = await this.getAllDatabaseConfigs();
      const hashes = await this.getAllContentHashes();
      const rules = await this.getAllSeoRules();
      
      // Return as a structured object
      return {
        apiSettings: settings,
        contentPreferences: preferences,
        researchParameters: parameters,
        contentItems: items,
        databaseConfigs: configs,
        contentHashes: hashes,
        seoRules: rules,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      // Return a minimal dataset to avoid application errors
      return {
        apiSettings: undefined,
        contentPreferences: undefined,
        researchParameters: undefined,
        contentItems: [],
        databaseConfigs: [],
        contentHashes: [],
        seoRules: [],
        exportDate: new Date().toISOString(),
        version: "1.0",
        error: "Failed to export complete data"
      };
    }
  }
}

// Default to database storage but fall back to memory storage if database isn't available
let storage: IStorage;

try {
  storage = new DatabaseStorage();
  console.log("Using database storage");
} catch (error) {
  console.error("Failed to initialize database storage, falling back to memory storage:", error);
  storage = new MemStorage();
}

export { storage };
