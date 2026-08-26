import React, { useEffect, useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Crown, 
  ShieldCheck, 
  TrendingUp
} from 'lucide-react';
import { DashboardMetrics, RecentAlertItem } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  onNavigateToTab: (tab: string) => void;
}

const EMPTY_METRICS: DashboardMetrics = {
  kpis: {
    totalUsers: { value: 0, change: '0% this month' },
    activeAlerts: { value: 0, change: '+0 today this month' },
    premiumUsers: { value: 0, change: '0% this month' },
    groupsActive: { value: 0, change: '0% this month' },
  },
  subscriptionSplit: {
    premium: 0,
    free: 0,
    monthlyRevenue: 0,
    revenueGrowth: '0% from last month',
  },
  recentAlerts: [],
};

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function formatRevenue(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);

  useEffect(() => {
    let cancelled = false;
    api.getMetrics()
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(EMPTY_METRICS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentAlerts = metrics.recentAlerts as RecentAlertItem[];
  const splitTotal = metrics.subscriptionSplit.premium + metrics.subscriptionSplit.free;
  const premiumPct = splitTotal > 0 ? (metrics.subscriptionSplit.premium / splitTotal) * 100 : 0;
  const freePct = splitTotal > 0 ? (metrics.subscriptionSplit.free / splitTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-lg font-bold text-gray-900 tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Welcome back, Admin. Here's what's happening with SafeAlert today.
        </p>
      </div>

      {/* 4 KPI Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => onNavigateToTab('users')}
          className="figma-card p-5 cursor-pointer figma-card-hover flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-gray-400">Total Users</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCount(metrics.kpis.totalUsers.value)}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              {metrics.kpis.totalUsers.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Alerts */}
        <div 
          onClick={() => onNavigateToTab('live-groups')}
          className="figma-card p-5 cursor-pointer figma-card-hover flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-gray-400">Active Alerts</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCount(metrics.kpis.activeAlerts.value)}</h3>
            <p className="text-[11px] font-semibold text-red-500 mt-1">
              {metrics.kpis.activeAlerts.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Premium Users */}
        <div 
          onClick={() => onNavigateToTab('subscriptions')}
          className="figma-card p-5 cursor-pointer figma-card-hover flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-gray-400">Premium Users</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCount(metrics.kpis.premiumUsers.value)}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">
              {metrics.kpis.premiumUsers.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Groups Active */}
        <div 
          onClick={() => onNavigateToTab('live-groups')}
          className="figma-card p-5 cursor-pointer figma-card-hover flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-gray-400">Groups Active</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCount(metrics.kpis.groupsActive.value)}</h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1">
              {metrics.kpis.groupsActive.change}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Row: Recent Alerts (Left 2/3) & Subscription Split (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts (2 Cols) */}
        <div className="figma-card p-4 sm:p-6 lg:col-span-2 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 gap-3">
              <h3 className="text-sm font-bold text-gray-900">Recent Alerts</h3>
              <button 
                onClick={() => onNavigateToTab('live-groups')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
              >
                View all
              </button>
            </div>

            {/* List of Recent Alerts */}
            <div className="divide-y divide-gray-100">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => onNavigateToTab('live-groups')}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 px-1 sm:px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                      style={{ backgroundColor: alert.color }}
                    >
                      {alert.userInitials}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{alert.userName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{alert.category}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end sm:flex-row sm:items-center gap-1 sm:gap-4 shrink-0">
                    <span 
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        alert.severity === 'Critical'
                          ? 'bg-red-50 text-red-500 border border-red-200'
                          : alert.severity === 'High'
                          ? 'bg-orange-50 text-orange-500 border border-orange-200'
                          : 'bg-amber-50 text-amber-500 border border-amber-200'
                      }`}
                    >
                      {alert.severity}
                    </span>

                    <span className="text-[11px] text-gray-400 font-medium sm:min-w-[70px] text-right whitespace-nowrap">
                      {alert.timeAgo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Split (1 Col) */}
        <div className="figma-card p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-6">Subscription Split</h3>

            {/* Bars */}
            <div className="space-y-4">
              {/* Premium bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-700 font-semibold">Premium</span>
                  <span className="text-gray-500 font-mono">{formatCount(metrics.subscriptionSplit.premium)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${premiumPct}%` }} />
                </div>
              </div>

              {/* Free bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-700 font-semibold">Free</span>
                  <span className="text-gray-500 font-mono">{formatCount(metrics.subscriptionSplit.free)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-blue-200 h-full rounded-full" style={{ width: `${freePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Lower Monthly Revenue Stats */}
          <div className="pt-6 border-t border-gray-100 mt-8">
            <p className="text-xs text-gray-400 font-medium">Monthly Revenue</p>
            <h4 className="text-2xl font-extrabold text-gray-900 mt-1">{formatRevenue(metrics.subscriptionSplit.monthlyRevenue)}</h4>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {metrics.subscriptionSplit.revenueGrowth}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
