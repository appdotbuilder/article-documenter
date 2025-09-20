import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Globe, Calendar, ExternalLink } from 'lucide-react';

interface Property {
  property_name: string;
  property_value: string;
}

interface PropertyManagerProps {
  properties: Property[];
  onChange: (properties: Property[]) => void;
}

export function PropertyManager({ properties, onChange }: PropertyManagerProps) {
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');

  // Common property suggestions
  const propertyPresets = [
    { name: 'URL', icon: ExternalLink, placeholder: 'https://example.com' },
    { name: 'Source', icon: Globe, placeholder: 'Website name or publication' },
    { name: 'Date', icon: Calendar, placeholder: 'YYYY-MM-DD or any date format' },
    { name: 'Author', icon: null, placeholder: 'Author name' },
    { name: 'Category', icon: null, placeholder: 'Article category' },
    { name: 'Tags', icon: null, placeholder: 'Comma-separated tags' },
  ];

  const addProperty = () => {
    if (!newPropertyName.trim() || !newPropertyValue.trim()) {
      return;
    }

    // Check if property name already exists
    const existingIndex = properties.findIndex(
      (p: Property) => p.property_name.toLowerCase() === newPropertyName.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      // Update existing property
      const updatedProperties = [...properties];
      updatedProperties[existingIndex] = {
        property_name: newPropertyName.trim(),
        property_value: newPropertyValue.trim(),
      };
      onChange(updatedProperties);
    } else {
      // Add new property
      const newProperty: Property = {
        property_name: newPropertyName.trim(),
        property_value: newPropertyValue.trim(),
      };
      onChange([...properties, newProperty]);
    }

    // Reset form
    setNewPropertyName('');
    setNewPropertyValue('');
  };

  const removeProperty = (index: number) => {
    const updatedProperties = properties.filter((_: Property, i: number) => i !== index);
    onChange(updatedProperties);
  };

  const updateProperty = (index: number, field: 'property_name' | 'property_value', value: string) => {
    const updatedProperties = [...properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      [field]: value,
    };
    onChange(updatedProperties);
  };

  const selectPreset = (presetName: string) => {
    setNewPropertyName(presetName);
    setNewPropertyValue('');
    // Focus the value input after a brief delay
    setTimeout(() => {
      const valueInput = document.getElementById('new-property-value');
      if (valueInput) {
        valueInput.focus();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addProperty();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Properties */}
      {properties.length > 0 && (
        <div className="space-y-3">
          {properties.map((property: Property, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`property-name-${index}`} className="text-xs font-medium text-gray-600">
                      Property Name
                    </Label>
                    <Input
                      id={`property-name-${index}`}
                      value={property.property_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProperty(index, 'property_name', e.target.value)
                      }
                      className="mt-1"
                      placeholder="Property name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`property-value-${index}`} className="text-xs font-medium text-gray-600">
                      Property Value
                    </Label>
                    <Input
                      id={`property-value-${index}`}
                      value={property.property_value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateProperty(index, 'property_value', e.target.value)
                      }
                      className="mt-1"
                      placeholder="Property value"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProperty(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 mt-5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Property Form */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-gray-500" />
              <Label className="font-medium text-gray-700">Add New Property</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-property-name" className="text-xs text-gray-600">
                  Property Name *
                </Label>
                <Input
                  id="new-property-name"
                  value={newPropertyName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPropertyName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., URL, Source, Date"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-property-value" className="text-xs text-gray-600">
                  Property Value *
                </Label>
                <Input
                  id="new-property-value"
                  value={newPropertyValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPropertyValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter value..."
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={addProperty}
              disabled={!newPropertyName.trim() || !newPropertyValue.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Preset Buttons - Always Displayed */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          🚀 Quick Add Common Properties:
        </Label>
        <div className="flex flex-wrap gap-2">
          {propertyPresets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => selectPreset(preset.name)}
              className="text-xs border-dashed hover:border-solid"
            >
              {preset.icon && <preset.icon className="h-3 w-3 mr-1" />}
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Property Count */}
      {properties.length > 0 && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            {properties.length} custom propert{properties.length !== 1 ? 'ies' : 'y'} defined
          </Badge>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>💡 Pro tip: Properties help organize and categorize your articles.</p>
        <p>Common examples: URL, Source, Author, Date, Category, Tags</p>
      </div>
    </div>
  );
}