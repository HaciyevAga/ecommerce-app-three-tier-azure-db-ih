import Database from '../config/database';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class ProductModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createProduct(productData: CreateProductData): Promise<Product> {
    const query = `
      INSERT INTO Products (name, description, price, category, imageUrl, stock, isActive, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @price, @category, @imageUrl, @stock, @isActive, GETDATE(), GETDATE())
    `;

    const result = await this.db.executeQuery(query, {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      imageUrl: productData.imageUrl,
      stock: productData.stock,
      isActive: true
    });

    return result.recordset[0];
  }

  async getProductById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM Products WHERE id = @id';
    const result = await this.db.executeQuery(query, { id });
    return result.recordset[0] || null;
  }

  async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
    const {
      page = 1,
      limit = 10
    } = filters;

    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) as total FROM Products WHERE isActive = 1';
    const countResult = await this.db.executeQuery(countQuery);
    const total = countResult.recordset[0].total;

    const query = `
      SELECT * FROM Products
      WHERE isActive = 1
      ORDER BY createdAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await this.db.executeQuery(query, { offset, limit });

    return {
      products: result.recordset,
      total
    };
  }

  async updateProduct(id: number, updateData: UpdateProductData): Promise<Product | null> {
    const fields: string[] = [];
    const params: Record<string, any> = {};

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateProductData] !== undefined) {
        fields.push(`${key} = @${key}`);
        params[key] = updateData[key as keyof UpdateProductData];
      }
    });

    if (fields.length === 0) {
      return null;
    }

    params['id'] = id;

    const query = `
      UPDATE Products
      SET ${fields.join(', ')}, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await this.db.executeQuery(query, params);
    return result.recordset[0] || null;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const query = 'DELETE FROM Products WHERE id = @id';
    const result = await this.db.executeQuery(query, { id });
    return result.rowsAffected[0] > 0;
  }

  async getCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM Products WHERE isActive = 1 ORDER BY category';
    const result = await this.db.executeQuery(query);
    return result.recordset.map((row: any) => row.category);
  }
}
