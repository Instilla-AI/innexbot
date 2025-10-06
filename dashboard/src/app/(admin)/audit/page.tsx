import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tracking Audit | InnexBot",
  description: "Pagina di audit del tracking e-commerce",
};

const TrackingAuditPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Tracking Audit</h1>
        <p className="text-sm text-bodydark">Dashboard / Tracking Audit</p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-4 sm:p-6 xl:p-7.5">
          <h2 className="text-2xl font-bold text-black dark:text-white">Audit del Tracking E-commerce</h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Questa pagina mostrerà i risultati dell&apos;audit del tracking, inclusi gli eventi del dataLayer, lo scoring e i report visuali.
          </p>
          {/* Qui verranno inseriti i componenti per visualizzare i dati dell'audit */}
        </div>
      </div>
    </div>
  );
};

export default TrackingAuditPage;
