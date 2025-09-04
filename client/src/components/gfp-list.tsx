import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGfpPlans, type GfpPlan } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Lock, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface GfpListProps {
  clientId: string;
  onCreateNew?: () => void;
  onEdit?: (planId: string) => void;
  onDelete?: (planId: string) => void;
}

export function GfpList({ clientId, onCreateNew, onEdit, onDelete }: GfpListProps) {
  const [retryCount, setRetryCount] = useState(0);

  const {
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['gfp-plans', clientId],
    queryFn: () => getGfpPlans(clientId),
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.message?.includes('400') || 
          error?.message?.includes('401') || 
          error?.message?.includes('403') || 
          error?.message?.includes('404')) {
        return false;
      }
      
      // Retry up to 3 times for other errors (5xx, network issues)
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 200ms, 500ms, 1s
      return Math.min(1000, 200 * Math.pow(2, attemptIndex));
    },
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  const getStatusBadge = (plan: GfpPlan) => {
    if (plan.locked) {
      return (
        <Badge variant="destructive">
          <Lock className="h-3 w-3 mr-1" />
          Låst
        </Badge>
      );
    }

    // You could add more status logic here based on plan data
    return (
      <Badge variant="secondary">
        <CheckCircle className="h-3 w-3 mr-1" />
        Aktiv
      </Badge>
    );
  };

  const isServerOverloaded = (error: any) => {
    // Only show "överbelastad" if server actually reports 429 or 503
    return error?.message?.includes('429') || 
           error?.message?.includes('503') ||
           error?.message?.includes('Too Many Requests') ||
           error?.message?.includes('Service Unavailable');
  };

  const isNetworkError = (error: any) => {
    return error?.message?.includes('Failed to fetch') ||
           error?.message?.includes('NetworkError') ||
           !navigator.onLine;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Laddar genomförandeplaner...
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Fel vid laddning av genomförandeplaner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isServerOverloaded(error) && (
                <>
                  <strong>Servern är överbelastad</strong><br />
                  Systemet har för många samtidiga förfrågningar. Vänta en stund och försök igen.
                </>
              )}
              {isNetworkError(error) && (
                <>
                  <strong>Nätverksfel</strong><br />
                  <WifiOff className="inline h-4 w-4 mr-1" />
                  Kontrollera din internetanslutning och försök igen.
                </>
              )}
              {!isServerOverloaded(error) && !isNetworkError(error) && (
                <>
                  <strong>Kunde inte ladda genomförandeplaner</strong><br />
                  {error?.message || 'Ett okänt fel uppstod'}
                </>
              )}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={handleRetry} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Försöker igen...' : 'Försök igen'}
            </Button>
            {onCreateNew && (
              <Button variant="outline" onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa ny plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Genomförandeplaner (GFP)</h2>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Skapa ny plan
          </Button>
        )}
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga genomförandeplaner
            </h3>
            <p className="text-gray-500 mb-4">
              Det finns inga genomförandeplaner för denna klient ännu.
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa första planen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.locked ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(plan)}
                      <Badge variant="outline">
                        Version {plan.version}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Uppdaterad {formatDistanceToNow(new Date(plan.updatedAt), { 
                          addSuffix: true, 
                          locale: sv 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(plan.id)}
                        disabled={plan.locked}
                      >
                        <Edit className="h-4 w-4" />
                        Redigera
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Ta bort
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Mål ({plan.goals.length})</h4>
                  <ul className="space-y-1">
                    {plan.goals.map((goal, index) => (
                      <li key={index} className="text-sm text-gray-700 pl-4 border-l-2 border-blue-200">
                        {goal.text}
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.locked && (
                  <Alert className="mt-4">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Denna plan är låst och kan inte redigeras av andra användare.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh info */}
      {retryCount > 0 && (
        <div className="text-center text-sm text-gray-500">
          Försök {retryCount + 1} av 4
        </div>
      )}
    </div>
  );
}