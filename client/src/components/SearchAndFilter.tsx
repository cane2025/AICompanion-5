import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchAndFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  sort: { field: string; direction: "asc" | "desc" };
  onSortChange: (sort: { field: string; direction: "asc" | "desc" }) => void;
  savedSearches: Array<{
    id: string;
    name: string;
    query: string;
    filters: any;
    sort: any;
  }>;
  onSaveSearch: (name: string) => void;
  onLoadSearch: (search: any) => void;
  totalCount: number;
  filteredCount: number;
  statusOptions?: string[];
  priorityOptions?: string[];
}

export function SearchAndFilter({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  totalCount,
  filteredCount,
  statusOptions = [],
  priorityOptions = [],
}: SearchAndFilterProps) {
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [searchName, setSearchName] = React.useState("");

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      onSaveSearch(searchName.trim());
      setSearchName("");
      setShowSaveDialog(false);
    }
  };

  const clearFilters = () => {
    onQueryChange("");
    onFiltersChange({});
    onSortChange({ field: "createdAt", direction: "desc" });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Sök..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          {statusOptions.length > 0 && (
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Priority Filter */}
          {priorityOptions.length > 0 && (
            <Select
              value={filters.priority || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  priority: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                {priorityOptions.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-");
              onSortChange({ field, direction: direction as "asc" | "desc" });
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Nyast först</SelectItem>
              <SelectItem value="createdAt-asc">Äldst först</SelectItem>
              <SelectItem value="title-asc">Titel A-Ö</SelectItem>
              <SelectItem value="title-desc">Titel Ö-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Saved Searches */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Save className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                Spara sökning
              </DropdownMenuItem>
              {savedSearches.map((search) => (
                <DropdownMenuItem
                  key={search.id}
                  onClick={() => onLoadSearch(search)}
                >
                  {search.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {(query || Object.keys(filters).length > 0) && (
            <Button variant="outline" onClick={clearFilters}>
              Rensa
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Visar {filteredCount} av {totalCount} resultat
          {(query || Object.keys(filters).length > 0) && (
            <span className="ml-2">(filtrerat)</span>
          )}
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Spara sökning</h3>
            <Input
              placeholder="Namn på sökning"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                Spara
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
