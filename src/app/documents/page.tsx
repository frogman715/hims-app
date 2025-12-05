import { redirect } from "next/navigation";

// DEPRECATED: This page uses mock data and has been replaced by /crewing/documents
// Redirect to the new location with real API integration
export default async function DocumentsPage() {
  redirect('/crewing/documents');
}
