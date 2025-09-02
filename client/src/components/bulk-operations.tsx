import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Mail,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  getStaffEnhanced,
  getClientsEnhanced,
  getMonthlyReportsEnhanced,
  bulkDeleteClients,
  bulkUpdateClients,
  bulkDeleteStaff,
  bulkUpdateStaff,
  exportData,
  importData,
  downloadFile,
  readFileAsJSON,
  downloadBulkReportsPDF
} from '../lib/api-enhanced';

interface BulkOperation {
  type: 'update' | 'delete' | 'export' | 'notify';
  target: 'clients' | 'staff' | 'reports';
  items: string[];
  data?: any;
}

export function BulkOperations() {
  const [selectedTab, setSelectedTab] = useState('clients');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkUpdateData, setBulkUpdateData] = useState<any>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch data for different tabs
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-bulk'],
    queryFn: () => getStaffEnhanced(),
    enabled: selectedTab === 'staff'
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-bulk'],
    queryFn: () => getClientsEnhanced(),
    enabled: selectedTab === 'clients'
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports-bulk'],
    queryFn: () => getMonthlyReportsEnhanced(),
    enabled: selectedTab === 'reports'
  });

  // Bulk operations mutations
  const bulkDeleteClientsMutation = useMutation({
    mutationFn: bulkDeleteClients,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-bulk'] });
      setSelectedItems([]);
      alert('Klienter borttagna framgångsrikt');
    },
    onError: (error) => {
      console.error('Bulk delete clients error:', error);
      alert('Fel vid borttagning av klienter');
    }
  });

  const bulkUpdateClientsMutation = useMutation({
    mutationFn: ({ clientIds, updates }: { clientIds: string[], updates: any }) => 
      bulkUpdateClients(clientIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-bulk'] });
      setSelectedItems([]);
      setShowBulkDialog(false);
      alert('Klienter uppdaterade framgångsrikt');
    },
    onError: (error) => {
      console.error('Bulk update clients error:', error);
      alert('Fel vid uppdatering av klienter');
    }
  });

  const bulkDeleteStaffMutation = useMutation({
    mutationFn: bulkDeleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-bulk'] });
      setSelectedItems([]);
      alert('Personal borttagen framgångsrikt');
    },
    onError: (error) => {
      console.error('Bulk delete staff error:', error);
      alert('Fel vid borttagning av personal');
    }
  });

  const bulkUpdateStaffMutation = useMutation({
    mutationFn: ({ staffIds, updates }: { staffIds: string[], updates: any }) => 
      bulkUpdateStaff(staffIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-bulk'] });
      setSelectedItems([]);
      setShowBulkDialog(false);
      alert('Personal uppdaterad framgångsrikt');
    },
    onError: (error) => {
      console.error('Bulk update staff error:', error);
      alert('Fel vid uppdatering av personal');
    }
  });

  const importDataMutation = useMutation({
    mutationFn: ({ data, type, overwrite }: { data: any, type: string, overwrite: boolean }) =>
      importData(data, type, overwrite),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      alert(`Import slutförd: ${result.message}`);
      setImportFile(null);
    },
    onError: (error) => {
      console.error('Import error:', error);
      alert('Fel vid import av data');
    }
  });

  const getCurrentData = () => {
    switch (selectedTab) {
      case 'staff':
        return staffData || [];
      case 'clients':
        return clientsData || [];
      case 'reports':
        return reportsData || [];
      default:
        return [];
    }
  };

  const isLoading = staffLoading || clientsLoading || reportsLoading;

  const handleSelectAll = () => {
    const currentData = getCurrentData();
    if (selectedItems.length === currentData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentData.map((item: any) => item.id));
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.length === 0) {
      alert('Inga objekt valda');
      return;
    }

    try {
      switch (bulkAction) {
        case 'delete':
          if (selectedTab === 'clients') {
            await bulkDeleteClientsMutation.mutateAsync(selectedItems);
          } else if (selectedTab === 'staff') {
            await bulkDeleteStaffMutation.mutateAsync(selectedItems);
          }
          break;

        case 'update':
          setShowBulkDialog(true);
          break;

        case 'export-json':
          const jsonBlob = await exportData(selectedTab, 'json');
          downloadFile(jsonBlob, `${selectedTab}-export-${new Date().toISOString().split('T')[0]}.json`);
          break;

        case 'export-csv':
          const csvBlob = await exportData(selectedTab, 'csv');
          downloadFile(csvBlob, `${selectedTab}-export-${new Date().toISOString().split('T')[0]}.csv`);
          break;

        case 'export-pdf':
          if (selectedTab === 'reports') {
            const pdfBlob = await downloadBulkReportsPDF(selectedItems, 'monthly');
            downloadFile(pdfBlob, `bulk-reports-${new Date().toISOString().split('T')[0]}.pdf`);
          }
          break;

        default:
          alert('Välj en åtgärd');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('Fel vid bulk-operation');
    }
  };

  const handleBulkUpdate = async () => {
    try {
      if (selectedTab === 'clients') {
        await bulkUpdateClientsMutation.mutateAsync({
          clientIds: selectedItems,
          updates: bulkUpdateData
        });
      } else if (selectedTab === 'staff') {
        await bulkUpdateStaffMutation.mutateAsync({
          staffIds: selectedItems,
          updates: bulkUpdateData
        });
      }
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Välj en fil att importera');
      return;
    }

    try {
      const jsonData = await readFileAsJSON(importFile);
      await importDataMutation.mutateAsync({
        data: jsonData,
        type: selectedTab,
        overwrite: false
      });
    } catch (error) {
      console.error('Import error:', error);
      alert('Fel vid import: ' + error.message);
    }
  };

  const renderDataTable = (data: any[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Ingen data att visa</p>
        </div>
      );
    }

    const columns = Object.keys(data[0]).filter(key => 
      !['id', 'passwordHash', 'deletedAt'].includes(key)
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">
                <Checkbox
                  checked={selectedItems.length === data.length}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              {columns.map(column => (
                <th key={column} className="text-left p-2 capitalize">
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-2">
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                  />
                </td>
                {columns.map(column => (
                  <td key={column} className="p-2 text-sm">
                    {typeof item[column] === 'boolean' ? (
                      <Badge variant={item[column] ? 'default' : 'secondary'}>
                        {item[column] ? 'Ja' : 'Nej'}
                      </Badge>
                    ) : item[column] instanceof Date ? (
                      format(item[column], 'dd/MM/yyyy')
                    ) : (
                      String(item[column] || '').substring(0, 50) + (String(item[column] || '').length > 50 ? '...' : '')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk-operationer</h1>
          <p className="text-muted-foreground">
            Hantera flera objekt samtidigt
          </p>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="text-sm">
                  {selectedItems.length} objekt valda
                </Badge>
                
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Välj åtgärd" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Uppdatera</SelectItem>
                    <SelectItem value="delete">Ta bort</SelectItem>
                    <SelectItem value="export-json">Exportera JSON</SelectItem>
                    <SelectItem value="export-csv">Exportera CSV</SelectItem>
                    {selectedTab === 'reports' && (
                      <SelectItem value="export-pdf">Exportera PDF</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItems([])}
                >
                  Rensa val
                </Button>
                
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  variant={bulkAction === 'delete' ? 'destructive' : 'default'}
                >
                  {bulkAction === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                  {bulkAction === 'update' && <Edit className="h-4 w-4 mr-2" />}
                  {bulkAction?.startsWith('export') && <Download className="h-4 w-4 mr-2" />}
                  Utför
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import/Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import/Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Import */}
            <div className="space-y-4">
              <h3 className="font-medium">Importera data</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="import-file">Välj fil (JSON)</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importDataMutation.isPending}
                  className="w-full"
                >
                  {importDataMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importera {selectedTab}
                </Button>
              </div>
            </div>

            {/* Export */}
            <div className="space-y-4">
              <h3 className="font-medium">Exportera data</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportData(selectedTab, 'json').then(blob => 
                    downloadFile(blob, `${selectedTab}-export-${new Date().toISOString().split('T')[0]}.json`)
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => exportData(selectedTab, 'csv').then(blob => 
                    downloadFile(blob, `${selectedTab}-export-${new Date().toISOString().split('T')[0]}.csv`)
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-2" />
            Klienter
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Rapporter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Klienter ({clientsData?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Laddar...</p>
                </div>
              ) : (
                renderDataTable(clientsData || [])
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Personal ({staffData?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Laddar...</p>
                </div>
              ) : (
                renderDataTable(staffData || [])
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapporter ({reportsData?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Laddar...</p>
                </div>
              ) : (
                renderDataTable(reportsData || [])
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk-uppdatering</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Uppdatera {selectedItems.length} {selectedTab}
            </p>
            
            {selectedTab === 'clients' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bulk-status">Status</Label>
                  <Select 
                    value={bulkUpdateData.status || ''} 
                    onValueChange={(value) => setBulkUpdateData({...bulkUpdateData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen ändring</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bulk-notes">Anteckningar</Label>
                  <Textarea
                    id="bulk-notes"
                    value={bulkUpdateData.notes || ''}
                    onChange={(e) => setBulkUpdateData({...bulkUpdateData, notes: e.target.value})}
                    placeholder="Lägg till anteckningar..."
                  />
                </div>
              </div>
            )}
            
            {selectedTab === 'staff' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bulk-role">Roll</Label>
                  <Input
                    id="bulk-role"
                    value={bulkUpdateData.roll || ''}
                    onChange={(e) => setBulkUpdateData({...bulkUpdateData, roll: e.target.value})}
                    placeholder="Ny roll..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="bulk-department">Avdelning</Label>
                  <Input
                    id="bulk-department"
                    value={bulkUpdateData.avdelning || ''}
                    onChange={(e) => setBulkUpdateData({...bulkUpdateData, avdelning: e.target.value})}
                    placeholder="Ny avdelning..."
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleBulkUpdate}>
                Uppdatera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{clientsData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Totalt klienter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{staffData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total personal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{reportsData?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Totalt rapporter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BulkOperations;