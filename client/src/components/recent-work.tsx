import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MoreVertical,
  ChevronRight,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface RecentWorkItem {
  id: string;
  clientInitials: string;
  type: "care-plan" | "weekly-doc" | "monthly-report";
  typeName: string;
  lastModified: Date;
  status: "draft" | "completed" | "in-review";
}

export function RecentWork() {

  // Fetch recent work items
  const { data: recentItems = [], isLoading } = useQuery<RecentWorkItem[]>({
    queryKey: ["/api/dashboard/recent-work"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the backend
      // For now, we'll return mock data
      const now = new Date();
      return [
        {
          id: "1",
          clientInitials: "A.B.",
          type: "care-plan",
          typeName: "Vårdplan",
          lastModified: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: "draft",
        },
        {
          id: "2",
          clientInitials: "C.D.",
          type: "weekly-doc",
          typeName: "Veckodok",
          lastModified: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
          status: "completed",
        },
        {
          id: "3",
          clientInitials: "E.F.",
          type: "monthly-report",
          typeName: "Månadsrapport",
          lastModified: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          status: "in-review",
        },
      ];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "care-plan":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "weekly-doc":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "monthly-report":
        return <BarChart3 className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
            Utkast
          </span>
        );
      case "completed":
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
            Slutförd
          </span>
        );
      case "in-review":
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            Granskas
          </span>
        );
      default:
        return null;
    }
  };

  const handleItemClick = (item: RecentWorkItem) => {
    // In the real implementation, this would open the appropriate dialog or change view
    console.log("Opening item:", item);
    // TODO: Implement dialog opening logic based on item type
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-purple-600" />
            SENAST ARBETAT MED
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-purple-600" />
          SENAST ARBETAT MED
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Inga senaste arbeten att visa
            </p>
          ) : (
            <>
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-150 group"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getIcon(item.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.clientInitials}</span>
                        <span className="text-gray-600">– {item.typeName}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(item.lastModified, {
                          addSuffix: true,
                          locale: sv,
                        })}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleItemClick(item)}>
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicera</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Arkivera</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Radera
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto w-full justify-start"
                onClick={() => console.log("Show all recent work")}
              >
                Visa alla <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}