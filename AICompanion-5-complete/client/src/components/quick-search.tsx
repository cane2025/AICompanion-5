import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Users, FileText, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOptimizedSearch, usePerformanceMonitor } from "@/hooks/use-debounce";
import type { Staff, Client, CarePlan, ImplementationPlan } from "@shared/schema";

interface QuickSearchProps {
  onSelectStaff?: (staff: Staff) => void;
  onSelectClient?: (client: Client, staff: Staff) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  type: 'staff' | 'client' | 'care-plan' | 'implementation-plan';
  id: string;
  title: string;
  subtitle: string;
  staff?: Staff;
  client?: Client;
  carePlan?: CarePlan;
  implementationPlan?: ImplementationPlan;
  matchedField?: string;
}

export function QuickSearch({ 
  onSelectStaff, 
  onSelectClient, 
  placeholder = "Sök personal, klienter eller ärenden...",
  className = ""
}: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Performance monitoring
  usePerformanceMonitor('QuickSearch render', [query]);

  // Fetch all data
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/all"],
  });

  const { data: carePlans = [] } = useQuery<CarePlan[]>({
    queryKey: ["/api/care-plans/all"],
  });

  const { data: implementationPlans = [] } = useQuery<ImplementationPlan[]>({
    queryKey: ["/api/implementation-plans/all"],
  });

  // Memoized searchable items for better performance
  const searchableItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'staff' | 'client' | 'care-plan' | 'implementation-plan';
      searchText: string;
      title: string;
      subtitle: string;
      staff?: Staff;
      client?: Client;
      carePlan?: CarePlan;
      implementationPlan?: ImplementationPlan;
      matchedField?: string;
    }> = [];

    // Add staff items
    staff.forEach(staffMember => {
      const searchText = [
        staffMember.name,
        staffMember.initials,
        staffMember.personnummer,
        staffMember.telefon,
        staffMember.epost,
        staffMember.roll,
        staffMember.avdelning
      ].filter(Boolean).join(' ').toLowerCase();

      items.push({
        id: staffMember.id,
        type: 'staff',
        searchText,
        title: staffMember.name || 'Okänd personal',
        subtitle: `${staffMember.initials || 'N/A'} • ${staffMember.roll || 'Personal'}`,
        staff: staffMember
      });
    });

    // Add client items  
    clients.forEach(client => {
      const staffMember = staff.find(s => s.id === client.staffId);
      if (!staffMember) return;

      const searchText = [
        client.initials,
        client.personalNumber,
        client.notes
      ].filter(Boolean).join(' ').toLowerCase();

      items.push({
        id: client.id,
        type: 'client',
        searchText,
        title: `Klient: ${client.initials}`,
        subtitle: `Ansvarig: ${staffMember.name || 'Okänd personal'}`,
        client,
        staff: staffMember
      });
    });

    // Add care plan items
    carePlans.forEach(carePlan => {
      const client = clients.find(c => c.id === carePlan.clientId);
      const staffMember = staff.find(s => s.id === carePlan.staffId);
      if (!client || !staffMember) return;

      const searchText = [
        carePlan.planContent,
        carePlan.goals,
        carePlan.interventions,
        carePlan.comment
      ].filter(Boolean).join(' ').toLowerCase();

      items.push({
        id: carePlan.id,
        type: 'care-plan',
        searchText,
        title: `Vårdplan: ${client.initials}`,
        subtitle: `${staffMember.name} • Status: ${getStatusText(carePlan.status || 'unknown')}`,
        client,
        staff: staffMember,
        carePlan
      });
    });

    // Add implementation plan items
    implementationPlans.forEach(implPlan => {
      const client = clients.find(c => c.id === implPlan.clientId);
      const staffMember = staff.find(s => s.id === implPlan.staffId);
      if (!client || !staffMember) return;

      const searchText = [
        implPlan.planContent,
        implPlan.goals,
        implPlan.activities,
        implPlan.comments
      ].filter(Boolean).join(' ').toLowerCase();

      const isOverdue = implPlan.status === 'completed' ? false : new Date() > new Date(implPlan.createdAt || new Date());
      
      items.push({
        id: implPlan.id,
        type: 'implementation-plan',
        searchText,
        title: `GFP: ${client.initials}`,
        subtitle: `${staffMember.name} • ${isOverdue ? 'Försenad' : 'Pågående'}`,
        client,
        staff: staffMember,
        implementationPlan: implPlan
      });
    });

    return items;
  }, [staff, clients, carePlans, implementationPlans]);

  // Optimized search with debounce
  const searchResults = useOptimizedSearch(
    searchableItems,
    query,
    ['searchText'] as any,
    300 // 300ms debounce for better UX
  ).slice(0, 8); // Limit to 8 results

  // Helper function for status text
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'received': 'Mottagen',
      'entered_journal': 'I journal',
      'staff_notified': 'Personal notifierad',
      'gfp_pending': 'Väntar GFP',
      'completed': 'Slutförd'
    };
    return statusMap[status] || status;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'staff' && result.staff && onSelectStaff) {
      onSelectStaff(result.staff);
    } else if (result.type === 'client' && result.client && result.staff && onSelectClient) {
      onSelectClient(result.client, result.staff);
    } else if ((result.type === 'care-plan' || result.type === 'implementation-plan') && result.client && result.staff && onSelectClient) {
      onSelectClient(result.client, result.staff);
    }
    
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'staff': return <User className="h-4 w-4" />;
      case 'client': return <Users className="h-4 w-4" />;
      case 'care-plan': return <FileText className="h-4 w-4" />;
      case 'implementation-plan': return <Clock className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getResultTypeText = (type: string) => {
    switch (type) {
      case 'staff': return 'Personal';
      case 'client': return 'Klient';
      case 'care-plan': return 'Vårdplan';
      case 'implementation-plan': return 'GFP';
      default: return '';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && query.trim().length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg border border-gray-200">
          <CardContent className="p-0">
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                      index === selectedIndex
                        ? 'bg-ungdoms-50 border-ungdoms-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-ungdoms-600">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {getResultTypeText(result.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                          {result.matchedField && (
                            <span className="ml-2 text-ungdoms-600">
                              (matchning: {result.matchedField})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Inga resultat hittades för "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {query.trim().length > 0 && query.trim().length < 2 && isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-500">
              Skriv minst 2 tecken för att söka...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}