type ApiOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: HeadersInit;
};

const API_BASE = import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:3000/api/v1/auth';

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.method === 'GET' ? undefined : options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data as T;
}

export type RegisterResponse = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
    failedLoginAttempts: number;
  };
  emailVerificationRequired: boolean;
  verificationToken?: string;
};

export type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  expiresInSeconds?: number;
  mfaRequired?: boolean;
  challengeId?: string;
  otp?: string;
  otpExpiresInSeconds?: number;
};

export type MeResponse = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    failedLoginAttempts: number;
    lockoutUntil?: string;
  };
};

export const authApi = {
  register: (body: { email: string; password: string; roles?: string[]; mfaEnabled?: boolean }) => request<RegisterResponse>('/register', { body }),
  verifyEmail: (token: string) => request<{ user: MeResponse['user'] }>('/verify-email', { body: { token } }),
  login: (body: { email: string; password: string }) => request<LoginResponse>('/login', { body }),
  verifyOtp: (body: { challengeId: string; otp: string }) => request<LoginResponse>('/verify-otp', { body }),
  refresh: (body: { refreshToken: string }) => request<{ accessToken: string; expiresInSeconds: number; sessionId: string }>('/refresh', { body }),
  logout: (body: { sessionId: string }) => request<{ loggedOut: boolean }>('/logout', { body }),
  requestPasswordReset: (body: { email: string }) => request<{ passwordResetRequired: boolean; resetToken?: string; resetTokenExpiresInSeconds: number }>('/request-password-reset', { body }),
  resetPassword: (body: { token: string; newPassword: string }) => request<{ passwordUpdated: boolean }>('/reset-password', { body }),
  changePassword: (body: { email: string; currentPassword: string; newPassword: string }) => request<{ passwordChanged: boolean }>('/change-password', { body }),
  me: (accessToken: string) => request<MeResponse>('/me', { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } })
};