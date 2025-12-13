import { requireCrew } from "@/lib/authz";
import MobileShell from "../MobileShell";
import UploadForm from "./UploadForm";

export default async function CrewUploadPage() {
  await requireCrew();
  return (
    <MobileShell
      title="Upload Documents"
      subtitle="Send scans securely for office verification."
      activeTab="upload"
    >
      <UploadForm />
    </MobileShell>
  );
}
