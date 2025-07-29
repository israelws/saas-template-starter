import React from 'react';
import { screen } from '@testing-library/react';
import { OrganizationStats } from '../organization-stats';
import { renderWithProviders, mockOrganizationStats } from '@/test-utils';

describe('OrganizationStats', () => {
  const defaultStats = mockOrganizationStats();

  it('renders organization name and basic info', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('company')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('displays organization health score', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('Organization Health')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // Active org with all metrics
  });

  it('shows organizational structure metrics', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('Direct Children')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Total Descendants')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays user metrics', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('Direct Users')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows security and business metrics', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('Direct Policies')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Total Policies')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const statsWithLargeNumbers = mockOrganizationStats({
      customersCount: 1500,
      totalUsersCount: 25000,
    });

    renderWithProviders(<OrganizationStats stats={statsWithLargeNumbers} />);

    expect(screen.getByText('1.5K')).toBeInTheDocument(); // Customers
    expect(screen.getByText('25K')).toBeInTheDocument(); // Total Users
  });

  it('calculates health score based on various factors', () => {
    const inactiveStats = mockOrganizationStats({
      status: 'inactive',
      totalUsersCount: 0,
      totalPoliciesCount: 0,
      productsCount: 0,
      customersCount: 0,
      totalDescendantsCount: 0,
    });

    renderWithProviders(<OrganizationStats stats={inactiveStats} />);

    expect(screen.getByText('0%')).toBeInTheDocument(); // Low health score
  });

  it('shows activity indicators', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    expect(screen.getByText('User Engagement')).toBeInTheDocument();
    expect(screen.getByText('Business Activity')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('handles comparison mode', () => {
    const comparisonStats = mockOrganizationStats({
      directChildrenCount: 2, // Was 3, so -33.3%
      totalUsersCount: 30, // Was 25, so +20%
    });

    renderWithProviders(
      <OrganizationStats
        stats={defaultStats}
        showComparison={true}
        comparisonStats={comparisonStats}
      />,
    );

    // Should show percentage changes
    expect(screen.getByText('+50.0%')).toBeInTheDocument(); // Direct children: 3 vs 2
    expect(screen.getByText('-16.7%')).toBeInTheDocument(); // Total users: 25 vs 30
  });

  it('shows correct status for inactive business', () => {
    const inactiveBusinessStats = mockOrganizationStats({
      productsCount: 0,
      customersCount: 0,
    });

    renderWithProviders(<OrganizationStats stats={inactiveBusinessStats} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calculates user engagement percentage', () => {
    renderWithProviders(<OrganizationStats stats={defaultStats} />);

    // Direct users (5) / Total users (25) = 20%
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const zeroStats = mockOrganizationStats({
      directChildrenCount: 0,
      totalDescendantsCount: 0,
      directUsersCount: 0,
      totalUsersCount: 0,
      directPoliciesCount: 0,
      totalPoliciesCount: 0,
      productsCount: 0,
      customersCount: 0,
    });

    renderWithProviders(<OrganizationStats stats={zeroStats} />);

    // Should render without errors
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument(); // For user engagement
  });
});
