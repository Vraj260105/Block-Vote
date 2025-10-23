import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  VerifyLoginRequest,
  VerifyLoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ApiResponse,
  User,
  AuthTokens,
  WalletStatusResponse,
  WalletVerifyRequest,
  WalletVerifyResponse
} from '@/types/auth.types';

class APIService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const tokens = this.getTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await this.refreshTokens();
            if (refreshed) {
              const tokens = this.getTokens();
              originalRequest.headers.Authorization = `Bearer ${tokens?.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Local storage management
  private getTokens(): AuthTokens | null {
    try {
      const tokens = localStorage.getItem('tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch {
      return null;
    }
  }

  private getUser(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  private setAuth(user: User, tokens: AuthTokens): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }

  public clearAuth(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async verifyLogin(otpData: VerifyLoginRequest): Promise<VerifyLoginResponse> {
    const response: AxiosResponse<VerifyLoginResponse> = await this.api.post('/auth/verify-login', otpData);
    if (response.data.success && response.data.data) {
      this.setAuth(response.data.data.user, response.data.data.tokens);
    }
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async verifyEmail(otpData: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response: AxiosResponse<VerifyEmailResponse> = await this.api.post('/auth/verify-email', otpData);
    if (response.data.success && response.data.data) {
      this.setAuth(response.data.data.user, response.data.data.tokens);
    }
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response: AxiosResponse<UpdateProfileResponse> = await this.api.put('/users/profile', profileData);
    if (response.data.success && response.data.data) {
      const updatedUser = response.data.data.user;
      const tokens = this.getTokens();
      if (tokens) {
        this.setAuth(updatedUser, tokens);
      }
    }
    return response.data;
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response: AxiosResponse<ForgotPasswordResponse> = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response: AxiosResponse<ResetPasswordResponse> = await this.api.post('/auth/reset-password', resetData);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await this.api.post('/auth/logout');
      this.clearAuth();
      return response.data;
    } catch (error) {
      // Clear auth even if API call fails
      this.clearAuth();
      throw error;
    }
  }

  async refreshTokens(): Promise<boolean> {
    try {
      const tokens = this.getTokens();
      if (!tokens?.refreshToken) {
        return false;
      }

      const response: AxiosResponse<ApiResponse<{ tokens: AuthTokens }>> = await this.api.post('/auth/refresh', {
        refreshToken: tokens.refreshToken
      });

      if (response.data.success && response.data.data) {
        const user = this.getUser();
        if (user) {
          this.setAuth(user, response.data.data.tokens);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // Wallet APIs
  async getWalletStatus(): Promise<WalletStatusResponse> {
    const response: AxiosResponse<WalletStatusResponse> = await this.api.get('/wallet/status');
    return response.data;
  }

  async verifyWallet(walletData: WalletVerifyRequest): Promise<WalletVerifyResponse> {
    const response: AxiosResponse<WalletVerifyResponse> = await this.api.post('/wallet/verify', walletData);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    const user = this.getUser();
    const tokens = this.getTokens();
    return !!(user && tokens);
  }

  getCurrentUserData(): User | null {
    return this.getUser();
  }

  getCurrentTokens(): AuthTokens | null {
    return this.getTokens();
  }
}

// Create and export singleton instance
const apiService = new APIService();
export default apiService;