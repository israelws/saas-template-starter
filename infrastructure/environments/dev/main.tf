terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "saas-template"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Username configuration
  username_attributes = ["email"]
  
  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "given_name"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "family_name"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Custom attributes
  schema {
    name                     = "organization_id"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = false

    string_attribute_constraints {
      min_length = 0
      max_length = 256
    }
  }

  schema {
    name                     = "role"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = false

    string_attribute_constraints {
      min_length = 0
      max_length = 256
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Verification message template
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}"
    email_subject        = "Verify your email for ${var.project_name}"
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  # Tags
  tags = {
    Name        = "${var.project_name}-${var.environment}-user-pool"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client (for backend/API)
resource "aws_cognito_user_pool_client" "backend" {
  name         = "${var.project_name}-${var.environment}-backend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token validity
  access_token_validity  = 60  # minutes
  id_token_validity      = 60  # minutes
  refresh_token_validity = 30  # days

  # Token units
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Generate secret for backend use
  generate_secret = true

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # OAuth settings
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                   = ["code", "implicit"]
  allowed_oauth_scopes                  = ["phone", "email", "openid", "profile"]
  
  callback_urls = [
    "http://localhost:3000/auth/callback",
    "http://localhost:3001/auth/callback"
  ]
  
  logout_urls = [
    "http://localhost:3000/auth/logout",
    "http://localhost:3001/auth/logout"
  ]

  supported_identity_providers = ["COGNITO"]

  # Attribute read/write permissions
  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "custom:organization_id",
    "custom:role"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "custom:organization_id",
    "custom:role"
  ]
}

# Cognito User Pool Client (for frontend/public)
resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.project_name}-${var.environment}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token validity
  access_token_validity  = 60  # minutes
  id_token_validity      = 60  # minutes
  refresh_token_validity = 30  # days

  # Token units
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # No secret for frontend use
  generate_secret = false

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # OAuth settings
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                   = ["code", "implicit"]
  allowed_oauth_scopes                  = ["phone", "email", "openid", "profile"]
  
  callback_urls = [
    "http://localhost:3000/auth/callback",
    "http://localhost:3001/auth/callback"
  ]
  
  logout_urls = [
    "http://localhost:3000/auth/logout",
    "http://localhost:3001/auth/logout"
  ]

  supported_identity_providers = ["COGNITO"]

  # Attribute read/write permissions
  read_attributes = [
    "email",
    "email_verified",
    "given_name",
    "family_name",
    "custom:organization_id",
    "custom:role"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "custom:organization_id",
    "custom:role"
  ]
}

# Create a test admin user (optional)
resource "aws_cognito_user" "admin" {
  user_pool_id = aws_cognito_user_pool.main.id
  username     = "admin@example.com"

  attributes = {
    email            = "admin@example.com"
    email_verified   = true
    given_name       = "Admin"
    family_name      = "User"
    "custom:role"    = "admin"
  }

  temporary_password = "TempPass123!"
  
  message_action = "SUPPRESS"
}

# Outputs
output "user_pool_id" {
  description = "The ID of the user pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "The ARN of the user pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_domain" {
  description = "The domain of the user pool"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "backend_client_id" {
  description = "The ID of the backend app client"
  value       = aws_cognito_user_pool_client.backend.id
}

output "backend_client_secret" {
  description = "The secret of the backend app client"
  value       = aws_cognito_user_pool_client.backend.client_secret
  sensitive   = true
}

output "frontend_client_id" {
  description = "The ID of the frontend app client"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_endpoint" {
  description = "The endpoint name of the user pool"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "cognito_issuer" {
  description = "The issuer URL for the user pool"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}