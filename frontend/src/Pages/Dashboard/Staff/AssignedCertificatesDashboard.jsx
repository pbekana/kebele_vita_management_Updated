import { FileText } from "lucide-react";
import StaffCertificateRequestsPanel from "./StaffCertificateRequestsPanel";

export default function AssignedCertificatesDashboard() {
  return (
    <StaffCertificateRequestsPanel
      title="My Assigned Certificates"
      headerIcon={<FileText className="w-7 h-7 text-indigo-600" />}
    />
  );
}
