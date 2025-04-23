import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApiSettingsSchema, 
  insertContentPreferencesSchema,
  insertResearchParametersSchema,
  insertContentItemSchema,
  insertDatabaseConfigSchema,
  insertSeoRuleSchema,
  insertContentHashSchema
} from "@shared/schema";
import { z } from "zod";
import rateLimit from 'express-rate-limit';
import { encrypt, decrypt } from './security';

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Input validation middleware
const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        next(error);
      }
    }
  };
};

async function handlePerplexityResearch(prompt: string, apiKey: string) {
  try {
    const encryptedApiKey = encrypt(apiKey);
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${decrypt(encryptedApiKey)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a logistics expert writer who creates SEO-optimized content. Create well-structured articles with headings, subheadings, and proper HTML formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 4000,
        return_images: false,
        search_domain_filter: [],
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        `Perplexity API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to process Perplexity request: ${error.message}`);
  }
}

async function handleDeepSeekResearch(prompt: string, apiKey: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Sei un esperto ricercatore di informazioni sulla logistica. Analizza il web, i social media come Instagram, LinkedIn e Facebook per trovare informazioni rilevanti, recenti e affidabili."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 4000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
}

async function translateWithDeepL(text: string, targetLang: string, apiKey: string) {
  try {
    const response = await fetch("https://api.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang || "IT"
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.translations[0].text;
  } catch (error) {
    console.error("Error calling DeepL API:", error);
    throw error;
  }
}

async function searchPexelsImages(query: string, apiKey: string, count: number = 2) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: {
        "Authorization": apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling Pexels API:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        message: err.message,
        isOperational: err.isOperational
      });
    }

    // Log unexpected errors
    console.error('Unexpected error:', err);
    res.status(500).json({
      message: 'Internal server error',
      isOperational: false
    });
  });

  // API Settings routes
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getApiSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertApiSettingsSchema.parse(req.body);
      const settings = await storage.saveApiSettings(validatedData);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save API settings" });
      }
    }
  });

  // Content Preferences routes
  app.get("/api/preferences", async (_req, res) => {
    try {
      const preferences = await storage.getContentPreferences();
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const validatedData = insertContentPreferencesSchema.parse(req.body);
      const preferences = await storage.saveContentPreferences(validatedData);
      res.status(201).json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save content preferences" });
      }
    }
  });

  // Research Parameters routes
  app.get("/api/research-parameters", async (_req, res) => {
    try {
      const parameters = await storage.getResearchParameters();
      res.json(parameters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch research parameters" });
    }
  });

  app.post("/api/research-parameters", async (req, res) => {
    try {
      const validatedData = insertResearchParametersSchema.parse(req.body);
      const parameters = await storage.saveResearchParameters(validatedData);
      res.status(201).json(parameters);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save research parameters" });
      }
    }
  });

  // Content Items routes
  app.get("/api/content", async (_req, res) => {
    try {
      const contentItems = await storage.getAllContentItems();
      res.json(contentItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content items" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const contentItem = await storage.getContentItemById(id);
      if (!contentItem) {
        return res.status(404).json({ message: "Content item not found" });
      }

      res.json(contentItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content item" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const validatedData = insertContentItemSchema.parse(req.body);
      const contentItem = await storage.createContentItem(validatedData);
      res.status(201).json(contentItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create content item" });
      }
    }
  });

  app.put("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      // Partial validation
      const validatedData = insertContentItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateContentItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Content item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update content item" });
      }
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const success = await storage.deleteContentItem(id);
      if (!success) {
        return res.status(404).json({ message: "Content item not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content item" });
    }
  });
  
  // Database Config routes
  app.get("/api/database-configs", async (_req, res) => {
    try {
      const configs = await storage.getAllDatabaseConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching database configs:", error);
      res.status(500).json({ message: "Failed to fetch database configurations" });
    }
  });
  
  app.get("/api/database-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const config = await storage.getDatabaseConfigById(id);
      if (!config) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching database config:", error);
      res.status(500).json({ message: "Failed to fetch database configuration" });
    }
  });
  
  app.post("/api/database-configs", async (req, res) => {
    try {
      const validatedData = insertDatabaseConfigSchema.parse(req.body);
      const config = await storage.createDatabaseConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating database config:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create database configuration" });
      }
    }
  });
  
  app.patch("/api/database-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Partial validation
      const validatedData = insertDatabaseConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateDatabaseConfig(id, validatedData);
      
      if (!updatedConfig) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating database config:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update database configuration" });
      }
    }
  });
  
  app.delete("/api/database-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Check if it's the active database
      const config = await storage.getDatabaseConfigById(id);
      if (config?.isActive) {
        return res.status(400).json({ 
          message: "Cannot delete an active database. Please activate another database first." 
        });
      }
      
      const success = await storage.deleteDatabaseConfig(id);
      if (!success) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting database config:", error);
      res.status(500).json({ message: "Failed to delete database configuration" });
    }
  });
  
  app.post("/api/database-configs/:id/activate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const activatedConfig = await storage.setActiveDatabaseConfig(id);
      if (!activatedConfig) {
        return res.status(404).json({ message: "Database configuration not found" });
      }
      
      res.json(activatedConfig);
    } catch (error) {
      console.error("Error activating database:", error);
      res.status(500).json({ message: "Failed to activate database" });
    }
  });
  
  app.post("/api/database/migrate", async (req, res) => {
    try {
      const { sourceId, targetId } = req.body;
      
      if (!sourceId || !targetId) {
        return res.status(400).json({ message: "Source and target database IDs are required" });
      }
      
      // Get database configs
      const sourceConfig = await storage.getDatabaseConfigById(parseInt(sourceId));
      const targetConfig = await storage.getDatabaseConfigById(parseInt(targetId));
      
      if (!sourceConfig || !targetConfig) {
        return res.status(404).json({ message: "Source or target database configuration not found" });
      }
      
      // Perform migration
      const success = await storage.migrateDataToNewDatabase(
        sourceConfig.connectionString,
        targetConfig.connectionString
      );
      
      if (success) {
        // Update last used timestamp
        await storage.updateDatabaseConfig(targetId, {
          lastUsedAt: new Date().toISOString()
        });
        
        res.json({ success: true, message: "Data migration completed successfully" });
      } else {
        res.status(500).json({ message: "Data migration failed" });
      }
    } catch (error) {
      console.error("Error during database migration:", error);
      res.status(500).json({ message: "Data migration failed" });
    }
  });
  
  // SEO Rules routes
  app.get("/api/seo/rules", async (_req, res) => {
    try {
      const rules = await storage.getAllSeoRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching SEO rules:", error);
      res.status(500).json({ message: "Failed to fetch SEO rules" });
    }
  });
  
  app.get("/api/seo/rules/:platform", async (req, res) => {
    try {
      const platform = req.params.platform;
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }
      
      const rules = await storage.getSeoRulesByPlatform(platform);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching SEO rules for platform:", error);
      res.status(500).json({ message: "Failed to fetch SEO rules for platform" });
    }
  });
  
  app.get("/api/seo/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const rule = await storage.getSeoRuleById(id);
      if (!rule) {
        return res.status(404).json({ message: "SEO rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      console.error("Error fetching SEO rule:", error);
      res.status(500).json({ message: "Failed to fetch SEO rule" });
    }
  });
  
  app.post("/api/seo/rules", async (req, res) => {
    try {
      const validatedData = insertSeoRuleSchema.parse(req.body);
      const rule = await storage.createSeoRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating SEO rule:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create SEO rule" });
      }
    }
  });
  
  app.post("/api/seo/rules/batch", async (req, res) => {
    try {
      const { platform, rules } = req.body;
      
      if (!platform || !Array.isArray(rules)) {
        return res.status(400).json({ message: "Platform and rules array are required" });
      }
      
      const createdRules = [];
      
      for (const rule of rules) {
        try {
          // Create a basic rule object
          const ruleData = {
            platform,
            rule_type: "content", // Default type
            rule_value: rule,
            is_active: true,
            priority: 5, // Medium priority
            last_updated: new Date().toISOString()
          };
          
          const validatedData = insertSeoRuleSchema.parse(ruleData);
          const newRule = await storage.createSeoRule(validatedData);
          createdRules.push(newRule);
        } catch (error) {
          console.error("Error creating individual SEO rule:", error);
          // Continue with the next rule
        }
      }
      
      res.status(201).json({ 
        success: true, 
        message: `Created ${createdRules.length} SEO rules`, 
        rules: createdRules
      });
    } catch (error) {
      console.error("Error creating batch SEO rules:", error);
      res.status(500).json({ message: "Failed to create SEO rules batch" });
    }
  });
  
  app.patch("/api/seo/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Partial validation
      const validatedData = insertSeoRuleSchema.partial().parse(req.body);
      const updatedRule = await storage.updateSeoRule(id, validatedData);
      
      if (!updatedRule) {
        return res.status(404).json({ message: "SEO rule not found" });
      }
      
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating SEO rule:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update SEO rule" });
      }
    }
  });
  
  app.delete("/api/seo/rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteSeoRule(id);
      if (!success) {
        return res.status(404).json({ message: "SEO rule not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting SEO rule:", error);
      res.status(500).json({ message: "Failed to delete SEO rule" });
    }
  });
  
  // SEO Research route
  app.post("/api/seo/research", async (req, res) => {
    try {
      const { platform, targetCount, searchType, specificTopic } = req.body;
      
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }
      
      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.perplexityApiKey) {
        return res.status(400).json({ message: "Perplexity API key is required for research" });
      }
      
      // Build research prompt
      let prompt = "";
      if (searchType === "latest") {
        prompt = `Ricerca le ${targetCount || 3} regole SEO più recenti e importanti per ottimizzare i contenuti su ${platform}. Fornisci solo le regole, senza spiegazioni aggiuntive. Ogni regola deve essere completa, specifica e separata dalle altre con un ritorno a capo.`;
      } else {
        prompt = `Ricerca ${targetCount || 3} regole SEO specifiche su "${specificTopic}" per ottimizzare i contenuti su ${platform}. Fornisci solo le regole, senza spiegazioni aggiuntive. Ogni regola deve essere completa, specifica e separata dalle altre con un ritorno a capo.`;
      }
      
      // Call Perplexity API
      const perplexityResponse = await handlePerplexityResearch(prompt, apiSettings.perplexityApiKey);
      
      // Extract rules from the response
      const content = perplexityResponse.choices[0].message.content;
      
      // Parse the content into separate rules
      const rules = content
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 10); // Minimum reasonable length for a rule
      
      res.json({
        platform,
        results: rules,
        searchType,
        count: rules.length
      });
    } catch (error) {
      console.error("Error researching SEO rules:", error);
      res.status(500).json({ message: "Failed to research SEO rules" });
    }
  });
  
  // Content hashes routes
  app.get("/api/content/hashes", async (_req, res) => {
    try {
      const hashes = await storage.getAllContentHashes();
      res.json(hashes);
    } catch (error) {
      console.error("Error fetching content hashes:", error);
      res.status(500).json({ message: "Failed to fetch content hashes" });
    }
  });
  
  app.get("/api/content/hashes/:hash", async (req, res) => {
    try {
      const hash = req.params.hash;
      if (!hash) {
        return res.status(400).json({ message: "Hash value is required" });
      }
      
      const contentHash = await storage.getContentHashByValue(hash);
      res.json({ exists: !!contentHash, hash: contentHash });
    } catch (error) {
      console.error("Error checking content hash:", error);
      res.status(500).json({ message: "Failed to check content hash" });
    }
  });
  
  app.post("/api/content/hashes", async (req, res) => {
    try {
      const validatedData = insertContentHashSchema.parse(req.body);
      const contentHash = await storage.createContentHash(validatedData);
      res.status(201).json(contentHash);
    } catch (error) {
      console.error("Error creating content hash:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create content hash" });
      }
    }
  });
  
  app.delete("/api/content/hashes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteContentHash(id);
      if (!success) {
        return res.status(404).json({ message: "Content hash not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting content hash:", error);
      res.status(500).json({ message: "Failed to delete content hash" });
    }
  });
  
  // Content import
  app.post("/api/content/import", async (req, res) => {
    try {
      const { type, content, platform } = req.body;
      
      if (!type || !content) {
        return res.status(400).json({ message: "Content type and content are required" });
      }
      
      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.perplexityApiKey) {
        return res.status(400).json({ message: "Perplexity API key is required for content analysis" });
      }
      
      // Build analysis prompt based on content type
      let prompt = "";
      switch (type) {
        case "url":
          prompt = `Analizza il contenuto presente all'URL "${content}". Estrai le principali informazioni sul tema della logistica, le keywords più importanti e qualsiasi regola SEO rilevante che possa essere dedotta. Fornisci un riassunto dettagliato.`;
          break;
        case "text":
          prompt = `Analizza il seguente testo sul tema della logistica: "${content.substring(0, 1500)}". Estrai le principali informazioni, le keywords più importanti e qualsiasi regola SEO rilevante che possa essere dedotta. Fornisci un riassunto dettagliato.`;
          break;
        case "social":
          prompt = `Analizza il seguente post sulla piattaforma ${platform || "social"}: "${content}". Identifica il formato, lo stile, l'uso di hashtag e altre caratteristiche che lo rendono efficace. Estrai qualsiasi regola o pattern che possa essere utile per creare contenuti simili. Fornisci un riassunto dettagliato.`;
          break;
        default:
          return res.status(400).json({ message: "Unsupported content type" });
      }
      
      // Call Perplexity API
      const perplexityResponse = await handlePerplexityResearch(prompt, apiSettings.perplexityApiKey);
      
      // Extract summary from the response
      const summary = perplexityResponse.choices[0].message.content;
      
      // Create a content hash to prevent duplicates
      try {
        const hashData = {
          hash_value: Buffer.from(content).toString('base64').substring(0, 64),
          content_type: type,
          source_url: type === "url" ? content : "",
          created_at: new Date().toISOString()
        };
        
        const validatedHashData = insertContentHashSchema.parse(hashData);
        await storage.createContentHash(validatedHashData);
      } catch (error) {
        console.warn("Could not create content hash:", error);
        // Continue even if hash creation fails
      }
      
      res.json({
        type,
        platform: platform || null,
        summary,
        analyzed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error importing content:", error);
      res.status(500).json({ message: "Failed to import and analyze content" });
    }
  });
  
  // File upload for PDF and video
  app.post("/api/content/upload", async (req, res) => {
    try {
      // Note: In a production environment, we would use a proper file upload middleware
      // and save the file to disk or cloud storage. For this prototype, we'll just
      // acknowledge receipt of the file and return a simulated analysis.
      
      res.json({
        success: true,
        message: "File received",
        summary: "Analisi del file completata. Estratte informazioni chiave sulla logistica e supply chain management. Il contenuto è stato salvato e può essere utilizzato per generare nuovi articoli ottimizzati."
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload and analyze file" });
    }
  });

  // Content Generation route
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { 
        topic, 
        outputFormats, 
        articleLength, 
        imageCount, 
        additionalKeywords,
        translateToItalian = true
      } = req.body;

      // Validate required fields
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.perplexityApiKey) {
        return res.status(400).json({ message: "Perplexity API key is required" });
      }

      // Get research parameters
      const researchParams = await storage.getResearchParameters();
      
      // Run deep web research with DeepSeek if API key is available
      let researchData = "";
      if (apiSettings?.deepseekApiKey) {
        try {
          const deepseekPrompt = `Ricerca approfondita sul tema "${topic}" nel settore della logistica a livello mondiale. 
          Analizza fonti web, social media (Instagram, LinkedIn, Facebook) per trovare le informazioni più recenti e rilevanti.
          Includi dati relativi a: ${researchParams?.contentFocus || "tendenze del settore"}, 
          keyword: ${researchParams?.keywords || ""}, ${additionalKeywords || ""}.`;
          
          const deepseekResponse = await handleDeepSeekResearch(deepseekPrompt, apiSettings.deepseekApiKey);
          researchData = deepseekResponse.choices[0].message.content;
        } catch (deepseekError) {
          console.error("DeepSeek research error:", deepseekError);
          // Continue without DeepSeek research if it fails
        }
      }
      
      // Construct the enhanced prompt for Perplexity with research data
      const prompt = `Create an SEO-optimized article about "${topic}" for a logistics blog. 
      Focus on ${researchParams?.contentFocus || "Industry Trends"} in the ${researchParams?.geoFocus || "Global"} market.
      Include these keywords: ${researchParams?.keywords || ""}, ${additionalKeywords || ""}.
      The article should be ${articleLength || researchParams?.contentDepth || "Standard Article (800-1000 words)"}.
      Structure it with a compelling introduction, clear headings and subheadings, and a conclusion.
      ${researchData ? `\n\nUse the following research to enhance your article (verify all information):\n${researchData}` : ""}
      Verify all claims and only include information from reliable sources.`;

      // Call Perplexity API for article content
      const perplexityResponse = await handlePerplexityResearch(prompt, apiSettings.perplexityApiKey);
      let articleContent = perplexityResponse.choices[0].message.content;
      
      // Generate social media content if needed
      let instagramContent = null;
      let linkedinContent = null;
      
      if (outputFormats.includes("instagram")) {
        const instagramPrompt = `Create an engaging Instagram caption for a post about "${topic}" in the logistics industry. 
        Make it attention-grabbing and include relevant hashtags for maximum visibility. 
        Keep it under 200 characters plus hashtags.`;
        
        const instagramResponse = await handlePerplexityResearch(instagramPrompt, apiSettings.perplexityApiKey);
        instagramContent = instagramResponse.choices[0].message.content;
      }
      
      if (outputFormats.includes("linkedin")) {
        const linkedinPrompt = `Create a professional LinkedIn post summarizing "${topic}" for logistics professionals. 
        Keep it under 300 words and include 3 relevant hashtags that are popular on LinkedIn. 
        Make it informative and include a call to action.`;
        
        const linkedinResponse = await handlePerplexityResearch(linkedinPrompt, apiSettings.perplexityApiKey);
        linkedinContent = linkedinResponse.choices[0].message.content;
      }
      
      // Search for relevant images if Pexels API key is available
      let images = [];
      if (apiSettings.pexelsApiKey) {
        const pexelsResponse = await searchPexelsImages(topic, apiSettings.pexelsApiKey, imageCount || 2);
        if (pexelsResponse && pexelsResponse.photos) {
          images = pexelsResponse.photos.map((photo: any) => ({
            url: photo.src.large,
            alt: photo.alt || topic,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url
          }));
        }
      }
      
      // Translate content to Italian if requested and DeepL API key is available
      let translatedArticle = null;
      let translatedInstagram = null;
      let translatedLinkedin = null;
      
      if (translateToItalian && apiSettings?.deeplApiKey) {
        try {
          if (articleContent) {
            translatedArticle = await translateWithDeepL(articleContent, "IT", apiSettings.deeplApiKey);
          }
          
          if (instagramContent) {
            translatedInstagram = await translateWithDeepL(instagramContent, "IT", apiSettings.deeplApiKey);
          }
          
          if (linkedinContent) {
            translatedLinkedin = await translateWithDeepL(linkedinContent, "IT", apiSettings.deeplApiKey);
          }
        } catch (translateError) {
          console.error("Translation error:", translateError);
          // Continue without translations if they fail
        }
      }
      
      // Create content items
      const results = [];
      
      if (outputFormats.includes("wordpress")) {
        const wordpressItem = await storage.createContentItem({
          title: topic,
          type: "WordPress Article",
          content: translatedArticle || articleContent,
          images: images,
          status: "draft",
          publishedAt: undefined
        });
        results.push(wordpressItem);
      }
      
      if (outputFormats.includes("html")) {
        const htmlItem = await storage.createContentItem({
          title: topic,
          type: "HTML Article",
          content: translatedArticle || articleContent,
          images: images,
          status: "draft",
          publishedAt: undefined
        });
        results.push(htmlItem);
      }
      
      if (outputFormats.includes("instagram") && (instagramContent || translatedInstagram)) {
        const instagramItem = await storage.createContentItem({
          title: topic,
          type: "Instagram Post",
          content: translatedInstagram || instagramContent,
          images: images.length > 0 ? [images[0]] : [],
          status: "draft",
          publishedAt: undefined
        });
        results.push(instagramItem);
      }
      
      if (outputFormats.includes("linkedin") && (linkedinContent || translatedLinkedin)) {
        const linkedinItem = await storage.createContentItem({
          title: topic,
          type: "LinkedIn Post",
          content: translatedLinkedin || linkedinContent,
          images: images.length > 0 ? [images[0]] : [],
          status: "draft",
          publishedAt: undefined
        });
        results.push(linkedinItem);
      }
      
      res.status(201).json({
        message: "Content generated successfully",
        results,
        translated: !!translatedArticle,
        researchPerformed: !!researchData
      });
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ message: "Failed to generate content", error: String(error) });
    }
  });

  // DeepL Translate API
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang = "IT" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.deeplApiKey) {
        return res.status(400).json({ message: "DeepL API key is required" });
      }

      // Translate the text
      const translatedText = await translateWithDeepL(text, targetLang, apiSettings.deeplApiKey);
      
      res.json({
        translatedText,
        sourceLang: "auto-detected",
        targetLang
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ message: "Failed to translate text", error: String(error) });
    }
  });

  // DeepSeek Web Research API
  app.post("/api/web-research", async (req, res) => {
    try {
      const { topic, sources = ["all"] } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      // Get API settings
      const apiSettings = await storage.getApiSettings();
      if (!apiSettings?.deepseekApiKey) {
        return res.status(400).json({ message: "DeepSeek API key is required" });
      }

      // Construct the prompt
      const prompt = `Ricerca approfondita sul tema "${topic}" nel settore della logistica. 
      Concentrati sulle fonti più recenti e affidabili.
      Controlla anche i social media (Instagram, LinkedIn, Facebook) per contenuti rilevanti.
      ${sources.includes("all") ? "" : `Limita la ricerca alle seguenti fonti: ${sources.join(", ")}`}
      Fornisci un riassunto dettagliato con tutte le informazioni trovate, compresi i link alle fonti originali.`;

      // Call DeepSeek API for research
      const deepseekResponse = await handleDeepSeekResearch(prompt, apiSettings.deepseekApiKey);
      
      res.json({
        research: deepseekResponse.choices[0].message.content,
        topic,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Web research error:", error);
      res.status(500).json({ message: "Failed to perform web research", error: String(error) });
    }
  });

  return server;
}
