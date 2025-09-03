import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  History, 
  FileText, 
  ChevronRight,
  Calendar,
  Clock
} from "lucide-react";

interface RecentWorkItem {
  id: string;
  type: "Vårdplan" | "Veckodok" | "Månadsrapport" | "GFP";
  client: string;
  time: string;
  lastModified: Date;
}

export function RecentWorkPanel() {
  // In a real implementation, this would fetch recent work from user activity API
  // For now, using mock data
  const recentWork: RecentWorkItem[] = [
    { 
      id: "1", 
      type: "Vårdplan", 
      client: "A.B.", 
      time: "för 2 timmar sedan",
      lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    { 
      id: "2", 
      type: "Veckodok", 
      client: "C.D.", 
      time: "igår 16:45",
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    { 
      id: "3", 
      type: "Månadsrapport", 
      client: "E.F.", 
      time: "i måndags",
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Vårdplan":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "Veckodok":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "Månadsrapport":
        return <Calendar className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-ungdoms-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Vårdplan":
        return "bg-blue-50 hover:bg-blue-100";
      case "Veckodok":
        return "bg-orange-50 hover:bg-orange-100";
      case "Månadsrapport":
        return "bg-green-50 hover:bg-green-100";
      default:
        return "bg-ungdoms-50 hover:bg-ungdoms-100";
    }
  };

  const handleItemClick = (item: RecentWorkItem) => {
    // TODO: Implement navigation to specific document
    console.log(`Opening ${item.type} for ${item.client}`);
  };

  const handleViewAll = () => {
    // TODO: Implement navigation to full recent work history
    console.log("Opening full recent work history");
  };

  return (
    <Card className="shadow-sm border border-ungdoms-200 h-fit dashboard-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-ungdoms-800 text-lg">
          <History className="h-5 w-5 mr-2" />
          🕐 SENAST ARBETAT MED
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {recentWork.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200 hover:scale-[1.01] ${getTypeColor(item.type)}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/50">
                  {getTypeIcon(item.type)}
                </div>
                <div className="ml-3">
                  <div className="text-ungdoms-800 font-medium">
                    {item.client} – {item.type}
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-ungdoms-500 mr-1" />
                    <span className="text-sm text-ungdoms-600">{item.time}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ungdoms-400 group-hover:text-ungdoms-600 transition-colors" />
            </div>
          ))}
          
          <div className="pt-2 border-t border-gray-100 mt-4">
            <Button 
              variant="ghost" 
              className="w-full text-ungdoms-600 hover:text-ungdoms-800 hover:bg-ungdoms-50 justify-center"
              onClick={handleViewAll}
            >
              Visa alla →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}