'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Types
interface Proposal {
  id: number;
  customerName: string;
  address: string;
  trade: string;
  amount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'won' | 'lost';
  createdAt: string;
  lastActivity: string;
  daysAgo: number;
}

// Sample data - in production this would come from API
const SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: 1,
    customerName: 'Cassie',
    address: '2214 Cedar',
    trade: 'Interior/Exterior',
    amount: 4225,
    status: 'draft',
    createdAt: 'Dec 28, 2024',
    lastActivity: 'Not sent yet',
    daysAgo: 6,
  },
  {
    id: 2,
    customerName: 'Johnson Residence',
    address: '4587 Maple Ave',
    trade: 'Roofing',
    amount: 4225,
    status: 'draft',
    createdAt: 'Dec 30, 2024',
    lastActivity: 'Not sent yet',
    daysAgo: 4,
  },
];

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Components
function MetricIcon({ 
  children, 
  bgColor = 'bg-slate-100',
  textColor = 'text-slate-700'
}: { 
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
}) {
  return (
    <div className={cn(
      'w-9 h-9 rounded-md flex items-center justify-center text-base font-semibold',
      bgColor,
      textColor
    )}>
      {children}
    </div>
  );
}

function TrendBadge({ 
  trend, 
  children 
}: { 
  trend: 'up' | 'down' | 'neutral';
  children: React.ReactNode;
}) {
  const styles = {
    up: 'bg-green-50 text-green-700 border-green-200',
    down: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border',
      styles[trend]
    )}>
      {children}
    </span>
  );
}

function PriorityBadge({ 
  priority 
}: { 
  priority: 'high' | 'medium' | 'low';
}) {
  const styles = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-slate-50 text-slate-600 border border-slate-200',
  };

  const labels = {
    high: 'High Priority',
    medium: 'Recommended',
    low: 'Optional',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
      styles[priority]
    )}>
      {labels[priority]}
    </span>
  );
}

function StatusBadge({ status }: { status: Proposal['status'] }) {
  const styles = {
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    sent: 'bg-blue-50 text-blue-700 border-blue-200',
    viewed: 'bg-purple-50 text-purple-700 border-purple-200',
    accepted: 'bg-amber-50 text-amber-700 border-amber-200',
    won: 'bg-green-50 text-green-700 border-green-200',
    lost: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    won: 'Won',
    lost: 'Lost',
  };

  return (
    <span className={cn(
      'inline-block px-2.5 py-1 rounded text-xs font-semibold border',
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
}

function FunnelStage({ 
  label, 
  value, 
  variant = 'default' 
}: { 
  label: string;
  value: number;
  variant?: 'default' | 'active' | 'success';
}) {
  const styles = {
    default: 'bg-slate-50 border-slate-200',
    active: 'bg-amber-50 border-amber-400',
    success: 'bg-green-50 border-green-300',
  };

  return (
    <div className={cn(
      'flex-1 text-center p-5 rounded-md border-2',
      styles[variant]
    )}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

export default function ContractorProposalDashboard() {
  const [proposals] = useState<Proposal[]>(SAMPLE_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');

  // Calculate metrics
  const metrics = useMemo(() => {
    const draftCount = proposals.filter(p => p.status === 'draft').length;
    const sentCount = proposals.filter(p => p.status === 'sent').length;
    const viewedCount = proposals.filter(p => p.status === 'viewed').length;
    const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
    const wonCount = proposals.filter(p => p.status === 'won').length;
    const totalPending = proposals.filter(p => ['draft', 'sent'].includes(p.status)).length;
    const pipelineValue = proposals
      .filter(p => ['draft', 'sent', 'viewed', 'accepted'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    const totalProposals = proposals.length;
    const winRate = totalProposals > 0 ? Math.round((wonCount / totalProposals) * 100) : 0;

    return {
      draftCount,
      sentCount,
      viewedCount,
      acceptedCount,
      wonCount,
      totalPending,
      pipelineValue,
      winRate,
    };
  }, [proposals]);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchesSearch = 
        searchQuery.length === 0 ||
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.trade.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesTrade = tradeFilter === 'all' || p.trade === tradeFilter;
      return matchesSearch && matchesStatus && matchesTrade;
    });
  }, [proposals, searchQuery, statusFilter, tradeFilter]);

  // Get unique trades for filter
  const uniqueTrades = useMemo(() => {
    return [...new Set(proposals.map(p => p.trade))];
  }, [proposals]);

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-5">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-white px-8 py-5 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-md flex items-center justify-center text-white text-lg font-bold">
            SG
          </div>
          <span className="text-xl font-semibold text-slate-900">SCOPEGEN</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="px-5 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-md text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
          >
            View Templates
          </Link>
          <Link
            href="/app"
            className="px-5 py-2.5 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition-all duration-200"
          >
            Create Proposal (60s)
          </Link>
        </div>
      </header>

      {/* Alert Banner */}
      {metrics.draftCount > 0 && (
        <div className="bg-white border-l-[3px] border-amber-500 rounded-md shadow-sm border-t border-r border-b border-slate-200 mb-6 flex items-center gap-4 px-6 py-4">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-amber-500">!</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-800 mb-1 text-sm">
              {metrics.draftCount} Proposal{metrics.draftCount > 1 ? 's' : ''} Need Your Attention
            </div>
            <div className="text-amber-700 text-sm">
              You have {metrics.draftCount} draft proposal{metrics.draftCount > 1 ? 's' : ''} ready to send. Send them now to get faster responses.
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition-all duration-200">
            Review Drafts
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Pending Proposals - Highlighted */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-amber-500 relative">
          <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 text-[9px] font-bold rounded tracking-wider">
            ACTION NEEDED
          </span>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pending Proposals
            </span>
            <MetricIcon bgColor="bg-amber-50" textColor="text-amber-700">
              {metrics.draftCount}
            </MetricIcon>
          </div>
          <div className="text-3xl font-semibold text-slate-900 mb-2">
            {metrics.draftCount}
          </div>
          <div className="text-sm text-slate-500">
            Awaiting customer response
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pipeline Value
            </span>
            <MetricIcon bgColor="bg-green-50" textColor="text-green-700">
              $
            </MetricIcon>
          </div>
          <div className="text-3xl font-semibold text-slate-900 mb-2">
            {formatCurrency(metrics.pipelineValue)}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            Total pending + draft value
            <TrendBadge trend="up">+33% vs last month</TrendBadge>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Win Rate (30d)
            </span>
            <MetricIcon bgColor="bg-blue-50" textColor="text-blue-700">
              %
            </MetricIcon>
          </div>
          <div className="text-3xl font-semibold text-slate-900 mb-2">
            {metrics.winRate}%
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            Target: 30%
            <TrendBadge trend="neutral">Getting started</TrendBadge>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Avg Response Time
            </span>
            <MetricIcon bgColor="bg-purple-50" textColor="text-purple-700">
              —
            </MetricIcon>
          </div>
          <div className="text-3xl font-semibold text-slate-900 mb-2">
            —
          </div>
          <div className="text-sm text-slate-500">
            Not enough data yet
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 mb-8">
        <h2 className="text-base font-semibold text-slate-900 mb-6">
          Proposal Conversion Funnel
        </h2>
        <div className="flex items-center gap-3 mb-6">
          <FunnelStage label="Draft" value={metrics.draftCount} variant="active" />
          <span className="text-xl text-slate-300">→</span>
          <FunnelStage label="Sent" value={metrics.sentCount} />
          <span className="text-xl text-slate-300">→</span>
          <FunnelStage label="Viewed" value={metrics.viewedCount} />
          <span className="text-xl text-slate-300">→</span>
          <FunnelStage label="Accepted" value={metrics.acceptedCount} />
          <span className="text-xl text-slate-300">→</span>
          <FunnelStage label="Won" value={metrics.wonCount} variant="success" />
        </div>
        <div className="bg-slate-50 border-l-[3px] border-slate-500 rounded-md p-4 text-sm text-slate-700">
          <strong className="text-slate-900">Insight:</strong> Your biggest bottleneck is getting proposals sent. Draft proposals don&apos;t generate revenue. Send them today to start your conversion funnel.
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Performance Benchmarks */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Performance Benchmarks
          </h3>
          <div className="space-y-0">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Industry Avg Win Rate</span>
              <span className="text-sm font-semibold text-slate-900">27-35%</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Your Current Win Rate</span>
              <span className={cn(
                'text-sm font-semibold',
                metrics.winRate === 0 ? 'text-red-600' : 'text-slate-900'
              )}>
                {metrics.winRate}%
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Proposals Needed (30% win)</span>
              <span className="text-sm font-semibold text-slate-900">7-10/month</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-600">Avg Time to First View</span>
              <span className="text-sm font-semibold text-slate-900">2.3 days</span>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Recommended Actions
          </h3>
          <div className="space-y-0">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Send your {metrics.draftCount} draft proposals</span>
              <PriorityBadge priority="high" />
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Set up follow-up reminders</span>
              <PriorityBadge priority="medium" />
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Review pricing strategy</span>
              <PriorityBadge priority="low" />
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-600">Customize proposal templates</span>
              <PriorityBadge priority="low" />
            </div>
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Proposals ({filteredProposals.length})
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm w-64 focus:outline-none focus:border-slate-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm bg-white cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
            >
              <option value="all">Status: All</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm bg-white cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
            >
              <option value="all">Trade: All</option>
              {uniqueTrades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trade
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last Activity
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal) => (
                <tr 
                  key={proposal.id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                >
                  <td className="px-3 py-4">
                    <div className="font-semibold text-slate-900 text-sm">
                      {proposal.customerName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {proposal.address}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-slate-700">
                    {proposal.trade}
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                    {formatCurrency(proposal.amount)}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={proposal.status} />
                  </td>
                  <td className="px-3 py-4 text-sm text-slate-700">
                    {proposal.createdAt}
                  </td>
                  <td className="px-3 py-4">
                    {proposal.status === 'draft' ? (
                      <>
                        <span className="text-red-600 font-medium text-sm">Not sent yet</span>
                        <br />
                        <span className="text-xs text-slate-500">{proposal.daysAgo} days ago</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-700">{proposal.lastActivity}</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1.5">
                      {proposal.status === 'draft' ? (
                        <button className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-900 transition-all duration-200">
                          Send Now
                        </button>
                      ) : null}
                      <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
                        Edit
                      </button>
                      <button className="px-2 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
                        ...
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="px-8 py-12 text-center">
            <div className="text-sm font-semibold text-slate-900 mb-1">No proposals found</div>
            <div className="text-sm text-slate-500">
              Try adjusting your search or filter criteria.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
