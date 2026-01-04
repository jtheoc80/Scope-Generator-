'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Sample data - in production this would come from API
const SAMPLE_PROPOSALS = [
  {
    id: 1,
    customer: 'Anderson Construction',
    trade: 'Roofing',
    amount: 15500,
    status: 'draft',
    created: '2024-01-02',
    lastActivity: 'Not sent yet',
  },
  {
    id: 2,
    customer: 'Miller Home Services',
    trade: 'HVAC',
    amount: 8200,
    status: 'draft',
    created: '2024-01-01',
    lastActivity: 'Not sent yet',
  },
  {
    id: 3,
    customer: 'Johnson Renovations',
    trade: 'Kitchen Remodel',
    amount: 24000,
    status: 'viewed',
    created: '2023-12-28',
    lastActivity: '2 days ago',
  },
];

export default function ContractorProposalDashboard() {
  const router = useRouter();
  const [proposals, setProposals] = useState(SAMPLE_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calculate metrics
  const pendingCount = proposals.filter(p => p.status === 'draft').length;
  const pipelineValue = proposals.reduce((sum, p) => sum + p.amount, 0);
  const totalProposals = proposals.length;
  const wonProposals = proposals.filter(p => p.status === 'won').length;
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  // Funnel counts
  const draftCount = proposals.filter(p => p.status === 'draft').length;
  const sentCount = proposals.filter(p => p.status === 'sent').length;
  const viewedCount = proposals.filter(p => p.status === 'viewed').length;
  const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
  const wonCount = proposals.filter(p => p.status === 'won').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viewed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'accepted':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'won':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.trade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-white border-l-[3px] border-[#d69e2e]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#fef5e7] flex items-center justify-center">
                <span className="text-[#d69e2e] font-semibold text-sm">!</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#d69e2e] mb-1">
                  Action Required
                </h3>
                <p className="text-sm text-[#b7791f]">
                  You have {pendingCount} draft proposal{pendingCount > 1 ? 's' : ''} waiting to be sent. Send them now to move deals forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#1a202c]">Proposal Dashboard</h1>
              <p className="text-sm text-[#718096] mt-1">Manage and track your contractor proposals</p>
            </div>
            <button
              onClick={() => router.push('/generator')}
              className="px-5 py-2.5 bg-[#2d3748] text-white text-sm font-medium rounded-md hover:bg-[#1a202c] transition-colors duration-200"
            >
              New Proposal
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Pending Proposals */}
          <div className="bg-white border-2 border-[#d69e2e] rounded-lg shadow-sm p-6 relative">
            <div className="absolute top-4 right-4 px-2 py-1 bg-[#fef5e7] border border-[#d69e2e] rounded text-[10px] font-semibold text-[#d69e2e] uppercase tracking-wide">
              Action Needed
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#fef5e7] rounded-lg flex items-center justify-center">
                <span className="text-[#d69e2e] text-xl font-bold">{pendingCount}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-2">
                  Pending Proposals
                </div>
                <div className="text-2xl font-semibold text-[#1a202c]">
                  {pendingCount}
                </div>
                <div className="text-xs text-[#718096] mt-1">
                  Awaiting action
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Value */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#f7fafc] rounded-lg flex items-center justify-center">
                <span className="text-[#2d3748] text-xl font-bold">$</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-2">
                  Pipeline Value
                </div>
                <div className="text-2xl font-semibold text-[#1a202c]">
                  {formatCurrency(pipelineValue)}
                </div>
                <div className="text-xs text-[#15803d] mt-1">
                  +33% vs last month
                </div>
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#f7fafc] rounded-lg flex items-center justify-center">
                <span className="text-[#2d3748] text-xl font-bold">%</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-2">
                  Win Rate
                </div>
                <div className="text-2xl font-semibold text-[#1a202c]">
                  {winRate}%
                </div>
                <div className="text-xs text-[#718096] mt-1">
                  Target: 30%
                </div>
              </div>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#f7fafc] rounded-lg flex items-center justify-center">
                <span className="text-[#2d3748] text-xl font-bold">—</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-2">
                  Avg Response Time
                </div>
                <div className="text-2xl font-semibold text-[#1a202c]">
                  —
                </div>
                <div className="text-xs text-[#718096] mt-1">
                  No data yet
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-4">
            Conversion Funnel
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Draft */}
            <div className="flex-1 min-w-[100px]">
              <div className="bg-[#fef5e7] border border-[#d69e2e] rounded-md p-4">
                <div className="text-xs font-medium text-[#718096] mb-1">Draft</div>
                <div className="text-2xl font-semibold text-[#1a202c]">{draftCount}</div>
              </div>
            </div>

            <span className="text-[#cbd5e0] text-lg flex-shrink-0">→</span>

            {/* Sent */}
            <div className="flex-1 min-w-[100px]">
              <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-md p-4">
                <div className="text-xs font-medium text-[#718096] mb-1">Sent</div>
                <div className="text-2xl font-semibold text-[#1a202c]">{sentCount}</div>
              </div>
            </div>

            <span className="text-[#cbd5e0] text-lg flex-shrink-0">→</span>

            {/* Viewed */}
            <div className="flex-1 min-w-[100px]">
              <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-md p-4">
                <div className="text-xs font-medium text-[#718096] mb-1">Viewed</div>
                <div className="text-2xl font-semibold text-[#1a202c]">{viewedCount}</div>
              </div>
            </div>

            <span className="text-[#cbd5e0] text-lg flex-shrink-0">→</span>

            {/* Accepted */}
            <div className="flex-1 min-w-[100px]">
              <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-md p-4">
                <div className="text-xs font-medium text-[#718096] mb-1">Accepted</div>
                <div className="text-2xl font-semibold text-[#1a202c]">{acceptedCount}</div>
              </div>
            </div>

            <span className="text-[#cbd5e0] text-lg flex-shrink-0">→</span>

            {/* Won */}
            <div className="flex-1 min-w-[100px]">
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-md p-4">
                <div className="text-xs font-medium text-[#718096] mb-1">Won</div>
                <div className="text-2xl font-semibold text-[#1a202c]">{wonCount}</div>
              </div>
            </div>
          </div>

          {/* Insight Box */}
          <div className="mt-4 bg-[#f7fafc] border-l-[3px] border-[#718096] rounded-md p-4">
            <p className="text-sm text-[#1a202c]">
              <span className="font-semibold">Insight:</span> {draftCount} proposals are in draft status. 
              Sending them could increase your pipeline by {formatCurrency(proposals.filter(p => p.status === 'draft').reduce((sum, p) => sum + p.amount, 0))}.
            </p>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Benchmarks */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-4">
              Performance Benchmarks
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0]">
                <span className="text-sm text-[#1a202c]">Industry avg win rate</span>
                <span className="text-sm font-semibold text-[#718096]">27-35%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0]">
                <span className="text-sm text-[#1a202c]">Your current win rate</span>
                <span className="text-sm font-semibold text-[#dc2626]">{winRate}%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e2e8f0]">
                <span className="text-sm text-[#1a202c]">Proposals needed for 30% win rate</span>
                <span className="text-sm font-semibold text-[#718096]">
                  {wonCount > 0 ? Math.ceil(wonCount / 0.3) : '10+'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#1a202c]">Avg time to first view</span>
                <span className="text-sm font-semibold text-[#718096]">—</span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#718096] mb-4">
              Recommended Actions
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm text-[#1a202c] mb-1">Send draft proposals</div>
                  <span className="inline-block px-2 py-1 bg-[#fee2e2] text-[#dc2626] text-xs font-medium rounded">
                    High Priority
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-[#e2e8f0]">
                <div className="flex-1">
                  <div className="text-sm text-[#1a202c] mb-1">Set up follow-up reminders</div>
                  <span className="inline-block px-2 py-1 bg-[#fef5e7] text-[#d69e2e] text-xs font-medium rounded">
                    Recommended
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-[#e2e8f0]">
                <div className="flex-1">
                  <div className="text-sm text-[#1a202c] mb-1">Review pricing strategy</div>
                  <span className="inline-block px-2 py-1 bg-[#f7fafc] text-[#718096] text-xs font-medium rounded border border-[#e2e8f0]">
                    Optional
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-[#e2e8f0]">
                <div className="flex-1">
                  <div className="text-sm text-[#1a202c] mb-1">Customize templates</div>
                  <span className="inline-block px-2 py-1 bg-[#f7fafc] text-[#718096] text-xs font-medium rounded border border-[#e2e8f0]">
                    Optional
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-[#e2e8f0]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-base font-semibold text-[#1a202c]">Recent Proposals</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d3748] focus:border-transparent"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d3748] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="won">Won</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f7fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Trade
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#718096]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-[#f7fafc] transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#1a202c]">{proposal.customer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#718096]">{proposal.trade}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-[#1a202c]">{formatCurrency(proposal.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#718096]">{proposal.created}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#718096]">
                        {proposal.status === 'draft' ? (
                          <span className="text-[#dc2626]">Not sent yet</span>
                        ) : (
                          proposal.lastActivity
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {proposal.status === 'draft' ? (
                          <button className="px-3 py-1.5 bg-[#2d3748] text-white text-xs font-medium rounded-md hover:bg-[#1a202c] transition-colors duration-200">
                            Send Now
                          </button>
                        ) : (
                          <>
                            <button className="px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#718096] text-xs font-medium rounded-md hover:bg-[#f7fafc] transition-colors duration-200">
                              View
                            </button>
                            <button className="px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#718096] text-xs font-medium rounded-md hover:bg-[#f7fafc] transition-colors duration-200">
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProposals.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#718096]">No proposals found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
