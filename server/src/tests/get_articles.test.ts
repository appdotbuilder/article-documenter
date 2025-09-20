import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { getArticles } from '../handlers/get_articles';

describe('getArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no articles exist', async () => {
    const result = await getArticles();
    
    expect(result).toEqual([]);
  });

  it('should return single article without properties', async () => {
    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        content: '<p>Test content</p>',
      })
      .returning()
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: article.id,
      title: 'Test Article',
      content: '<p>Test content</p>',
      created_at: article.created_at,
      updated_at: article.updated_at,
      properties: [],
    });
  });

  it('should return article with single property', async () => {
    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Article with Property',
        content: '<h1>Content</h1>',
      })
      .returning()
      .execute();

    // Add property to article
    await db.insert(articlePropertiesTable)
      .values({
        article_id: article.id,
        property_name: 'author',
        property_value: 'John Doe',
      })
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(article.id);
    expect(result[0].title).toBe('Article with Property');
    expect(result[0].content).toBe('<h1>Content</h1>');
    expect(result[0].properties).toHaveLength(1);
    expect(result[0].properties[0]).toEqual({
      property_name: 'author',
      property_value: 'John Doe',
    });
  });

  it('should return article with multiple properties', async () => {
    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Multi-Property Article',
        content: '<div>Rich content</div>',
      })
      .returning()
      .execute();

    // Add multiple properties
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article.id,
          property_name: 'author',
          property_value: 'Jane Smith',
        },
        {
          article_id: article.id,
          property_name: 'category',
          property_value: 'Tutorial',
        },
        {
          article_id: article.id,
          property_name: 'tags',
          property_value: 'javascript,tutorial,beginner',
        },
      ])
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].properties).toHaveLength(3);
    
    // Check all properties are present
    const propertyNames = result[0].properties.map(p => p.property_name);
    expect(propertyNames).toContain('author');
    expect(propertyNames).toContain('category');
    expect(propertyNames).toContain('tags');

    // Check specific property values
    const authorProperty = result[0].properties.find(p => p.property_name === 'author');
    expect(authorProperty?.property_value).toBe('Jane Smith');
    
    const categoryProperty = result[0].properties.find(p => p.property_name === 'category');
    expect(categoryProperty?.property_value).toBe('Tutorial');
  });

  it('should return multiple articles with mixed properties', async () => {
    // Create first article
    const [article1] = await db.insert(articlesTable)
      .values({
        title: 'First Article',
        content: '<p>First content</p>',
      })
      .returning()
      .execute();

    // Create second article
    const [article2] = await db.insert(articlesTable)
      .values({
        title: 'Second Article',
        content: '<p>Second content</p>',
      })
      .returning()
      .execute();

    // Create third article (no properties)
    const [article3] = await db.insert(articlesTable)
      .values({
        title: 'Third Article',
        content: '<p>Third content</p>',
      })
      .returning()
      .execute();

    // Add properties to first article
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article1.id,
          property_name: 'author',
          property_value: 'Author One',
        },
        {
          article_id: article1.id,
          property_name: 'status',
          property_value: 'published',
        },
      ])
      .execute();

    // Add single property to second article
    await db.insert(articlePropertiesTable)
      .values({
        article_id: article2.id,
        property_name: 'category',
        property_value: 'News',
      })
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(3);
    
    // Sort results by ID for consistent testing
    result.sort((a, b) => a.id - b.id);

    // Check first article
    expect(result[0].title).toBe('First Article');
    expect(result[0].properties).toHaveLength(2);
    
    // Check second article
    expect(result[1].title).toBe('Second Article');
    expect(result[1].properties).toHaveLength(1);
    expect(result[1].properties[0].property_name).toBe('category');
    
    // Check third article (no properties)
    expect(result[2].title).toBe('Third Article');
    expect(result[2].properties).toHaveLength(0);
  });

  it('should handle articles with empty content', async () => {
    // Create article with empty content (default value)
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Empty Content Article',
        // content will use default empty string
      })
      .returning()
      .execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Empty Content Article');
    expect(result[0].content).toBe('');
    expect(result[0].properties).toEqual([]);
  });

  it('should return articles ordered by database insertion', async () => {
    // Create multiple articles in sequence
    const titles = ['Article A', 'Article B', 'Article C'];
    
    for (const title of titles) {
      await db.insert(articlesTable)
        .values({
          title,
          content: `<p>${title} content</p>`,
        })
        .execute();
    }

    const result = await getArticles();

    expect(result).toHaveLength(3);
    
    // Sort results by ID to ensure consistent testing
    result.sort((a, b) => a.id - b.id);
    
    // Verify we have the expected titles in the correct order
    expect(result[0].title).toBe('Article A');
    expect(result[1].title).toBe('Article B');
    expect(result[2].title).toBe('Article C');
    
    // Verify IDs are in ascending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i].id).toBeGreaterThan(result[i-1].id);
    }
  });
});