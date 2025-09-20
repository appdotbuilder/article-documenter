import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { getArticleById } from '../handlers/get_article_by_id';
import { eq } from 'drizzle-orm';

describe('getArticleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent article', async () => {
    const result = await getArticleById(999);
    expect(result).toBeNull();
  });

  it('should get article by ID without properties', async () => {
    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Test Article',
        content: '<p>Test content</p>',
      })
      .returning()
      .execute();

    const result = await getArticleById(article.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(article.id);
    expect(result!.title).toEqual('Test Article');
    expect(result!.content).toEqual('<p>Test content</p>');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.properties).toEqual([]);
  });

  it('should get article by ID with properties', async () => {
    // Create test article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Article with Properties',
        content: '<h1>Rich Content</h1>',
      })
      .returning()
      .execute();

    // Add properties to the article
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article.id,
          property_name: 'author',
          property_value: 'John Doe',
        },
        {
          article_id: article.id,
          property_name: 'category',
          property_value: 'Technology',
        },
        {
          article_id: article.id,
          property_name: 'tags',
          property_value: 'javascript,web,development',
        }
      ])
      .execute();

    const result = await getArticleById(article.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(article.id);
    expect(result!.title).toEqual('Article with Properties');
    expect(result!.content).toEqual('<h1>Rich Content</h1>');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.properties).toHaveLength(3);
    
    // Check properties are correctly mapped
    const propertyMap = result!.properties.reduce((acc, prop) => {
      acc[prop.property_name] = prop.property_value;
      return acc;
    }, {} as Record<string, string>);

    expect(propertyMap['author']).toEqual('John Doe');
    expect(propertyMap['category']).toEqual('Technology');
    expect(propertyMap['tags']).toEqual('javascript,web,development');
  });

  it('should handle article with empty content', async () => {
    // Create article with empty content (default)
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Empty Article',
        content: '',
      })
      .returning()
      .execute();

    const result = await getArticleById(article.id);

    expect(result).not.toBeNull();
    expect(result!.content).toEqual('');
    expect(result!.properties).toEqual([]);
  });

  it('should verify database consistency', async () => {
    // Create article with properties
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Consistency Test',
        content: '<p>Testing database consistency</p>',
      })
      .returning()
      .execute();

    await db.insert(articlePropertiesTable)
      .values({
        article_id: article.id,
        property_name: 'test_prop',
        property_value: 'test_value',
      })
      .execute();

    const result = await getArticleById(article.id);

    expect(result).not.toBeNull();
    
    // Verify the data matches what's in the database
    const dbArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    const dbProperties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, article.id))
      .execute();

    expect(result!.id).toEqual(dbArticle[0].id);
    expect(result!.title).toEqual(dbArticle[0].title);
    expect(result!.properties).toHaveLength(dbProperties.length);
  });

  it('should handle article with multiple properties of same name', async () => {
    // Create article
    const [article] = await db.insert(articlesTable)
      .values({
        title: 'Multi-Property Article',
        content: '<p>Article with duplicate property names</p>',
      })
      .returning()
      .execute();

    // Add properties with same name
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: article.id,
          property_name: 'tag',
          property_value: 'javascript',
        },
        {
          article_id: article.id,
          property_name: 'tag',
          property_value: 'typescript',
        },
        {
          article_id: article.id,
          property_name: 'author',
          property_value: 'Jane Smith',
        }
      ])
      .execute();

    const result = await getArticleById(article.id);

    expect(result).not.toBeNull();
    expect(result!.properties).toHaveLength(3);
    
    // Check that both tag properties are returned
    const tagProperties = result!.properties.filter(p => p.property_name === 'tag');
    expect(tagProperties).toHaveLength(2);
    expect(tagProperties.map(p => p.property_value).sort()).toEqual(['javascript', 'typescript']);
    
    // Check author property
    const authorProperty = result!.properties.find(p => p.property_name === 'author');
    expect(authorProperty).toBeDefined();
    expect(authorProperty!.property_value).toEqual('Jane Smith');
  });
});