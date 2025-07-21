'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { productAPI } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { ProductVariant, ProductImage } from '@saas-template/shared';

const categories = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'other', label: 'Other' },
];

interface ProductFormVariant extends Omit<ProductVariant, 'id'> {
  tempId: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category: '',
    inventory: '',
    isActive: true,
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductFormVariant[]>([]);
  const [variantForm, setVariantForm] = useState({
    sku: '',
    name: '',
    price: '',
    size: '',
    color: '',
    inventory: '',
  });
  const [customAttributes, setCustomAttributes] = useState<{ key: string; value: string }[]>([]);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.price) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        inventory: formData.inventory ? {
          quantity: parseInt(formData.inventory),
          reserved: 0,
          available: parseInt(formData.inventory),
          reorderLevel: 0,
          reorderQuantity: 0,
        } : undefined,
        images: images,
        variants: variants.map(({ tempId, ...variant }) => variant),
      };

      await productAPI.create(productData);
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      router.push('/dashboard/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: ProductImage = {
          url: reader.result as string,
          alt: file.name,
          isPrimary: images.length === 0,
          order: images.length,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update primary image if needed
      if (newImages.length > 0 && prev[index].isPrimary) {
        newImages[0].isPrimary = true;
      }
      // Update order
      return newImages.map((img, i) => ({ ...img, order: i }));
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const addVariant = () => {
    if (!variantForm.sku || !variantForm.name) {
      toast({
        title: 'Error',
        description: 'Please fill in variant SKU and name',
        variant: 'destructive',
      });
      return;
    }

    // Build attributes object including custom attributes
    const attributes: { [key: string]: any } = {};
    if (variantForm.size) attributes.size = variantForm.size;
    if (variantForm.color) attributes.color = variantForm.color;
    
    // Add custom attributes
    customAttributes.forEach(({ key, value }) => {
      attributes[key] = value;
    });

    const newVariant: ProductFormVariant = {
      tempId: Date.now().toString(),
      sku: variantForm.sku,
      name: variantForm.name,
      price: variantForm.price ? parseFloat(variantForm.price) : undefined,
      inventory: variantForm.inventory
        ? {
            quantity: parseInt(variantForm.inventory),
            reserved: 0,
            available: parseInt(variantForm.inventory),
            reorderLevel: 0,
            reorderQuantity: 0,
          }
        : undefined,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      isActive: true,
    };

    setVariants((prev) => [...prev, newVariant]);
    setVariantForm({
      sku: '',
      name: '',
      price: '',
      size: '',
      color: '',
      inventory: '',
    });
    setCustomAttributes([]);
  };

  const removeVariant = (tempId: string) => {
    setVariants((prev) => prev.filter((v) => v.tempId !== tempId));
  };

  const addCustomAttribute = () => {
    if (!newAttributeKey || !newAttributeValue) {
      toast({
        title: 'Error',
        description: 'Please enter both attribute name and value',
        variant: 'destructive',
      });
      return;
    }

    setCustomAttributes((prev) => [...prev, { key: newAttributeKey, value: newAttributeValue }]);
    setNewAttributeKey('');
    setNewAttributeValue('');
  };

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/products')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        <p className="text-gray-500">Add a new product to your inventory</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Enter the basic information for the new product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                  placeholder="PROD-001"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Stock Keeping Unit - unique identifier
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory">Initial Inventory</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={formData.inventory}
                  onChange={(e) => handleChange('inventory', e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => handleChange('isActive', value === 'active')}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload images for your product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className={`w-full h-40 object-cover rounded-lg ${
                              image.isPrimary ? 'ring-2 ring-primary' : ''
                            }`}
                          />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setPrimaryImage(index)}
                              disabled={image.isPrimary}
                            >
                              {image.isPrimary ? 'Primary' : 'Set Primary'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Add different variations of your product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="variant-sku">Variant SKU</Label>
                      <Input
                        id="variant-sku"
                        value={variantForm.sku}
                        onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })}
                        placeholder="VAR-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant-name">Variant Name</Label>
                      <Input
                        id="variant-name"
                        value={variantForm.name}
                        onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                        placeholder="Large Blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant-price">Price (optional)</Label>
                      <Input
                        id="variant-price"
                        type="number"
                        step="0.01"
                        value={variantForm.price}
                        onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                        placeholder="Leave empty to use base price"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant-size">Size</Label>
                      <Input
                        id="variant-size"
                        value={variantForm.size}
                        onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                        placeholder="L, XL, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant-color">Color</Label>
                      <Input
                        id="variant-color"
                        value={variantForm.color}
                        onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                        placeholder="Blue, Red, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant-inventory">Inventory</Label>
                      <Input
                        id="variant-inventory"
                        type="number"
                        value={variantForm.inventory}
                        onChange={(e) => setVariantForm({ ...variantForm, inventory: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Custom Attributes Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium">Custom Attributes</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="attr-key">Attribute Name</Label>
                        <Input
                          id="attr-key"
                          value={newAttributeKey}
                          onChange={(e) => setNewAttributeKey(e.target.value)}
                          placeholder="e.g., Material, Style"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attr-value">Attribute Value</Label>
                        <Input
                          id="attr-value"
                          value={newAttributeValue}
                          onChange={(e) => setNewAttributeValue(e.target.value)}
                          placeholder="e.g., Cotton, Casual"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" onClick={addCustomAttribute} variant="secondary">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Attribute
                        </Button>
                      </div>
                    </div>

                    {customAttributes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Attributes to add to variant:</p>
                        <div className="flex flex-wrap gap-2">
                          {customAttributes.map((attr, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-md text-sm"
                            >
                              <span className="font-medium">{attr.key}:</span>
                              <span>{attr.value}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-auto p-0 ml-2"
                                onClick={() => removeCustomAttribute(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="button" onClick={addVariant} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant with Attributes
                  </Button>

                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Added Variants</h4>
                      <div className="space-y-2">
                        {variants.map((variant) => (
                          <div
                            key={variant.tempId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-1">
                                <span className="font-medium">{variant.name}</span>
                                <span className="text-sm text-gray-500">SKU: {variant.sku}</span>
                                {variant.price && (
                                  <span className="text-sm font-medium">${variant.price}</span>
                                )}
                              </div>
                              {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Object.entries(variant.attributes).map(([key, value], index) => (
                                    <span
                                      key={`${variant.tempId}-${key}-${index}`}
                                      className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 rounded"
                                    >
                                      <span className="font-medium capitalize">{key}:</span>
                                      <span className="ml-1">{value}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeVariant(variant.tempId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/products')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}