// API Configuration for LegalAI Backend
export const API_CONFIG = {
  BASE_URL: 'https://legaldoc-ai-production.up.railway.app/api',
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

  // Normalize filename for storage (remove spaces and special chars)
  private normalizeFilename(filename: string): string {
    return filename.toLowerCase().replace(/[^a-z0-9.]/g, '');
  }

  // Helper method to store file info in session storage
  private storeFileInfo(filename: string, fileHash: string) {
    const normalized = this.normalizeFilename(filename);
    const fileMap = JSON.parse(sessionStorage.getItem('fileMap') || '{}');
    const fileList = JSON.parse(sessionStorage.getItem('fileList') || '[]');
    
    // Store with both original and normalized keys
    fileMap[filename] = fileHash;
    fileMap[normalized] = fileHash;
    
    // Add to file list if not already present
    if (!fileList.some((f: {name: string}) => f.name === filename)) {
      fileList.push({ name: filename, normalized });
    }
    
    sessionStorage.setItem('fileMap', JSON.stringify(fileMap));
    sessionStorage.setItem('fileList', JSON.stringify(fileList));
    sessionStorage.setItem('lastUploadedFile', JSON.stringify({ filename, fileHash }));
  }

  // Helper method to get file hash by filename or get the last uploaded file
  private getFileHash(filename?: string): string | null {
    if (filename) {
      const fileMap = JSON.parse(sessionStorage.getItem('fileMap') || '{}');
      return fileMap[filename] || null;
    }
    
    // If no filename provided, get the last uploaded file
    const lastFile = sessionStorage.getItem('lastUploadedFile');
    return lastFile ? JSON.parse(lastFile).fileHash : null;
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

    const result = await this.handleResponse<UploadResponse>(response);
    
    // Store the file info in session storage
    if (result.file_id) {
      this.storeFileInfo(file.name, result.file_id);
    }

    return result;
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

    const result = await this.handleResponse<UploadResponse>(response);

    // Store the file info in session storage for guest uploads as well
    if (result.file_id) {
      this.storeFileInfo(file.name, result.file_id);
    }

    return result;
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

  // Helper method to convert wildcard pattern to regex
  private wildcardToRegex(pattern: string): RegExp {
    // Escape special regex chars, then replace * with .* and ? with .
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape special regex chars
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i'); // case insensitive
  }

  // Get all available filenames for @ mentions
  getAvailableFiles(): Array<{name: string, normalized: string}> {
    return JSON.parse(sessionStorage.getItem('fileList') || '[]');
  }

  // Helper method to find a filename in the text with @ mention support
  private findFilenameInText(text: string): string | null {
    const fileMap = JSON.parse(sessionStorage.getItem('fileMap') || '{}');
    const fileList = JSON.parse(sessionStorage.getItem('fileList') || '[]');
    
    // Check for @ mention
    const mentionMatch = text.match(/@([\w.-]+)/);
    if (mentionMatch) {
      const searchTerm = mentionMatch[1].toLowerCase();
      // Find file by normalized name
      const file = fileList.find((f: {normalized: string}) => 
        f.normalized.includes(searchTerm)
      );
      if (file) {
        return file.name;
      }
    }
    
    // Check for exact matches in quotes
    for (const file of fileList) {
      if (text.includes(`"${file.name}"`) || text.includes(`'${file.name}'`)) {
        return file.name;
      }
    }
    
    // Check for filename as a whole word
    for (const file of fileList) {
      // eslint-disable-next-line no-useless-escape
      const wordBoundary = /[\s\n\r\t.,;:!?()\[\]{}"']/;
      const escapedName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|${wordBoundary.source})${escapedName}($|${wordBoundary.source})`, 'i');
      
      if (regex.test(text)) {
        return file.name;
      }
    }
    
    // Use last uploaded file if no specific file mentioned
    const lastFile = sessionStorage.getItem('lastUploadedFile');
    return lastFile ? JSON.parse(lastFile).filename : null;
  }

  // Q&A methods
  async askQuestion(question: string, fileIdentifier?: string, topK: number = 5): Promise<QAResponse> {
    let fileHash: string | null = null;
    
    // If fileIdentifier is provided, use it
    if (fileIdentifier) {
      // If it looks like a filename (contains a dot), resolve to a hash via map
      if (fileIdentifier.includes('.')) {
        fileHash = this.getFileHash(fileIdentifier);
      } else {
        // Otherwise, treat it as an already-resolved file hash
        fileHash = fileIdentifier;
      }
    } 
    // Otherwise, try to find a filename in the question
    else {
      const foundFilename = this.findFilenameInText(question);
      if (foundFilename) {
        fileHash = this.getFileHash(foundFilename);
      } 
      // If no filename found in text, use the last uploaded file
      else {
        const lastFile = sessionStorage.getItem('lastUploadedFile');
        if (lastFile) {
          fileHash = JSON.parse(lastFile).fileHash;
        }
      }
    }
    
    if (!fileHash) {
      throw new Error('No file specified and no files have been uploaded yet. Please upload a file first or specify a filename in your question.');
    }

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
