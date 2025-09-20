import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type ExportInput } from '../schema';
import { exportArticles } from '../handlers/export_articles';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('exportArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup helper
  const createTestArticles = async () => {
    // Create first article
    const article1 = await db.insert(articlesTable)
      .values({
        title: 'First Article',
        content: '<p>This is the first article content.</p>',
      })
      .returning()
      .execute();

    // Create second article
    const article2 = await db.insert(articlesTable)
      .values({
        title: 'Second Article',
        content: '<p>This is the second article content with <strong>bold</strong> text.</p>',
      })
      .returning()
      .execute();

    // Add properties to first article
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article1[0].id,
          property_name: 'Author',
          property_value: 'John Doe'
        },
        {
          article_id: article1[0].id,
          property_name: 'Category',
          property_value: 'Technology'
        }
      ])
      .execute();

    // Add property to second article
    await db.insert(articlePropertiesTable)
      .values({
        article_id: article2[0].id,
        property_name: 'Author',
        property_value: 'Jane Smith'
      })
      .execute();

    return { article1: article1[0], article2: article2[0] };
  };

  it('should export all articles when no article_ids provided', async () => {
    const { article1, article2 } = await createTestArticles();

    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();
    expect(result.downloadUrl).toMatch(/\/exports\/articles_.*\.html/);

    // Verify file was created
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    expect(existsSync(filePath)).toBe(true);

    // Check file content
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Table of Contents');
    expect(content).toContain('First Article');
    expect(content).toContain('Second Article');
    expect(content).toContain('This is the first article content.');
    expect(content).toContain('John Doe');
    expect(content).toContain('Technology');
    expect(content).toContain('Jane Smith');
  });

  it('should export specific articles when article_ids provided', async () => {
    const { article1, article2 } = await createTestArticles();

    const input: ExportInput = {
      format: 'html',
      article_ids: [article1.id]
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();

    // Verify file content only contains first article
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    const content = readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('First Article');
    expect(content).not.toContain('Second Article');
    expect(content).toContain('John Doe');
    expect(content).toContain('Technology');
    expect(content).not.toContain('Jane Smith');
  });

  it('should handle PDF format (saves as HTML for now)', async () => {
    await createTestArticles();

    const input: ExportInput = {
      format: 'pdf'
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();
    expect(result.downloadUrl).toMatch(/\/exports\/articles_.*\.pdf/);

    // For now, PDF saves as HTML file
    const filename = result.downloadUrl!.split('/').pop()!.replace('.pdf', '.html');
    const filePath = join(process.cwd(), 'exports', filename);
    expect(existsSync(filePath)).toBe(true);
  });

  it('should return failure when no articles exist', async () => {
    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(false);
    expect(result.downloadUrl).toBeUndefined();
  });

  it('should return failure when specified articles do not exist', async () => {
    await createTestArticles();

    const input: ExportInput = {
      format: 'html',
      article_ids: [999, 1000] // Non-existent IDs
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(false);
    expect(result.downloadUrl).toBeUndefined();
  });

  it('should handle articles without properties', async () => {
    // Create article without properties
    await db.insert(articlesTable)
      .values({
        title: 'Article Without Properties',
        content: '<p>Simple content</p>',
      })
      .execute();

    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(true);
    
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    const content = readFileSync(filePath, 'utf-8');
    
    expect(content).toContain('Article Without Properties');
    expect(content).toContain('Simple content');
    // Should not contain properties section
    expect(content).not.toContain('Properties:');
  });

  it('should properly escape HTML in titles and property values', async () => {
    // Create article with HTML characters in title and properties
    const article = await db.insert(articlesTable)
      .values({
        title: 'Article with <script>alert("xss")</script> & "quotes"',
        content: '<p>Safe content</p>',
      })
      .returning()
      .execute();

    await db.insert(articlePropertiesTable)
      .values({
        article_id: article[0].id,
        property_name: 'Description',
        property_value: '<dangerous>value</dangerous> & "test"'
      })
      .execute();

    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);

    expect(result.success).toBe(true);
    
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    const content = readFileSync(filePath, 'utf-8');
    
    // Check that dangerous content is escaped
    expect(content).not.toContain('<script>');
    expect(content).not.toContain('<dangerous>');
    expect(content).toContain('&lt;script&gt;');
    expect(content).toContain('&lt;dangerous&gt;');
    expect(content).toContain('&amp;');
    expect(content).toContain('&quot;');
  });

  it('should generate clickable table of contents', async () => {
    const { article1, article2 } = await createTestArticles();

    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);
    
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    const content = readFileSync(filePath, 'utf-8');
    
    // Check TOC structure
    expect(content).toContain('Table of Contents');
    expect(content).toContain(`<a href="#article-${article1.id}">First Article</a>`);
    expect(content).toContain(`<a href="#article-${article2.id}">Second Article</a>`);
    
    // Check article anchors exist
    expect(content).toContain(`<article id="article-${article1.id}"`);
    expect(content).toContain(`<article id="article-${article2.id}"`);
  });

  it('should include metadata in exported articles', async () => {
    await createTestArticles();

    const input: ExportInput = {
      format: 'html'
    };

    const result = await exportArticles(input);
    
    const filename = result.downloadUrl!.split('/').pop()!;
    const filePath = join(process.cwd(), 'exports', filename);
    const content = readFileSync(filePath, 'utf-8');
    
    // Check metadata is present
    expect(content).toContain('<strong>Created:</strong>');
    expect(content).toContain('<strong>Updated:</strong>');
    expect(content).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format check
  });
});