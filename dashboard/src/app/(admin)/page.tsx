import type { Metadata } from "next";
import React from "react";
import { AuditMetrics } from "@/components/innexbot/AuditMetrics";
import { AuditChart } from "@/components/innexbot/AuditChart";
import { EventsStatistics } from "@/components/innexbot/EventsStatistics";
import { RecentAudits } from "@/components/innexbot/RecentAudits";
import { ScoreDistribution } from "@/components/innexbot/ScoreDistribution";

export const metadata: Metadata = {
  title: "InnexBot Dashboard - E-commerce Tracking Analytics",
  description: "Monitor and analyze e-commerce tracking audit results from InnexBot Chrome extension",
};

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Metrics Overview */}
      <div className="col-span-12">
        <AuditMetrics />
      </div>

      {/* Charts Row */}
      <div className="col-span-12 xl:col-span-8">
        <AuditChart />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <ScoreDistribution />
      </div>

      {/* Events Statistics */}
      <div className="col-span-12 xl:col-span-7">
        <EventsStatistics />
      </div>

      {/* Recent Audits */}
      <div className="col-span-12 xl:col-span-5">
        <RecentAudits />
      </div>
    </div>
  );
}
