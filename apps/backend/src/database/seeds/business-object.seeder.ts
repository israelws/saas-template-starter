import { DataSource } from 'typeorm';
import { Product } from '../../modules/products/entities/product.entity';
import { Customer } from '../../modules/customers/entities/customer.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { OrderItem } from '../../modules/orders/entities/order-item.entity';
import { Transaction } from '../../modules/transactions/entities/transaction.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User } from '../../modules/users/entities/user.entity';
import { LoggerService } from '../../common/logger/logger.service';

export class BusinessObjectSeeder {
  private logger = new LoggerService('BusinessObjectSeeder');
  private productRepository: any;
  private customerRepository: any;
  private orderRepository: any;
  private orderItemRepository: any;
  private transactionRepository: any;
  private organizationRepository: any;
  private userRepository: any;

  constructor(private dataSource: DataSource) {
    this.productRepository = this.dataSource.getRepository(Product);
    this.customerRepository = this.dataSource.getRepository(Customer);
    this.orderRepository = this.dataSource.getRepository(Order);
    this.orderItemRepository = this.dataSource.getRepository(OrderItem);
    this.transactionRepository = this.dataSource.getRepository(Transaction);
    this.organizationRepository = this.dataSource.getRepository(Organization);
    this.userRepository = this.dataSource.getRepository(User);
  }

  async seed(): Promise<void> {
    this.logger.log('Starting business objects seeding...');

    // Clear existing business objects
    await this.transactionRepository.query('TRUNCATE TABLE transactions CASCADE');
    await this.orderItemRepository.query('TRUNCATE TABLE order_items CASCADE');
    await this.orderRepository.query('TRUNCATE TABLE orders CASCADE');
    await this.customerRepository.query('TRUNCATE TABLE customers CASCADE');
    await this.productRepository.query('TRUNCATE TABLE products CASCADE');

    // Get organizations
    const techCorp = await this.organizationRepository.findOne({ where: { code: 'TECHCORP' } });
    const engDiv = await this.organizationRepository.findOne({ where: { code: 'ENG_DIV' } });
    const salesDiv = await this.organizationRepository.findOne({ where: { code: 'SALES_DIV' } });
    const retailMax = await this.organizationRepository.findOne({ where: { code: 'RETAILMAX' } });
    const finFlow = await this.organizationRepository.findOne({ where: { code: 'FINFLOW' } });

    // Create products
    await this.createProducts(techCorp, engDiv, salesDiv, retailMax, finFlow);
    
    // Create customers
    await this.createCustomers(techCorp, salesDiv, retailMax, finFlow);
    
    // Create orders and order items
    await this.createOrders(techCorp, retailMax, finFlow);
    
    // Create transactions
    await this.createTransactions(techCorp, retailMax, finFlow);

    this.logger.log('Business objects seeding completed successfully');
  }

  private async createProducts(techCorp: any, engDiv: any, salesDiv: any, retailMax: any, finFlow: any): Promise<void> {
    const products = [
      // TechCorp Products
      {
        name: 'Enterprise Platform Suite',
        description: 'Complete enterprise software platform with CRM, ERP, and analytics',
        sku: 'TC-EPS-001',
        price: 50000.00,
        stockQuantity: 100,
        status: 'active',
        attributes: {
          category: 'software',
          license: 'enterprise',
          deployment: 'cloud',
          support: 'premium',
          integrations: ['salesforce', 'sap', 'office365'],
          compliance: ['sox', 'gdpr', 'hipaa']
        },
        organization: techCorp
      },
      {
        name: 'API Gateway Professional',
        description: 'High-performance API gateway with security and analytics',
        sku: 'TC-AGP-002',
        price: 15000.00,
        stockQuantity: 200,
        status: 'active',
        attributes: {
          category: 'infrastructure',
          deployment: 'hybrid',
          throughput: '10000_rps',
          features: ['authentication', 'rate_limiting', 'analytics', 'monitoring']
        },
        organization: engDiv
      },
      {
        name: 'Data Analytics Platform',
        description: 'Real-time data analytics and business intelligence platform',
        sku: 'TC-DAP-003',
        price: 25000.00,
        stockQuantity: 75,
        status: 'active',
        attributes: {
          category: 'analytics',
          data_sources: ['databases', 'apis', 'files', 'streams'],
          visualization: true,
          machine_learning: true
        },
        organization: techCorp
      },
      {
        name: 'Cloud Storage Enterprise',
        description: 'Secure cloud storage with collaboration features',
        sku: 'TC-CSE-004',
        price: 500.00,
        stockQuantity: 1000,
        status: 'active',
        attributes: {
          category: 'storage',
          capacity: '10TB',
          encryption: 'AES-256',
          collaboration: true,
          backup: 'automated'
        },
        organization: techCorp
      },
      {
        name: 'Professional Services Package',
        description: 'Implementation and consulting services',
        sku: 'TC-PSP-005',
        price: 1500.00,
        stockQuantity: 50,
        status: 'active',
        attributes: {
          category: 'service',
          unit: 'day',
          expertise: ['implementation', 'training', 'optimization'],
          duration: 'flexible'
        },
        organization: salesDiv
      },

      // RetailMax Products
      {
        name: 'Premium Fashion Line',
        description: 'High-quality fashion apparel for modern professionals',
        sku: 'RM-PFL-001',
        price: 299.99,
        stockQuantity: 500,
        status: 'active',
        attributes: {
          category: 'apparel',
          gender: 'unisex',
          season: 'all-season',
          materials: ['cotton', 'wool', 'synthetic'],
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        organization: retailMax
      },
      {
        name: 'Smart Home Electronics',
        description: 'Connected home devices and smart appliances',
        sku: 'RM-SHE-002',
        price: 599.99,
        stockQuantity: 300,
        status: 'active',
        attributes: {
          category: 'electronics',
          connectivity: ['wifi', 'bluetooth', 'zigbee'],
          warranty: '2-years',
          energy_rating: 'A+++'
        },
        organization: retailMax
      },
      {
        name: 'Outdoor Sports Equipment',
        description: 'Professional-grade outdoor and sports equipment',
        sku: 'RM-OSE-003',
        price: 899.99,
        stockQuantity: 150,
        status: 'active',
        attributes: {
          category: 'sports',
          activities: ['hiking', 'camping', 'cycling', 'climbing'],
          durability: 'professional',
          weather_resistant: true
        },
        organization: retailMax
      },

      // FinanceFlow Products
      {
        name: 'Payment Processing API',
        description: 'Secure payment processing with multi-currency support',
        sku: 'FF-PPA-001',
        price: 0.025, // Per transaction
        stockQuantity: 9999999,
        status: 'active',
        attributes: {
          category: 'fintech',
          pricing_model: 'per_transaction',
          currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD'],
          compliance: ['pci_dss', 'gdpr'],
          settlement: '24h'
        },
        organization: finFlow
      },
      {
        name: 'Fraud Detection Service',
        description: 'AI-powered fraud detection and prevention',
        sku: 'FF-FDS-002',
        price: 500.00,
        stockQuantity: 200,
        status: 'active',
        attributes: {
          category: 'security',
          pricing_model: 'monthly',
          ai_engine: 'machine_learning',
          real_time: true,
          accuracy: '99.7%'
        },
        organization: finFlow
      },
      {
        name: 'Risk Analytics Platform',
        description: 'Comprehensive risk assessment and analytics tools',
        sku: 'FF-RAP-003',
        price: 2500.00,
        stockQuantity: 100,
        status: 'active',
        attributes: {
          category: 'analytics',
          risk_models: ['credit', 'market', 'operational', 'liquidity'],
          reporting: 'real_time',
          regulation: ['basel_III', 'dodd_frank']
        },
        organization: finFlow
      }
    ];

    for (const productData of products) {
      const product = this.productRepository.create(productData);
      await this.productRepository.save(product);
      this.logger.debug(`Created product: ${productData.name}`);
    }
  }

  private async createCustomers(techCorp: any, salesDiv: any, retailMax: any, finFlow: any): Promise<void> {
    const customers = [
      // TechCorp Customers
      {
        name: 'Global Manufacturing Corp',
        email: 'procurement@globalmanufacturing.com',
        phone: '+1-555-1001',
        address: '123 Industrial Blvd, Detroit, MI 48201',
        balance: 125000.00,
        status: 'active',
        attributes: {
          industry: 'manufacturing',
          size: 'enterprise',
          employees: 15000,
          annual_revenue: '2.5B',
          contract_tier: 'platinum',
          payment_terms: 'net_30'
        },
        organization: techCorp
      },
      {
        name: 'MedTech Innovations',
        email: 'it@medtechinnovations.com',
        phone: '+1-555-1002',
        address: '456 Healthcare Way, Boston, MA 02115',
        balance: 75000.00,
        status: 'active',
        attributes: {
          industry: 'healthcare',
          size: 'large',
          employees: 5000,
          compliance: ['hipaa', 'fda'],
          contract_tier: 'gold'
        },
        organization: salesDiv
      },
      {
        name: 'StartupAccelerator Inc',
        email: 'tech@startupaccel.com',
        phone: '+1-555-1003',
        address: '789 Innovation St, Austin, TX 78701',
        balance: 25000.00,
        status: 'active',
        attributes: {
          industry: 'technology',
          size: 'medium',
          employees: 200,
          growth_stage: 'series_b',
          contract_tier: 'silver'
        },
        organization: salesDiv
      },
      {
        name: 'Educational Solutions Network',
        email: 'admin@edusolutions.edu',
        phone: '+1-555-1004',
        address: '321 Learning Ave, Chicago, IL 60610',
        balance: 45000.00,
        status: 'active',
        attributes: {
          industry: 'education',
          size: 'large',
          students: 50000,
          compliance: ['ferpa'],
          contract_tier: 'gold'
        },
        organization: techCorp
      },

      // RetailMax Customers
      {
        name: 'Fashion Forward Boutiques',
        email: 'buying@fashionforward.com',
        phone: '+1-555-2001',
        address: '555 Style Street, New York, NY 10001',
        balance: 35000.00,
        status: 'active',
        attributes: {
          industry: 'retail',
          size: 'medium',
          stores: 25,
          customer_type: 'wholesale',
          order_frequency: 'monthly'
        },
        organization: retailMax
      },
      {
        name: 'Tech Gadget Distributors',
        email: 'orders@techgadgets.com',
        phone: '+1-555-2002',
        address: '777 Electronics Blvd, San Jose, CA 95110',
        balance: 85000.00,
        status: 'active',
        attributes: {
          industry: 'electronics',
          size: 'large',
          distribution_channels: ['online', 'retail', 'b2b'],
          volume_tier: 'high'
        },
        organization: retailMax
      },
      {
        name: 'Outdoor Adventure Co',
        email: 'purchasing@outdooradventure.com',
        phone: '+1-555-2003',
        address: '888 Mountain View Dr, Denver, CO 80202',
        balance: 22000.00,
        status: 'active',
        attributes: {
          industry: 'sporting_goods',
          size: 'medium',
          specialization: 'outdoor_equipment',
          seasonality: 'spring_summer'
        },
        organization: retailMax
      },

      // FinanceFlow Customers
      {
        name: 'E-commerce Platform LLC',
        email: 'api@ecommerceplatform.com',
        phone: '+1-555-3001',
        address: '999 Digital Commerce St, Seattle, WA 98101',
        balance: 15000.00,
        status: 'active',
        attributes: {
          industry: 'ecommerce',
          size: 'large',
          monthly_volume: 50000,
          integration_type: 'api',
          risk_profile: 'low'
        },
        organization: finFlow
      },
      {
        name: 'Regional Credit Union',
        email: 'tech@regionalcu.org',
        phone: '+1-555-3002',
        address: '111 Community Bank Way, Austin, TX 78702',
        balance: 85000.00,
        status: 'active',
        attributes: {
          industry: 'financial_services',
          size: 'medium',
          members: 100000,
          assets: '500M',
          regulation: ['ncua', 'ffiec']
        },
        organization: finFlow
      },
      {
        name: 'FinTech Startup Solutions',
        email: 'dev@fintechstartup.com',
        phone: '+1-555-3003',
        address: '222 Innovation Hub, San Francisco, CA 94105',
        balance: 5000.00,
        status: 'active',
        attributes: {
          industry: 'fintech',
          size: 'small',
          funding_stage: 'seed',
          use_case: 'payment_processing',
          risk_profile: 'medium'
        },
        organization: finFlow
      }
    ];

    for (const customerData of customers) {
      const customer = this.customerRepository.create(customerData);
      await this.customerRepository.save(customer);
      this.logger.debug(`Created customer: ${customerData.name}`);
    }
  }

  private async createOrders(techCorp: any, retailMax: any, finFlow: any): Promise<void> {
    // Get some products and customers
    const products = await this.productRepository.find();
    const customers = await this.customerRepository.find();
    const users = await this.userRepository.find();

    if (!products.length || !customers.length || !users.length) {
      this.logger.warn('No products, customers, or users found for order creation');
      return;
    }

    const orders = [
      {
        orderNumber: 'TC-2024-001',
        status: 'completed',
        totalAmount: 75000.00,
        customer: customers.find(c => c.name === 'Global Manufacturing Corp'),
        createdBy: users.find(u => u.email === 'emma.sales@techcorp.com'),
        organization: techCorp,
        attributes: {
          priority: 'high',
          contract_type: 'enterprise',
          payment_method: 'wire_transfer',
          delivery_date: '2024-02-15'
        },
        items: [
          { product: products.find(p => p.sku === 'TC-EPS-001'), quantity: 1, unitPrice: 50000.00 },
          { product: products.find(p => p.sku === 'TC-PSP-005'), quantity: 10, unitPrice: 1500.00 },
          { product: products.find(p => p.sku === 'TC-CSE-004'), quantity: 15, unitPrice: 500.00 }
        ]
      },
      {
        orderNumber: 'TC-2024-002',
        status: 'processing',
        totalAmount: 40000.00,
        customer: customers.find(c => c.name === 'MedTech Innovations'),
        createdBy: users.find(u => u.email === 'emma.sales@techcorp.com'),
        organization: techCorp,
        attributes: {
          priority: 'medium',
          compliance_required: 'hipaa',
          payment_method: 'ach'
        },
        items: [
          { product: products.find(p => p.sku === 'TC-DAP-003'), quantity: 1, unitPrice: 25000.00 },
          { product: products.find(p => p.sku === 'TC-AGP-002'), quantity: 1, unitPrice: 15000.00 }
        ]
      },
      {
        orderNumber: 'RM-2024-001',
        status: 'shipped',
        totalAmount: 15000.00,
        customer: customers.find(c => c.name === 'Fashion Forward Boutiques'),
        createdBy: users.find(u => u.email === 'lisa.na@retailmax.com'),
        organization: retailMax,
        attributes: {
          wholesale_order: true,
          shipping_method: 'ground',
          expected_delivery: '2024-07-10'
        },
        items: [
          { product: products.find(p => p.sku === 'RM-PFL-001'), quantity: 50, unitPrice: 299.99 }
        ]
      },
      {
        orderNumber: 'FF-2024-001',
        status: 'completed',
        totalAmount: 3000.00,
        customer: customers.find(c => c.name === 'E-commerce Platform LLC'),
        createdBy: users.find(u => u.email === 'alex.founder@financeflow.com'),
        organization: finFlow,
        attributes: {
          service_setup: true,
          integration_support: true,
          go_live_date: '2024-07-01'
        },
        items: [
          { product: products.find(p => p.sku === 'FF-FDS-002'), quantity: 6, unitPrice: 500.00 }
        ]
      }
    ];

    for (const orderData of orders) {
      // Create order
      const order = this.orderRepository.create({
        orderNumber: orderData.orderNumber,
        status: orderData.status,
        totalAmount: orderData.totalAmount,
        customer: orderData.customer,
        createdBy: orderData.createdBy,
        organization: orderData.organization,
        attributes: orderData.attributes,
        orderDate: new Date(),
      });

      const savedOrder = await this.orderRepository.save(order);
      this.logger.debug(`Created order: ${orderData.orderNumber}`);

      // Create order items
      for (const itemData of orderData.items) {
        if (itemData.product) {
          const orderItem = this.orderItemRepository.create({
            order: savedOrder,
            product: itemData.product,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.quantity * itemData.unitPrice,
          });

          await this.orderItemRepository.save(orderItem);
          this.logger.debug(`Created order item: ${itemData.product.name} x${itemData.quantity}`);
        }
      }
    }
  }

  private async createTransactions(techCorp: any, retailMax: any, finFlow: any): Promise<void> {
    const orders = await this.orderRepository.find({ relations: ['customer', 'createdBy'] });
    const users = await this.userRepository.find();

    const transactions = [
      {
        transactionNumber: 'TXN-TC-2024-001',
        type: 'payment',
        amount: 75000.00,
        status: 'completed',
        order: orders.find(o => o.orderNumber === 'TC-2024-001'),
        processedBy: users.find(u => u.email === 'john.admin@techcorp.com'),
        organization: techCorp,
        attributes: {
          payment_method: 'wire_transfer',
          reference_number: 'WIRE-2024-001',
          bank_confirmation: 'CONF-123456',
          processing_fee: 25.00
        }
      },
      {
        transactionNumber: 'TXN-RM-2024-001',
        type: 'payment',
        amount: 15000.00,
        status: 'completed',
        order: orders.find(o => o.orderNumber === 'RM-2024-001'),
        processedBy: users.find(u => u.email === 'david.ceo@retailmax.com'),
        organization: retailMax,
        attributes: {
          payment_method: 'credit_card',
          card_last_four: '4532',
          authorization_code: 'AUTH-789123',
          processing_fee: 435.00
        }
      },
      {
        transactionNumber: 'TXN-FF-2024-001',
        type: 'payment',
        amount: 3000.00,
        status: 'completed',
        order: orders.find(o => o.orderNumber === 'FF-2024-001'),
        processedBy: users.find(u => u.email === 'alex.founder@financeflow.com'),
        organization: finFlow,
        attributes: {
          payment_method: 'ach',
          ach_trace_number: 'ACH-2024-001',
          settlement_date: '2024-07-02',
          processing_fee: 15.00
        }
      },
      {
        transactionNumber: 'TXN-TC-2024-002',
        type: 'refund',
        amount: -2500.00,
        status: 'completed',
        processedBy: users.find(u => u.email === 'emma.sales@techcorp.com'),
        organization: techCorp,
        attributes: {
          refund_reason: 'service_cancellation',
          original_transaction: 'TXN-TC-2024-001',
          approved_by: 'john.admin@techcorp.com'
        }
      },
      {
        transactionNumber: 'TXN-FF-2024-002',
        type: 'fee',
        amount: 125.50,
        status: 'completed',
        processedBy: users.find(u => u.email === 'carlos.risk@financeflow.com'),
        organization: finFlow,
        attributes: {
          fee_type: 'monthly_service',
          period: '2024-07',
          auto_deducted: true
        }
      }
    ];

    for (const transactionData of transactions) {
      const transaction = this.transactionRepository.create({
        transactionNumber: transactionData.transactionNumber,
        type: transactionData.type,
        amount: transactionData.amount,
        status: transactionData.status,
        order: transactionData.order,
        processedBy: transactionData.processedBy,
        organization: transactionData.organization,
        attributes: transactionData.attributes,
        transactionDate: new Date(),
      });

      await this.transactionRepository.save(transaction);
      this.logger.debug(`Created transaction: ${transactionData.transactionNumber}`);
    }
  }
}