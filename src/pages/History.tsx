import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Calendar, Clock, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface ChatHistoryItem {
  id: string;
  file_hash: string;
  question: string;
  answer: string;
  confidence: number;
  timestamp: string;
}

export default function History() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatHistoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const loadChatHistory = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your chat history.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.getChatHistory(undefined, 100);
      if (response.history) {
        setChatHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    loadChatHistory();
  }, [isAuthenticated, loadChatHistory]);

  const formatAnswer = (answer: string): string => {
    // Remove markdown headers and format for display
    return answer
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .substring(0, 200) + (answer.length > 200 ? '...' : '');
  };

  const formatFullAnswer = (answer: string): string => {
    // Format full answer for chat display - preserve some markdown
    return answer
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const handleViewFullAnswer = (item: ChatHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChat(item);
    setIsDialogOpen(true);
  };

  const handleViewChat = (item: ChatHistoryItem) => {
    console.log("Viewing chat:", item.id);
    // Could navigate to chat with this conversation loaded
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <AppHeader />
          
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Chat History</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your previously analyzed documents
                </p>
              </div>

              {!isAuthenticated ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                    <p className="text-muted-foreground">Please log in to view your chat history.</p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <p className="text-muted-foreground">Loading chat history...</p>
                  </CardContent>
                </Card>
              ) : chatHistory.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-2">No Chat History</h3>
                    <p className="text-muted-foreground">Start a conversation to see your chat history here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {chatHistory.map((item) => (
                    <Card 
                      key={item.id} 
                      className="hover:shadow-card transition-all duration-200 cursor-pointer"
                      onClick={() => handleViewChat(item)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{item.question}</CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          
                          <Badge 
                            variant="secondary"
                            className={
                              item.confidence >= 0.9 ? "bg-success/10 text-success" :
                              item.confidence >= 0.7 ? "bg-warning/10 text-warning" :
                              "bg-destructive/10 text-destructive"
                            }
                          >
                            {Math.round(item.confidence * 100)}% Confidence
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {formatAnswer(item.answer)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              File: {item.file_hash.substring(0, 8)}...
                            </Badge>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleViewFullAnswer(item, e)}
                          >
                            View Full Answer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Answer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              Chat Conversation
            </DialogTitle>
          </DialogHeader>
          
          {selectedChat && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                  <p className="text-sm font-medium mb-1">You</p>
                  <p>{selectedChat.question}</p>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium">Legal AI Assistant</p>
                    <Badge 
                      variant="secondary"
                      className={
                        selectedChat.confidence >= 0.9 ? "bg-success/10 text-success" :
                        selectedChat.confidence >= 0.7 ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }
                    >
                      {Math.round(selectedChat.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatFullAnswer(selectedChat.answer) }}
                  />
                </div>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedChat.timestamp).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(selectedChat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  File: {selectedChat.file_hash.substring(0, 8)}...
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}