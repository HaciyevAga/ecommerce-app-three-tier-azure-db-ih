import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from '../config/database';

export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export class UserModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const query = `
      INSERT INTO Users (email, password, firstName, lastName, phone, address, city, state, zipCode, country, isAdmin, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (@email, @password, @firstName, @lastName, @phone, @address, @city, @state, @zipCode, @country, @isAdmin, GETDATE(), GETDATE())
    `;

    const result = await this.db.executeQuery(query, {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      address: userData.address || null,
      city: userData.city || null,
      state: userData.state || null,
      zipCode: userData.zipCode || null,
      country: userData.country || null,
      isAdmin: false
    });

    return result.recordset[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM Users WHERE email = @email';
    const result = await this.db.executeQuery(query, { email });
    return result.recordset[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM Users WHERE id = @id';
    const result = await this.db.executeQuery(query, { id });
    return result.recordset[0] || null;
  }

  async updateUser(id: number, updateData: Partial<CreateUserData>): Promise<User | null> {
    const fields: string[] = [];
    const params: Record<string, any> = { id };

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof CreateUserData] !== undefined) {
        fields.push(`${key} = @${key}`);
        params[key] = updateData[key as keyof CreateUserData];
      }
    });

    if (fields.length === 0) return this.getUserById(id);

    fields.push('updatedAt = GETDATE()');

    const query = `
      UPDATE Users 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await this.db.executeQuery(query, params);
    return result.recordset[0] || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const query = 'DELETE FROM Users WHERE id = @id';
    const result = await this.db.executeQuery(query, { id });
    return result.rowsAffected[0] > 0;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      secret,
      { expiresIn: expiresIn as any }
    );
  }

  verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  }
}
