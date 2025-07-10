import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationTreeDnd } from '../organization-tree-dnd';
import { renderWithProviders, mockOrganization } from '@/test-utils';

// Mock @dnd-kit/sortable
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

describe('OrganizationTreeDnd', () => {
  const mockOrganizations = [
    mockOrganization({
      id: '1',
      name: 'Parent Org',
      parentId: null,
      children: [
        mockOrganization({
          id: '2',
          name: 'Child Org 1',
          parentId: '1',
          children: [
            mockOrganization({
              id: '4',
              name: 'Grandchild Org',
              parentId: '2',
            }),
          ],
        }),
        mockOrganization({
          id: '3',
          name: 'Child Org 2',
          parentId: '1',
        }),
      ],
    }),
    mockOrganization({
      id: '5',
      name: 'Another Root Org',
      parentId: null,
    }),
  ];

  const defaultProps = {
    organizations: mockOrganizations,
    onReorder: jest.fn(),
    onMoveOrganization: jest.fn(),
    selectedOrganizationId: null,
    onSelectOrganization: jest.fn(),
    onAddOrganization: jest.fn(),
    onEditOrganization: jest.fn(),
    onDeleteOrganization: jest.fn(),
    onViewDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders organization tree with drag handles', () => {
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    expect(screen.getByText('Parent Org')).toBeInTheDocument();
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();
    expect(screen.getByText('Child Org 2')).toBeInTheDocument();
    expect(screen.getByText('Grandchild Org')).toBeInTheDocument();
    expect(screen.getByText('Another Root Org')).toBeInTheDocument();

    // Should have drag handles
    const dragHandles = screen.getAllByRole('button', { name: /drag handle/i });
    expect(dragHandles.length).toBeGreaterThan(0);
  });

  it('maintains tree structure', () => {
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Parent should be visible
    expect(screen.getByText('Parent Org')).toBeInTheDocument();

    // Children should be indented (check for padding/margin classes)
    const childOrg1 = screen.getByText('Child Org 1').closest('.flex');
    expect(childOrg1).toHaveStyle({ paddingLeft: expect.stringContaining('px') });
  });

  it('handles organization selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    await user.click(screen.getByText('Child Org 1'));

    expect(defaultProps.onSelectOrganization).toHaveBeenCalledWith('2');
  });

  it('shows selected organization with highlight', () => {
    const propsWithSelection = {
      ...defaultProps,
      selectedOrganizationId: '2',
    };

    renderWithProviders(<OrganizationTreeDnd {...propsWithSelection} />);

    const selectedOrg = screen.getByText('Child Org 1').closest('.rounded-md');
    expect(selectedOrg).toHaveClass('bg-accent');
  });

  it('expands and collapses nodes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Initially expanded (children visible)
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();

    // Find and click collapse button for Parent Org
    const collapseButtons = screen.getAllByRole('button', { name: /chevron/i });
    await user.click(collapseButtons[0]);

    // Children should be hidden
    expect(screen.queryByText('Child Org 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child Org 2')).not.toBeInTheDocument();

    // Click again to expand
    await user.click(collapseButtons[0]);

    // Children should be visible again
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();
    expect(screen.getByText('Child Org 2')).toBeInTheDocument();
  });

  it('shows action menu on more button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Find the first more button
    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    await user.click(moreButtons[0]);

    // Action menu items should appear
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Add Child')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles view details action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    await user.click(moreButtons[0]);
    await user.click(screen.getByText('View Details'));

    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('1');
  });

  it('handles add child action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    await user.click(moreButtons[0]);
    await user.click(screen.getByText('Add Child'));

    expect(defaultProps.onAddOrganization).toHaveBeenCalledWith('1');
  });

  it('handles edit action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    await user.click(moreButtons[0]);
    await user.click(screen.getByText('Edit'));

    expect(defaultProps.onEditOrganization).toHaveBeenCalledWith('1');
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    const moreButtons = screen.getAllByRole('button', { name: /more options/i });
    await user.click(moreButtons[0]);
    await user.click(screen.getByText('Delete'));

    expect(defaultProps.onDeleteOrganization).toHaveBeenCalledWith('1');
  });

  it('disables drag for organizations with children', () => {
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Parent Org has children, so drag should be disabled
    const parentOrgHandle = screen.getAllByRole('button', { name: /drag handle/i })[0];
    expect(parentOrgHandle).toHaveAttribute('disabled');

    // Another Root Org has no children, so drag should be enabled
    const rootOrgHandles = screen.getAllByRole('button', { name: /drag handle/i });
    const anotherRootHandle = rootOrgHandles[rootOrgHandles.length - 1];
    expect(anotherRootHandle).not.toHaveAttribute('disabled');
  });

  it('shows organization metadata', () => {
    renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Should display organization types
    expect(screen.getByText('company')).toBeInTheDocument();
    expect(screen.getByText('division')).toBeInTheDocument();
  });

  it('handles drag and drop simulation', async () => {
    const mockOnReorder = jest.fn();
    const propsWithReorder = {
      ...defaultProps,
      onReorder: mockOnReorder,
    };

    renderWithProviders(<OrganizationTreeDnd {...propsWithReorder} />);

    // Since we're mocking @dnd-kit, we can't simulate actual drag and drop
    // But we can verify the structure is set up correctly
    expect(screen.getAllByRole('button', { name: /drag handle/i })).toHaveLength(5);
  });

  it('preserves expansion state during rerender', () => {
    const { rerender } = renderWithProviders(<OrganizationTreeDnd {...defaultProps} />);

    // Verify initial state
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();

    // Rerender with same props
    rerender(<OrganizationTreeDnd {...defaultProps} />);

    // Children should still be visible
    expect(screen.getByText('Child Org 1')).toBeInTheDocument();
  });

  it('handles empty organization list', () => {
    const propsWithEmpty = {
      ...defaultProps,
      organizations: [],
    };

    renderWithProviders(<OrganizationTreeDnd {...propsWithEmpty} />);

    // Should render without errors
    expect(screen.queryByRole('button', { name: /drag handle/i })).not.toBeInTheDocument();
  });

  it('renders deeply nested organizations correctly', () => {
    const deeplyNested = [
      mockOrganization({
        id: '1',
        name: 'Level 1',
        children: [
          mockOrganization({
            id: '2',
            name: 'Level 2',
            parentId: '1',
            children: [
              mockOrganization({
                id: '3',
                name: 'Level 3',
                parentId: '2',
                children: [
                  mockOrganization({
                    id: '4',
                    name: 'Level 4',
                    parentId: '3',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    const propsWithDeepNesting = {
      ...defaultProps,
      organizations: deeplyNested,
    };

    renderWithProviders(<OrganizationTreeDnd {...propsWithDeepNesting} />);

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Level 4')).toBeInTheDocument();

    // Each level should be progressively more indented
    const level4 = screen.getByText('Level 4').closest('.flex');

    expect(level4).toHaveStyle({
      paddingLeft: expect.stringContaining('px'),
    });
  });
});
