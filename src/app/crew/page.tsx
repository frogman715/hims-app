import { redirect } from "next/navigation";

// Legacy page kept for deep-link compatibility; move users to the new seafarer hub.
export default function CrewPage() {
  redirect("/crewing/seafarers");
  return null;
}