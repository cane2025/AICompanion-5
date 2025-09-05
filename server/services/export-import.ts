import { databaseService } from "./database.js";
import type { Staff, Client, WeeklyDocumentation, MonthlyReport, CarePlan, ImplementationPlan, VimsaTime } from "../../shared/schema.js";
import { createObjectCsvWriter } from 'csv-writer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeDeleted?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    staffId?: string;
    clientId?: string;
    status?: string;
    quality?: string;
  };
}

export interface ImportOptions {
  format: 'csv' | 'json' | 'excel';
  updateExisting?: boolean;
  skipErrors?: boolean;
  validateData?: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export class ExportImportService {
  async exportStaff(options: ExportOptions): Promise<string | Buffer> {
    const staff = await databaseService.getAllStaff();
    const filteredStaff = this.filterStaff(staff, options);

    switch (options.format) {
      case 'csv':
        return await this.exportToCSV(filteredStaff, 'staff');
      case 'json':
        return JSON.stringify(filteredStaff, null, 2);
      case 'excel':
        return await this.exportToExcel(filteredStaff, 'staff');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async exportClients(options: ExportOptions): Promise<string | Buffer> {
    const clients = await databaseService.getAllClients();
    const filteredClients = this.filterClients(clients, options);

    switch (options.format) {
      case 'csv':
        return await this.exportToCSV(filteredClients, 'clients');
      case 'json':
        return JSON.stringify(filteredClients, null, 2);
      case 'excel':
        return await this.exportToExcel(filteredClients, 'clients');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async exportWeeklyDocumentation(options: ExportOptions): Promise<string | Buffer> {
    const weeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const filteredDocs = this.filterWeeklyDocumentation(weeklyDocs, options);

    switch (options.format) {
      case 'csv':
        return await this.exportToCSV(filteredDocs, 'weekly_documentation');
      case 'json':
        return JSON.stringify(filteredDocs, null, 2);
      case 'excel':
        return await this.exportToExcel(filteredDocs, 'weekly_documentation');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async exportMonthlyReports(options: ExportOptions): Promise<string | Buffer> {
    const monthlyReports = await databaseService.getAllMonthlyReports();
    const filteredReports = this.filterMonthlyReports(monthlyReports, options);

    switch (options.format) {
      case 'csv':
        return await this.exportToCSV(filteredReports, 'monthly_reports');
      case 'json':
        return JSON.stringify(filteredReports, null, 2);
      case 'excel':
        return await this.exportToExcel(filteredReports, 'monthly_reports');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async exportCarePlans(options: ExportOptions): Promise<string | Buffer> {
    const carePlans = await databaseService.getAllCarePlans();
    const filteredPlans = this.filterCarePlans(carePlans, options);

    switch (options.format) {
      case 'csv':
        return await this.exportToCSV(filteredPlans, 'care_plans');
      case 'json':
        return JSON.stringify(filteredPlans, null, 2);
      case 'excel':
        return await this.exportToExcel(filteredPlans, 'care_plans');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  async exportAllData(options: ExportOptions): Promise<Record<string, any>> {
    const [
      staff,
      clients,
      weeklyDocs,
      monthlyReports,
      carePlans,
      implementationPlans,
      vimsaTime,
    ] = await Promise.all([
      databaseService.getAllStaff(),
      databaseService.getAllClients(),
      databaseService.getAllWeeklyDocumentation(),
      databaseService.getAllMonthlyReports(),
      databaseService.getAllCarePlans(),
      databaseService.getAllImplementationPlans(),
      databaseService.getAllVimsaTime(),
    ]);

    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        staff: this.filterStaff(staff, options),
        clients: this.filterClients(clients, options),
        weeklyDocumentation: this.filterWeeklyDocumentation(weeklyDocs, options),
        monthlyReports: this.filterMonthlyReports(monthlyReports, options),
        carePlans: this.filterCarePlans(carePlans, options),
        implementationPlans: this.filterImplementationPlans(implementationPlans, options),
        vimsaTime: this.filterVimsaTime(vimsaTime, options),
      },
    };
  }

  // Import methods
  async importStaff(data: string | Buffer, options: ImportOptions): Promise<ImportResult> {
    try {
      const parsedData = await this.parseData(data, options.format);
      const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

      for (const item of parsedData) {
        try {
          if (options.validateData) {
            const validationResult = this.validateStaffData(item);
            if (!validationResult.isValid) {
              result.errors.push(`Row ${result.success + result.failed + 1}: ${validationResult.errors.join(', ')}`);
              if (!options.skipErrors) continue;
            }
          }

          // Check if staff already exists
          const existingStaff = await databaseService.getStaffByName(item.name);
          if (existingStaff) {
            if (options.updateExisting) {
              await databaseService.updateStaff(existingStaff.id, item);
              result.success++;
            } else {
              result.warnings.push(`Staff ${item.name} already exists, skipping`);
            }
          } else {
            await databaseService.createStaff(item);
            result.success++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${result.success + result.failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (!options.skipErrors) break;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importClients(data: string | Buffer, options: ImportOptions): Promise<ImportResult> {
    try {
      const parsedData = await this.parseData(data, options.format);
      const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

      for (const item of parsedData) {
        try {
          if (options.validateData) {
            const validationResult = this.validateClientData(item);
            if (!validationResult.isValid) {
              result.errors.push(`Row ${result.success + result.failed + 1}: ${validationResult.errors.join(', ')}`);
              if (!options.skipErrors) continue;
            }
          }

          // Check if client already exists
          const existingClient = await databaseService.getClient(item.id);
          if (existingClient) {
            if (options.updateExisting) {
              await databaseService.updateClient(existingClient.id, item);
              result.success++;
            } else {
              result.warnings.push(`Client ${item.initials} already exists, skipping`);
            }
          } else {
            await databaseService.createClient(item);
            result.success++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${result.success + result.failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (!options.skipErrors) break;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async importWeeklyDocumentation(data: string | Buffer, options: ImportOptions): Promise<ImportResult> {
    try {
      const parsedData = await this.parseData(data, options.format);
      const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

      for (const item of parsedData) {
        try {
          if (options.validateData) {
            const validationResult = this.validateWeeklyDocumentationData(item);
            if (!validationResult.isValid) {
              result.errors.push(`Row ${result.success + result.failed + 1}: ${validationResult.errors.join(', ')}`);
              if (!options.skipErrors) continue;
            }
          }

          // Check if documentation already exists
          const existingDoc = await databaseService.getWeeklyDocumentation(
            item.clientId,
            item.year,
            item.week
          );

          if (existingDoc) {
            if (options.updateExisting) {
              await databaseService.updateWeeklyDocumentation(existingDoc.id, item);
              result.success++;
            } else {
              result.warnings.push(`Weekly documentation for client ${item.clientId}, week ${item.week} ${item.year} already exists, skipping`);
            }
          } else {
            await databaseService.createWeeklyDocumentation(item);
            result.success++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${result.success + result.failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          if (!options.skipErrors) break;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Bulk operations
  async bulkCreateStaff(staffList: any[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

    try {
      const createdStaff = await databaseService.bulkCreateStaff(staffList);
      result.success = createdStaff.length;
    } catch (error) {
      result.failed = staffList.length;
      result.errors.push(`Bulk creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async bulkCreateClients(clientList: any[]): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

    try {
      const createdClients = await databaseService.bulkCreateClients(clientList);
      result.success = createdClients.length;
    } catch (error) {
      result.failed = clientList.length;
      result.errors.push(`Bulk creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Data migration
  async migrateFromLegacySystem(legacyData: any): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [], warnings: [] };

    try {
      // Migrate staff
      if (legacyData.staff) {
        const staffResult = await this.importStaff(JSON.stringify(legacyData.staff), {
          format: 'json',
          updateExisting: true,
          skipErrors: true,
          validateData: false,
        });
        result.success += staffResult.success;
        result.failed += staffResult.failed;
        result.errors.push(...staffResult.errors);
        result.warnings.push(...staffResult.warnings);
      }

      // Migrate clients
      if (legacyData.clients) {
        const clientResult = await this.importClients(JSON.stringify(legacyData.clients), {
          format: 'json',
          updateExisting: true,
          skipErrors: true,
          validateData: false,
        });
        result.success += clientResult.success;
        result.failed += clientResult.failed;
        result.errors.push(...clientResult.errors);
        result.warnings.push(...clientResult.warnings);
      }

      // Add more migration logic for other data types
    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Private helper methods
  private async exportToCSV(data: any[], entityName: string): Promise<string> {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvWriter = createObjectCsvWriter({
      path: `temp_${entityName}_${Date.now()}.csv`,
      header: headers.map(header => ({ id: header, title: header })),
    });

    await csvWriter.writeRecords(data);
    
    // Read the file and return content
    const fs = await import('fs/promises');
    const content = await fs.readFile(`temp_${entityName}_${Date.now()}.csv`, 'utf-8');
    
    // Clean up temp file
    await fs.unlink(`temp_${entityName}_${Date.now()}.csv`);
    
    return content;
  }

  private async exportToExcel(data: any[], entityName: string): Promise<Buffer> {
    // This would use a library like xlsx to create Excel files
    // For now, return JSON as buffer
    return Buffer.from(JSON.stringify(data, null, 2));
  }

  private async parseData(data: string | Buffer, format: string): Promise<any[]> {
    switch (format) {
      case 'csv':
        return await this.parseCSV(data);
      case 'json':
        return this.parseJSON(data);
      case 'excel':
        return await this.parseExcel(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async parseCSV(data: string | Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
      });

      parser.on('data', (row) => results.push(row));
      parser.on('end', () => resolve(results));
      parser.on('error', reject);

      const stream = Readable.from([data.toString()]);
      stream.pipe(parser);
    });
  }

  private parseJSON(data: string | Buffer): any[] {
    const content = typeof data === 'string' ? data : data.toString();
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  private async parseExcel(data: Buffer): Promise<any[]> {
    // This would use a library like xlsx to parse Excel files
    // For now, return empty array
    return [];
  }

  // Data validation methods
  private validateStaffData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name) errors.push('Name is required');
    if (!data.initials) errors.push('Initials are required');
    if (data.email && !this.isValidEmail(data.email)) errors.push('Invalid email format');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateClientData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.initials) errors.push('Initials are required');
    if (!data.staffId) errors.push('Staff ID is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateWeeklyDocumentationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.clientId) errors.push('Client ID is required');
    if (!data.staffId) errors.push('Staff ID is required');
    if (!data.year) errors.push('Year is required');
    if (!data.week) errors.push('Week is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Filtering methods
  private filterStaff(staff: Staff[], options: ExportOptions): Staff[] {
    let filtered = staff;

    if (options.filters?.staffId) {
      filtered = filtered.filter(s => s.id === options.filters!.staffId);
    }

    if (options.dateRange) {
      filtered = filtered.filter(s => {
        const createdAt = new Date(s.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterClients(clients: Client[], options: ExportOptions): Client[] {
    let filtered = clients;

    if (options.filters?.staffId) {
      filtered = filtered.filter(c => c.staffId === options.filters!.staffId);
    }

    if (options.filters?.status) {
      filtered = filtered.filter(c => c.status === options.filters!.status);
    }

    if (options.dateRange) {
      filtered = filtered.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterWeeklyDocumentation(docs: WeeklyDocumentation[], options: ExportOptions): WeeklyDocumentation[] {
    let filtered = docs;

    if (options.filters?.staffId) {
      filtered = filtered.filter(d => d.staffId === options.filters!.staffId);
    }

    if (options.filters?.clientId) {
      filtered = filtered.filter(d => d.clientId === options.filters!.clientId);
    }

    if (options.filters?.quality) {
      filtered = filtered.filter(d => d.qualityAssessment === options.filters!.quality);
    }

    if (options.dateRange) {
      filtered = filtered.filter(d => {
        const createdAt = new Date(d.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterMonthlyReports(reports: MonthlyReport[], options: ExportOptions): MonthlyReport[] {
    let filtered = reports;

    if (options.filters?.staffId) {
      filtered = filtered.filter(r => r.staffId === options.filters!.staffId);
    }

    if (options.filters?.clientId) {
      filtered = filtered.filter(r => r.clientId === options.filters!.clientId);
    }

    if (options.filters?.status) {
      filtered = filtered.filter(r => r.status === options.filters!.status);
    }

    if (options.dateRange) {
      filtered = filtered.filter(r => {
        const createdAt = new Date(r.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterCarePlans(plans: CarePlan[], options: ExportOptions): CarePlan[] {
    let filtered = plans;

    if (options.filters?.staffId) {
      filtered = filtered.filter(p => p.staffId === options.filters!.staffId);
    }

    if (options.filters?.clientId) {
      filtered = filtered.filter(p => p.clientId === options.filters!.clientId);
    }

    if (options.dateRange) {
      filtered = filtered.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterImplementationPlans(plans: ImplementationPlan[], options: ExportOptions): ImplementationPlan[] {
    let filtered = plans;

    if (options.filters?.staffId) {
      filtered = filtered.filter(p => p.staffId === options.filters!.staffId);
    }

    if (options.filters?.clientId) {
      filtered = filtered.filter(p => p.clientId === options.filters!.clientId);
    }

    if (options.dateRange) {
      filtered = filtered.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }

  private filterVimsaTime(vimsaTime: VimsaTime[], options: ExportOptions): VimsaTime[] {
    let filtered = vimsaTime;

    if (options.filters?.staffId) {
      filtered = filtered.filter(v => v.staffId === options.filters!.staffId);
    }

    if (options.filters?.clientId) {
      filtered = filtered.filter(v => v.clientId === options.filters!.clientId);
    }

    if (options.dateRange) {
      filtered = filtered.filter(v => {
        const createdAt = new Date(v.createdAt);
        return createdAt >= options.dateRange!.start && createdAt <= options.dateRange!.end;
      });
    }

    return filtered;
  }
}

export const exportImportService = new ExportImportService();