import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    // Connection timeout
    connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    requestTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
};

class Database {
  private static instance: Database;
  private pool: sql.ConnectionPool | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.pool = new sql.ConnectionPool(config);
      await this.pool.connect();
      console.log('Connected to Azure SQL Database');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('Disconnected from Azure SQL Database');
    }
  }

  public getPool(): sql.ConnectionPool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

public async executeQuery(query: string, params?: Record<string, any>): Promise<sql.IResult<any>> {
  const pool = this.getPool();
  const request = pool.request();
       
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
       
  return await request.query(query);
}

  public async executeStoredProcedure(procedureName: string, params?: any): Promise<sql.IResult<any>> {
    const pool = this.getPool();
    const request = pool.request();
    
    if (params) {
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
    }
    
    return await request.execute(procedureName);
  }
}

export default Database;
