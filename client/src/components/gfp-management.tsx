import React, { useState } from 'react';
import { GfpForm } from './gfp-form';
import { GfpList } from './gfp-list';
import { deleteGfpPlan } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GfpManagementProps {
  clientId: string;
  staffId: string;
  clientInitials?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export function GfpManagement({ clientId, staffId, clientInitials }: GfpManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (planId: string) => deleteGfpPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gfp-plans', clientId] });
      toast({
        title: "Genomförandeplan borttagen",
        description: "Planen har tagits bort framgångsrikt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort genomförandeplan.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    setEditingPlanId(null);
    setViewMode('create');
  };

  const handleEdit = (planId: string) => {
    setEditingPlanId(planId);
    setViewMode('edit');
  };

  const handleDelete = (planId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna genomförandeplan?')) {
      deleteMutation.mutate(planId);
    }
  };

  const handleSaved = () => {
    setViewMode('list');
    setEditingPlanId(null);
  };

  const handleDeleted = () => {
    setViewMode('list');
    setEditingPlanId(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingPlanId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Genomförandeplaner (GFP)
            {clientInitials && (
              <span className="text-gray-500 ml-2">- {clientInitials}</span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Hantera genomförandeplaner för klienten
          </p>
        </div>
        {viewMode !== 'list' && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till listan
          </Button>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <GfpList
          clientId={clientId}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <GfpForm
          clientId={clientId}
          staffId={staffId}
          planId={editingPlanId || undefined}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}