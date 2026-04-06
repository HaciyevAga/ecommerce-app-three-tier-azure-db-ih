import Database from '../config/database';

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCartItemData {
  userId: number;
  productId: number;
  quantity: number;
}

export class CartModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async addToCart(cartData: CreateCartItemData): Promise<CartItem> {
    const existingItemQuery = 'SELECT * FROM CartItems WHERE userId = @userId AND productId = @productId';
    const existingResult = await this.db.executeQuery(existingItemQuery, {
      userId: cartData.userId,
      productId: cartData.productId
    });

    if (existingResult.recordset[0]) {
      const updateQuery = `
        UPDATE CartItems 
        SET quantity = quantity + @quantity, updatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE userId = @userId AND productId = @productId
      `;
      const updateResult = await this.db.executeQuery(updateQuery, {
        quantity: cartData.quantity,
        userId: cartData.userId,
        productId: cartData.productId
      });
      return updateResult.recordset[0];
    } else {
      const productQuery = 'SELECT name, price, imageUrl FROM Products WHERE id = @productId AND isActive = 1';
      const productResult = await this.db.executeQuery(productQuery, {
        productId: cartData.productId
      });

      if (!productResult.recordset[0]) {
        throw new Error('Product not found or inactive');
      }

      const product = productResult.recordset[0];

      const insertQuery = `
        INSERT INTO CartItems (userId, productId, quantity, productName, productPrice, productImageUrl, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@userId, @productId, @quantity, @productName, @productPrice, @productImageUrl, GETDATE(), GETDATE())
      `;

      const result = await this.db.executeQuery(insertQuery, {
        userId: cartData.userId,
        productId: cartData.productId,
        quantity: cartData.quantity,
        productName: product.name,
        productPrice: product.price,
        productImageUrl: product.imageUrl
      });

      return result.recordset[0];
    }
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    const query = 'SELECT * FROM CartItems WHERE userId = @userId ORDER BY createdAt DESC';
    const result = await this.db.executeQuery(query, { userId });
    return result.recordset;
  }

  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | null> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return null;
    }

    const query = `
      UPDATE CartItems 
      SET quantity = @quantity, updatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE userId = @userId AND productId = @productId
    `;

    const result = await this.db.executeQuery(query, { quantity, userId, productId });
    return result.recordset[0] || null;
  }

  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const query = 'DELETE FROM CartItems WHERE userId = @userId AND productId = @productId';
    const result = await this.db.executeQuery(query, { userId, productId });
    return result.rowsAffected[0] > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const query = 'DELETE FROM CartItems WHERE userId = @userId';
    const result = await this.db.executeQuery(query, { userId });
    return result.rowsAffected[0] > 0;
  }

  async getCartTotal(userId: number): Promise<number> {
    const query = 'SELECT SUM(quantity * productPrice) as total FROM CartItems WHERE userId = @userId';
    const result = await this.db.executeQuery(query, { userId });
    return result.recordset[0].total || 0;
  }

  async getCartItemCount(userId: number): Promise<number> {
    const query = 'SELECT SUM(quantity) as count FROM CartItems WHERE userId = @userId';
    const result = await this.db.executeQuery(query, { userId });
    return result.recordset[0].count || 0;
  }
}
