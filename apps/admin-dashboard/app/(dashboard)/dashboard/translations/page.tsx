'use client';

import { useState, useEffect } from 'react';
import { useTranslationManager } from '@/lib/translations/hooks';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/translations/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { Search, Plus, Edit, Trash2, Download, Upload, Languages, AlertCircle } from 'lucide-react';
import { TranslationEntry } from '@/lib/translations/types';

export default function TranslationsPage() {
  const { toast } = useToast();
  const {
    translations,
    categories,
    statistics,
    setTranslation,
    deleteTranslation,
    searchTranslations,
    getTranslationsByCategory,
    getMissingTranslations,
    exportTranslations,
    exportByLanguage,
    importTranslations,
  } = useTranslationManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [filteredTranslations, setFilteredTranslations] = useState<TranslationEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Translations', href: '/dashboard/translations' },
  ]);

  useEffect(() => {
    let results = translations;

    if (searchQuery) {
      results = searchTranslations(searchQuery);
    } else if (selectedCategory !== 'all') {
      results = getTranslationsByCategory(selectedCategory);
    }

    setFilteredTranslations(results);
  }, [searchQuery, selectedCategory, translations, searchTranslations, getTranslationsByCategory]);

  const handleEdit = (entry: TranslationEntry) => {
    setEditingEntry({ ...entry });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (editingEntry) {
      setTranslation({
        key: editingEntry.key,
        translations: editingEntry.translations,
        description: editingEntry.description,
        category: editingEntry.category,
      });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      toast({
        title: 'Translation updated',
        description: 'The translation has been successfully updated.',
      });
    }
  };

  const handleDelete = (key: string) => {
    setDeletingKey(key);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingKey) {
      deleteTranslation(deletingKey);
      setIsDeleteDialogOpen(false);
      setDeletingKey(null);
      toast({
        title: 'Translation deleted',
        description: 'The translation has been successfully deleted.',
      });
    }
  };

  const handleExport = (language?: SupportedLanguage) => {
    const data = language ? exportByLanguage(language) : exportTranslations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = language ? `translations-${language}.json` : 'translations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: `Translations exported successfully.`,
    });
  };

  const handleImport = () => {
    try {
      importTranslations(importData, true);
      setIsImportDialogOpen(false);
      setImportData('');
      toast({
        title: 'Import successful',
        description: 'Translations imported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid JSON format. Please check your data.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = () => {
    setEditingEntry({
      id: '',
      key: '',
      translations: {
        en: '',
        he: '',
        ar: '',
        es: '',
        fr: '',
        de: '',
      },
      category: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translations</h1>
          <p className="text-muted-foreground mt-2">
            Manage translations for all supported languages
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              import('@/lib/translations/sync').then(({ syncTranslations }) => {
                syncTranslations();
                window.location.reload();
              });
            }} 
            variant="outline"
          >
            <Languages className="me-2 h-4 w-4" />
            Sync Resources
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="me-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => handleExport()} variant="outline">
            <Download className="me-2 h-4 w-4" />
            Export All
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="me-2 h-4 w-4" />
            Add Translation
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statistics.languages.map((stat: any) => {
            const lang = SUPPORTED_LANGUAGES[stat.language as SupportedLanguage];
            return (
              <Card key={stat.language}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {lang.flag} {lang.name}
                  </CardTitle>
                  <CardDescription>
                    {stat.translated} of {statistics.totalKeys} translated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={stat.percentage} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{stat.percentage}% complete</span>
                    <span>{stat.missing} missing</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Translation Keys</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search translations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-8 w-[300px]"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Translations</TabsTrigger>
              <TabsTrigger value="missing">
                Missing <Badge variant="destructive" className="ms-2">{getMissingTranslations(selectedLanguage).length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Category</TableHead>
                    {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                      <TableHead key={lang.code}>
                        {lang.flag} {lang.code.toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((entry) => (
                    <TableRow key={entry.key}>
                      <TableCell className="font-mono text-sm">{entry.key}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.category || 'general'}</Badge>
                      </TableCell>
                      {Object.keys(SUPPORTED_LANGUAGES).map((lang) => (
                        <TableCell key={lang}>
                          {entry.translations[lang] ? (
                            <span className="text-sm">{entry.translations[lang]}</span>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="me-1 h-3 w-3" />
                              Missing
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="missing">
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}>
                <SelectTrigger className="w-[200px] mb-4">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                    <SelectItem key={code} value={code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMissingTranslations(selectedLanguage).map((entry) => (
                    <TableRow key={entry.key}>
                      <TableCell className="font-mono text-sm">{entry.key}</TableCell>
                      <TableCell>{entry.translations.en}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          Add Translation
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry?.id ? 'Edit Translation' : 'Add New Translation'}
            </DialogTitle>
            <DialogDescription>
              Update translations for all supported languages
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="key">Translation Key</Label>
                  <Input
                    id="key"
                    value={editingEntry.key}
                    onChange={(e) => setEditingEntry({ ...editingEntry, key: e.target.value })}
                    placeholder="e.g., navigation.dashboard"
                    disabled={!!editingEntry.id}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingEntry.category || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                    placeholder="e.g., navigation"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={editingEntry.description || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                    placeholder="Describe when and where this translation is used"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Translations</h4>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <div key={code} className="grid gap-2">
                    <Label htmlFor={`trans-${code}`}>
                      {lang.flag} {lang.name}
                    </Label>
                    <Textarea
                      id={`trans-${code}`}
                      value={editingEntry.translations[code] || ''}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        translations: {
                          ...editingEntry.translations,
                          [code]: e.target.value,
                        },
                      })}
                      dir={lang.direction}
                      className="min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this translation key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Translations</DialogTitle>
            <DialogDescription>
              Paste your translation JSON data below. The data will be merged with existing translations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON data here..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}