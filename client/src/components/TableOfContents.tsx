import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Calendar, ExternalLink, Globe } from 'lucide-react';
import type { ArticleWithProperties } from '../../../server/src/schema';

interface TableOfContentsProps {
  articles: ArticleWithProperties[];
  isLoading: boolean;
  onEditArticle: (article: ArticleWithProperties) => void;
  onDeleteArticle: (id: number) => void;
}

export function TableOfContents({ articles, isLoading, onEditArticle, onDeleteArticle }: TableOfContentsProps) {
  // Extract all unique property names from all articles
  const allPropertyNames = Array.from(
    new Set(
      articles.flatMap((article: ArticleWithProperties) => 
        article.properties.map((p) => p.property_name)
      )
    )
  ).sort();

  // Get property value for an article, or "/" if not found
  const getPropertyValue = (article: ArticleWithProperties, propertyName: string): string => {
    const property = article.properties.find((p) => p.property_name === propertyName);
    return property ? property.property_value : '/';
  };

  // Format property value for display
  const formatPropertyValue = (value: string, propertyName: string) => {
    if (value === '/') {
      return <span className="text-gray-400">/</span>;
    }
    
    // Special formatting for common property types
    if (propertyName.toLowerCase().includes('url') || propertyName.toLowerCase().includes('link')) {
      return (
        <a 
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="truncate max-w-[200px]">{value}</span>
        </a>
      );
    }
    
    if (propertyName.toLowerCase().includes('date')) {
      return (
        <span className="inline-flex items-center space-x-1 text-gray-700">
          <Calendar className="h-3 w-3" />
          <span>{value}</span>
        </span>
      );
    }
    
    if (propertyName.toLowerCase().includes('source')) {
      return (
        <span className="inline-flex items-center space-x-1 text-gray-700">
          <Globe className="h-3 w-3" />
          <span className="truncate max-w-[200px]">{value}</span>
        </span>
      );
    }
    
    return <span className="truncate max-w-[200px]">{value}</span>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading articles...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <span className="text-4xl mb-4 block">📝</span>
              No articles yet. Create your first article to get started!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📋 Table of Contents</span>
          <Badge variant="secondary" className="ml-2">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[120px]">Updated</TableHead>
                {allPropertyNames.map((propertyName: string) => (
                  <TableHead key={propertyName} className="w-[200px]">
                    {propertyName}
                  </TableHead>
                ))}
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article: ArticleWithProperties) => (
                <TableRow key={article.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div 
                      className="cursor-pointer hover:text-blue-600 truncate max-w-[200px]"
                      onClick={() => onEditArticle(article)}
                      title={article.title}
                    >
                      {article.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {article.created_at.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {article.updated_at.toLocaleDateString()}
                  </TableCell>
                  {allPropertyNames.map((propertyName: string) => (
                    <TableCell key={propertyName} className="text-sm">
                      {formatPropertyValue(getPropertyValue(article, propertyName), propertyName)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditArticle(article)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Article</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{article.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDeleteArticle(article.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}