function ReportCard({ report, onToggle, onExpand }) {
  const statusColors = {
    pending: 'border-gray-500 bg-gray-900/20',
    included: 'border-green-500 bg-green-900/20',
    excluded: 'border-red-500 bg-red-900/20',
    duplicate: 'border-orange-500 bg-orange-900/20'
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[report.reconciliationStatus]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold">
              Report #{report.printedAt ? new Date(report.printedAt).toLocaleTimeString() : 'Unknown'}
            </h3>
            <StatusBadge status={report.reconciliationStatus} />
          </div>
          
          <div className="text-sm space-y-1 text-gray-300">
            <div>💰 Revenue: <span className="font-bold">${report.totalRevenue.toFixed(2)}</span></div>
            <div>🎰 Machines: {report.machineBreakdown.length}</div>
            {report.dataQuality.issues.length > 0 && (
              <div className="text-yellow-400">
                ⚠️ {report.dataQuality.issues.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {report.reconciliationStatus === 'pending' && (
            <>
              <button onClick={() => onToggle(report._id, true)} 
                      className="btn btn-sm btn-success">
                Include
              </button>
              <button onClick={() => onToggle(report._id, false)} 
                      className="btn btn-sm btn-outline">
                Exclude
              </button>
            </>
          )}
          {report.reconciliationStatus !== 'pending' && (
            <button onClick={() => onToggle(report._id, !report.includeInReconciliation)}
                    className="btn btn-sm btn-outline">
              {report.includeInReconciliation ? 'Exclude' : 'Include'}
            </button>
          )}
        </div>
      </div>
      
      <button onClick={() => onExpand(report._id)}
              className="text-xs text-blue-400 mt-2">
        View Details ▼
      </button>
    </div>
  );
}