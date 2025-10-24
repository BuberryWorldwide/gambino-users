// /opt/gambino/frontend/src/app/admin/stores/[storeId]/components/FinancialSummaryTab.js
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function FinancialSummaryTab({ storeId, store }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // For fee adjustment (super admin only)
  const [editingFee, setEditingFee] = useState(false);
  const [newFeePercentage, setNewFeePercentage] = useState(store?.feePercentage || 0);
  const [savingFee, setSavingFee] = useState(false);

  // Fetch financial summary
  const fetchSummary = async (date) => {
    try {
      setLoading(true);
      setError('');
      
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await api.get(
        `/api/admin/reports/${encodeURIComponent(storeId)}/financial-summary?date=${dateStr}`
      );
      
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch financial summary:', err);
      setError(err?.response?.data?.error || 'Failed to load financial summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Load summary when date changes
  useEffect(() => {
    if (storeId) {
      fetchSummary(selectedDate);
    }
  }, [selectedDate, storeId]);

  // Date navigation
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Update fee percentage (super admin only)
  const handleSaveFee = async () => {
    try {
      setSavingFee(true);
      const feeValue = Math.max(0, Math.min(100, parseFloat(newFeePercentage) || 0));
      
      await api.put(`/api/admin/stores/${encodeURIComponent(storeId)}`, {
        feePercentage: feeValue
      });
      
      setEditingFee(false);
      
      // Refresh summary with new fee
      await fetchSummary(selectedDate);
      
      alert('Fee percentage updated successfully');
    } catch (err) {
      console.error('Failed to update fee:', err);
      alert(err?.response?.data?.error || 'Failed to update fee percentage');
    } finally {
      setSavingFee(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Financial Summary</h2>
        <p className="text-gray-400">
          Daily revenue, payouts, and fee calculations
        </p>
      </div>

      {/* Date Navigator */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            ← Previous Day
          </button>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            {!isToday(selectedDate) && (
              <button
                onClick={goToToday}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline mt-1 transition-colors"
              >
                Jump to Today
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            disabled={isToday(selectedDate)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Next Day →
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading financial summary...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => fetchSummary(selectedDate)}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Period Open State - Daily Report Not Yet Submitted */}
      {summary && !loading && summary.status === 'open' && (
        <div className="space-y-6">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Period Open - Daily Report Pending
            </h3>
            <p className="text-yellow-200 text-lg mb-6">
              Financial summary will be available after the <strong>Daily Report</strong> button 
              is pressed on the Mutha Goose machine.
            </p>
            
            {summary.voucherCount > 0 && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-sm text-gray-400 mb-2">Activity Today</div>
                <div className="text-4xl font-bold text-white mb-2">
                  {summary.voucherCount} {summary.voucherCount === 1 ? 'voucher' : 'vouchers'}
                </div>
                <div className="text-2xl text-red-300">
                  {formatCurrency(summary.voucherTotal)} paid out
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  Revenue will be calculated after daily report submission
                </div>
              </div>
            )}
            
            {summary.voucherCount === 0 && (
              <div className="text-gray-400 mt-4">
                No vouchers issued yet today
              </div>
            )}
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">ℹ️</div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-1">How It Works</h4>
                <p className="text-blue-200 text-sm">
                  Press the <strong>Daily Report</strong> button on the Mutha Goose at the end of each day. 
                  This records total Money IN and allows accurate financial calculations with fee breakdown.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Closed State - Full Financial Summary */}
      {summary && !loading && summary.status === 'closed' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">✅</div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-1">Period Closed - Reconciled</h4>
                <p className="text-blue-200 text-sm">
                  Daily report submitted with {summary.reportCount} {summary.reportCount === 1 ? 'report' : 'reports'}.
                  Financial data is complete and accurate.
                </p>
              </div>
            </div>
          </div>

          {/* Main Financial Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Money IN Card */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-300">Money IN</h3>
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                  {summary.reportCount} report{summary.reportCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {formatCurrency(summary.moneyIn)}
              </div>
              <p className="text-sm text-green-200">From daily reports</p>
            </div>

            {/* Money OUT Card */}
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-300">Money OUT</h3>
                <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
                  {summary.voucherCount} voucher{summary.voucherCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {formatCurrency(summary.moneyOut)}
              </div>
              <p className="text-sm text-red-200">Customer payouts</p>
            </div>
          </div>

          {/* Net Revenue Card */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">Net Revenue</h3>
            <div className="text-5xl font-bold text-white mb-2">
              {formatCurrency(summary.netRevenue)}
            </div>
            <p className="text-sm text-blue-200">
              {formatCurrency(summary.moneyIn)} (IN) - {formatCurrency(summary.moneyOut)} (OUT)
            </p>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Fee Breakdown</h3>
              
              {/* Fee percentage display/edit */}
              <div className="flex items-center gap-3">
                {editingFee ? (
                  <>
                    <input
                      type="number"
                      value={newFeePercentage}
                      onChange={(e) => setNewFeePercentage(e.target.value)}
                      className="w-20 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={savingFee}
                    />
                    <span className="text-gray-400">%</span>
                    <button
                      onClick={handleSaveFee}
                      disabled={savingFee}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm rounded transition-colors"
                    >
                      {savingFee ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingFee(false);
                        setNewFeePercentage(store?.feePercentage || 0);
                      }}
                      disabled={savingFee}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-yellow-400">
                      {summary.feePercentage}%
                    </span>
                    <button
                      onClick={() => setEditingFee(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Edit Fee
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gambino's Fee */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-5">
                <h4 className="text-sm font-medium text-yellow-300 mb-3">Gambino's Fee ({summary.feePercentage}%)</h4>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summary.gambinoFee)}
                </div>
                <p className="text-xs text-yellow-200">
                  {formatCurrency(summary.netRevenue)} × {summary.feePercentage}%
                </p>
              </div>

              {/* Store Keeps */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-5">
                <h4 className="text-sm font-medium text-green-300 mb-3">Store Keeps</h4>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summary.storeKeeps)}
                </div>
                <p className="text-xs text-green-200">
                  {formatCurrency(summary.netRevenue)} - {formatCurrency(summary.gambinoFee)}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Calculation Details</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Money IN ({summary.reportCount} report{summary.reportCount !== 1 ? 's' : ''}):</span>
                <span className="text-white">{formatCurrency(summary.moneyIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Money OUT ({summary.voucherCount} voucher{summary.voucherCount !== 1 ? 's' : ''}):</span>
                <span className="text-white">- {formatCurrency(summary.moneyOut)}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold">
                <span className="text-blue-400">Net Revenue:</span>
                <span className="text-white">{formatCurrency(summary.netRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gambino Fee ({summary.feePercentage}%):</span>
                <span className="text-white">- {formatCurrency(summary.gambinoFee)}</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-lg">
                <span className="text-green-400">Store Keeps:</span>
                <span className="text-green-300">{formatCurrency(summary.storeKeeps)}</span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-xs text-gray-500">
            Calculated at {new Date(summary.calculatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}