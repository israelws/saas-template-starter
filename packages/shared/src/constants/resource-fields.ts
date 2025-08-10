// Resource field definitions for field-level permissions

export const RESOURCE_FIELDS = {
  // User resources
  User: {
    basic: ['id', 'email', 'firstName', 'lastName', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['password', 'mfaSecret', 'securityQuestions', 'lastLoginAt', 'loginAttempts'],
    metadata: ['preferences', 'settings', 'tags', 'customAttributes'],
  },
  user: {
    basic: ['id', 'email', 'firstName', 'lastName', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['password', 'mfaSecret', 'securityQuestions', 'lastLoginAt', 'loginAttempts'],
    metadata: ['preferences', 'settings', 'tags', 'customAttributes'],
  },
  users: {
    basic: ['id', 'email', 'firstName', 'lastName', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['password', 'mfaSecret', 'securityQuestions', 'lastLoginAt', 'loginAttempts'],
    metadata: ['preferences', 'settings', 'tags', 'customAttributes'],
  },
  // Customer resources
  Customer: {
    basic: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'medicalHistory'],
    business: ['company', 'position', 'industry', 'employeeCount'],
    address: ['street', 'city', 'state', 'zipCode', 'country'],
  },
  customer: {
    basic: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'medicalHistory'],
    business: ['company', 'position', 'industry', 'employeeCount'],
    address: ['street', 'city', 'state', 'zipCode', 'country'],
  },
  customers: {
    basic: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'medicalHistory'],
    business: ['company', 'position', 'industry', 'employeeCount'],
    address: ['street', 'city', 'state', 'zipCode', 'country'],
  },
  // Product resources
  Product: {
    basic: ['id', 'name', 'description', 'sku', 'category', 'status', 'createdAt', 'updatedAt'],
    pricing: ['price', 'currency', 'taxRate', 'discountPercentage'],
    sensitive: ['costPrice', 'profitMargin', 'supplierNotes', 'internalNotes'],
    inventory: ['quantity', 'reorderLevel', 'warehouse', 'location'],
  },
  product: {
    basic: ['id', 'name', 'description', 'sku', 'category', 'status', 'createdAt', 'updatedAt'],
    pricing: ['price', 'currency', 'taxRate', 'discountPercentage'],
    sensitive: ['costPrice', 'profitMargin', 'supplierNotes', 'internalNotes'],
    inventory: ['quantity', 'reorderLevel', 'warehouse', 'location'],
  },
  products: {
    basic: ['id', 'name', 'description', 'sku', 'category', 'status', 'createdAt', 'updatedAt'],
    pricing: ['price', 'currency', 'taxRate', 'discountPercentage'],
    sensitive: ['costPrice', 'profitMargin', 'supplierNotes', 'internalNotes'],
    inventory: ['quantity', 'reorderLevel', 'warehouse', 'location'],
  },
  // Order resources
  Order: {
    basic: ['id', 'orderNumber', 'status', 'customerId', 'createdAt', 'updatedAt'],
    financial: ['subtotal', 'tax', 'shipping', 'total', 'currency'],
    items: ['items', 'itemCount', 'totalQuantity'],
    fulfillment: ['shippingAddress', 'billingAddress', 'trackingNumber', 'carrier'],
  },
  order: {
    basic: ['id', 'orderNumber', 'status', 'customerId', 'createdAt', 'updatedAt'],
    financial: ['subtotal', 'tax', 'shipping', 'total', 'currency'],
    items: ['items', 'itemCount', 'totalQuantity'],
    fulfillment: ['shippingAddress', 'billingAddress', 'trackingNumber', 'carrier'],
  },
  orders: {
    basic: ['id', 'orderNumber', 'status', 'customerId', 'createdAt', 'updatedAt'],
    financial: ['subtotal', 'tax', 'shipping', 'total', 'currency'],
    items: ['items', 'itemCount', 'totalQuantity'],
    fulfillment: ['shippingAddress', 'billingAddress', 'trackingNumber', 'carrier'],
  },
  // Transaction resources
  Transaction: {
    basic: ['id', 'type', 'status', 'amount', 'currency', 'createdAt'],
    sensitive: ['cardNumber', 'cvv', 'bankAccount', 'routingNumber'],
    metadata: ['orderId', 'customerId', 'description', 'reference'],
    audit: ['ipAddress', 'userAgent', 'location', 'device'],
  },
  transaction: {
    basic: ['id', 'type', 'status', 'amount', 'currency', 'createdAt'],
    sensitive: ['cardNumber', 'cvv', 'bankAccount', 'routingNumber'],
    metadata: ['orderId', 'customerId', 'description', 'reference'],
    audit: ['ipAddress', 'userAgent', 'location', 'device'],
  },
  transactions: {
    basic: ['id', 'type', 'status', 'amount', 'currency', 'createdAt'],
    sensitive: ['cardNumber', 'cvv', 'bankAccount', 'routingNumber'],
    metadata: ['orderId', 'customerId', 'description', 'reference'],
    audit: ['ipAddress', 'userAgent', 'location', 'device'],
  },
  // Insurance Policy resources
  InsurancePolicy: {
    basic: ['id', 'policyNumber', 'type', 'status', 'startDate', 'endDate'],
    coverage: ['coverageAmount', 'deductible', 'premium', 'paymentFrequency'],
    sensitive: ['profitMargin', 'commissionStructure', 'internalNotes', 'riskScore'],
    holder: ['holderId', 'holderName', 'beneficiaries', 'dependents'],
  },
  insurancePolicy: {
    basic: ['id', 'policyNumber', 'type', 'status', 'startDate', 'endDate'],
    coverage: ['coverageAmount', 'deductible', 'premium', 'paymentFrequency'],
    sensitive: ['profitMargin', 'commissionStructure', 'internalNotes', 'riskScore'],
    holder: ['holderId', 'holderName', 'beneficiaries', 'dependents'],
  },
  // Organization resources
  Organization: {
    basic: ['id', 'name', 'type', 'status', 'code', 'createdAt', 'updatedAt'],
    hierarchy: ['parentId', 'childIds', 'level', 'path'],
    contact: ['email', 'phone', 'website', 'address'],
    metadata: ['settings', 'preferences', 'customAttributes', 'tags'],
  },
  organization: {
    basic: ['id', 'name', 'type', 'status', 'code', 'createdAt', 'updatedAt'],
    hierarchy: ['parentId', 'childIds', 'level', 'path'],
    contact: ['email', 'phone', 'website', 'address'],
    metadata: ['settings', 'preferences', 'customAttributes', 'tags'],
  },
  organizations: {
    basic: ['id', 'name', 'type', 'status', 'code', 'createdAt', 'updatedAt'],
    hierarchy: ['parentId', 'childIds', 'level', 'path'],
    contact: ['email', 'phone', 'website', 'address'],
    metadata: ['settings', 'preferences', 'customAttributes', 'tags'],
  },
  // Policy resources
  Policy: {
    basic: ['id', 'name', 'description', 'effect', 'priority', 'status', 'createdAt', 'updatedAt'],
    conditions: ['conditions', 'resourceRules', 'fieldPermissions'],
    metadata: ['tags', 'version', 'createdBy', 'modifiedBy'],
  },
  policy: {
    basic: ['id', 'name', 'description', 'effect', 'priority', 'status', 'createdAt', 'updatedAt'],
    conditions: ['conditions', 'resourceRules', 'fieldPermissions'],
    metadata: ['tags', 'version', 'createdBy', 'modifiedBy'],
  },
  policies: {
    basic: ['id', 'name', 'description', 'effect', 'priority', 'status', 'createdAt', 'updatedAt'],
    conditions: ['conditions', 'resourceRules', 'fieldPermissions'],
    metadata: ['tags', 'version', 'createdBy', 'modifiedBy'],
  },
  // Role resources
  Role: {
    basic: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
    permissions: ['permissions', 'policies', 'resources'],
    metadata: ['tags', 'priority', 'system'],
  },
  role: {
    basic: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
    permissions: ['permissions', 'policies', 'resources'],
    metadata: ['tags', 'priority', 'system'],
  },
  roles: {
    basic: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
    permissions: ['permissions', 'policies', 'resources'],
    metadata: ['tags', 'priority', 'system'],
  },
};

// Helper to normalize resource type (handles case-insensitive lookups)
function normalizeResourceType(resourceType: string): keyof typeof RESOURCE_FIELDS | undefined {
  // First try exact match
  if (resourceType in RESOURCE_FIELDS) {
    return resourceType as keyof typeof RESOURCE_FIELDS;
  }
  
  // Try case-insensitive match
  const normalized = Object.keys(RESOURCE_FIELDS).find(
    key => key.toLowerCase() === resourceType.toLowerCase()
  );
  
  return normalized as keyof typeof RESOURCE_FIELDS | undefined;
}

// Helper to get all fields for a resource
export function getAllFieldsForResource(resourceType: string): string[] {
  const normalizedType = normalizeResourceType(resourceType);
  if (!normalizedType) return [];
  
  const resource = RESOURCE_FIELDS[normalizedType];
  if (!resource) return [];

  return Object.values(resource).flat() as string[];
}

// Helper to get field categories
export function getFieldCategories(resourceType: string): Record<string, string[]> {
  const normalizedType = normalizeResourceType(resourceType);
  if (!normalizedType) return {};
  
  return RESOURCE_FIELDS[normalizedType] || {};
}

// Helper to check if a field is sensitive
export function isFieldSensitive(resourceType: string, field: string): boolean {
  const normalizedType = normalizeResourceType(resourceType);
  if (!normalizedType) return false;
  
  const resource = RESOURCE_FIELDS[normalizedType];
  if (!resource) return false;

  // Check if the resource has a sensitive property
  if ('sensitive' in resource && Array.isArray(resource.sensitive)) {
    return resource.sensitive.includes(field);
  }

  return false;
}
