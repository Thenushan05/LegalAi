import { useState } from "react";
import {
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Printer,
  AlertTriangle,
  DollarSign,
  FileText,
  CheckCircle,
  MessageSquare,
  Send,
  Edit,
  X,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HighlightedText {
  text: string;
  type?: "favorable" | "neutral" | "risky" | "payment" | "clause";
  category: string;
  suggestion?: string | null;
  onClick?: () => void;
}

interface Evidence {
  text: string;
  page_number?: number;
  section?: string;
  confidence?: number;
}

interface ChatBubbleProps {
  type: "user" | "ai";
  content: string;
  highlights?: HighlightedText[];
  evidence?: Evidence[];
  confidence?: number;
  timestamp?: Date;
  isCopied?: boolean;
  isEditing?: boolean;
  editingContent?: string;
  editingFiles?: string[];
  onEditingContentChange?: (content: string) => void;
  onRemoveEditingFile?: (fileName: string) => void;
  onHighlightClick?: (highlight: HighlightedText) => void;
  onBookmark?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  onCopy?: () => void;
  onPrint?: () => void;
  onEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onFeedbackSubmit?: (feedback: string) => void;
  onShowEvidence?: () => void;
}

const getHighlightIcon = (category: string | undefined) => {
  if (!category) return FileText;
  const lowerCategory = category.toLowerCase();
  switch (lowerCategory) {
    case "risky":
    case "risk":
      return AlertTriangle;
    case "payment":
    case "financial":
      return DollarSign;
    case "clause":
    case "clauses":
      return FileText;
    case "favorable":
    case "positive":
      return CheckCircle;
    default:
      return FileText;
  }
};

const getHighlightColor = (category: string | undefined) => {
  if (!category) return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
  const lowerCategory = category.toLowerCase();
  switch (lowerCategory) {
    case "risky":
    case "risk":
      return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";
    case "payment":
    case "financial":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800";
    case "clause":
    case "clauses":
      return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800";
    case "favorable":
    case "positive":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
  }
};

// This function is no longer needed since we use the API category directly

export const ChatBubble = ({
  type,
  content,
  highlights = [],
  evidence = [],
  confidence,
  timestamp,
  isCopied = false,
  isEditing = false,
  editingContent = "",
  editingFiles = [],
  onEditingContentChange,
  onRemoveEditingFile,
  onHighlightClick,
  onBookmark,
  onLike,
  onDislike,
  onCopy,
  onPrint,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onFeedbackSubmit,
  onShowEvidence,
}: ChatBubbleProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsDisliked(false);
    onLike?.();
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    setIsLiked(false);
    onDislike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleFeedbackSubmit = () => {
    if (feedbackText.trim() && onFeedbackSubmit) {
      onFeedbackSubmit(feedbackText.trim());
      setFeedbackSubmitted(true);
      setFeedbackText("");
      setShowFeedbackForm(false);
      // Reset after 3 seconds
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    }
  };

  const toggleFeedbackForm = () => {
    setShowFeedbackForm(!showFeedbackForm);
    if (showFeedbackForm) {
      setFeedbackText("");
    }
  };

  // Function to format content within sections
  const formatSectionContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <ul className="space-y-1">
        {lines.map((line, idx) => {
          const trimmedLine = line.trim();
          
          // Remove existing bullet points and add as list items
          const cleanLine = trimmedLine.replace(/^[•\-*]\s*/, '');
          
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-1">•</span>
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Function to render structured content with visual styling
  const renderStructuredContent = (content: string) => {
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      
      if (trimmedSection.startsWith('🎯 **DIRECT ANSWER**')) {
        const sectionContent = trimmedSection.replace('🎯 **DIRECT ANSWER**\n', '');
        return (
          <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h3 className="font-bold text-blue-700 dark:text-blue-300">DIRECT ANSWER</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }
      
      if (trimmedSection.startsWith('📋 **SUMMARY**')) {
        const sectionContent = trimmedSection.replace('📋 **SUMMARY**\n', '');
        return (
          <div key={index} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="font-bold text-green-700 dark:text-green-300">SUMMARY</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }
      
      if (trimmedSection.startsWith('📜 **KEY CLAUSES & OBLIGATIONS**')) {
        const sectionContent = trimmedSection.replace('📜 **KEY CLAUSES & OBLIGATIONS**\n', '');
        return (
          <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📜</span>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-300">KEY CLAUSES & OBLIGATIONS</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }
      
      if (trimmedSection.startsWith('🚨 **RED FLAGS & RISKS**')) {
        const sectionContent = trimmedSection.replace('🚨 **RED FLAGS & RISKS**\n', '');
        return (
          <div key={index} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚨</span>
              <h3 className="font-bold text-red-700 dark:text-red-300">RED FLAGS & RISKS</h3>
            </div>
            <div className="text-red-700 dark:text-red-300 font-medium">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }

      // Simplified format sections
      if (trimmedSection.startsWith('🔑 **KEY TERMS**')) {
        const sectionContent = trimmedSection.replace('🔑 **KEY TERMS**\n', '');
        return (
          <div key={index} className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔑</span>
              <h3 className="font-bold text-purple-700 dark:text-purple-300">KEY TERMS</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }

      if (trimmedSection.startsWith('📋 **YOUR OBLIGATIONS**')) {
        const sectionContent = trimmedSection.replace('📋 **YOUR OBLIGATIONS**\n', '');
        return (
          <div key={index} className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="font-bold text-blue-700 dark:text-blue-300">YOUR OBLIGATIONS</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }

      if (trimmedSection.startsWith('🚨 **POTENTIAL RISKS & RED FLAGS**')) {
        const sectionContent = trimmedSection.replace('🚨 **POTENTIAL RISKS & RED FLAGS**\n', '');
        return (
          <div key={index} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚨</span>
              <h3 className="font-bold text-red-700 dark:text-red-300">POTENTIAL RISKS & RED FLAGS</h3>
            </div>
            <div className="text-red-700 dark:text-red-300 font-medium">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }

      if (trimmedSection.startsWith('💰 **FINANCIAL SUMMARY**')) {
        const sectionContent = trimmedSection.replace('💰 **FINANCIAL SUMMARY**\n', '');
        return (
          <div key={index} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💰</span>
              <h3 className="font-bold text-green-700 dark:text-green-300">FINANCIAL SUMMARY</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }

      if (trimmedSection.startsWith('📅 **IMPORTANT DATES**')) {
        const sectionContent = trimmedSection.replace('📅 **IMPORTANT DATES**\n', '');
        return (
          <div key={index} className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📅</span>
              <h3 className="font-bold text-orange-700 dark:text-orange-300">IMPORTANT DATES</h3>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {formatSectionContent(sectionContent)}
            </div>
          </div>
        );
      }
      
      // Default rendering for unstructured content
      if (trimmedSection) {
        return (
          <div key={index} className="whitespace-pre-line">
            {trimmedSection}
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  if (type === "user") {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="chat-bubble-user max-w-[80%] relative">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editingContent}
                onChange={(e) => onEditingContentChange?.(e.target.value)}
                className="w-full"
                placeholder="Edit your message..."
                autoFocus
              />

              {/* Editing Files Display */}
              {editingFiles && editingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Attached files ({editingFiles.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingFiles.map((fileName, index) => (
                      <div
                        key={`${fileName}-${index}`}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border/30"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span
                          className="text-sm font-medium truncate max-w-32"
                          title={fileName}
                        >
                          {fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log("ChatBubble: Removing file:", fileName);
                            onRemoveEditingFile?.(fileName);
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                          title={`Remove ${fileName}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onSaveEdit}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm space-y-4">
                {renderStructuredContent(content)}
              </div>
              {timestamp && (
                <p className="text-xs opacity-70 mt-1">
                  {new Date(timestamp).toLocaleTimeString()}
                </p>
              )}
            </>
          )}

          {/* Action buttons for user messages */}
          <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopy}
                  className="h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  {isCopied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopied ? "Copied!" : "Copy"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit message</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <Card className="chat-bubble-ai border-0 shadow-card max-w-[85%] bg-card dark:bg-gray-900/95 relative">
        {/* Evidence Button - Top Right Corner */}
        {evidence.length > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowEvidence}
                  className="h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-border/50"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View evidence sources</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* AI Response Content */}
            <div className="text-sm leading-relaxed text-foreground space-y-4">
              {renderStructuredContent(content)}
            </div>

            {/* Highlights Section */}
            {highlights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Key Highlights
                  </h4>
                </div>
                <div className="grid gap-2">
                  {highlights.map((highlight, index) => {
                    const Icon = getHighlightIcon(highlight.category);
                    const category = highlight.category || 'Unknown';
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          getHighlightColor(highlight.category)
                        )}
                        onClick={() => onHighlightClick?.(highlight)}
                      >
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Icon className="w-4 h-4" />
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 rounded-full border-current"
                          >
                            {category}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium flex-1 min-w-0 break-words">
                          {highlight.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 sm:ml-auto mt-1 sm:mt-0"
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confidence Badge */}
            {confidence && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-3 py-1 rounded-full",
                    confidence >= 90
                      ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30 dark:bg-[#00FF88]/20 dark:border-[#00FF88]/40"
                      : confidence >= 70
                      ? "bg-[#FFD700]/15 text-[#FFD700] border-[#FFD700]/30 dark:bg-[#FFD700]/20 dark:border-[#FFD700]/40"
                      : "bg-[#FF4C4C]/15 text-[#FF4C4C] border-[#FF4C4C]/30 dark:bg-[#FF4C4C]/20 dark:border-[#FF4C4C]/40"
                  )}
                >
                  {confidence}% Confidence
                </Badge>
                {confidence < 80 && (
                  <span className="text-xs text-muted-foreground">
                    Consider consulting a lawyer
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300",
                      isBookmarked &&
                        "text-yellow-600 bg-yellow-100 border border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/20 dark:border-yellow-500/30"
                    )}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isBookmarked ? "Remove bookmark" : "Bookmark"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                      isLiked && "text-primary bg-primary/10 dark:bg-primary/20"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLiked ? "Remove like" : "Like"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDislike}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                      isDisliked &&
                        "text-red-500 bg-red-500/10 dark:bg-red-500/20"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDisliked ? "Remove dislike" : "Dislike"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300",
                      isCopied &&
                        "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20"
                    )}
                  >
                    {isCopied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCopied ? "Copied!" : "Copy"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrint}
                    className="h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFeedbackForm}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all duration-200",
                      showFeedbackForm
                        ? "text-primary bg-primary/10 dark:bg-primary/20"
                        : "hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300",
                      feedbackSubmitted && "text-green-500 bg-green-500/10"
                    )}
                  >
                    {feedbackSubmitted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{feedbackSubmitted ? "Feedback sent" : "Give feedback"}</p>
                </TooltipContent>
              </Tooltip>

              {timestamp && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Feedback Form */}
            {showFeedbackForm && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Share your feedback
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us what you think about this response..."
                      className="flex-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleFeedbackSubmit();
                        }
                      }}
                    />
                    <Button
                      onClick={handleFeedbackSubmit}
                      disabled={!feedbackText.trim()}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter to submit or click the send button
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Success Message */}
            {feedbackSubmitted && (
              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Thank you for your feedback!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
