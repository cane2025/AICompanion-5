import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Download, FileText, Users, Calendar, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  getStaffEnhanced, 
  getClientsEnhanced, 
  getCarePlansEnhanced,
  getMonthlyReportsEnhanced,
  getWeeklyDocumentationEnhanced,
  downloadMonthlyReportPDF,
  downloadWeeklyDocumentationPDF,
  downloadCarePlanPDF,
  downloadFile
} from '../lib/api-enhanced';

interface SearchFilters {
  type: 'all' | 'clients' | 'staff' | 'care-plans' | 'monthly-reports' | 'weekly-docs';
  status?: string;
  staffId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function EnhancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data based on current filters
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-search', searchQuery, filters],
    queryFn: () => getStaffEnhanced({
      search: searchQuery || undefined,
      sort: filters.sortBy,
      order: filters.sortOrder
    }),
    enabled: filters.type === 'all' || filters.type === 'staff'
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-search', searchQuery, filters],
    queryFn: () => getClientsEnhanced({
      search: searchQuery || undefined,
      staffId: filters.staffId,
      status: filters.status,
      sort: filters.sortBy,
      order: filters.sortOrder
    }),
    enabled: filters.type === 'all' || filters.type === 'clients'
  });

  const { data: carePlansData, isLoading: carePlansLoading } = useQuery({
    queryKey: ['care-plans-search', searchQuery, filters],
    queryFn: () => getCarePlansEnhanced({
      search: searchQuery || undefined,
      staffId: filters.staffId,
      status: filters.status
    }),
    enabled: filters.type === 'all' || filters.type === 'care-plans'
  });

  const { data: monthlyReportsData, isLoading: monthlyReportsLoading } = useQuery({
    queryKey: ['monthly-reports-search', searchQuery, filters],
    queryFn: () => getMonthlyReportsEnhanced({
      search: searchQuery || undefined,
      staffId: filters.staffId,
      status: filters.status
    }),
    enabled: filters.type === 'all' || filters.type === 'monthly-reports'
  });

  const { data: weeklyDocsData, isLoading: weeklyDocsLoading } = useQuery({
    queryKey: ['weekly-docs-search', searchQuery, filters],
    queryFn: () => getWeeklyDocumentationEnhanced({
      search: searchQuery || undefined,
      staffId: filters.staffId
    }),
    enabled: filters.type === 'all' || filters.type === 'weekly-docs'
  });

  const isLoading = staffLoading || clientsLoading || carePlansLoading || monthlyReportsLoading || weeklyDocsLoading;

  // Combine and format search results
  const searchResults = useMemo(() => {
    const results: any[] = [];

    if (filters.type === 'all' || filters.type === 'staff') {
      staffData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'staff',
          title: item.name,
          subtitle: item.initials,
          description: `${item.epost || 'Ingen e-post'} • ${item.roll || 'Ingen roll'}`,
          status: item.deletedAt ? 'deleted' : 'active',
          createdAt: item.createdAt,
          data: item
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'clients') {
      clientsData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'clients',
          title: item.initials,
          subtitle: item.personalNumber || 'Inget personnummer',
          description: item.notes || 'Inga anteckningar',
          status: item.status,
          createdAt: item.createdAt,
          data: item
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'care-plans') {
      carePlansData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'care-plans',
          title: 'Vårdplan',
          subtitle: `Klient: ${item.clientId}`,
          description: item.planContent?.substring(0, 100) + '...' || 'Ingen beskrivning',
          status: item.status,
          createdAt: item.createdAt,
          data: item
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'monthly-reports') {
      monthlyReportsData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'monthly-reports',
          title: 'Månadsrapport',
          subtitle: `${item.month}/${item.year}`,
          description: item.reportContent?.substring(0, 100) + '...' || 'Ingen innehåll',
          status: item.status,
          createdAt: item.createdAt,
          data: item
        });
      });
    }

    if (filters.type === 'all' || filters.type === 'weekly-docs') {
      weeklyDocsData?.forEach(item => {
        results.push({
          id: item.id,
          type: 'weekly-docs',
          title: 'Veckodokumentation',
          subtitle: `Vecka ${item.week}, ${item.year}`,
          description: item.documentation?.substring(0, 100) + '...' || 'Ingen dokumentation',
          status: item.approved ? 'approved' : 'pending',
          createdAt: item.createdAt,
          data: item
        });
      });
    }

    return results.sort((a, b) => {
      const aValue = a[filters.sortBy] || a.createdAt;
      const bValue = b[filters.sortBy] || b.createdAt;
      
      if (filters.sortOrder === 'desc') {
        return new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      return new Date(aValue).getTime() - new Date(bValue).getTime();
    });
  }, [staffData, clientsData, carePlansData, monthlyReportsData, weeklyDocsData, filters]);

  const handleDownloadPDF = async (item: any) => {
    try {
      let blob: Blob;
      let filename: string;

      switch (item.type) {
        case 'monthly-reports':
          blob = await downloadMonthlyReportPDF(item.id);
          filename = `månadsrapport-${item.data.clientId}-${item.data.year}-${item.data.month}.pdf`;
          break;
        case 'weekly-docs':
          blob = await downloadWeeklyDocumentationPDF(item.id);
          filename = `veckodokumentation-${item.data.clientId}-${item.data.year}-v${item.data.week}.pdf`;
          break;
        case 'care-plans':
          blob = await downloadCarePlanPDF(item.id);
          filename = `vårdplan-${item.data.clientId}.pdf`;
          break;
        default:
          throw new Error('PDF-generering stöds inte för denna typ');
      }

      downloadFile(blob, filename);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Fel vid PDF-nedladdning: ' + error.message);
    }
  };

  const getStatusBadgeVariant = (status: string, type: string) => {
    if (type === 'staff' || type === 'clients') {
      return status === 'active' ? 'default' : 'secondary';
    }
    
    switch (status) {
      case 'completed':
      case 'approved':
        return 'default';
      case 'in_progress':
      case 'pending':
        return 'secondary';
      case 'overdue':
      case 'deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'staff':
        return <Users className="h-4 w-4" />;
      case 'clients':
        return <Users className="h-4 w-4" />;
      case 'care-plans':
        return <FileText className="h-4 w-4" />;
      case 'monthly-reports':
        return <BarChart3 className="h-4 w-4" />;
      case 'weekly-docs':
        return <Calendar className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'staff':
        return 'Personal';
      case 'clients':
        return 'Klienter';
      case 'care-plans':
        return 'Vårdplaner';
      case 'monthly-reports':
        return 'Månadsrapporter';
      case 'weekly-docs':
        return 'Veckodokumentation';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök i alla data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Typ</label>
                  <Select value={filters.type} onValueChange={(value: any) => setFilters({...filters, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla</SelectItem>
                      <SelectItem value="clients">Klienter</SelectItem>
                      <SelectItem value="staff">Personal</SelectItem>
                      <SelectItem value="care-plans">Vårdplaner</SelectItem>
                      <SelectItem value="monthly-reports">Månadsrapporter</SelectItem>
                      <SelectItem value="weekly-docs">Veckodokumentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value || undefined})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alla statusar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alla statusar</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                      <SelectItem value="pending">Väntande</SelectItem>
                      <SelectItem value="completed">Slutförd</SelectItem>
                      <SelectItem value="in_progress">Pågående</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sortera efter</label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Skapad</SelectItem>
                      <SelectItem value="updatedAt">Uppdaterad</SelectItem>
                      <SelectItem value="name">Namn</SelectItem>
                      <SelectItem value="initials">Initialer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordning</label>
                  <Select value={filters.sortOrder} onValueChange={(value: any) => setFilters({...filters, sortOrder: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Fallande</SelectItem>
                      <SelectItem value="asc">Stigande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? 'Söker...' : `${searchResults.length} resultat hittades`}
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedItems.length} valda
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedItems([])}
            >
              <X className="h-4 w-4 mr-1" />
              Rensa
            </Button>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Laddar...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Inga resultat hittades</h3>
              <p className="text-muted-foreground">
                Prova att ändra dina söktermer eller filter
              </p>
            </CardContent>
          </Card>
        ) : (
          searchResults.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                        className="rounded"
                      />
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium truncate">{item.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(item.type)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(item.status, item.type)}>
                          {item.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">{item.subtitle}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Skapad: {new Date(item.createdAt).toLocaleDateString('sv-SE')}</span>
                        {item.data.updatedAt && (
                          <span>Uppdaterad: {new Date(item.data.updatedAt).toLocaleDateString('sv-SE')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(['monthly-reports', 'weekly-docs', 'care-plans'].includes(item.type)) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(item)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Bulk-operationer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Implement bulk PDF download
                  console.log('Bulk PDF download for:', selectedItems);
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Ladda ner PDF
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Implement bulk export
                  console.log('Bulk export for:', selectedItems);
                }}
              >
                <FileText className="h-4 w-4 mr-1" />
                Exportera
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedSearch;
