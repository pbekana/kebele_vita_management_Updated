import { Baby } from "lucide-react";
import StaffCertificateRequestsPanel from "./StaffCertificateRequestsPanel";

export default function BirthOfficerDashboard() {
  return (
    <StaffCertificateRequestsPanel
      title="Birth Certificate Office"
      headerIcon={<Baby className="w-7 h-7 text-pink-600" />}
    />
  );
}
