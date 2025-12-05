'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function HGQSMainManual() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/quality"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Quality Management
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mt-2">
                HGQS Main Manual
              </h1>
              <p className="text-lg text-gray-600 mt-1">Doc. No.: HGQS-MM | Rev. No.: 00 | Enf. Date: 2023.07.03</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                ISO 9001:2015
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                MLC 2006
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="prose prose-slate max-w-none">
            <h2>HGQS MAIN MANUAL</h2>
            <p><strong>CONFORM TO THE ISO9001-2015 AND THE MLC2006</strong></p>
            <p>Doc. No.: HGQS - MM<br/>Leg. Date: 2023.07.03<br/>Rev. No.: 00<br/>Enf. Date: 2023.07.03</p>
            <p>Prepared by Reviewed by Approved by<br/>Quality Management Representative<br/>Mr Mochamad Rinaldy Quality Management Representative<br/>Mr Mochamad Rinaldy Director<br/>Mr. Mochamad Rinaldy<br/>Signature Signature Signature<br/>2023.07.03 2023.07.03 2023.07.03</p>
            <h3>PT. HANN GLOBAL INDONESIA</h3>
            <h3>MASTER LIST OF HGQS DOCUMENTS</h3>
            <p>HGQS – ML</p>
            <table className="border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">No.</th>
                  <th className="border border-gray-300 p-2">TITLE</th>
                  <th className="border border-gray-300 p-2">DEPARTMENT</th>
                  <th className="border border-gray-300 p-2">CONTROL NUMBER</th>
                  <th className="border border-gray-300 p-2">STATUS</th>
                  <th className="border border-gray-300 p-2">NUMBER OF PAGES</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 p-2">1</td><td className="border border-gray-300 p-2">HGQS MASTER LIST</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGQS-ML</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">2</td><td className="border border-gray-300 p-2">HGQS MAIN MANUAL</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGQS-MM</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">56</td></tr>
                <tr><td className="border border-gray-300 p-2">3</td><td className="border border-gray-300 p-2">HGQS PROCEDURE MANUAL</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGQS-PM</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">48</td></tr>
                <tr><td className="border border-gray-300 p-2">4</td><td className="border border-gray-300 p-2">HGQS MANAGEMENT GUIDELINE FOR OFFICE EMPLOYEES</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGQS-MG</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">30</td></tr>
                <tr><td className="border border-gray-300 p-2">5</td><td className="border border-gray-300 p-2">HGQS FORMS</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGQS-FO</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">84</td></tr>
                <tr><td className="border border-gray-300 p-2">6</td><td className="border border-gray-300 p-2">SEAFARERS RIGHTS AND CBA</td><td className="border border-gray-300 p-2">HGQS</td><td className="border border-gray-300 p-2">HGD-SR</td><td className="border border-gray-300 p-2">D</td><td className="border border-gray-300 p-2">46</td></tr>
              </tbody>
            </table>
            <h3>HGQS FORM LIST</h3>
            <p>HGQS – FL</p>
            <table className="border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">No.</th>
                  <th className="border border-gray-300 p-2">TITLE</th>
                  <th className="border border-gray-300 p-2">DEPARTMENT</th>
                  <th className="border border-gray-300 p-2">CONTROL NUMBER</th>
                  <th className="border border-gray-300 p-2">STATUS</th>
                  <th className="border border-gray-300 p-2">NUMBER OF PAGES</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 p-2">1</td><td className="border border-gray-300 p-2">DOCUMENTS CHECKLIST</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-01</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">2</td><td className="border border-gray-300 p-2">APPLICATION FOR EMPLOYMENT</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-02</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">3</td><td className="border border-gray-300 p-2">CHECKLIST FOR DEPARTING CREW</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-03</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">4</td><td className="border border-gray-300 p-2">DE-BRIEFING FORM</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-04</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
                <tr><td className="border border-gray-300 p-2">5</td><td className="border border-gray-300 p-2">AFFIDAVIT OF UNDERTAKING</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-05</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">6</td><td className="border border-gray-300 p-2">WRITTEN OATH ABOUT ALCOHOL & DRUG</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-06</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">7</td><td className="border border-gray-300 p-2">CREW VACATION PLAN</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-07</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">8</td><td className="border border-gray-300 p-2">CREW EVALUATION REPORT</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-08</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">9</td><td className="border border-gray-300 p-2">RECORD OF INTERVIEW FOR CREW</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-09</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">10</td><td className="border border-gray-300 p-2">CONTRACT OF EMPLOYMENT</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-10</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">3</td></tr>
                <tr><td className="border border-gray-300 p-2">11</td><td className="border border-gray-300 p-2">REPORT OF ON BOARD COMPLAINT</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-11</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">12</td><td className="border border-gray-300 p-2">CREW EDUCATION & TRAINING PLAN / RESULT REPORT</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-12</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">13</td><td className="border border-gray-300 p-2">DISEMBARKATION APPLICATION</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-13</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">14</td><td className="border border-gray-300 p-2">MANAGEMENT LIST OF SEAFARER&apos;S DOCUMENTS</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-14</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">15</td><td className="border border-gray-300 p-2">RESULT OF MEDICAL ADVICE</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-15</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">16</td><td className="border border-gray-300 p-2">MEDICAL TREATMENT REQUEST</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-16</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
                <tr><td className="border border-gray-300 p-2">17</td><td className="border border-gray-300 p-2">NOTICE OF CREW ON&OFF-SIGNING</td><td className="border border-gray-300 p-2">CREWING DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-CR-17</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">18</td><td className="border border-gray-300 p-2">DEPARTMENTAL MEETING</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-01</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">19</td><td className="border border-gray-300 p-2">MANAGEMENT MEETING</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-02</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
                <tr><td className="border border-gray-300 p-2">20</td><td className="border border-gray-300 p-2">EVALUATION TO CHOICE SUPPLIER</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-03</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">21</td><td className="border border-gray-300 p-2">EVALUATION OF SUPPLIER</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-04</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">22</td><td className="border border-gray-300 p-2">EVALUATION OF CUSTOMERS</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-05</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
                <tr><td className="border border-gray-300 p-2">23</td><td className="border border-gray-300 p-2">EVALUATION OF EMPLOYEE</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-06</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">3</td></tr>
                <tr><td className="border border-gray-300 p-2">24</td><td className="border border-gray-300 p-2">INTERNAL AUDIT GUIDE</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-07</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">14</td></tr>
                <tr><td className="border border-gray-300 p-2">25</td><td className="border border-gray-300 p-2">INTERNAL AUDIT PLAN</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-08</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">26</td><td className="border border-gray-300 p-2">INTERNAL AUDIT REPORT</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-09</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">3</td></tr>
                <tr><td className="border border-gray-300 p-2">27</td><td className="border border-gray-300 p-2">CORRECTIVE AND PREVENTIVE ACTION REQUEST</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-10</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">28</td><td className="border border-gray-300 p-2">CORRECTIVE AND PREVENTIVE ACTION REPORT</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-11</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">29</td><td className="border border-gray-300 p-2">PURCHASE ORDER</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-12</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">30</td><td className="border border-gray-300 p-2">RELEASE AND QUITCLAIM</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-13</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">31</td><td className="border border-gray-300 p-2">ORIENTATION FOR NEW EMPLOYEE</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-14</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">32</td><td className="border border-gray-300 p-2">REPORT OF NON-CONFORMITY</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-15</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">33</td><td className="border border-gray-300 p-2">INDEX</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-16</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">34</td><td className="border border-gray-300 p-2">LIST OF DOCUMENTS FOR DISPATCHING</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-17</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">35</td><td className="border border-gray-300 p-2">OFFICIAL LETTER FORM</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-18</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">36</td><td className="border border-gray-300 p-2">LIST OF RECORD FOR CONTROL</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-19</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">37</td><td className="border border-gray-300 p-2">IMPROVEMENT PLAN OF THE PROCESS</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-20</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">38</td><td className="border border-gray-300 p-2">MANAGEMENT PLAN OF THE PROCESS</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-21</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">39</td><td className="border border-gray-300 p-2">MANAGEMENT REVIEW RESULT REPORT</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-22</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">40</td><td className="border border-gray-300 p-2">MANAGEMENT REVIEW RECORD</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-23</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
                <tr><td className="border border-gray-300 p-2">41</td><td className="border border-gray-300 p-2">MANAGEMENT REVIEW REPORT</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-24</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">42</td><td className="border border-gray-300 p-2">MANPOWER REQUISITION FORM</td><td className="border border-gray-300 p-2">HR/ADMIN DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AD-25</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">43</td><td className="border border-gray-300 p-2">CREW WAGE PAMENT RECORD</td><td className="border border-gray-300 p-2">ACCOUNT DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AC-01</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">44</td><td className="border border-gray-300 p-2">APPOINTMENTS & OFFICIAL ORDER</td><td className="border border-gray-300 p-2">ACCOUNT DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AC-02</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">45</td><td className="border border-gray-300 p-2">PETTY CASH VOUCHER</td><td className="border border-gray-300 p-2">ACCOUNT DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AC-03</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">46</td><td className="border border-gray-300 p-2">ALLOTMENT</td><td className="border border-gray-300 p-2">ACCOUNT DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AC-04</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">1</td></tr>
                <tr><td className="border border-gray-300 p-2">47</td><td className="border border-gray-300 p-2">STATEMENT OF ACCOUNT</td><td className="border border-gray-300 p-2">ACCOUNT DEPARTMENT</td><td className="border border-gray-300 p-2">HGF-AC-05</td><td className="border border-gray-300 p-2">F</td><td className="border border-gray-300 p-2">2</td></tr>
              </tbody>
            </table>
            <p><em>Note: This is a summary. The full manual contains detailed sections on Scope, Normative References, Terms and Definitions, Context of the Company, Leadership, Planning, Support, Operation, Performance Evaluation, and Improvement.</em></p>
          </div>
        </div>
      </main>
    </div>
  );
}