'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { QualityReferenceLayout } from "@/components/quality/QualityReferenceLayout";

export default function HGQSProceduresManual() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="section-stack"><div className="surface-card px-6 py-12 text-center text-sm text-slate-600">Loading HGQS procedures manual...</div></div>;
  }

  if (!session) {
    return null;
  }

  return (
    <QualityReferenceLayout
      eyebrow="Quality Reference"
      title="HGQS procedures manual"
      subtitle="Controlled procedures reference for contract control, risk and opportunity handling, document control, records, internal audit, and corrective action."
      docInfo="Doc. No.: HGQS-PM | Rev. 00 | Enf. Date: 2023.07.03"
      badges={["ISO 9001:2015", "MLC 2006"]}
    >
            <h2>HGQS PROCEDURES MANUAL</h2>
            <p><strong>CONFORM TO THE ISO 9001-2015 AND THE MLC2006</strong></p>
            <p>Doc. No.: HGQS - PM<br/>Leg. Date: 2023.07.03<br/>Rev. No.: 00<br/>Enf. Date: 2023.07.03</p>
            <p>Prepared by Reviewed by Approved by<br/>Quality Management Representative<br/>Mr. Mochamad Rinaldy Quality Management Representative<br/>Mr. Mochamad Rinaldy Director<br/>Mr. Mochamad Rinaldy<br/>Signature Signature Signature<br/>2023.07.03 2023.07.03 2023.07.03</p>
            <h3>PT. HANN GLOBAL INDONESIA</h3>
            <h3>HGQSPROCEDURES MANUAL</h3>
            <p>ISO 9001:2015</p>
            <p>This HGQS Standard Operating Procedures (SOP) Manual has been reviewed and approved for use. The QMR is responsible to ensure the effective implementation and subsequent changes are acknowledged by those authorized to receive the HGQS SOP Manual. Revisions may be made as required and all the changes must be recorded in revision of documents. The HGQS SOP Manual is a controlled document. However, the HGQS SOP manual can be made available to customers and third party auditors.</p>
            <p>This HGQS Standard Operating Procedures (SOP) Manual contains procedures under the ten (10) mandatory requirements. Miscellaneous procedures can be found in annexes of the HGQS SOP Manual.</p>
            <h3>HGQSPROCEDURES MANUAL - TABLE OF CONTENTS</h3>
            <table className="border-collapse border border-gray-400">
              <thead>
                <tr>
                  <th className="border border-gray-400 p-2">TITLE</th>
                  <th className="border border-gray-400 p-2">PAGE</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-400 p-2">1. Control of Contract</td><td className="border border-gray-400 p-2">1 - 2</td></tr>
                <tr><td className="border border-gray-400 p-2">2. Control of Risk and Opportunities</td><td className="border border-gray-400 p-2">3 -6</td></tr>
                <tr><td className="border border-gray-400 p-2">3. Hiring of Shore Personnel</td><td className="border border-gray-400 p-2">7-9</td></tr>
                <tr><td className="border border-gray-400 p-2">4. Control of Infrastructure and Environment</td><td className="border border-gray-400 p-2">10 - 11</td></tr>
                <tr><td className="border border-gray-400 p-2">5. Control of Documents</td><td className="border border-gray-400 p-2">12 - 13</td></tr>
                <tr><td className="border border-gray-400 p-2">6. Control of Records</td><td className="border border-gray-400 p-2">14 - 15</td></tr>
                <tr><td className="border border-gray-400 p-2">7. Control of Externally Provided Processes, Product & Services</td><td className="border border-gray-400 p-2">16 - 18</td></tr>
                <tr><td className="border border-gray-400 p-2">8. Control Nonconforming Product</td><td className="border border-gray-400 p-2">19- 21</td></tr>
                <tr><td className="border border-gray-400 p-2">9. Internal Audit</td><td className="border border-gray-400 p-2">22 - 25</td></tr>
                <tr><td className="border border-gray-400 p-2">10. Corrective Action</td><td className="border border-gray-400 p-2">26-27</td></tr>
              </tbody>
            </table>
            <p><em>Note: This is a summary. The full procedures manual contains detailed procedures for each section, including annexes with additional procedures for recruitment and placement, management of communication, management of signed-off seafarers, and human resource administration and purchasing procedures.</em></p>
    </QualityReferenceLayout>
  );
}
