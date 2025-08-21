import { useState } from "react";
import { Search, Download, Menu, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounce";

interface HeaderProps {
  onSidebarToggle: () => void;
  onExport: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Header({ onSidebarToggle, onExport, searchTerm, onSearchChange }: HeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Debounced search for better performance
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange(value);
  }, 250, [onSearchChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={onSidebarToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-blue-600 mr-3" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Uppföljning – Öppenvård</h1>
                <p className="text-sm text-gray-500">Vårdadministrativt system</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Sök personal eller data..."
                defaultValue={searchTerm}
                onChange={handleSearchChange}
                className="w-80 pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Export Button */}
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isExporting ? 'Exporterar...' : 'Exportera'}</span>
            </Button>
            
            {/* User Menu */}
            <Button variant="ghost" size="sm">
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
