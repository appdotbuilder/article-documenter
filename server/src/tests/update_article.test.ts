import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable, articlePropertiesTable } from '../db/schema';
import { type UpdateArticleInput } from '../schema';
import { updateArticle } from '../handlers/update_article';
import { eq } from 'drizzle-orm';

describe('updateArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testArticleId: number;

  // Create a test article before each test
  beforeEach(async () => {
    const result = await db.insert(articlesTable)
      .values({
        title: 'Original Article',
        content: 'Original content',
      })
      .returning()
      .execute();
    
    testArticleId = result[0].id;

    // Add some initial properties
    await db.insert(articlePropertiesTable)
      .values([
        {
          article_id: testArticleId,
          property_name: 'category',
          property_value: 'tech'
        },
        {
          article_id: testArticleId,
          property_name: 'author',
          property_value: 'John Doe'
        }
      ])
      .execute();
  });

  it('should update article title only', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Updated Title'
    };

    const result = await updateArticle(input);

    expect(result.id).toEqual(testArticleId);
    expect(result.title).toEqual('Updated Title');
    expect(result.content).toEqual('Original content'); // Should remain unchanged
    expect(result.properties).toHaveLength(2); // Properties should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const dbArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, testArticleId))
      .execute();

    expect(dbArticle[0].title).toEqual('Updated Title');
    expect(dbArticle[0].content).toEqual('Original content');
  });

  it('should update article content only', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      content: '<h1>Updated HTML content</h1>'
    };

    const result = await updateArticle(input);

    expect(result.id).toEqual(testArticleId);
    expect(result.title).toEqual('Original Article'); // Should remain unchanged
    expect(result.content).toEqual('<h1>Updated HTML content</h1>');
    expect(result.properties).toHaveLength(2); // Properties should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both title and content', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Completely Updated Article',
      content: '<p>New content with <strong>formatting</strong></p>'
    };

    const result = await updateArticle(input);

    expect(result.title).toEqual('Completely Updated Article');
    expect(result.content).toEqual('<p>New content with <strong>formatting</strong></p>');
    expect(result.properties).toHaveLength(2); // Properties should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should replace properties when properties array is provided', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      properties: [
        {
          property_name: 'status',
          property_value: 'published'
        },
        {
          property_name: 'priority',
          property_value: 'high'
        }
      ]
    };

    const result = await updateArticle(input);

    expect(result.properties).toHaveLength(2);
    expect(result.properties).toEqual(expect.arrayContaining([
      { property_name: 'status', property_value: 'published' },
      { property_name: 'priority', property_value: 'high' }
    ]));

    // Verify old properties are removed
    const dbProperties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, testArticleId))
      .execute();

    expect(dbProperties).toHaveLength(2);
    expect(dbProperties.some(p => p.property_name === 'category')).toBe(false);
    expect(dbProperties.some(p => p.property_name === 'author')).toBe(false);
  });

  it('should clear all properties when empty properties array is provided', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      properties: []
    };

    const result = await updateArticle(input);

    expect(result.properties).toHaveLength(0);

    // Verify in database
    const dbProperties = await db.select()
      .from(articlePropertiesTable)
      .where(eq(articlePropertiesTable.article_id, testArticleId))
      .execute();

    expect(dbProperties).toHaveLength(0);
  });

  it('should update everything - title, content, and properties', async () => {
    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Fully Updated Article',
      content: '<div>Brand new content</div>',
      properties: [
        {
          property_name: 'tags',
          property_value: 'javascript,typescript'
        }
      ]
    };

    const result = await updateArticle(input);

    expect(result.title).toEqual('Fully Updated Article');
    expect(result.content).toEqual('<div>Brand new content</div>');
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0]).toEqual({
      property_name: 'tags',
      property_value: 'javascript,typescript'
    });

    // Verify updated_at is recent
    const timeDiff = new Date().getTime() - result.updated_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
  });

  it('should preserve created_at and update updated_at', async () => {
    // Get original timestamps
    const originalArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, testArticleId))
      .execute();

    const originalCreatedAt = originalArticle[0].created_at;
    const originalUpdatedAt = originalArticle[0].updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateArticleInput = {
      id: testArticleId,
      title: 'Updated Title'
    };

    const result = await updateArticle(input);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when article does not exist', async () => {
    const input: UpdateArticleInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateArticle(input)).rejects.toThrow(/Article with id 99999 not found/i);
  });

  it('should handle article without properties', async () => {
    // Create article without properties
    const articleWithoutProps = await db.insert(articlesTable)
      .values({
        title: 'Article Without Properties',
        content: 'Content without properties',
      })
      .returning()
      .execute();

    const input: UpdateArticleInput = {
      id: articleWithoutProps[0].id,
      title: 'Updated Title'
    };

    const result = await updateArticle(input);

    expect(result.properties).toHaveLength(0);
    expect(result.title).toEqual('Updated Title');
  });

  it('should handle updating article with new properties when it had none', async () => {
    // Create article without properties
    const articleWithoutProps = await db.insert(articlesTable)
      .values({
        title: 'Article Without Properties',
        content: 'Content without properties',
      })
      .returning()
      .execute();

    const input: UpdateArticleInput = {
      id: articleWithoutProps[0].id,
      properties: [
        {
          property_name: 'new_prop',
          property_value: 'new_value'
        }
      ]
    };

    const result = await updateArticle(input);

    expect(result.properties).toHaveLength(1);
    expect(result.properties[0]).toEqual({
      property_name: 'new_prop',
      property_value: 'new_value'
    });
  });
});