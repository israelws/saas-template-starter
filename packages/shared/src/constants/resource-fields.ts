// Resource field definitions for field-level permissions

export const RESOURCE_FIELDS = {
  User: {
    basic: ['id', 'email', 'firstName', 'lastName', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['password', 'mfaSecret', 'securityQuestions', 'lastLoginAt', 'loginAttempts'],
    metadata: ['preferences', 'settings', 'tags', 'customAttributes'],
  },
  Customer: {
    basic: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
    sensitive: ['ssn', 'dateOfBirth', 'creditScore', 'income', 'medicalHistory'],
    business: ['company', 'position', 'industry', 'employeeCount'],
    address: ['street', 'city', 'state', 'zipCode', 'country'],
  },
  Product: {
    basic: ['id', 'name', 'description', 'sku', 'category', 'status', 'createdAt', 'updatedAt'],
    pricing: ['price', 'currency', 'taxRate', 'discountPercentage'],
    sensitive: ['costPrice', 'profitMargin', 'supplierNotes', 'internalNotes'],
    inventory: ['quantity', 'reorderLevel', 'warehouse', 'location'],
  },
  Order: {
    basic: ['id', 'orderNumber', 'status', 'customerId', 'createdAt', 'updatedAt'],
    financial: ['subtotal', 'tax', 'shipping', 'total', 'currency'],
    items: ['items', 'itemCount', 'totalQuantity'],
    fulfillment: ['shippingAddress', 'billingAddress', 'trackingNumber', 'carrier'],
  },
  Transaction: {
    basic: ['id', 'type', 'status', 'amount', 'currency', 'createdAt'],
    sensitive: ['cardNumber', 'cvv', 'bankAccount', 'routingNumber'],
    metadata: ['orderId', 'customerId', 'description', 'reference'],
    audit: ['ipAddress', 'userAgent', 'location', 'device'],
  },
  InsurancePolicy: {
    basic: ['id', 'policyNumber', 'type', 'status', 'startDate', 'endDate'],
    coverage: ['coverageAmount', 'deductible', 'premium', 'paymentFrequency'],
    sensitive: ['profitMargin', 'commissionStructure', 'internalNotes', 'riskScore'],
    holder: ['holderId', 'holderName', 'beneficiaries', 'dependents'],
  },
  Organization: {
    basic: ['id', 'name', 'type', 'status', 'code', 'createdAt', 'updatedAt'],
    hierarchy: ['parentId', 'childIds', 'level', 'path'],
    contact: ['email', 'phone', 'website', 'address'],
    metadata: ['settings', 'preferences', 'customAttributes', 'tags'],
  }
};

// Helper to get all fields for a resource
export function getAllFieldsForResource(resourceType: string): string[] {
  const resource = RESOURCE_FIELDS[resourceType as keyof typeof RESOURCE_FIELDS];
  if (!resource) return [];
  
  return Object.values(resource).flat() as string[];
}

// Helper to get field categories
export function getFieldCategories(resourceType: string): Record<string, string[]> {
  return RESOURCE_FIELDS[resourceType as keyof typeof RESOURCE_FIELDS] || {};
}

// Helper to check if a field is sensitive
export function isFieldSensitive(resourceType: string, field: string): boolean {
  const resource = RESOURCE_FIELDS[resourceType as keyof typeof RESOURCE_FIELDS];
  if (!resource) return false;
  
  // Check if the resource has a sensitive property
  if ('sensitive' in resource && Array.isArray(resource.sensitive)) {
    return resource.sensitive.includes(field);
  }
  
  return false;
}