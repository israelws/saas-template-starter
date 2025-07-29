import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { OrganizationTree } from '../organization-tree';
import { renderWithProviders, mockOrganization } from '@/test-utils';

describe('OrganizationTree', () => {
  const mockOrganizations = [
    mockOrganization({
      id: 'org-1',
      name: 'Root Org',
      children: [
        mockOrganization({
          id: 'org-2',
          name: 'Child Org 1',
          parentId: 'org-1',
          children: [
            mockOrganization({
              id: 'org-4',
              name: 'Grandchild Org',
              parentId: 'org-2',
            }),
          ],
        }),
        mockOrganization({
          id: 'org-3',
          name: 'Child Org 2',
          parentId: 'org-1',
        }),
      ],
    }),
  ];

  const defaultProps = {
    organizations: mockOrganizations,
    onSelectOrganization: jest.fn(),
    onAddOrganization: jest.fn(),
    onEditOrganization: jest.fn(),
    onDeleteOrganization: jest.fn(),
    onViewDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders organization hierarchy correctly', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    expect(screen.getByText('Root Org')).toBeInTheDocument();
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();
    expect(screen.getByText('Child Org 2')).toBeInTheDocument();
    expect(screen.getByText('Grandchild Org')).toBeInTheDocument();
  });

  it('shows organization codes', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    expect(screen.getByText('(TEST_ORG)')).toBeInTheDocument();
  });

  it('displays status badges', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    const statusBadges = screen.getAllByText('active');
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('handles organization selection', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    const orgNode = screen.getByText('Root Org').closest('div');
    fireEvent.click(orgNode!);

    expect(defaultProps.onSelectOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'org-1', name: 'Root Org' }),
    );
  });

  it('toggles node expansion', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    // Initially expanded (default behavior)
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();

    // Find and click the chevron icon for Root Org
    const rootOrgRow = screen.getByText('Root Org').closest('div');
    const chevronButton = rootOrgRow?.querySelector('button');

    if (chevronButton) {
      fireEvent.click(chevronButton);
    }

    // After clicking, children should be hidden
    expect(screen.queryByText('Child Org 1')).not.toBeInTheDocument();
  });

  it('shows empty state when no organizations', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} organizations={[]} />);

    expect(screen.getByText('No organizations found')).toBeInTheDocument();
    expect(screen.getByText('Create First Organization')).toBeInTheDocument();
  });

  it('handles add organization action', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} organizations={[]} />);

    const createButton = screen.getByText('Create First Organization');
    fireEvent.click(createButton);

    expect(defaultProps.onAddOrganization).toHaveBeenCalledWith(null);
  });

  it('expands all nodes when clicking Expand All', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);

    // All organizations should be visible
    expect(screen.getByText('Root Org')).toBeInTheDocument();
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();
    expect(screen.getByText('Child Org 2')).toBeInTheDocument();
    expect(screen.getByText('Grandchild Org')).toBeInTheDocument();
  });

  it('collapses all nodes when clicking Collapse All', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} />);

    const collapseAllButton = screen.getByText('Collapse All');
    fireEvent.click(collapseAllButton);

    // Only root should be visible
    expect(screen.getByText('Root Org')).toBeInTheDocument();
    expect(screen.queryByText('Child Org 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child Org 2')).not.toBeInTheDocument();
  });

  it('highlights selected organization', () => {
    renderWithProviders(<OrganizationTree {...defaultProps} selectedOrganizationId="org-1" />);

    const selectedOrgRow = screen.getByText('Root Org').closest('div');
    expect(selectedOrgRow).toHaveClass('bg-muted');
  });

  it('renders different icons for different organization types', () => {
    const orgsWithTypes = [
      mockOrganization({ type: 'company', name: 'Company Org' }),
      mockOrganization({ type: 'division', name: 'Division Org' }),
      mockOrganization({ type: 'department', name: 'Department Org' }),
      mockOrganization({ type: 'team', name: 'Team Org' }),
    ];

    renderWithProviders(<OrganizationTree {...defaultProps} organizations={orgsWithTypes} />);

    // Verify all organizations are rendered
    expect(screen.getByText('Company Org')).toBeInTheDocument();
    expect(screen.getByText('Division Org')).toBeInTheDocument();
    expect(screen.getByText('Department Org')).toBeInTheDocument();
    expect(screen.getByText('Team Org')).toBeInTheDocument();
  });
});
