// components/DailyReportsTab.js
const { useState, useEffect, useCallback } = require('react');

function DailyReportsTab({ storeId, api }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyReports, setDailyReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [reportsSummary, setReportsSummary] = useState({
    total: 0,
    included: 0,
    excluded: 0,
    duplicate: 0,
    pending: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedReports, setExpandedReports] = useState(new Set());

  // Helper to show success message
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Fetch reports for selected date
  const fetchDailyReports = useCallback(async (date) => {
    try {
      setLoading(true);
      setError('');
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await api.get(
        `/api/admin/reports/daily/${encodeURIComponent(storeId)}?date=${dateStr}`
      );
      
      const reports = data.reports || [];
      setDailyReports(reports);
      
      // Calculate comprehensive summary
      const included = reports.filter(r => r.reconciliationStatus === 'included');
      const excluded = reports.filter(r => r.reconciliationStatus === 'excluded');
      const duplicate = reports.filter(r => r.reconciliationStatus === 'duplicate');
      const pending = reports.filter(r => !r.reconciliationStatus || r.reconciliationStatus === 'pending');
      
      setReportsSummary({
        total: reports.length,
        included: included.length,
        excluded: excluded.length,
        duplicate: duplicate.length,
        pending: pending.length,
        totalRevenue: included.reduce((sum, r) => sum + (r.totalRevenue || 0), 0)
      });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load daily reports');
      setDailyReports([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, api]);

  // Update single report status
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      setLoading(true);
      setError('');
      
      const include = newStatus === 'included';
      await api.post(`/api/admin/reports/${reportId}/reconciliation`, {
        include,
        status: newStatus,
        notes: `Status changed to ${newStatus}`
      });
      
      await fetchDailyReports(selectedDate);
      showSuccess(`Report ${newStatus} successfully`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update report');
    } finally {
      setLoading(false);
    }
  };

  // Bulk update selected reports
  const bulkUpdateStatus = async (newStatus) => {
    if (selectedReports.length === 0) return;
    
    try {
      setLoading(true);
      setError('');
      
      const include = newStatus === 'included';
      await Promise.all(
        selectedReports.map(reportId =>
          api.post(`/api/admin/reports/${reportId}/reconciliation`, {
            include,
            status: newStatus,
            notes: `Bulk ${newStatus}`
          })
        )
      );
      
      setSelectedReports([]);
      await fetchDailyReports(selectedDate);
      showSuccess(`${selectedReports.length} reports updated to ${newStatus}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to bulk update reports');
    } finally {
      setLoading(false);
    }
  };

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

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectedReports.length === dailyReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(dailyReports.map(r => r._id));
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const toggleExpanded = (reportId) => {
    setExpandedReports(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  // Quality score color
  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Load reports when date changes
  useEffect(() => {
    if (storeId) {
      fetchDailyReports(selectedDate);
    }
  }, [selectedDate, storeId, fetchDailyReports]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const configs = {
      included: { color: 'bg-green-900/20 border-green-500/50 text-green-300', label: 'Included' },
      excluded: { color: 'bg-red-900/20 border-red-500/50 text-red-300', label: 'Excluded' },
      duplicate: { color: 'bg-orange-900/20 border-orange-500/50 text-orange-300', label: 'Duplicate' },
      pending: { color: 'bg-gray-900/20 border-gray-500/50 text-gray-300', label: 'Pending' },
    };
    
    const config = configs[status] || configs.pending;
    
    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">About Daily Reports</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Each time the "Daily Report" button is pressed on the Mutha Goose, a report is generated showing revenue from all machines. 
              <span className="text-white font-medium"> Only reports marked as "Included" count toward your revenue totals.</span> 
              {' '}Mark reports as "Excluded" if they're test runs, errors, or duplicates.
            </p>
          </div>
        </div>
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
            <h2 className="text-2xl font-bold text-white">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="text-gray-400 text-sm font-medium">Total Reports</div>
          <div className="text-3xl font-bold text-white mt-1">{reportsSummary.total}</div>
        </div>
        
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-green-300 text-sm font-medium">Included</div>
          <div className="text-3xl font-bold text-white mt-1">{reportsSummary.included}</div>
        </div>
        
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="text-red-300 text-sm font-medium">Excluded</div>
          <div className="text-3xl font-bold text-white mt-1">{reportsSummary.excluded}</div>
        </div>
        
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
          <div className="text-orange-300 text-sm font-medium">Duplicates</div>
          <div className="text-3xl font-bold text-white mt-1">{reportsSummary.duplicate}</div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="text-yellow-300 text-sm font-medium">Total Revenue</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${reportsSummary.totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-yellow-400 mt-1">from included reports</div>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="text-xl">✓</div>
            <p className="text-green-200 font-medium">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="text-xl">⚠</div>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {dailyReports.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedReports.length === dailyReports.length && dailyReports.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                />
                <span className="text-white text-sm font-medium">
                  {selectedReports.length > 0 
                    ? `${selectedReports.length} of ${dailyReports.length} selected`
                    : 'Select all reports'}
                </span>
              </label>
            </div>
            
            {selectedReports.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkUpdateStatus('included')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Include Selected
                </button>
                <button
                  onClick={() => bulkUpdateStatus('excluded')}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Exclude Selected
                </button>
                <button
                  onClick={() => bulkUpdateStatus('duplicate')}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Mark as Duplicate
                </button>
                <button
                  onClick={() => setSelectedReports([])}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports List */}
      {loading && dailyReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-800/30 border border-gray-700/50 rounded-xl">
          <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-400 font-medium">Loading reports...</div>
        </div>
      ) : dailyReports.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-gray-400 text-lg font-medium mb-2">No reports found for this date</div>
          <p className="text-gray-500 text-sm">
            Reports are automatically created when the Raspberry Pi sends daily summary data from the Mutha Goose
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyReports.map((report, index) => {
            const isSelected = selectedReports.includes(report._id);
            const isExpanded = expandedReports.has(report._id);
            const status = report.reconciliationStatus || 'pending';
            
            return (
              <div 
                key={report._id}
                className={`relative bg-gray-800/50 border-2 rounded-xl p-6 transition-all ${
                  status === 'included' 
                    ? 'border-green-500 shadow-lg shadow-green-500/10'
                    : status === 'excluded'
                    ? 'border-red-500/30 opacity-75'
                    : status === 'duplicate'
                    ? 'border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'border-gray-700/50'
                } ${isSelected ? 'ring-2 ring-yellow-500/50' : ''}`}
              >
                {/* Status Corner Badge */}
                {status === 'included' && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    COUNTING IN TOTAL
                  </div>
                )}
                {status === 'excluded' && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    NOT COUNTED
                  </div>
                )}
                {status === 'duplicate' && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    DUPLICATE
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleReportSelection(report._id)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                  />

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-white">
                        Report #{index + 1}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Printed At</div>
                        <div className="text-white font-medium">
                          {new Date(report.printedAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Revenue</div>
                        <div className="text-white font-bold text-lg">
                          ${(report.totalRevenue || 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Machines</div>
                        <div className="text-white font-medium">
                          {report.machineData?.length || 0}
                        </div>
                      </div>
                      <div className="relative group">
                        <div className="text-sm text-gray-400 mb-1">Quality Score</div>
                        <div className={`font-bold text-lg ${getQualityColor(report.qualityScore || 0)}`}>
                          {report.qualityScore || 0}/100
                        </div>
                        
                        {/* Quality Score Tooltip */}
                        <div className="absolute hidden group-hover:block bottom-full mb-2 left-0 bg-gray-900 border border-gray-700 rounded-lg p-3 w-64 z-10 shadow-xl">
                          <div className="text-xs text-gray-300">
                            Quality score based on data completeness, timing consistency, and anomaly detection. 
                            <span className="text-white font-semibold"> Scores below 70 may indicate issues.</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Report ID</div>
                        <div className="text-white font-mono text-xs">
                          {report._id.slice(-8)}
                        </div>
                      </div>
                    </div>

                    {/* Anomaly Warnings */}
                    {report.anomalyReasons && report.anomalyReasons.length > 0 && (
                      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-400 text-xl">⚠</div>
                          <div>
                            <div className="text-yellow-300 text-sm font-semibold mb-1">
                              Data Quality Issues Detected:
                            </div>
                            <ul className="text-yellow-200 text-sm space-y-1">
                              {report.anomalyReasons.map((reason, idx) => (
                                <li key={idx}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Machine Breakdown */}
                    {report.machineData && report.machineData.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleExpanded(report._id)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <span>{isExpanded ? '▼' : '▶'}</span>
                          <span>
                            {isExpanded ? 'Hide' : 'View'} Machine Breakdown ({report.machineData.length} machines)
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
                            {report.machineData.map((machine, idx) => (
                              <div key={idx} className="bg-gray-900/50 border border-gray-700/30 rounded-lg p-3 hover:border-gray-600/50 transition-colors">
                                <div className="text-xs text-gray-400 mb-1">{machine.machineId}</div>
                                <div className="text-white font-bold text-lg">
                                  ${(machine.netRevenue || 0).toFixed(2)}
                                </div>
                                {machine.moneyIn !== undefined && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    In: ${machine.moneyIn.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex-shrink-0">
                    <select
                      value={status}
                      onChange={(e) => updateReportStatus(report._id, e.target.value)}
                      disabled={loading}
                      className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors cursor-pointer ${
                        status === 'included' 
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : status === 'excluded'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : status === 'duplicate'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="included">✓ Include</option>
                      <option value="excluded">✗ Exclude</option>
                      <option value="duplicate">⚠ Duplicate</option>
                      <option value="pending">⏱ Pending</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

module.exports = DailyReportsTab;