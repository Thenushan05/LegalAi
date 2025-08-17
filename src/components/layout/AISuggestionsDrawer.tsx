import {
  X,
  Scale,
  DollarSign,
  FileText,
  ArrowRight,
  Phone,
  CreditCard,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: "legal" | "payment" | "explanation" | "action" | "risk" | "clause";
  icon: React.ElementType;
  title: string;
  description: string;
  actionText: string;
  priority: "high" | "medium" | "low";
  color: string;
}

interface AISuggestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHighlight?: {
    text: string;
    type: "favorable" | "neutral" | "risky" | "payment" | "clause";
  };
}

const getSuggestionsForHighlight = (highlight?: {
  text: string;
  type: string;
}): Suggestion[] => {
  if (!highlight) return [];

  const baseSuggestions: Suggestion[] = [
    {
      id: "legal-advice",
      type: "legal",
      icon: Scale,
      title: "Legal Consultation",
      description:
        "Consider consulting a lawyer for professional advice on this clause",
      actionText: "Find Lawyers",
      priority: "high",
      color: "border-emerald-200 bg-emerald-50 dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-100",
    },
    {
      id: "explanation",
      type: "explanation",
      icon: BookOpen,
      title: "Plain Language Explanation",
      description: "Get a simplified explanation of this legal terminology",
      actionText: "Explain Terms",
      priority: "medium",
      color: "border-purple-200 bg-purple-50 dark:border-purple-800/70 dark:bg-purple-900/30 dark:text-purple-100",
    },
  ];

  // Add specific suggestions based on highlight type and content
  if (highlight.type === "risky") {
    baseSuggestions.unshift({
      id: "risk-mitigation",
      type: "risk",
      icon: AlertTriangle,
      title: "Risk Mitigation",
      description: "Explore options to reduce or negotiate this risk",
      actionText: "See Options",
      priority: "high",
      color: "border-red-200 bg-red-50 dark:border-red-800/70 dark:bg-red-900/30 dark:text-red-100",
    });
  }

  if (highlight.type === "payment") {
    baseSuggestions.unshift({
      id: "payment-analysis",
      type: "payment",
      icon: DollarSign,
      title: "Payment Analysis",
      description: "Detailed breakdown of payment terms and implications",
      actionText: "Analyze",
      priority: "high",
      color: "border-yellow-200 bg-yellow-50 dark:border-yellow-800/70 dark:bg-yellow-900/30 dark:text-yellow-100",
    });
  }

  if (highlight.type === "clause") {
    baseSuggestions.unshift({
      id: "clause-breakdown",
      type: "clause",
      icon: FileText,
      title: "Clause Breakdown",
      description: "Step-by-step explanation of this legal clause",
      actionText: "Break Down",
      priority: "medium",
      color: "border-green-200 bg-green-50 dark:border-green-800/70 dark:bg-green-900/30 dark:text-green-100",
    });
  }

  if (highlight.type === "favorable") {
    baseSuggestions.unshift({
      id: "advantage-highlight",
      type: "clause",
      icon: CheckCircle,
      title: "Advantage Highlight",
      description: "This clause works in your favor - here's why",
      actionText: "Learn More",
      priority: "low",
      color: "border-emerald-200 bg-emerald-50 dark:border-emerald-800/70 dark:bg-emerald-900/30 dark:text-emerald-100",
    });
  }

  return baseSuggestions;
};

const nextSteps = [
  {
    text: "Negotiate terms",
    icon: "🤝",
    color: "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/30 dark:hover:border-blue-800/70",
  },
  {
    text: "Request clarification",
    icon: "❓",
    color: "hover:bg-yellow-50 hover:border-yellow-200 dark:hover:bg-yellow-900/30 dark:hover:border-yellow-800/70",
  },
  {
    text: "Re-analyze document",
    icon: "🔍",
    color: "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/30 dark:hover:border-green-800/70",
  },
  {
    text: "Compare similar contracts",
    icon: "📊",
    color: "hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/30 dark:hover:border-purple-800/70",
  },
];

export function AISuggestionsDrawer({
  isOpen,
  onClose,
  selectedHighlight,
}: AISuggestionsDrawerProps) {
  if (!isOpen) return null;

  const suggestions = getSuggestionsForHighlight(selectedHighlight);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive" as const;
      case "medium":
        return "secondary" as const;
      case "low":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-black/20 sm:bg-transparent"
        onClick={onClose}
      />

      {/* Drawer - fixed and independently scrollable */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-full sm:max-w-sm bg-background/95 dark:bg-background/90 backdrop-blur-xl border-l shadow-2xl overflow-y-auto",
          "dark:border-gray-800/50 dark:shadow-xl dark:shadow-black/30",
          "animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/50 bg-background/95 dark:bg-background/90 backdrop-blur-xl">
          <div className="space-y-2">
            <h3 className="font-semibold text-xl text-foreground">
              AI Suggestions
            </h3>
            {selectedHighlight && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    selectedHighlight.type === "risky"
                      ? "bg-red-500"
                      : selectedHighlight.type === "payment"
                      ? "bg-yellow-500"
                      : selectedHighlight.type === "clause"
                      ? "bg-green-500"
                      : selectedHighlight.type === "favorable"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  )}
                />
                <p className="text-sm text-muted-foreground">
                  "{selectedHighlight.text.substring(0, 30)}..."
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 hover:bg-muted rounded-xl transition-all duration-200 hover:scale-105 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Recommendations
              </h4>
              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <Card
                      key={suggestion.id}
                      className={cn(
                        "border-2 transition-all duration-200 hover:scale-105 cursor-pointer",
                        suggestion.color
                      )}
                    >
                      <CardHeader className="pb-3 bg-white/50 dark:bg-gray-900/30 rounded-t-lg">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200",
                              suggestion.type === "risk"
                                ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
                                : suggestion.type === "payment"
                                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
                                : suggestion.type === "clause"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
                                : suggestion.type === "legal"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                                : "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                {suggestion.title}
                              </CardTitle>
                              <Badge
                                variant={getPriorityColor(suggestion.priority)}
                                className="text-xs px-2 py-1 rounded-full"
                              >
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-10 text-sm rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:border-border dark:hover:border-blue-600 transition-all duration-200"
                        >
                          {suggestion.actionText}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {nextSteps.map((step, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-2 text-sm rounded-xl border-2 transition-all duration-200 hover:scale-105",
                    step.color
                  )}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-center leading-tight font-medium">
                    {step.text}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
                  Need immediate help?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Connect with verified legal professionals
                </p>
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl h-10 transition-colors duration-200"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
