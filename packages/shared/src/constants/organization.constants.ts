import { OrganizationType } from '../types/organization.types';

export const ORGANIZATION_TYPE_HIERARCHY: Record<OrganizationType, OrganizationType[]> = {
  [OrganizationType.COMPANY]: [OrganizationType.DIVISION, OrganizationType.INSURANCE_AGENCY],
  [OrganizationType.DIVISION]: [OrganizationType.DEPARTMENT],
  [OrganizationType.DEPARTMENT]: [OrganizationType.TEAM],
  [OrganizationType.TEAM]: [],
  [OrganizationType.INSURANCE_AGENCY]: [OrganizationType.INSURANCE_BRANCH],
  [OrganizationType.INSURANCE_BRANCH]: [],
};

export const MAX_ORGANIZATION_DEPTH = 4;

export const DEFAULT_ORGANIZATION_SETTINGS = {
  allowSubOrganizations: true,
  maxDepth: MAX_ORGANIZATION_DEPTH,
  features: ['basic'],
};
