import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  Mic,
  Settings,
  Plus,
  Brain,
  Upload,
  X,
  FileText,
  Zap,
  Shield,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { NeuralLoader } from "@/components/chat/NeuralLoader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AISuggestionsDrawer } from "@/components/layout/AISuggestionsDrawer";
import { EvidenceDialog } from "@/components/chat/EvidenceDialog";
import { cn } from "@/lib/utils";
import {
  apiClient,
  checkBackendHealth,
  UploadResponse,
  QAResponse,
} from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundend: (() => void) | null;
  onaudioend: (() => void) | null;
  onnomatch: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SpeechRecognitionClass =
  window.SpeechRecognition || window.webkitSpeechRecognition;

interface Evidence {
  text: string;
  page_number?: number;
  section?: string;
  confidence?: number;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  highlights?: HighlightedText[];
  evidence?: Evidence[];
  confidence?: number;
  isSimplified?: boolean;
  attachedFiles?: string[];
}

interface HighlightedText {
  text: string;
  type?: "favorable" | "neutral" | "risky" | "payment" | "clause";
  category: string;
  suggestion?: string | null;
}

const placeholderTexts = [
  "Upload a document to get started...",
  "Ask me about penalties...",
  "Need a lawyer's opinion?",
  "What are my obligations here?",
  "Explain this clause in plain language...",
  "Highlight the risks in this contract...",
  "Summarize the key terms...",
  "What should I negotiate?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState(placeholderTexts[0]);
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(false);
  const [showSuggestionDrawer, setShowSuggestionDrawer] = useState(false);
  const [selectedHighlight, setSelectedHighlight] =
    useState<HighlightedText | null>(null);
  const [typingMessage, setTypingMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [sendButtonState, setSendButtonState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [simplifyButtonState, setSimplifyButtonState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [editingFiles, setEditingFiles] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<
    "normal" | "confidential" | null
  >(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: UploadResponse;
  }>({});
  const [fileStatuses, setFileStatuses] = useState<{ [key: string]: string }>(
    {}
  );
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [currentFileHash, setCurrentFileHash] = useState<string | null>(null);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [availableFiles, setAvailableFiles] = useState<Array<{name: string, normalized: string}>>([]);
  const [showAtMention, setShowAtMention] = useState(false);
  const [atMentionPosition, setAtMentionPosition] = useState(0);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // File hash persistence functions
  const saveFileHashToStorage = useCallback((fileHash: string) => {
    try {
      localStorage.setItem("legalai_current_file_hash", fileHash);
    } catch (error) {
      console.error("Failed to save file hash to localStorage:", error);
    }
  }, []);

  // Load available files from session storage
  const loadAvailableFiles = useCallback(() => {
    try {
      const files = apiClient.getAvailableFiles();
      console.log('Loaded files from session storage:', files);
      setAvailableFiles(files);
      
      // Also log what's in session storage directly
      const fileMap = sessionStorage.getItem('fileMap');
      const fileList = sessionStorage.getItem('fileList');
      console.log('Session storage fileMap:', fileMap);
      console.log('Session storage fileList:', fileList);
    } catch (error) {
      console.error('Error loading available files:', error);
      setAvailableFiles([]);
    }
  }, []);

  // Handle @ mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setInputValue(value);
    
    // Check for @ mention
    const atIndex = value.lastIndexOf('@', cursorPosition - 1);
    if (!isLoading && atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
      const searchTerm = value.substring(atIndex + 1, cursorPosition).toLowerCase();
      console.log('@ mention detected, search term:', searchTerm);
      console.log('Available files for filtering:', availableFiles);
      // Refresh available files to ensure latest
      loadAvailableFiles();
      
      const filteredFiles = availableFiles.filter(file => 
        file.normalized.includes(searchTerm) || file.name.toLowerCase().includes(searchTerm)
      );
      
      console.log('Filtered files:', filteredFiles);
      
      if (availableFiles.length > 0) { // Show dropdown if any files exist
        setShowAtMention(true);
        setAtMentionPosition(atIndex);
      } else {
        setShowAtMention(false);
      }
    } else {
      setShowAtMention(false);
    }
  };

  // Handle file selection from @ mention
  const handleFileSelect = (fileName: string) => {
    const beforeAt = inputValue.substring(0, atMentionPosition);
    const afterCursor = inputValue.substring(inputValue.indexOf(' ', atMentionPosition) !== -1 ? inputValue.indexOf(' ', atMentionPosition) : inputValue.length);
    const newValue = `${beforeAt}@${fileName}${afterCursor}`;
    
    setInputValue(newValue);
    setShowAtMention(false);
    setSelectedFile(fileName);
  };

  // Handle + button file selection
  const handlePlusButtonFileSelect = (fileName: string) => {
    console.log('Plus button file selected:', fileName);
    setSelectedFile(fileName);
    setShowFileSelector(false);
    // Add file mention to input if not already present
    if (!inputValue.includes(fileName)) {
      setInputValue(prev => prev ? `${prev} @${fileName}` : `@${fileName}`);
    }
    // Also trigger a refresh of available files
    setTimeout(() => loadAvailableFiles(), 100);
  };

  const loadFileHashFromStorage = useCallback((): string | null => {
    try {
      return localStorage.getItem("legalai_current_file_hash");
    } catch (error) {
      console.error("Failed to load file hash from localStorage:", error);
      return null;
    }
  }, []);

  // Chat persistence functions - DISABLED to prevent storage
  const saveChatToStorage = useCallback((messages: Message[]) => {
    // Chat storage disabled per user request
    // Messages will only persist during the current session in memory
    return;
  }, []);

  const clearChatStorage = useCallback(() => {
    try {
      // Clear file hash but NOT chat messages (chat messages no longer stored)
      localStorage.removeItem("legalai_current_file_hash");
      sessionStorage.removeItem("legalai_current_file_hash");
      // Clean up any existing chat messages from previous versions
      localStorage.removeItem("legalai_chat_messages");
      sessionStorage.removeItem("legalai_guest_chat_messages");
    } catch (error) {
      console.error("Failed to clear chat storage:", error);
    }
  }, []);

  const loadChatFromStorage = useCallback((): Message[] => {
    // Chat loading from storage disabled to prevent cross-user data leakage
    // Messages only exist in memory during current session
    return [];
  }, []);

  const loadChatHistory = useCallback(async () => {
    // First, always try to load from local storage to prevent clearing
    const storedMessages = loadChatFromStorage();
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
    }

    // Load saved file hash
    const savedHash = loadFileHashFromStorage();
    if (savedHash) {
      setCurrentFileHash(savedHash);
    }

    if (!isAuthenticated) {
      return; // For guests, only use local storage
    }

    // For authenticated users, try to sync with server but don't replace local data if server fails
    try {
      const historyResponse = await apiClient.getChatHistory(undefined, 50);
      if (historyResponse.messages && historyResponse.messages.length > 0) {
        const formattedMessages = historyResponse.messages.map(
          (msg: {
            id?: number;
            content?: string;
            message?: string;
            sender?: string;
            is_user?: boolean;
            timestamp?: string;
            highlights?: any[];
            evidence?: any[];
            confidence?: number;
            is_simplified?: boolean;
          }) => ({
            id: msg.id ? msg.id.toString() : Date.now().toString(),
            type: (msg.sender || (msg.is_user ? "user" : "ai")) as
              | "user"
              | "ai",
            content: msg.content || msg.message || "",
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            highlights: msg.highlights || [],
            evidence: msg.evidence || [],
            confidence: msg.confidence,
            isSimplified: msg.is_simplified || false,
          })
        );
        
        // Only update if server has more recent data or local storage is empty
        if (storedMessages.length === 0) {
          setMessages(formattedMessages.slice(-20));
        }
      }
    } catch (error) {
      console.error("Failed to load chat history from server:", error);
      // Keep using local storage data - don't clear messages
    }
  }, [isAuthenticated, loadChatFromStorage, loadFileHashFromStorage]);

  // Function to format API responses with structured sections
  const formatResponse = (
    text: string,
    isSimplified: boolean = false
  ): string => {
    // First clean the text and normalize spacing
    const cleanText = text
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .trim();

    if (isSimplified) {
      // Structure for simplified responses
      const simplifiedSections = {
        keyTerms: "",
        obligations: "",
        risks: "",
        financial: "",
        dates: "",
      };

      // Split by section headers for simplified format
      const sectionSplits = cleanText.split(
        /(?=(?:Key Terms|Your Obligations|Potential Risks|Financial Summary|Important Dates))/i
      );

      for (const section of sectionSplits) {
        const trimmedSection = section.trim();

        if (trimmedSection.match(/^Key Terms/i)) {
          simplifiedSections.keyTerms = trimmedSection
            .replace(/^Key Terms[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^Your Obligations/i)) {
          simplifiedSections.obligations = trimmedSection
            .replace(/^Your Obligations[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^Potential Risks/i)) {
          simplifiedSections.risks = trimmedSection
            .replace(/^Potential Risks[^:]*?[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^Financial Summary/i)) {
          simplifiedSections.financial = trimmedSection
            .replace(/^Financial Summary[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^Important Dates/i)) {
          simplifiedSections.dates = trimmedSection
            .replace(/^Important Dates[:\s]*/i, "")
            .trim();
        }
      }

      // Format the simplified response with visual styling
      let formattedResponse = "";

      if (simplifiedSections.keyTerms) {
        formattedResponse += `🔑 **KEY TERMS**\n${simplifiedSections.keyTerms}\n\n`;
      }

      if (simplifiedSections.obligations) {
        formattedResponse += `📋 **YOUR OBLIGATIONS**\n${simplifiedSections.obligations}\n\n`;
      }

      if (simplifiedSections.risks) {
        formattedResponse += `🚨 **POTENTIAL RISKS & RED FLAGS**\n${simplifiedSections.risks}\n\n`;
      }

      if (simplifiedSections.financial) {
        formattedResponse += `💰 **FINANCIAL SUMMARY**\n${simplifiedSections.financial}\n\n`;
      }

      if (simplifiedSections.dates) {
        formattedResponse += `📅 **IMPORTANT DATES**\n${simplifiedSections.dates}`;
      }

      return formattedResponse || cleanText;
    } else {
      // Structure for normal responses
      const sections = {
        directAnswer: "",
        summary: "",
        keyClauses: "",
        redFlags: "",
      };

      // Split by numbered sections using more flexible patterns
      const sectionSplits = cleanText.split(
        /(?=\d+\.\s*(?:Direct Answer|Summary|Key Clauses|Red Flags))/i
      );

      for (const section of sectionSplits) {
        const trimmedSection = section.trim();

        if (trimmedSection.match(/^1\.\s*Direct Answer/i)) {
          sections.directAnswer = trimmedSection
            .replace(/^1\.\s*Direct Answer[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^2\.\s*Summary/i)) {
          sections.summary = trimmedSection
            .replace(/^2\.\s*Summary[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^3\.\s*Key Clauses/i)) {
          sections.keyClauses = trimmedSection
            .replace(/^3\.\s*Key Clauses[^:]*?[:\s]*/i, "")
            .trim();
        } else if (trimmedSection.match(/^4\.\s*Red Flags/i)) {
          sections.redFlags = trimmedSection
            .replace(/^4\.\s*Red Flags[^:]*?[:\s]*/i, "")
            .trim();
        }
      }

      // Format the final response with visual styling
      let formattedResponse = "";

      if (sections.directAnswer) {
        formattedResponse += `🎯 **DIRECT ANSWER**\n${sections.directAnswer}\n\n`;
      }

      if (sections.summary) {
        formattedResponse += `📋 **SUMMARY**\n${sections.summary}\n\n`;
      }

      if (sections.keyClauses) {
        formattedResponse += `📜 **KEY CLAUSES & OBLIGATIONS**\n${sections.keyClauses}\n\n`;
      }

      if (sections.redFlags) {
        formattedResponse += `🚨 **RED FLAGS & RISKS**\n${sections.redFlags}`;
      }

      // If no structured format detected, return cleaned text
      return formattedResponse || cleanText;
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const prevIsAuthenticatedRef = useRef<boolean | null>(null);

  // Load chat history on component mount and when authentication changes
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Prevent chat clearing by ensuring messages persist across re-renders
  useEffect(() => {
    if (messages.length === 0) {
      // If messages are empty, try to restore from storage
      const storedMessages = loadChatFromStorage();
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      }
    }
  }, [messages.length, loadChatFromStorage]);

  // Clear chat when user logs out
  useEffect(() => {
    // Initialize on first run
    if (prevIsAuthenticatedRef.current === null) {
      prevIsAuthenticatedRef.current = isAuthenticated;
      return;
    }
    
    // If user was authenticated and now is not (logged out)
    if (prevIsAuthenticatedRef.current && !isAuthenticated) {
      console.log('User logged out, clearing chat storage');
      clearChatStorage();
      setMessages([]);
      setCurrentFileHash(null);
      setStagedFiles([]);
      setUploadedFiles({});
      setFileStatuses({});
    }
    
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, clearChatStorage]);

  // Handle authentication state changes
  useEffect(() => {
    if (!isAuthenticated && prevIsAuthenticatedRef.current === true) {
      // Only clear when transitioning from authenticated to unauthenticated (logout)
      console.log('User logged out, clearing authenticated data');
      clearChatStorage();
      setMessages([]);
      setCurrentFileHash(null);
      setStagedFiles([]);
      setUploadedFiles({});
      setFileStatuses({});
    } else if (isAuthenticated && prevIsAuthenticatedRef.current === false) {
      // User just logged in, load their data
      console.log('User logged in, loading chat history');
      setTimeout(() => loadChatHistory(), 100);
    }
  }, [isAuthenticated, clearChatStorage, loadChatHistory]);

  // Storage disabled - messages only persist in memory during session
  useEffect(() => {
    // Chat storage disabled per user request
    // Only save file hash for functionality, not chat messages
    if (currentFileHash) {
      saveFileHashToStorage(currentFileHash);
    }
  }, [currentFileHash, saveFileHashToStorage]);

  // Page visibility handling disabled - no chat restoration from storage
  useEffect(() => {
    // Chat storage disabled to prevent cross-user data leakage
    // Messages only persist in memory during current session
    return;
  }, []);

  // Handle beforeunload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only save file hash, not chat messages
      if (currentFileHash) {
        saveFileHashToStorage(currentFileHash);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentFileHash, saveFileHashToStorage]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (placeholderIndex + 1) % placeholderTexts.length;
      setPlaceholderIndex(nextIndex);
      typePlaceholderText(placeholderTexts[nextIndex]);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholderIndex]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTyping]);

  // Check backend availability on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const available = await checkBackendHealth();
      setBackendAvailable(available);
      if (!available) {
        toast({
          description: "Backend server is not available. Using demo mode.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };
    checkBackend();
  }, [toast]);

  // Load available files on mount
  useEffect(() => {
    loadAvailableFiles();
  }, [loadAvailableFiles]);

  const typePlaceholderText = async (text: string) => {
    setIsTypingPlaceholder(true);
    setPlaceholderText("");

    for (let i = 0; i <= text.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 80)); // Slower for placeholder (80ms)
      setPlaceholderText(text.slice(0, i));
    }

    setIsTypingPlaceholder(false);
  };

  const demoAIResponse = {
    content:
      "I've analyzed your lease agreement. Here are the key findings: The security deposit clause is favorable to you, requiring the landlord to return deposits within 30 days. However, the penalty clause for early termination appears risky - you could be liable for 3 months' rent. The rent increase clause is neutral, limited to 5% annually. The late payment fees are clearly defined at $50 per day.",
    highlights: [
      {
        text: "security deposit clause",
        category: "Favorable",
        type: "favorable" as const,
      },
      {
        text: "penalty clause for early termination",
        category: "Risky",
        type: "risky" as const,
      },
      {
        text: "rent increase clause",
        category: "Clause",
        type: "clause" as const,
      },
      {
        text: "late payment fees",
        category: "Payment",
        type: "payment" as const,
      },
    ],
    confidence: 87,
  };

  const typeMessage = async (message: string) => {
    setIsTyping(true);
    setTypingMessage("");

    for (let i = 0; i <= message.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 8)); // Much faster for chat (8ms)
      setTypingMessage(message.slice(0, i));
    }

    setIsTyping(false);
    return message;
  };

  // Old handleSendMessage function removed - now using handleSendWithFiles

  const handleFileUpload = () => {
    setShowUploadDialog(true);
  };

  const handleUploadTypeSelect = (type: "normal" | "confidential") => {
    setUploadType(type);
    setShowUploadDialog(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0 && uploadType) {
        setIsUploading(true);
        try {
          // Process each file
          for (const file of files) {
            if (backendAvailable) {
              try {
                // Upload to backend (use guest upload if not authenticated)
                const uploadResponse: UploadResponse = isAuthenticated
                  ? await apiClient.uploadFile(file, uploadType)
                  : await apiClient.guestUploadFile(file);

                // Store upload response
                setUploadedFiles((prev) => ({
                  ...prev,
                  [uploadResponse.file_id]: uploadResponse,
                }));

                // Set initial status
                setFileStatuses((prev) => ({
                  ...prev,
                  [uploadResponse.file_id]: "processing",
                }));

                // Add to staged files with backend metadata
                const fileWithType = file as File & {
                  uploadType?: "normal" | "confidential";
                  fileId?: string;
                };
                fileWithType.uploadType = uploadType;
                fileWithType.fileId = uploadResponse.file_id;
                setStagedFiles((prev) => [...prev, fileWithType]);

                // Start polling for status updates
                pollFileStatus(uploadResponse.file_id);

                const typeLabel =
                  uploadType === "confidential" ? "confidential" : "normal";
                toast({
                  description: `${file.name} uploaded successfully (${typeLabel})`,
                  duration: 2000,
                });
                // Refresh available files list after successful upload
                loadAvailableFiles();
              } catch (error) {
                console.error("Upload error:", error);
                toast({
                  description: `Failed to upload ${file.name}: ${error}`,
                  variant: "destructive",
                  duration: 3000,
                });
              }
            } else {
              // Fallback to demo mode
              const fileWithType = file as File & {
                uploadType?: "normal" | "confidential";
              };
              fileWithType.uploadType = uploadType;
              setStagedFiles((prev) => [...prev, fileWithType]);

              const typeLabel =
                uploadType === "confidential" ? "confidential" : "normal";
              toast({
                description: `${file.name} added to chat (${typeLabel}) - Demo mode`,
                duration: 2000,
              });
            }
          }
        } finally {
          // Reset the input and upload type
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setUploadType(null);
          setIsUploading(false);
        }
      }
    },
    [uploadType, toast, backendAvailable, isAuthenticated, loadAvailableFiles]
  );

  // Listen for file uploads from sidebar
  useEffect(() => {
    const handleSidebarFileUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileChange({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const sidebarFileInput = document.getElementById("file-upload");
    if (sidebarFileInput) {
      sidebarFileInput.addEventListener("change", handleSidebarFileUpload);
    }

    return () => {
      if (sidebarFileInput) {
        sidebarFileInput.removeEventListener("change", handleSidebarFileUpload);
      }
    };
  }, [handleFileChange]);

  // Poll file status
  const pollFileStatus = async (fileId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const statusResponse = await apiClient.getUploadStatus(fileId);
        setFileStatuses((prev) => ({
          ...prev,
          [fileId]: statusResponse.status,
        }));

        if (
          statusResponse.status === "completed" ||
          statusResponse.status === "failed" ||
          attempts >= maxAttempts
        ) {
          return;
        }

        attempts++;
        setTimeout(poll, 10000); // Poll every 10 seconds
      } catch (error) {
        console.error("Error polling file status:", error);
      }
    };

    poll();
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = stagedFiles[index];
    const fileWithId = fileToRemove as File & { fileId?: string };

    // If file has been uploaded to backend, delete it
    if (fileWithId.fileId && backendAvailable) {
      try {
        if (isAuthenticated) {
          await apiClient.deleteFile(fileWithId.fileId);
        }
        // Remove from uploadedFiles and status tracking
        setUploadedFiles((prev) => {
          const updated = { ...prev };
          delete updated[fileWithId.fileId!];
          return updated;
        });
        setFileStatuses((prev) => {
          const updated = { ...prev };
          delete updated[fileWithId.fileId!];
          return updated;
        });

        toast({
          title: "File removed",
          description: `${fileToRemove.name} has been deleted successfully.`,
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        toast({
          title: "Error",
          description: `Failed to delete ${fileToRemove.name} from server.`,
          variant: "destructive",
        });
      }
    }

    // Remove from staged files
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const inputAreaRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside the input area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = inputAreaRef.current;
      if (container && !container.contains(e.target as Node)) {
        setShowFileSelector(false);
        setShowAtMention(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSendWithFiles = async (isSimplify: boolean = false) => {
    // For simplify: only need file hash, no text or files required
    // For normal send: need text input
    if (isSimplify) {
      if (!currentFileHash) return;
    } else {
      if (!inputValue.trim() && stagedFiles.length === 0) return;
    }

    let content = inputValue.trim();
    if (stagedFiles.length > 0) {
      const fileList = stagedFiles.map((file) => `📄 ${file.name}`).join(", ");
      content = content
        ? `${content}\n\nAttached files: ${fileList}`
        : `Attached files: ${fileList}`;
    }

    // For simplify, use a default message since no text input is required
    const finalContent = isSimplify
      ? "📄 Document simplification requested"
      : content;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: finalContent,
      timestamp: new Date(),
      isSimplified: isSimplify,
      attachedFiles: stagedFiles.map((file) => file.name),
    };

    // Close any open dropdowns while sending
    setShowFileSelector(false);
    setShowAtMention(false);
    setMessages((prev) => [...prev, userMessage]);
    const currentQuestionRaw = inputValue.trim();
    // Clean the question by removing any @mention file tokens (both original and normalized names)
    const cleanQuestion = (text: string) => {
      try {
        const fileList: Array<{ name: string; normalized: string }> = JSON.parse(
          sessionStorage.getItem('fileList') || '[]'
        );
        let cleaned = text;
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        for (const f of fileList) {
          const patterns = [f.name, f.normalized]
            .filter(Boolean)
            .map((n) => new RegExp(`(^|\\s)@${escapeRegex(n)}(\\b|\\s|$)`, 'ig'));
          for (const re of patterns) {
            cleaned = cleaned.replace(re, (m, p1, p2) => (p1 ? p1 : '') + (p2 ? p2 : ''));
          }
        }
        // Also remove stray solitary '@' tokens followed by non-space word if it exactly matches any file token
        // Build a set of tokens for quick check
        const tokens = new Set<string>(fileList.flatMap(f => [f.name, f.normalized].filter(Boolean)) as string[]);
        cleaned = cleaned.replace(/(^|\s)@([^\s]+)/g, (full, pre, word) => {
          return tokens.has(word) ? (pre || '') : full;
        });
        return cleaned.trim();
      } catch {
        return text;
      }
    };
    const currentQuestion = cleanQuestion(currentQuestionRaw);
    const currentFiles = [...stagedFiles];
    setInputValue("");
    setStagedFiles([]);
    setIsLoading(true);

    if (isSimplify) {
      setSimplifyButtonState("loading");
    } else {
      setSendButtonState("loading");
    }

    try {
      let responseContent: string;
      let confidence: number | undefined;
      let highlights: HighlightedText[] = [];
      let evidence: Evidence[] = [];

      // Determine which file hash to use
      let fileId: string | null = null;

      if (currentFiles.length > 0) {
        // Use newly uploaded file
        const fileWithId = currentFiles.find(
          (f) => (f as File & { fileId?: string }).fileId
        );
        if (fileWithId) {
          fileId = (fileWithId as File & { fileId?: string }).fileId;
          // Save this file hash for future use
          setCurrentFileHash(fileId);
          saveFileHashToStorage(fileId);
        }
      } else if (selectedFile) {
        // Use selected file from @ mention or + button
        const fileMap = JSON.parse(sessionStorage.getItem('fileMap') || '{}');
        fileId = fileMap[selectedFile];
        if (fileId) {
          setCurrentFileHash(fileId);
          saveFileHashToStorage(fileId);
        }
      } else if (currentFileHash && (currentQuestion || isSimplify)) {
        // Use previously saved file hash
        fileId = currentFileHash;
      }

      if (backendAvailable && fileId && (currentQuestion || isSimplify)) {
        // Use backend API for real processing
        try {
          if (isSimplify) {
            // Use simplify endpoint with file hash only
            const simplifyResponse = await apiClient.simplifyText(fileId);
            const rawResponse =
              simplifyResponse.simplified ||
              simplifyResponse.simplified_text ||
              "Here's a simplified explanation of your document...";
            responseContent = formatResponse(rawResponse, true);
            confidence = simplifyResponse.confidence;
          } else {
            // Use appropriate Q&A endpoint based on authentication
            // Pass the question without file identifier since we're using fileId directly
            const qaResponse: QAResponse = isAuthenticated
              ? await apiClient.askQuestion(currentQuestion, fileId)
              : await apiClient.guestQA(currentQuestion, fileId);
            responseContent = formatResponse(qaResponse.answer);
            confidence = qaResponse.confidence;

            // Store evidence for popup
            evidence = qaResponse.evidence.map((ev) => ({
              text: ev.text,
              page_number: ev.meta?.page,
              section: ev.meta?.section,
              score: ev.score,
            }));

            // Use highlights directly from API response if available
            if (qaResponse.highlights && qaResponse.highlights.length > 0) {
              highlights = qaResponse.highlights.map((highlight) => ({
                text: highlight.text,
                category: highlight.category,
                suggestion: highlight.suggestion || null,
                type: highlight.category.toLowerCase() as
                  | "favorable"
                  | "neutral"
                  | "risky"
                  | "payment"
                  | "clause",
              }));
            } else {
              // Fallback: Convert evidence to highlights with better formatting
              highlights = qaResponse.evidence
                .slice(0, 4)
                .map((evidence, index) => {
                  // Extract meaningful text and add page/section info if available
                  const displayText =
                    evidence.text.length > 80
                      ? evidence.text.substring(0, 80) + "..."
                      : evidence.text;

                  // Add page number if available in evidence metadata
                  const pageInfo = evidence.meta?.page_number
                    ? ` (Page ${evidence.meta.page_number})`
                    : "";
                  const sectionInfo = evidence.meta?.section
                    ? ` [${evidence.meta.section}]`
                    : "";

                  return {
                    text: `${displayText}${pageInfo}${sectionInfo}`,
                    category: ["Favorable", "Neutral", "Risky", "Clause"][
                      index % 4
                    ],
                    type: ["favorable", "neutral", "risky", "clause"][
                      index % 4
                    ] as "favorable" | "neutral" | "risky" | "clause",
                  };
                });
            }
          }
        } catch (apiError) {
          console.error("API Error:", apiError);
          // If API fails, use demo response but show error
          responseContent = `API Error: ${apiError}. Please ensure your file is fully processed and try again.`;
          confidence = 0;
          highlights = [];
        }
      } else if (!fileId && currentQuestion && !isSimplify) {
        // No file available but user is asking a question
        responseContent =
          "Please upload a document first to get started with your legal analysis.";
        confidence = 0;
        highlights = [];
      } else {
        // Fallback to demo response
        responseContent = isSimplify
          ? "Here's a simplified explanation of your request and documents..."
          : demoAIResponse.content;
        confidence = demoAIResponse.confidence;
        highlights = isSimplify ? [] : demoAIResponse.highlights;
      }

      // Start typing animation first
      await typeMessage(responseContent);

      // Add the AI response to messages (for all cases)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: responseContent,
        timestamp: new Date(),
        highlights: highlights,
        evidence: evidence,
        confidence: confidence,
        isSimplified: isSimplify,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Set button states
      if (isSimplify) {
        setSimplifyButtonState("success");
        setTimeout(() => setSimplifyButtonState("idle"), 2000);
      } else {
        setSendButtonState("success");
        setTimeout(() => setSendButtonState("idle"), 2000);
      }
    } catch (error) {
      console.error("Error in message processing:", error);

      // Show error message
      const errorMessage = `Error: ${error}. Using demo response.`;
      await typeMessage(demoAIResponse.content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: demoAIResponse.content,
        timestamp: new Date(),
        highlights: isSimplify ? [] : demoAIResponse.highlights,
        confidence: demoAIResponse.confidence,
        isSimplified: isSimplify,
      };
      setMessages((prev) => [...prev, aiMessage]);

      toast({
        description: "Using demo response due to backend error",
        variant: "destructive",
        duration: 3000,
      });

      if (isSimplify) {
        setSimplifyButtonState("idle");
      } else {
        setSendButtonState("idle");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => handleSendWithFiles(false);
  const handleSimplifyMessage = () => handleSendWithFiles(true);

  const handleOldFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: `📄 Uploaded: ${file.name}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      setTimeout(async () => {
        setIsLoading(false);

        const fullContent = `I've successfully processed your document "${file.name}". ${demoAIResponse.content}`;

        // Start typing animation first
        await typeMessage(fullContent);

        // After typing completes, add the full message with highlights
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: fullContent,
          timestamp: new Date(),
          highlights: demoAIResponse.highlights,
          confidence: demoAIResponse.confidence,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 4000);
    }
  };

  const startVoiceTyping = () => {
    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true; // Enable interim results for better UX
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      // Store the recognition instance in the ref
      recognitionRef.current = recognition;

      recognition.onaudiostart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Update the input with the final transcript if available, otherwise use interim
        const newTranscript = finalTranscript.trim() || interimTranscript;
        setTranscript(newTranscript);

        // Only update input value with final transcript to avoid flickering
        if (finalTranscript) {
          setInputValue((prev) => {
            // If there's existing text, add a space before appending
            const separator = prev && !prev.endsWith(" ") ? " " : "";
            return prev + separator + finalTranscript.trim();
          });
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        // Don't show error if user manually stopped the recognition
        if (event.error !== "aborted" && event.error !== "not-allowed") {
          alert("Error occurred in speech recognition: " + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        // If still in listening mode, restart recognition
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Error restarting recognition:", e);
            setIsListening(false);
          }
        }
      };

      // Start recognition
      try {
        recognition.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        setIsListening(false);
      }
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      alert(
        "Failed to initialize speech recognition. Please check your microphone permissions."
      );
      setIsListening(false);
    }
  };

  const stopVoiceTyping = () => {
    if (recognitionRef.current) {
      try {
        // Stop the recognition
        recognitionRef.current.stop();

        // Clear the transcript if it's empty
        if (!transcript.trim()) {
          setTranscript("");
        }
      } catch (e) {
        console.error("Error stopping recognition:", e);
      } finally {
        recognitionRef.current = null;
        setIsListening(false);
      }
    }
  };

  const handleHighlightClick = (highlight: HighlightedText) => {
    setSelectedHighlight(highlight);
    setShowSuggestionDrawer(true);
  };

  // Feedback handlers
  const handleLike = (messageId: string) => {
    console.log(`Liked message: ${messageId}`);
    // TODO: Implement feedback storage/API call
  };

  const handleDislike = (messageId: string) => {
    console.log(`Disliked message: ${messageId}`);
    // TODO: Implement feedback storage/API call
  };

  const handleBookmark = (messageId: string) => {
    console.log(`Bookmarked message: ${messageId}`);
    // TODO: Implement bookmark storage/API call
  };

  const handleShowEvidence = (evidence: Evidence[]) => {
    setSelectedEvidence(evidence);
    setShowEvidenceDialog(true);
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({
        description: "Message copied to clipboard!",
        duration: 2000,
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
        toast({
          description: "Message copied to clipboard!",
          duration: 2000,
        });
      } catch (fallbackErr) {
        console.error("Failed to copy text: ", fallbackErr);
        toast({
          description: "Failed to copy message",
          variant: "destructive",
          duration: 2000,
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = (content: string) => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        throw new Error("Failed to open print window");
      }

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Legal Assistant Response - ${currentDate}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                border-bottom: 2px solid #0d76ea;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #0d76ea;
                margin: 0;
                font-size: 24px;
              }
              .meta {
                color: #666;
                font-size: 14px;
                margin-top: 10px;
              }
              .content {
                white-space: pre-wrap;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #0d76ea;
                word-wrap: break-word;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>LegalAssist AI Response</h1>
              <div class="meta">
                Generated on: ${currentDate} at ${currentTime}
              </div>
            </div>
            <div class="content">${content
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</div>
            <div class="footer">
              This document was generated by LegalAssist AI. Please consult with a qualified legal professional for important legal matters.
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 100);
      };

      // Handle print completion
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    } catch (error) {
      console.error("Print failed:", error);
      alert(
        "Unable to print. Please check your browser settings and try again."
      );
    }
  };

  const handleFeedbackSubmit = (messageId: string, feedback: string) => {
    console.log(`Feedback for message ${messageId}:`, feedback);
    // TODO: Implement feedback storage/API call
    // You could send this to your backend API to store user feedback
  };

  const handleEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && message.type === "user") {
      setIsEditingMessage(true);
      setEditingMessageId(messageId);
      setEditingContent(message.content);
      setEditingFiles(message.attachedFiles || []);
    }
  };

  const handleSaveEdit = (messageId: string) => {
    const editedMessage = messages.find((msg) => msg.id === messageId);
    if (!editedMessage) return;

    // Update the user message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: editingContent, attachedFiles: editingFiles }
          : msg
      )
    );

    // Clear edit state
    setEditingMessageId(null);
    setEditingContent("");
    setEditingFiles([]);
    setIsEditingMessage(false);

    // Remove the old AI response (next message after the edited user message)
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex !== -1 && messageIndex + 1 < messages.length) {
      const nextMessage = messages[messageIndex + 1];
      if (nextMessage.type === "ai") {
        setMessages((prev) => prev.filter((msg) => msg.id !== nextMessage.id));
      }
    }

    // Generate new AI response based on the edited message
    const isSimplifyMessage = editedMessage.isSimplified || false;

    // Set loading state
    setIsLoading(true);
    if (isSimplifyMessage) {
      setSimplifyButtonState("loading");
    } else {
      setSendButtonState("loading");
    }

    const responseContent = isSimplifyMessage
      ? "Here's a simplified explanation of your updated request and documents..."
      : demoAIResponse.content;

    setTimeout(async () => {
      try {
        await typeMessage(responseContent);

        const newAiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: responseContent,
          timestamp: new Date(),
          highlights: isSimplifyMessage ? [] : demoAIResponse.highlights,
          confidence: isSimplifyMessage ? undefined : demoAIResponse.confidence,
          isSimplified: isSimplifyMessage,
        };

        setMessages((prev) => [...prev, newAiMessage]);

        if (isSimplifyMessage) {
          setSimplifyButtonState("success");
          setTimeout(() => setSimplifyButtonState("idle"), 2000);
        } else {
          setSendButtonState("success");
          setTimeout(() => setSendButtonState("idle"), 2000);
        }
      } catch (error) {
        console.error("Error regenerating response:", error);
        if (isSimplifyMessage) {
          setSimplifyButtonState("idle");
        } else {
          setSendButtonState("idle");
        }
      } finally {
        setIsLoading(false);
      }
    }, 3000);

    toast({
      description: "Message updated and response regenerated!",
      duration: 2000,
    });
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
    setEditingFiles([]);
    setIsEditingMessage(false);
  };

  const handleRemoveEditingFile = (fileName: string) => {
    console.log("Removing file:", fileName);
    console.log("Current editing files:", editingFiles);
    setEditingFiles((prev) => {
      const newFiles = prev.filter((file) => file !== fileName);
      console.log("New editing files:", newFiles);
      return newFiles;
    });
    toast({
      description: `${fileName} removed from editing files`,
      duration: 2000,
    });
  };

  const handleUploadClick = () => {
    setShowUploadDialog(true);
  };

  const handleNewChat = () => {
    // Clear all chat-related state
    setMessages([]);
    setCurrentFileHash(null);
    setStagedFiles([]);
    setUploadedFiles({});
    setFileStatuses({});
    setInputValue("");
    setEditingMessageId(null);
    setEditingContent("");
    setEditingFiles([]);
    setIsEditingMessage(false);
    
    // Clear storage
    clearChatStorage();
    
    toast({
      description: "New chat started",
      duration: 2000,
    });
  };

  const quickActions = [
    "Explain This Clause",
    "List Penalties",
    "Show Renewal Terms",
    "Risk Assessment",
    "Payment Terms",
    "Legal Obligations",
  ];

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col ml-16 lg:ml-64">
          <AppHeader
            onUploadClick={handleUploadClick}
            onSettingsClick={() => console.log("Settings clicked")}
            onNewChatClick={handleNewChat}
            showNewChat={messages.length > 0}
          />
          <div className="flex-1 flex relative pt-16">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
                {messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-8">
                      <div className="w-28 h-28 mx-auto rounded-3xl bg-[#00C2FF] flex items-center justify-center shadow-2xl">
                        <Brain className="w-14 h-14 text-white" />
                      </div>
                      <div>
                        <h2
                          className="text-3xl font-bold mb-3"
                          style={{ color: "#111111" }}
                        >
                          Welcome to LegalAssist AI
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-center text-lg">
                          {isAuthenticated
                            ? `Welcome back, ${
                                user?.displayName || user?.email
                              }! Upload a legal document or ask me any questions about legal terms, contracts, and more.`
                            : "Upload a legal document or ask me any questions about legal terms, contracts, and more. Sign in for enhanced features and document history."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setMessages([]);
                            setInputValue("");
                          }}
                          className="bg-[#00C2FF] hover:bg-[#0099CC] text-white px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Chat
                        </Button>
                        {quickActions.map((action) => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="cursor-pointer hover:bg-[#00C2FF]/10 hover:text-[#00C2FF] transition-all duration-200 hover:scale-105 px-4 py-2 text-sm rounded-xl border-2 border-[#00C2FF]/20"
                            onClick={() => setInputValue(action)}
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={`message-${message.id}`} className="relative">
                    {/* Simplify Badge for user messages */}
                    {message.type === "user" && message.isSimplified && (
                      <div className="flex justify-end mb-1">
                        <div className="bg-[#FF6B35] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Simplified</span>
                        </div>
                      </div>
                    )}
                    {/* Simplify Badge for AI messages */}
                    {message.type === "ai" && message.isSimplified && (
                      <div className="flex justify-start mb-1">
                        <div className="bg-[#FF6B35] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Simplified Response</span>
                        </div>
                      </div>
                    )}
                    <ChatBubble
                      key={message.id}
                      type={message.type}
                      content={message.content}
                      highlights={message.highlights}
                      evidence={message.evidence}
                      confidence={message.confidence}
                      timestamp={message.timestamp}
                      isCopied={copiedMessageId === message.id}
                      isEditing={editingMessageId === message.id}
                      editingContent={editingContent}
                      editingFiles={
                        editingMessageId === message.id ? editingFiles : []
                      }
                      onEditingContentChange={setEditingContent}
                      onRemoveEditingFile={handleRemoveEditingFile}
                      onHighlightClick={handleHighlightClick}
                      onBookmark={() => console.log("Bookmark clicked")}
                      onLike={() => console.log("Like clicked")}
                      onDislike={() => console.log("Dislike clicked")}
                      onCopy={() => handleCopy(message.content, message.id)}
                      onPrint={() => handlePrint(message.content)}
                      onEdit={() => handleEditMessage(message.id)}
                      onSaveEdit={() => handleSaveEdit(message.id)}
                      onShowEvidence={() =>
                        message.evidence && handleShowEvidence(message.evidence)
                      }
                      onCancelEdit={handleCancelEdit}
                      onFeedbackSubmit={(feedback) => {
                        console.log("Feedback submitted:", feedback);
                      }}
                    />
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <Card className="max-w-[85%] border-0 shadow-card bg-card dark:bg-gray-900/95">
                      <CardContent className="p-6">
                        <NeuralLoader />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <Card className="max-w-[85%] border-0 shadow-card bg-card dark:bg-gray-900/95">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="text-sm leading-relaxed text-foreground">
                            {typingMessage}
                            <span className="inline-flex items-center ml-3">
                              <div className="relative w-5 h-5">
                                <Brain className="w-5 h-5 text-[#00C2FF] animate-brain-typing" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00C2FF] rounded-full animate-pulse"></div>
                              </div>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Fixed Bottom Chat Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 z-10 ml-16 lg:ml-64">
                <div className="w-full space-y-3">
                  {isUploading && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/50 text-sm text-muted-foreground">
                      <div className="h-3 w-3 rounded-full border-2 border-[#00C2FF] border-t-transparent animate-spin" />
                      Uploading file(s)... This may take a moment.
                    </div>
                  )}
                  {/* Staged Files Display */}
                  {stagedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Attached files ({stagedFiles.length}):</span>
                          {!isAuthenticated && (
                            <Badge
                              variant="outline"
                              className="text-xs text-blue-600 border-blue-300"
                            >
                              Guest Mode
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStagedFiles([])}
                          className="h-6 px-2 text-xs hover:bg-red-100 hover:text-red-600 rounded-md"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      {stagedFiles.map((file, index) => {
                        const fileWithType = file as File & {
                          uploadType?: "normal" | "confidential";
                        };
                        const isConfidential =
                          fileWithType.uploadType === "confidential";

                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2 border ${
                              isConfidential
                                ? "border-red-500/50 bg-red-500/10 dark:border-red-400/50 dark:bg-red-400/10"
                                : "border-border/30"
                            }`}
                          >
                            {isConfidential ? (
                              <Shield className="h-4 w-4 text-red-500 dark:text-red-400" />
                            ) : (
                              <FileText className="h-4 w-4 text-[#00C2FF]" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium truncate max-w-32">
                                {file.name}
                              </span>
                              <div className="flex items-center gap-2">
                                {isConfidential && (
                                  <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                                    Confidential
                                  </span>
                                )}
                                {(() => {
                                  const fileWithId = file as File & {
                                    fileId?: string;
                                  };
                                  const status = fileWithId.fileId
                                    ? fileStatuses[fileWithId.fileId]
                                    : null;
                                  if (status) {
                                    const statusColors = {
                                      processing:
                                        "text-yellow-600 dark:text-yellow-400",
                                      completed:
                                        "text-green-600 dark:text-green-400",
                                      failed: "text-red-600 dark:text-red-400",
                                    };
                                    return (
                                      <span
                                        className={`text-xs font-medium ${
                                          statusColors[
                                            status as keyof typeof statusColors
                                          ] || "text-gray-500"
                                        }`}
                                      >
                                        {status === "processing" && "⏳"}
                                        {status === "completed" && "✅"}
                                        {status === "failed" && "❌"}
                                        {status}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative" ref={inputAreaRef}>
                    {/* + Button for file selection */}
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isLoading) return; // Prevent opening while sending
                          // Refresh available files when opening the selector
                          setShowFileSelector((prev) => {
                            const next = !prev;
                            if (next) {
                              loadAvailableFiles();
                            }
                            return next;
                          });
                        }}
                        className="h-8 w-8 p-0 rounded-full hover:bg-[#00C2FF]/10 transition-colors"
                        disabled={isLoading || isUploading}
                        title={availableFiles.length === 0 ? 'No files uploaded yet' : `${availableFiles.length} files available`}
                      >
                        <Plus className="h-4 w-4 text-[#00C2FF]" />
                      </Button>
                    </div>

                    <Input
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder={
                        isTypingPlaceholder
                          ? placeholderText
                          : placeholderTexts[placeholderIndex]
                      }
                      className="pr-48 h-14 text-base rounded-2xl border-2 border-border/50 transition-all duration-300 focus:ring-2 focus:ring-[#00C2FF] focus:border-[#00C2FF] pl-12"
                      disabled={isLoading || isUploading}
                    />

                    {/* @ Mention Dropdown */}
                    {showAtMention && (
                      <div className="absolute bottom-16 left-12 w-80 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                        <div className="px-3 py-2 border-b border-border">
                          <span className="text-sm font-medium text-muted-foreground">@ Mention Files</span>
                        </div>
                        {availableFiles.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            No files uploaded yet
                          </div>
                        ) : (
                          availableFiles
                            .filter(file => {
                              const searchTerm = inputValue.substring(atMentionPosition + 1).toLowerCase();
                              return searchTerm === '' || file.normalized.includes(searchTerm) || file.name.toLowerCase().includes(searchTerm);
                            })
                            .map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleFileSelect(file.name)}
                              >
                                <FileText className="h-4 w-4 text-[#00C2FF]" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{file.normalized}</span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}

                    {/* + Button File Selector Dropdown */}
                    {showFileSelector && (
                      <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg w-72 max-h-40 overflow-y-auto z-50">
                        <div className="px-3 py-2 border-b border-border">
                          <span className="text-sm font-medium text-muted-foreground">Select a file</span>
                        </div>
                        {availableFiles.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            <div>No files uploaded yet</div>
                            <div className="text-xs mt-1">Upload a file first to see it here</div>
                          </div>
                        ) : (
                          <>
                            <div className="px-3 py-1 text-xs text-muted-foreground">
                              {availableFiles.length} file{availableFiles.length !== 1 ? 's' : ''} available
                            </div>
                            {availableFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handlePlusButtonFileSelect(file.name)}
                              >
                                <FileText className="h-4 w-4 text-[#00C2FF]" />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{file.normalized}</span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFileUpload}
                        className="h-10 w-10 p-0 hover:bg-[#00C2FF]/10 hover:text-[#00C2FF] rounded-xl transition-all duration-200 hover:scale-105"
                        disabled={isLoading || isUploading}
                      >
                        <Upload className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={
                          isListening ? stopVoiceTyping : startVoiceTyping
                        }
                        className={cn(
                          "h-10 w-10 p-0 rounded-xl transition-all duration-200 hover:scale-105",
                          isListening
                            ? "bg-[#FF4C4C] hover:bg-[#CC3D3D] text-white"
                            : "hover:bg-[#00C2FF]/10 hover:text-[#00C2FF]"
                        )}
                        disabled={isLoading || isUploading}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      {/* Dual Send Buttons */}
                      <div className="flex items-center gap-1">
                        <div className="relative group">
                          <Button
                            onClick={handleSimplifyMessage}
                            disabled={!currentFileHash || isLoading || isUploading}
                            size="sm"
                            className={cn(
                              "h-10 w-10 p-0 rounded-xl transition-all duration-300",
                              simplifyButtonState === "loading"
                                ? "bg-[#FF6B35] animate-pulse"
                                : simplifyButtonState === "success"
                                ? "bg-[#00FF88] hover:bg-[#00CC6A]"
                                : "bg-[#FF6B35] hover:bg-[#E55A2B] hover:scale-105 shadow-lg"
                            )}
                          >
                            {simplifyButtonState === "loading" ? (
                              <div className="relative w-4 h-4">
                                {/* Lightning/Thunder Loading Animation */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 relative">
                                    <div className="absolute inset-0 animate-ping">
                                      <Zap className="h-4 w-4 text-white opacity-75" />
                                    </div>
                                    <div className="absolute inset-0 animate-pulse">
                                      <Zap className="h-4 w-4 text-white" />
                                    </div>
                                    {/* Lightning bolt effect */}
                                    <div className="absolute inset-0 animate-bounce">
                                      <div
                                        className="w-full h-full bg-white/20 rounded-sm animate-pulse"
                                        style={{
                                          clipPath:
                                            "polygon(20% 0%, 40% 20%, 30% 20%, 70% 100%, 50% 80%, 60% 80%, 20% 0%)",
                                          animationDuration: "0.8s",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : simplifyButtonState === "success" ? (
                              <div className="w-4 h-4 text-white font-bold text-lg leading-none flex items-center justify-center">
                                ✓
                              </div>
                            ) : (
                              <Zap className="h-4 w-4 text-white" />
                            )}
                          </Button>
                          {/* Enhanced Tooltip */}
                          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-[#FF6B35] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-semibold">🔥 Simplify</div>
                              <div className="text-[10px] opacity-90">
                                Get easy explanation
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#FF6B35]"></div>
                            </div>
                          </div>
                        </div>
                        <div className="relative group">
                          <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading || isUploading}
                            size="sm"
                            className={cn(
                              "h-10 w-10 p-0 rounded-xl transition-all duration-300",
                              sendButtonState === "loading"
                                ? "bg-[#00C2FF] animate-pulse"
                                : sendButtonState === "success"
                                ? "bg-[#00FF88] hover:bg-[#00CC6A]"
                                : "bg-[#00C2FF] hover:bg-[#0099CC] hover:scale-105 shadow-lg"
                            )}
                          >
                            {sendButtonState === "loading" ? (
                              <div className="relative w-5 h-5">
                                {/* Lightning/Thunder Loading Animation for Send */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-5 h-5 relative">
                                    <div className="absolute inset-0 animate-ping">
                                      <Send className="h-5 w-5 text-white opacity-75" />
                                    </div>
                                    <div className="absolute inset-0 animate-pulse">
                                      <Send className="h-5 w-5 text-white" />
                                    </div>
                                    {/* Lightning bolt effect */}
                                    <div className="absolute inset-0 animate-bounce">
                                      <div
                                        className="w-full h-full bg-white/20 rounded-sm animate-pulse"
                                        style={{
                                          clipPath:
                                            "polygon(20% 0%, 40% 20%, 30% 20%, 70% 100%, 50% 80%, 60% 80%, 20% 0%)",
                                          animationDuration: "0.6s",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : sendButtonState === "success" ? (
                              <div className="w-5 h-5 text-white font-bold text-lg leading-none flex items-center justify-center">
                                ✓
                              </div>
                            ) : (
                              <Send className="h-5 w-5 text-white" />
                            )}
                          </Button>
                          {/* Enhanced Tooltip */}
                          <div className="absolute bottom-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-[#00C2FF] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-semibold">📊 Send</div>
                              <div className="text-[10px] opacity-90">
                                Get detailed analysis
                              </div>
                              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#00C2FF]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Transcript Display */}
                  {isListening && transcript && (
                    <div className="mt-2 p-3 bg-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-[#00C2FF] rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-[#00C2FF]">
                          Live Transcript:
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{transcript}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    LegalAssist AI can make mistakes. Consider consulting a
                    lawyer for important legal matters.
                  </p>
                </div>
              </div>
            </div>

            <AISuggestionsDrawer
              isOpen={showSuggestionDrawer}
              onClose={() => setShowSuggestionDrawer(false)}
              selectedHighlight={selectedHighlight || undefined}
            />
          </div>
        </div>
      </div>

      {/* Upload Type Selection Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#00C2FF]" />
              Choose Upload Type
            </DialogTitle>
            <DialogDescription>
              Select how you want to upload your document. Confidential uploads
              receive enhanced security handling.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              onClick={() => handleUploadTypeSelect("normal")}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-[#00C2FF]/10 hover:border-[#00C2FF] dark:hover:bg-[#00C2FF]/20 transition-all duration-200"
            >
              <File className="h-8 w-8 text-[#00C2FF]" />
              <div className="text-center">
                <div className="font-semibold text-base">Normal Upload</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Standard document processing with regular security
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleUploadTypeSelect("confidential")}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:bg-red-500/10 hover:border-red-500 dark:hover:bg-red-400/20 dark:hover:border-red-400 transition-all duration-200"
            >
              <Shield className="h-8 w-8 text-red-500 dark:text-red-400" />
              <div className="text-center">
                <div className="font-semibold text-base text-red-600 dark:text-red-400">
                  Confidential Upload
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Enhanced security and privacy protection for sensitive
                  documents
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evidence Dialog */}
      <EvidenceDialog
        isOpen={showEvidenceDialog}
        onClose={() => setShowEvidenceDialog(false)}
        evidence={selectedEvidence}
        title="Evidence Sources"
      />

      <Toaster />
    </TooltipProvider>
  );
}
