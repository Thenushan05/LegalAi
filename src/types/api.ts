export interface ApiEndpoints {
  // Authentication
  auth: {
    login: string;
    register: string;
  };
  
  // Document Processing
  upload: string;
  uploadStatus: string;
  uploadFile: (fileHash: string) => string;
  qa: string;
  feedback: string;
  summarize: string;
  simplify: string;
  compare: string;
  highlightEvidence: string;
  retrain: string;
  
  // Chat and Documents
  chat: string;
  legalDocs: string;
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: ApiEndpoints;
  keys: {
    openai: string;
    legalApi: string;
  };
  isProduction: boolean;
}
