import { ApiConfig, ApiEndpoints } from '@/types/api';

const endpoints: ApiEndpoints = {
  // Authentication
  auth: {
    login: import.meta.env.VITE_API_AUTH_LOGIN || '/auth/login',
    register: import.meta.env.VITE_API_AUTH_REGISTER || '/auth/register',
  },
  
  // Document Processing
  upload: import.meta.env.VITE_API_UPLOAD || '/api/upload',
  uploadStatus: import.meta.env.VITE_API_UPLOAD_STATUS || '/api/upload/status',
  uploadFile: (fileHash: string) => 
    (import.meta.env.VITE_API_UPLOAD_FILE || '/api/upload/{file_hash}').replace('{file_hash}', fileHash),
  qa: import.meta.env.VITE_API_QA || '/api/qa',
  feedback: import.meta.env.VITE_API_FEEDBACK || '/api/feedback',
  summarize: import.meta.env.VITE_API_SUMMARIZE || '/api/summarize',
  simplify: import.meta.env.VITE_API_SIMPLIFY || '/api/simplify',
  compare: import.meta.env.VITE_API_COMPARE || '/api/compare',
  highlightEvidence: import.meta.env.VITE_API_HIGHLIGHT_EVIDENCE || '/api/highlight-evidence',
  retrain: import.meta.env.VITE_API_RETRAIN || '/api/retrain',
  
  // Chat and Documents
  chat: import.meta.env.VITE_API_CHAT || '/chat',
  legalDocs: import.meta.env.VITE_API_LEGAL_DOCS || '/legal/docs',
};

const config: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  endpoints,
  keys: {
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    legalApi: import.meta.env.VITE_LEGAL_API_KEY || '',
  },
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
};

export default config;
