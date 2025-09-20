import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { WysiwygEditor } from '@/components/WysiwygEditor';
import { PropertyManager } from '@/components/PropertyManager';
import { Save, X, FileText } from 'lucide-react';
import type { ArticleWithProperties, CreateArticleInput, UpdateArticleInput } from '../../../server/src/schema';

interface ArticleEditorProps {
  article: ArticleWithProperties | null; // null for new article
  onSave: () => void;
  onCancel: () => void;
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [properties, setProperties] = useState<Array<{ property_name: string; property_value: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load article data when editing
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setProperties(article.properties);
    } else {
      // Reset form for new article
      setTitle('');
      setContent('');
      setProperties([]);
    }
  }, [article]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the article.');
      return;
    }

    setIsLoading(true);
    try {
      if (article) {
        // Update existing article
        const updateInput: UpdateArticleInput = {
          id: article.id,
          title: title.trim(),
          content,
          properties,
        };
        await trpc.updateArticle.mutate(updateInput);
        onSave();
      } else {
        // Create new article
        const createInput: CreateArticleInput = {
          title: title.trim(),
          content,
          properties,
        };
        await trpc.createArticle.mutate(createInput);
        onSave();
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('Failed to save article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = title.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle>
                {article ? `✏️ Editing: ${article.title}` : '📝 Create New Article'}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isFormValid || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Article'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Title Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Article Title</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="text-lg font-medium"
              required
            />
            {!title.trim() && (
              <p className="text-sm text-red-600">Title is required</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Article Content</CardTitle>
        </CardHeader>
        <CardContent>
          <WysiwygEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your article content..."
          />
        </CardContent>
      </Card>

      {/* Custom Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Custom Properties</CardTitle>
            <Badge variant="secondary">
              {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PropertyManager
            properties={properties}
            onChange={setProperties}
          />
        </CardContent>
      </Card>

      {/* Save Actions (Footer) */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {article ? 'Last updated: ' + article.updated_at.toLocaleString() : 'New article'}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isFormValid || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Article'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}