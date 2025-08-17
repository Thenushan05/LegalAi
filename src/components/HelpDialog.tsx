import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type HelpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Help & Support</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DialogDescription className="text-left">
            Get help with using LegalAssist AI
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Getting Started</h3>
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground">Uploading Documents</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the upload button in the chat interface to add documents for analysis. 
                  Supported formats include PDF, DOCX, and TXT files.
                </p>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground">Analyzing Text</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Highlight any text in your document to see AI-powered suggestions 
                  and legal insights.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-foreground">How do I save my work?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your work is automatically saved as you go. You can access your documents 
                  anytime from the main dashboard.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-foreground">Is my data secure?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes, we use end-to-end encryption to ensure your documents and data 
                  remain private and secure.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              Need more help? Contact our support team at support@legalassist.ai
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
