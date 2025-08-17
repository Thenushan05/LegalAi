// API Configuration for LegalAI Backend
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  ENDPOINTS: {
    // Upload endpoints
    UPLOAD: '/upload',
    UPLOAD_STATUS: '/upload/status',
    DELETE_FILE: '/upload',
    
    // Guest endpoints (no auth required)
    GUEST_UPLOAD: '/guest/upload',
    GUEST_QA: '/guest/qa',
    GUEST_SUMMARIZE: '/guest/summarize',
    
    // Q&A endpoints
    QA: '/qa',
    
    // Summarization endpoints
    SUMMARIZE: '/summarize',
    COMPARE: '/compare',
    SIMPLIFY: '/simplify',
    HIGHLIGHT_EVIDENCE: '/highlight-evidence',
    
    // User management
    USER_PROFILE: '/users/profile',
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    GOOGLE_SIGNIN: '/users/google-signin',
    CHAT_HISTORY: '/users/chat-history',
    CONFIDENTIAL_REPORT: '/users/confidential-report',
    
    // Feedback
    FEEDBACK: '/feedback',
    
    // Retraining
    RETRAIN: '/retrain'
  }
};

// API Client class
export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const headers: HeadersInit = {};
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  private async _fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal  
    });

    clearTimeout(id);
    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Upload methods
  async uploadFile(file: File, uploadType: 'normal' | 'confidential' = 'normal'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_type', uploadType);

    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    return this.handleResponse(response);
  }

  async getUploadStatus(fileHash: string): Promise<{ status: string }> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPLOAD_STATUS}/${fileHash}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async deleteFile(fileHash: string): Promise<{ message: string }> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.DELETE_FILE}/${fileHash}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Guest methods (no auth required)
  async guestUploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GUEST_UPLOAD}`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  async guestQA(question: string, fileHash: string, topK: number = 5): Promise<QAResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GUEST_QA}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        file_hash: fileHash,
        top_k: topK,
      }),
    });

    return this.handleResponse(response);
  }

  // Q&A methods
  async askQuestion(question: string, fileHash: string, topK: number = 5): Promise<QAResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.QA}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        question,
        file_hash: fileHash,
        top_k: topK,
      }),
    });

    return this.handleResponse(response);
  }

  // Summarization methods
  async summarizeDocument(fileHash: string, focusAreas?: string[]): Promise<SummarizeResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.SUMMARIZE}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        file_hash: fileHash,
        focus_areas: focusAreas,
      }),
    });

    return this.handleResponse(response);
  }

  async compareDocuments(fileHash1: string, fileHash2: string): Promise<CompareResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.COMPARE}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        file_hash_1: fileHash1,
        file_hash_2: fileHash2,
      }),
    });

    return this.handleResponse(response);
  }

  async simplifyText(fileHash: string, level: 'basic' | 'intermediate' | 'advanced' = 'basic'): Promise<SimplifyResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.SIMPLIFY}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        file_hash: fileHash,
        level,
      }),
    });

    return this.handleResponse(response);
  }

  // User management methods
  async getUserProfile(): Promise<UserProfile> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.USER_PROFILE}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Chat history methods
  async saveChatMessage(message: any): Promise<{ message: string }> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CHAT_HISTORY}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(message),
    });

    return this.handleResponse(response);
  }

  async register(email: string, password: string, displayName: string): Promise<RegisterResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password,
        name: displayName,
      }),
    });

    return this.handleResponse(response);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return this.handleResponse(response);
  }

  async googleSignIn(idToken: string): Promise<GoogleSignInResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GOOGLE_SIGNIN}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        id_token: idToken,
      }),
    });

    return this.handleResponse(response);
  }

  async getChatHistory(fileHash?: string, limit: number = 50): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams();
    if (fileHash) params.append('file_hash', fileHash);
    params.append('limit', limit.toString());

    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CHAT_HISTORY}?${params}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Feedback methods
  async submitFeedback(
    fileHash: string,
    chunkId: string,
    question: string,
    answer: string,
    rating: number,
    confidential: boolean = false
  ): Promise<FeedbackResponse> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.FEEDBACK}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        file_hash: fileHash,
        chunk_id: chunkId,
        question,
        answer,
        rating,
        confidential,
      }),
    });

    return this.handleResponse(response);
  }

  // Retrain method
  async triggerRetrain(): Promise<{ message: string }> {
    const response = await this._fetchWithTimeout(`${this.baseUrl}${API_CONFIG.ENDPOINTS.RETRAIN}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Helper function to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/docs`);
    return response.ok;
  } catch {
    return false;
  }
}

// Types for API responses
export interface UploadResponse {
  file_id: string;
  filename: string;
  pages: number;
  message: string;
  is_duplicate: boolean;
}

export interface QAResponse {
  answer: string;
  evidence: Array<{
    chunk_id: string;
    text: string;
    meta: {
      page_number?: number;
      section?: string;
      [key: string]: any;
    };
    score: number;
  }>;
  highlights?: Array<{
    text: string;
    category: string;
    suggestion?: string | null;
  }>;
  confidence: number;
}

export interface SummarizeResponse {
  summary: string;
  confidence?: number;
}

export interface CompareResponse {
  comparison: string;
  confidence?: number;
}

export interface SimplifyResponse {
  simplified?: string;
  simplified_text?: string;
  confidence?: number;
}

export interface LoginResponse {
  id_token: string;
  refresh_token: string;
  expires_in: number;
  uid: string;
  email: string;
  message: string;
}

export interface ChatHistoryResponse {
  messages: any[]; // Define a proper message type if available
}

export interface FeedbackResponse {
  message: string;
  feedback_id: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  created_at: string;
  last_login?: string;
}

export interface RegisterResponse {
  uid: string;
  email: string;
  name?: string;
  message: string;
}

export interface GoogleSignInResponse {
  uid: string;
  email: string;
  name?: string;
  message: string;
}
