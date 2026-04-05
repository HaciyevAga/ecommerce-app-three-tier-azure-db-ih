import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Product, 
  CartItem, 
  Order, 
  AuthResponse, 
  ApiResponse, 
  ProductFilters, 
  CreateUserData, 
  LoginData, 
  CreateOrderData 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: CreateUserData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', userData),
  
  login: (loginData: LoginData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', loginData),
  
  getProfile: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/profile'),
  
  updateProfile: (userData: Partial<User>): Promise<AxiosResponse<{ message: string; user: User }>> =>
    api.put('/auth/profile', userData),
};

// Products API
export const productsAPI = {
  getProducts: (filters?: ProductFilters): Promise<AxiosResponse<{ products: Product[]; pagination: any }>> =>
    api.get('/products', { params: filters }),
  
  getProduct: (id: number): Promise<AxiosResponse<{ product: Product }>> =>
    api.get(`/products/${id}`),
  
  getCategories: (): Promise<AxiosResponse<{ categories: string[] }>> =>
    api.get('/products/categories/list'),
  
  createProduct: (productData: Partial<Product>): Promise<AxiosResponse<{ message: string; product: Product }>> =>
    api.post('/products', productData),
  
  updateProduct: (id: number, productData: Partial<Product>): Promise<AxiosResponse<{ message: string; product: Product }>> =>
    api.put(`/products/${id}`, productData),
  
  deleteProduct: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/products/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: (): Promise<AxiosResponse<{ items: CartItem[]; total: number; itemCount: number }>> =>
    api.get('/cart'),
  
  addToCart: (productId: number, quantity: number): Promise<AxiosResponse<{ message: string; cartItem: CartItem }>> =>
    api.post('/cart/add', { productId, quantity }),
  
  updateCartItem: (productId: number, quantity: number): Promise<AxiosResponse<{ message: string; cartItem: CartItem }>> =>
    api.put(`/cart/update/${productId}`, { quantity }),
  
  removeFromCart: (productId: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/cart/remove/${productId}`),
  
  clearCart: (): Promise<AxiosResponse<{ message: string; success: boolean }>> =>
    api.delete('/cart/clear'),
};

// Orders API
export const ordersAPI = {
  getOrders: (page?: number, limit?: number): Promise<AxiosResponse<{ orders: Order[]; pagination: any }>> =>
    api.get('/orders', { params: { page, limit } }),
  
  getMyOrders: (page?: number, limit?: number): Promise<AxiosResponse<{ orders: Order[]; pagination: any }>> =>
    api.get('/orders/my-orders', { params: { page, limit } }),
  
  getOrder: (id: number): Promise<AxiosResponse<{ order: Order }>> =>
    api.get(`/orders/${id}`),
  
  createOrder: (orderData: CreateOrderData): Promise<AxiosResponse<{ message: string; order: Order }>> =>
    api.post('/orders/create', orderData),
  
  createOrderFromCart: (orderData: { shippingAddress: string; billingAddress: string; paymentMethod: string }): Promise<AxiosResponse<{ message: string; order: Order }>> =>
    api.post('/orders/create-from-cart', orderData),
  
  updateOrderStatus: (id: number, status: string): Promise<AxiosResponse<{ message: string; order: Order }>> =>
    api.put(`/orders/${id}/status`, { status }),
  
  cancelOrder: (id: number): Promise<AxiosResponse<{ message: string; order: Order }>> =>
    api.put(`/orders/${id}/cancel`),
};

export default api;
