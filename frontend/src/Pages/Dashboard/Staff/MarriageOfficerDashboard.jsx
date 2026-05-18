import { Heart } from "lucide-react";
import StaffCertificateRequestsPanel from "./StaffCertificateRequestsPanel";

export default function MarriageOfficerDashboard() {
  return (
    <StaffCertificateRequestsPanel
      title="Marriage Certificate Office"
      headerIcon={<Heart className="w-7 h-7 text-rose-600" />}
    />
  );
}
