'use client';

import { useEffect, useState } from 'react';

interface Audit {
  id: number;
  audit_id: string;
  score: number;
  total_events: number;
  events_found: number;
  events_failed: number;
  created_at: string;
}

const AuditsPage = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setAudits(data.recentAudits || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-meta-3 text-white';
    if (score >= 70) return 'bg-primary text-white';
    if (score >= 50) return 'bg-meta-6 text-white';
    return 'bg-meta-1 text-white';
  };

  if (loading) {
    return <div className="p-7">Caricamento...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">Audits</h1>
        <p className="text-sm text-bodydark">Dashboard / Audits</p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">Audit History</h3>
        </div>
        <div className="p-7">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">Audit ID</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Score</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Events Found</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Events Failed</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-bodydark">
                    Nessun audit disponibile. Completa un audit dall&apos;estensione Chrome.
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-stroke dark:border-strokedark">
                    <td className="px-4 py-5">
                      <code className="text-sm">
                        {audit.audit_id ? audit.audit_id.substring(0, 12) + '...' : 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`rounded px-3 py-1 text-sm font-medium ${getScoreBadge(audit.score || 0)}`}>
                        {audit.score || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-5 text-meta-3">{audit.events_found || 0}</td>
                    <td className="px-4 py-5 text-meta-1">{audit.events_failed || 0}</td>
                    <td className="px-4 py-5">
                      {audit.created_at ? new Date(audit.created_at).toLocaleString('it-IT') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditsPage;
