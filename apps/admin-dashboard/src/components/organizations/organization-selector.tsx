'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentOrganization } from '@/store/slices/organizationSlice';
import { organizationAPI } from '@/lib/api';
import { Organization } from '@saas-template/shared';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

/**
 * Organization selector component with autocomplete
 * @component OrganizationSelector
 * @description
 * Provides a searchable dropdown to select the current organization.
 * Features server-side autocomplete that triggers after 3 characters.
 */
export function OrganizationSelector() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const currentOrganization = useSelector((state: RootState) => state.organization.currentOrganization);
  
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [defaultOrganizations, setDefaultOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Loads default organizations when dropdown opens
   */
  const loadDefaultOrganizations = useCallback(async () => {
    if (defaultOrganizations.length > 0) return;
    
    setIsLoading(true);
    try {
      const response = await organizationAPI.getAll({ limit: 10 });
      const data = response.data?.data || response.data || [];
      setDefaultOrganizations(Array.isArray(data) ? data : []);
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [defaultOrganizations.length, toast]);

  /**
   * Fetches organizations based on search query
   * @param {string} query - Search query (organization name)
   */
  const fetchOrganizations = useCallback(async (query: string) => {
    if (query.length === 0) {
      setOrganizations(defaultOrganizations);
      setHasSearched(false);
      return;
    }

    if (query.length < 2) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await organizationAPI.search({ 
        name: query,
        limit: 20 
      });
      const data = response.data?.data || response.data || [];
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to search organizations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to search organizations';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [defaultOrganizations, toast]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      fetchOrganizations(query);
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  // Load default organizations when dropdown opens
  useEffect(() => {
    if (open) {
      loadDefaultOrganizations();
    }
  }, [open, loadDefaultOrganizations]);

  /**
   * Handles organization selection
   * @param {Organization} organization - Selected organization
   */
  const handleSelect = (organization: Organization) => {
    dispatch(setCurrentOrganization(organization));
    setOpen(false);
    setSearchValue('');
    
    // Store in localStorage for persistence
    localStorage.setItem('currentOrganizationId', organization.id);
    localStorage.setItem('currentOrganization', JSON.stringify(organization));
    
    toast({
      title: 'Organization selected',
      description: `Switched to ${organization.name}`,
    });
  };

  /**
   * Gets the badge color based on organization type
   * @param {string} type - Organization type
   * @returns {string} Tailwind color classes
   */
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      company: 'bg-blue-100 text-blue-800',
      division: 'bg-green-100 text-green-800',
      department: 'bg-purple-100 text-purple-800',
      team: 'bg-yellow-100 text-yellow-800',
      insurance_agency: 'bg-indigo-100 text-indigo-800',
      insurance_branch: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Load organization from localStorage on mount
  useEffect(() => {
    if (!currentOrganization) {
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = localStorage.getItem('currentOrganization');
      
      if (savedOrg) {
        try {
          const org = JSON.parse(savedOrg);
          dispatch(setCurrentOrganization(org));
        } catch (error) {
          console.error('Failed to load saved organization:', error);
        }
      }
    }
  }, [currentOrganization, dispatch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className="w-full max-w-sm justify-between"
        >
          {currentOrganization ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{currentOrganization.name}</span>
              <Badge variant="secondary" className={cn('ml-2 text-xs', getTypeColor(currentOrganization.type))}>
                {currentOrganization.type}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Select organization...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search organizations..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && organizations.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading organizations...
                </div>
              </div>
            ) : organizations.length === 0 ? (
              <CommandEmpty>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchValue.length > 0 ? 'No organizations found' : 'No organizations available'}
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup className="p-2">
                <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {searchValue.length > 0 ? 'Search Results' : 'Available Organizations'}
                </div>
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.id}
                    onSelect={() => handleSelect(org)}
                    className="cursor-pointer rounded-md px-3 py-3 hover:bg-accent mb-1"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          'mr-3 h-4 w-4 flex-shrink-0',
                          currentOrganization?.id === org.id ? 'opacity-100 text-primary' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{org.name}</span>
                            </div>
                            {org.code && (
                              <div className="text-xs text-muted-foreground">Code: {org.code}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className={cn('text-xs', getTypeColor(org.type))}>
                          {org.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </div>
          {searchValue.length > 0 && searchValue.length < 2 && (
            <div className="border-t p-3">
              <p className="text-xs text-muted-foreground text-center">
                Type at least 2 characters to search
              </p>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}