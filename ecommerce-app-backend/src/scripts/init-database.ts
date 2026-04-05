import Database from '../config/database';

export default class DatabaseInitializer {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing database...');
      
      // Check if tables exist
      const tablesExist = await this.checkTablesExist();
      
      if (tablesExist) {
        console.log('✅ Database tables already exist. Skipping initialization.');
        return;
      }

      console.log('📋 Creating database tables...');
      await this.createTables();
      
      console.log('🌱 Inserting sample data...');
      await this.insertSampleData();
      
      console.log('🔧 Creating triggers...');
      await this.createTriggers();
      
      console.log('✅ Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async checkTablesExist(): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as tableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME IN ('Users', 'Products', 'CartItems', 'Orders', 'OrderItems')
      `;
      
      const result = await this.db.executeQuery(query, []);
      return result.recordset[0].tableCount >= 5;
    } catch (error) {
      // If query fails, tables probably don't exist
      return false;
    }
  }

  private async createTables(): Promise<void> {
    const createTablesSQL = `
      -- Create Users table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          email NVARCHAR(255) UNIQUE NOT NULL,
          password NVARCHAR(255) NOT NULL,
          firstName NVARCHAR(100) NOT NULL,
          lastName NVARCHAR(100) NOT NULL,
          phone NVARCHAR(20),
          address NVARCHAR(500),
          city NVARCHAR(100),
          state NVARCHAR(100),
          zipCode NVARCHAR(20),
          country NVARCHAR(100),
          isAdmin BIT DEFAULT 0,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE()
      );

      -- Create Products table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
      CREATE TABLE Products (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          category NVARCHAR(100) NOT NULL,
          imageUrl NVARCHAR(500) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          isActive BIT DEFAULT 1,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE()
      );

      -- Create CartItems table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CartItems' AND xtype='U')
      CREATE TABLE CartItems (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userId INT NOT NULL,
          productId INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          productName NVARCHAR(255) NOT NULL,
          productPrice DECIMAL(10,2) NOT NULL,
          productImageUrl NVARCHAR(500) NOT NULL,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES Products(id) ON DELETE CASCADE,
          UNIQUE(userId, productId)
      );

      -- Create Orders table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
      CREATE TABLE Orders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userId INT NOT NULL,
          totalAmount DECIMAL(10,2) NOT NULL,
          status NVARCHAR(50) DEFAULT 'pending',
          paymentStatus NVARCHAR(50) DEFAULT 'pending',
          shippingAddress NVARCHAR(500) NOT NULL,
          billingAddress NVARCHAR(500) NOT NULL,
          paymentMethod NVARCHAR(100) NOT NULL,
          createdAt DATETIME2 DEFAULT GETDATE(),
          updatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      );

      -- Create OrderItems table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderItems' AND xtype='U')
      CREATE TABLE OrderItems (
          id INT IDENTITY(1,1) PRIMARY KEY,
          orderId INT NOT NULL,
          productId INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          productName NVARCHAR(255) NOT NULL,
          productImageUrl NVARCHAR(500) NOT NULL,
          createdAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES Products(id) ON DELETE CASCADE
      );
    `;

    await this.db.executeQuery(createTablesSQL, []);
  }

  private async insertSampleData(): Promise<void> {
    // Check if sample data already exists
    const checkProducts = await this.db.executeQuery('SELECT COUNT(*) as count FROM Products', []);
    if (checkProducts.recordset[0].count > 0) {
      console.log('📦 Sample products already exist. Skipping sample data insertion.');
      return;
    }

    // Insert sample products
    const insertProductsSQL = `
      INSERT INTO Products (name, description, price, category, imageUrl, stock) VALUES
      ('Wireless Headphones', 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 199.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 50),
      ('Smartphone', 'Latest smartphone with advanced camera system and all-day battery life.', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', 25),
      ('Laptop', 'Powerful laptop perfect for work and gaming with 16GB RAM and SSD storage.', 1299.99, 'Electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 15),
      ('Running Shoes', 'Comfortable running shoes with excellent cushioning and breathable material.', 129.99, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 100),
      ('Yoga Mat', 'Premium yoga mat with excellent grip and cushioning for all types of yoga.', 49.99, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500', 75),
      ('Coffee Maker', 'Automatic coffee maker with programmable settings and thermal carafe.', 89.99, 'Home', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', 30),
      ('Bluetooth Speaker', 'Portable Bluetooth speaker with 360-degree sound and waterproof design.', 79.99, 'Electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 60),
      ('Backpack', 'Durable backpack with multiple compartments and laptop sleeve.', 59.99, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 40),
      ('Water Bottle', 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 120),
      ('Gaming Mouse', 'High-precision gaming mouse with customizable RGB lighting and programmable buttons.', 69.99, 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 45);
    `;

    await this.db.executeQuery(insertProductsSQL, []);

    // Insert admin user (password: admin123)
    const insertAdminSQL = `
      IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@ecommerce.com')
      INSERT INTO Users (email, password, firstName, lastName, isAdmin) VALUES
      ('admin@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K2', 'Admin', 'User', 1);
    `;

    await this.db.executeQuery(insertAdminSQL, []);
  }

  private async createTriggers(): Promise<void> {
    const createTriggersSQL = `
      -- Create triggers for updatedAt timestamps
      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Users_UpdatedAt')
      BEGIN
        EXEC('CREATE TRIGGER TR_Users_UpdatedAt
        ON Users
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            UPDATE Users 
            SET updatedAt = GETDATE()
            FROM Users u
            INNER JOIN inserted i ON u.id = i.id;
        END');
      END

      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Products_UpdatedAt')
      BEGIN
        EXEC('CREATE TRIGGER TR_Products_UpdatedAt
        ON Products
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            UPDATE Products 
            SET updatedAt = GETDATE()
            FROM Products p
            INNER JOIN inserted i ON p.id = i.id;
        END');
      END

      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_CartItems_UpdatedAt')
      BEGIN
        EXEC('CREATE TRIGGER TR_CartItems_UpdatedAt
        ON CartItems
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            UPDATE CartItems 
            SET updatedAt = GETDATE()
            FROM CartItems c
            INNER JOIN inserted i ON c.id = i.id;
        END');
      END

      IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Orders_UpdatedAt')
      BEGIN
        EXEC('CREATE TRIGGER TR_Orders_UpdatedAt
        ON Orders
        AFTER UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;
            UPDATE Orders 
            SET updatedAt = GETDATE()
            FROM Orders o
            INNER JOIN inserted i ON o.id = i.id;
        END');
      END
    `;

    await this.db.executeQuery(createTriggersSQL, []);
  }
}
