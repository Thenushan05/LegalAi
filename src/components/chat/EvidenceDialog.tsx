import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, MapPin } from "lucide-react";

interface Evidence {
  text: string;
  page_number?: number;
  section?: string;
  confidence?: number;
  score?: number;
}

interface EvidenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence[];
  title?: string;
}

export const EvidenceDialog = ({ isOpen, onClose, evidence, title = "Evidence Sources" }: EvidenceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {evidence.length} source{evidence.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {evidence.map((item, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Source {index + 1}
                    </Badge>
                    {item.page_number && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                        <MapPin className="h-3 w-3" />
                        Page {item.page_number}
                      </Badge>
                    )}
                    {item.section && (
                      <Badge variant="secondary" className="text-xs">
                        {item.section}
                      </Badge>
                    )}
                  </div>
                  {item.score && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        item.score >= 0.8
                          ? "border-green-500 text-green-700 dark:text-green-400"
                          : item.score >= 0.6
                          ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                          : "border-red-500 text-red-700 dark:text-red-400"
                      }`}
                    >
                      Score: {item.score.toFixed(3)}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm leading-relaxed text-foreground bg-muted/30 rounded p-3 border-l-4 border-primary/30">
                  <p className="whitespace-pre-wrap">{item.text}</p>
                </div>
              </div>
            ))}
            
            {evidence.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No evidence sources available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
