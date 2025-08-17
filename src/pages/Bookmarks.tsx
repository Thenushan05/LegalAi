import { useState } from "react";
import { Search, Filter, Download, Trash2, Eye, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: string;
  title: string;
  excerpt: string;
  type: 'risk' | 'payment' | 'clause' | 'favorable';
  tags: string[];
  date: Date;
  source: string; // Document name
  fullContent: string;
}

const mockBookmarks: Bookmark[] = [
  {
    id: "1",
    title: "Early Termination Penalty",
    excerpt: "Tenant liable for 3 months' rent if lease terminated early without cause...",
    type: "risk",
    tags: ["Lease", "Penalty", "Termination"],
    date: new Date("2024-01-15"),
    source: "Apartment_Lease_Agreement.pdf",
    fullContent: "Early termination clause analysis: Tenant liable for 3 months' rent if lease terminated early without cause. This is above market standard of 2 months."
  },
  {
    id: "2",
    title: "Security Deposit Return",
    excerpt: "Landlord must return security deposit within 30 days with itemized deductions...",
    type: "favorable",
    tags: ["Lease", "Security Deposit"],
    date: new Date("2024-01-15"),
    source: "Apartment_Lease_Agreement.pdf",
    fullContent: "Security deposit clause is favorable - requires return within 30 days with itemized deductions, which is better than state minimum of 45 days."
  },
  {
    id: "3",
    title: "Payment Terms",
    excerpt: "Net 30 payment terms with 2% early payment discount available...",
    type: "payment",
    tags: ["Contract", "Payment", "Terms"],
    date: new Date("2024-01-10"),
    source: "Service_Contract.pdf",
    fullContent: "Payment terms analysis: Net 30 with 2% discount for payment within 10 days. Standard terms for this industry."
  }
];

const typeIcons = {
  risk: "⚠️",
  payment: "💰",
  clause: "📜",
  favorable: "✅"
};

const typeColors = {
  risk: "destructive",
  payment: "secondary", 
  clause: "outline",
  favorable: "default"
} as const;

export default function Bookmarks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState(mockBookmarks);

  // Get all unique tags
  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  // Filter bookmarks
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag ? bookmark.tags.includes(selectedTag) : true;
    
    return matchesSearch && matchesTag;
  });

  const handleDelete = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleView = (bookmark: Bookmark) => {
    // In a real app, this would navigate to the full view
    console.log("Viewing bookmark:", bookmark);
  };

  const handleExport = (bookmark: Bookmark) => {
    // In a real app, this would trigger PDF/print export
    console.log("Exporting bookmark:", bookmark);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <AppHeader />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bookmarks</h1>
                  <p className="text-muted-foreground">
                    Your saved highlights and AI insights
                  </p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookmarks by title, content, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={selectedTag === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(null)}
                    >
                      All
                    </Button>
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bookmarks Grid */}
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {searchQuery || selectedTag ? "No bookmarks found" : "No bookmarks yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedTag 
                    ? "Try adjusting your search or filter criteria"
                    : "Start bookmarking AI insights to save them here"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBookmarks.map((bookmark) => (
                  <Card 
                    key={bookmark.id}
                    className="group hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeIcons[bookmark.type]}</span>
                          <Badge 
                            variant={typeColors[bookmark.type]}
                            className="text-xs"
                          >
                            {bookmark.type}
                          </Badge>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(bookmark.id);
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardTitle className="text-base line-clamp-2">
                        {bookmark.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {bookmark.excerpt}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.map(tag => (
                          <Badge 
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Source and Date */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>From: {bookmark.source}</div>
                        <div>{bookmark.date.toLocaleDateString()}</div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(bookmark);
                          }}
                          className="h-8 flex-1 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(bookmark);
                          }}
                          className="h-8 flex-1 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
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
  );
}