import { getInitials } from "@/lib/staff-data";
import { PersonalInfoForm } from "./personal-info-form";
import { ClientManagement } from "./followup-form";
import type { Staff } from "@shared/schema";

interface StaffSectionProps {
  staff: Staff;
}

export function StaffSection({ staff }: StaffSectionProps) {
  const initials = getInitials(staff.name);

  return (
    <div className="p-6 fade-in">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-semibold text-lg">{initials}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
            <p className="text-gray-600">Personaluppföljning och administrativa data</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PersonalInfoForm staff={staff} />
        <ClientManagement staff={staff} />
      </div>
    </div>
  );
}
