import { FileText } from "lucide-react";
import StaffCertificateRequestsPanel from "./StaffCertificateRequestsPanel";

export default function DeathOfficerDashboard() {
  return (
    <StaffCertificateRequestsPanel
      title="Death Certificate Office"
      headerIcon={<FileText className="w-7 h-7 text-slate-700" />}
    />
  );
}
