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
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Fetches organizations based on search query
   * @param {string} query - Search query (organization name)
   */
  const fetchOrganizations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setOrganizations([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      console.log('Searching for organizations with query:', query);
      const response = await organizationAPI.search({ 
        name: query,
        limit: 10 
      });
      console.log('Search response:', response);
      const data = response.data?.data || response.data || [];
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to search organizations:', error);
      console.error('Error response:', error.response);
      console.error('Error config:', error.config);
      
      // Show more specific error message
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
  }, [toast]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      fetchOrganizations(query);
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

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
      <PopoverContent className="w-full max-w-sm p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search organizations (min 3 chars)..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {isLoading ? (
              <div className="py-6 text-center text-sm">Searching...</div>
            ) : searchValue.length < 3 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 3 characters to search
              </div>
            ) : hasSearched ? (
              <div className="py-6 text-center text-sm">No organizations found</div>
            ) : null}
          </CommandEmpty>
          {!isLoading && organizations.length > 0 && (
            <CommandGroup>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={() => handleSelect(org)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentOrganization?.id === org.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{org.name}</span>
                      <Badge variant="outline" className={cn('text-xs', getTypeColor(org.type))}>
                        {org.type}
                      </Badge>
                    </div>
                    {org.code && (
                      <div className="text-xs text-muted-foreground">Code: {org.code}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}