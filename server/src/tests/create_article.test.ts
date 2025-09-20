import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { createArticle } from '../handlers/create_article';
import { eq } from 'drizzle-orm';

// Test inputs with different scenarios
const basicInput: CreateArticleInput = {
  title: 'Basic Article',
  content: '<p>This is basic HTML content</p>',
  properties: []
};

const articleWithProperties: CreateArticleInput = {
  title: 'Article with Properties',
  content: '<h1>Rich Content</h1><p>With <strong>formatting</strong></p>',
  properties: [
    { property_name: 'author', property_value: 'John Doe' },
    { property_name: 'category', property_value: 'Technology' },
    { property_name: 'tags', property_value: 'javascript,programming' }
  ]
};

const minimalInput: CreateArticleInput = {
  title: 'Minimal Article',
  content: '',
  properties: []
};

describe('createArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic article without properties', async () => {
    const result = await createArticle(basicInput);

    // Basic field validation
    expect(result.title).toEqual('Basic Article');
    expect(result.content).toEqual('<p>This is basic HTML content</p>');
    expect(result.properties).toEqual([]);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create article with custom properties', async () => {
    const result = await createArticle(articleWithProperties);

    // Validate article fields
    expect(result.title).toEqual('Article with Properties');
    expect(result.content).toEqual('<h1>Rich Content</h1><p>With <strong>formatting</strong></p>');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate properties
    expect(result.properties).toHaveLength(3);
    expect(result.properties).toEqual([
      { property_name: 'author', property_value: 'John Doe' },
      { property_name: 'category', property_value: 'Technology' },
      { property_name: 'tags', property_value: 'javascript,programming' }
    ]);
  });

  it('should create minimal article with empty content', async () => {
    const result = await createArticle(minimalInput);

    expect(result.title).toEqual('Minimal Article');
    expect(result.content).toEqual('');
    expect(result.properties).toEqual([]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save article to database correctly', async () => {
    const result = await createArticle(basicInput);

    // Query the article from database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(articles).toHaveLength(1);
    const dbArticle = articles[0];
    expect(dbArticle.title).toEqual('Basic Article');
    expect(dbArticle.content).toEqual('<p>This is basic HTML content</p>');
    expect(dbArticle.created_at).toBeInstanceOf(Date);
    expect(dbArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should save properties to database correctly', async () => {
    const result = await createArticle(articleWithProperties);

    // Query properties from database
    const properties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, result.id))
      .execute();

    expect(properties).toHaveLength(3);
    
    // Check all properties are saved correctly
    const propertyMap = new Map(properties.map(p => [p.property_name, p.property_value]));
    expect(propertyMap.get('author')).toEqual('John Doe');
    expect(propertyMap.get('category')).toEqual('Technology');
    expect(propertyMap.get('tags')).toEqual('javascript,programming');

    // Verify foreign key relationship
    properties.forEach(prop => {
      expect(prop.article_id).toEqual(result.id);
      expect(prop.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle single property correctly', async () => {
    const singlePropertyInput: CreateArticleInput = {
      title: 'Single Property Article',
      content: '<p>Content</p>',
      properties: [{ property_name: 'status', property_value: 'draft' }]
    };

    const result = await createArticle(singlePropertyInput);

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0]).toEqual({ 
      property_name: 'status', 
      property_value: 'draft' 
    });

    // Verify in database
    const dbProperties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, result.id))
      .execute();

    expect(dbProperties).toHaveLength(1);
    expect(dbProperties[0].property_name).toEqual('status');
    expect(dbProperties[0].property_value).toEqual('draft');
  });

  it('should handle HTML content correctly', async () => {
    const htmlInput: CreateArticleInput = {
      title: 'Rich HTML Article',
      content: `<div class="article">
        <h1>Main Title</h1>
        <p>Paragraph with <a href="https://example.com">link</a></p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <img src="image.jpg" alt="Description" />
      </div>`,
      properties: []
    };

    const result = await createArticle(htmlInput);

    expect(result.content).toContain('<div class="article">');
    expect(result.content).toContain('<h1>Main Title</h1>');
    expect(result.content).toContain('<a href="https://example.com">link</a>');
    expect(result.content).toContain('<img src="image.jpg" alt="Description" />');

    // Verify HTML is preserved in database
    const dbArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, result.id))
      .execute();

    expect(dbArticle[0].content).toEqual(htmlInput.content);
  });

  it('should set updated_at timestamp correctly', async () => {
    const beforeCreate = new Date();
    const result = await createArticle(basicInput);
    const afterCreate = new Date();

    expect(result.updated_at >= beforeCreate).toBe(true);
    expect(result.updated_at <= afterCreate).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify timestamps are close but not necessarily identical
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });
});