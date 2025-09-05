/**
 * Säker CSV export med proper escaping och data sanitization
 * Förhindrar HTML injection och skyddar känslig data
 */
import { escapeCsvField, sanitizeText, safeLog } from './security';
import type { Staff, Client, CarePlan, ImplementationPlan } from '@shared/schema';

export interface ExportOptions {
  includePersonalNumbers?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  staffIds?: string[];
  format?: 'csv' | 'json';
}

/**
 * Exporterar personal data till CSV format
 */
export function exportStaffToCSV(staff: Staff[], options: ExportOptions = {}): string {
  safeLog('Exporting staff data', { count: staff.length });

  const headers = [
    'Namn',
    'Initialer', 
    'Roll',
    'Avdelning',
    'Telefon',
    'E-post',
    'Anställningsdatum',
    'Status'
  ];

  if (options.includePersonalNumbers) {
    headers.splice(2, 0, 'Personnummer');
  }

  const rows = staff.map(member => {
    const row = [
      escapeCsvField(sanitizeText(member.name || '')),
      escapeCsvField(sanitizeText(member.initials || '')),
      escapeCsvField(sanitizeText(member.roll || '')),
      escapeCsvField(sanitizeText(member.avdelning || '')),
      escapeCsvField(sanitizeText(member.telefon || '')),
      escapeCsvField(sanitizeText(member.epost || '')),
      escapeCsvField(member.anställningsdatum || ''),
      escapeCsvField('Aktiv') // Staff is always active in this system
    ];

    if (options.includePersonalNumbers) {
      // Mask personal numbers for security - only show last 4 digits
      const maskedNumber = member.personnummer ? 
        `****-**${member.personnummer.slice(-2)}` : '';
      row.splice(2, 0, escapeCsvField(maskedNumber));
    }

    return row;
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Exporterar klient data till CSV format (GDPR-säker)
 */
export function exportClientsToCSV(
  clients: Client[], 
  staff: Staff[], 
  options: ExportOptions = {}
): string {
  safeLog('Exporting client data', { count: clients.length });

  const headers = [
    'Initialer',
    'Ansvarig Personal',
    'Status',
    'Skapad Datum',
    'Senast Uppdaterad'
  ];

  const rows = clients
    .filter(client => {
      if (options.dateRange) {
        const createdDate = new Date(client.createdAt || '');
        return createdDate >= options.dateRange.start && createdDate <= options.dateRange.end;
      }
      return true;
    })
    .filter(client => {
      if (options.staffIds && options.staffIds.length > 0) {
        return options.staffIds.includes(client.staffId);
      }
      return true;
    })
    .map(client => {
      const responsibleStaff = staff.find(s => s.id === client.staffId);
      
      return [
        escapeCsvField(sanitizeText(client.initials)),
        escapeCsvField(sanitizeText(responsibleStaff?.name || 'Okänd')),
        escapeCsvField(sanitizeText(client.status || 'active')),
        escapeCsvField(client.createdAt ? new Date(client.createdAt).toLocaleDateString('sv-SE') : ''),
        escapeCsvField(client.updatedAt ? new Date(client.updatedAt).toLocaleDateString('sv-SE') : '')
      ];
    });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Exporterar vårdplaner till CSV format
 */
export function exportCarePlansToCSV(
  carePlans: CarePlan[],
  clients: Client[],
  staff: Staff[],
  options: ExportOptions = {}
): string {
  safeLog('Exporting care plans', { count: carePlans.length });

  const headers = [
    'Klient Initialer',
    'Ansvarig Personal',
    'Status',
    'Mottaget Datum',
    'Personal Notifierad',
    'Mål (Kort)',
    'Skapad Datum'
  ];

  const rows = carePlans
    .filter(plan => {
      if (options.dateRange) {
        const createdDate = new Date(plan.createdAt || '');
        return createdDate >= options.dateRange.start && createdDate <= options.dateRange.end;
      }
      return true;
    })
    .map(plan => {
      const client = clients.find(c => c.id === plan.clientId);
      const responsibleStaff = staff.find(s => s.id === plan.staffId);
      
      // Truncate goals to max 100 chars for CSV readability
      const truncatedGoals = plan.goals ? 
        (plan.goals.length > 100 ? plan.goals.substring(0, 97) + '...' : plan.goals) : '';

      return [
        escapeCsvField(sanitizeText(client?.initials || 'Okänd')),
        escapeCsvField(sanitizeText(responsibleStaff?.name || 'Okänd')),
        escapeCsvField(getStatusDisplay(plan.status)),
        escapeCsvField(plan.receivedDate || ''),
        escapeCsvField(plan.staffNotifiedDate || ''),
        escapeCsvField(sanitizeText(truncatedGoals)),
        escapeCsvField(plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('sv-SE') : '')
      ];
    });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Exporterar genomförandeplaner till CSV format
 */
export function exportImplementationPlansToCSV(
  plans: ImplementationPlan[],
  clients: Client[],
  staff: Staff[],
  options: ExportOptions = {}
): string {
  safeLog('Exporting implementation plans', { count: plans.length });

  const headers = [
    'Klient Initialer',
    'Ansvarig Personal',
    'Status',
    'Planinnehåll (Kort)',
    'Aktiviteter (Kort)',
    'Skapad Datum',
    'Uppdaterad Datum'
  ];

  const rows = plans
    .filter(plan => {
      if (options.dateRange) {
        const createdDate = new Date(plan.createdAt || '');
        return createdDate >= options.dateRange.start && createdDate <= options.dateRange.end;
      }
      return true;
    })
    .map(plan => {
      const client = clients.find(c => c.id === plan.clientId);
      const responsibleStaff = staff.find(s => s.id === plan.staffId);
      
      // Truncate long text fields for CSV readability
      const truncatedContent = plan.planContent ? 
        (plan.planContent.length > 80 ? plan.planContent.substring(0, 77) + '...' : plan.planContent) : '';
      const truncatedActivities = plan.activities ? 
        (plan.activities.length > 80 ? plan.activities.substring(0, 77) + '...' : plan.activities) : '';

      return [
        escapeCsvField(sanitizeText(client?.initials || 'Okänd')),
        escapeCsvField(sanitizeText(responsibleStaff?.name || 'Okänd')),
        escapeCsvField(getStatusDisplay(plan.status)),
        escapeCsvField(sanitizeText(truncatedContent)),
        escapeCsvField(sanitizeText(truncatedActivities)),
        escapeCsvField(plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('sv-SE') : ''),
        escapeCsvField(plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('sv-SE') : '')
      ];
    });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Skapar en komplett export av alla data
 */
export function createCompleteExport(
  staff: Staff[],
  clients: Client[],
  carePlans: CarePlan[],
  implementationPlans: ImplementationPlan[],
  options: ExportOptions = {}
): string {
  safeLog('Creating complete export');

  const sections = [
    '=== PERSONAL ===',
    exportStaffToCSV(staff, options),
    '',
    '=== KLIENTER ===',
    exportClientsToCSV(clients, staff, options),
    '',
    '=== VÅRDPLANER ===',
    exportCarePlansToCSV(carePlans, clients, staff, options),
    '',
    '=== GENOMFÖRANDEPLANER ===',
    exportImplementationPlansToCSV(implementationPlans, clients, staff, options),
    '',
    `=== EXPORT INFO ===`,
    `Exporterat: ${new Date().toLocaleString('sv-SE')}`,
    `Antal personal: ${staff.length}`,
    `Antal klienter: ${clients.length}`,
    `Antal vårdplaner: ${carePlans.length}`,
    `Antal GFP: ${implementationPlans.length}`
  ];

  return sections.join('\n');
}

/**
 * Hjälpfunktion för status display
 */
function getStatusDisplay(status: string | null): string {
  const statusMap: Record<string, string> = {
    'received': 'Mottagen',
    'entered_journal': 'I journal',
    'staff_notified': 'Personal notifierad',
    'gfp_pending': 'Väntar GFP',
    'completed': 'Slutförd',
    'pending': 'Pågående',
    'active': 'Aktiv',
    'inactive': 'Inaktiv'
  };
  
  return statusMap[status || ''] || (status || 'Okänd');
}

/**
 * Ladda ner CSV fil säkert
 */
export function downloadCSV(content: string, filename: string): void {
  try {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    safeLog('CSV download initiated', { filename });
  } catch (error) {
    console.error('Failed to download CSV:', error);
    throw new Error('Export misslyckades. Försök igen.');
  }
}
