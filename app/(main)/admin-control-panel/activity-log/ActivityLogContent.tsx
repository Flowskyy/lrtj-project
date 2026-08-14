"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp, Activity } from "lucide-react";
import GlassTable from "@/components/GlassTable";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import Pagination from "@/components/Pagination";
import { formatWIBDate } from "@/lib/formatWIBDate";
import { useActivityLogUpdates } from "@/hooks/use-activity-log-updates";

interface ActivityLog {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRoleId: number | null;
  actorRoleName: string | null;
  tableName: string;
  recordId: string;
  action: string;
  beforeState: any;
  afterState: any;
  changedFields: string[] | null;
  createdAt: string;
  revertedAt: string | null;
  revertedByUserId: string | null;
}

interface ActivityLogContentProps {
  currentUserId: string;
}

export default function ActivityLogContent({ currentUserId }: ActivityLogContentProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedActor, setSelectedActor] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [logToRevert, setLogToRevert] = useState<ActivityLog | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [userTimelineUserId, setUserTimelineUserId] = useState<string | null>(null);
  const [showUserTimeline, setShowUserTimeline] = useState(false);
  const [roles, setRoles] = useState<Array<{id: number, name: string}>>([]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const activeFilterCount = (selectedTable ? 1 : 0) + (selectedAction ? 1 : 0) + (selectedActor ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedTable("");
    setSelectedAction("");
    setSelectedActor("");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchLogs = async (filters: any = {}, opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...filters,
      });

      const url = userTimelineUserId
        ? `/api/activity-logs?actor=${userTimelineUserId}&${params.toString()}`
        : `/api/activity-logs?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error("Failed to fetch activity logs");
      }
    } catch (err) {
      console.error("Failed to fetch activity logs", err);
      toast.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const { isConnected, onLogsAdded, onLogsReverted } = useActivityLogUpdates();

  const fetchLogsRef = useRef(fetchLogs);
  fetchLogsRef.current = fetchLogs;

  useEffect(() => {
    onLogsAdded(() => fetchLogsRef.current({}, { silent: true }));
    onLogsReverted(() => fetchLogsRef.current({}, { silent: true }));
  }, [onLogsAdded, onLogsReverted]);

  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      fetchLogsRef.current({}, { silent: true });
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    const filters: any = {};
    if (selectedTable) filters.table = selectedTable;
    if (selectedAction) filters.action = selectedAction;
    if (selectedActor) filters.actor = selectedActor;
    if (activeTab !== "all") filters.role = activeTab;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.order = sortOrder;

    fetchLogs(filters);
  }, [page, selectedTable, selectedAction, selectedActor, activeTab, startDate, endDate, sortBy, sortOrder, userTimelineUserId]);

  const handleRevert = async () => {
    if (!logToRevert) return;

    setIsReverting(true);
    try {
      const res = await fetch(`/api/activity-logs/${logToRevert.id}/revert`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Revert successful");
        setRevertDialogOpen(false);
        setLogToRevert(null);
        fetchLogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to revert");
      }
    } catch (err) {
      console.error("Failed to revert", err);
      toast.error("Failed to revert");
    } finally {
      setIsReverting(false);
    }
  };

  const openRevertDialog = (log: ActivityLog) => {
    setLogToRevert(log);
    setRevertDialogOpen(true);
  };

  const handleShowUserTimeline = (userId: string) => {
    setUserTimelineUserId(userId);
    setShowUserTimeline(true);
    setPage(1);
  };

  const closeUserTimeline = () => {
    setUserTimelineUserId(null);
    setShowUserTimeline(false);
    setPage(1);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-50 text-green-700 border-green-200/80",
      UPDATE: "bg-blue-50 text-blue-700 border-blue-200/80",
      DELETE: "bg-red-50 text-red-700 border-red-200/80",
    };
    return colors[action] || "bg-gray-100 text-gray-800 border-gray-200/80";
  };

  const formatTableForDisplay = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getChangedFieldsSummary = (log: ActivityLog) => {
    if (log.action === 'CREATE') return 'New record created';
    if (log.action === 'DELETE') return 'Record deleted';
    if (!log.changedFields || log.changedFields.length === 0) return 'No changes';

    if (log.changedFields.length <= 3) {
      return `Changed: ${log.changedFields.join(', ')}`;
    }
    return `Changed: ${log.changedFields.slice(0, 3).join(', ')} +${log.changedFields.length - 3} more`;
  };

  const tableOptions = Array.from(new Set(logs.map(log => log.tableName))).sort().map((table) => ({
    value: table,
    label: formatTableForDisplay(table)
  }));

  const actionOptions = [
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" }
  ];

  const actorOptions = Array.from(new Map(
    logs
      .filter(log => log.actorUserId && log.actorName)
      .map(log => [log.actorUserId!, log.actorName!])
  ).entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {showUserTimeline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeUserTimeline}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {showUserTimeline ? 'User Activity Timeline' : 'Activity Log'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {showUserTimeline
                ? 'Track all changes made by this user'
                : 'Monitor system changes and activity history'
              }
            </p>
          </div>
        </div>
        {!showUserTimeline && (
          <div className="flex items-center gap-2">
            <TableFilterSortMenu
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              sortByOptions={[
                { value: "createdAt", label: "Created Date" },
                { value: "action", label: "Action" },
                { value: "tableName", label: "Table" }
              ]}
              typeFilter={selectedTable}
              onTypeFilterChange={setSelectedTable}
              typeOptions={tableOptions}
              showTypeFilter={true}
              statusFilter={selectedAction}
              onStatusFilterChange={setSelectedAction}
              statusOptions={actionOptions}
              showStatusFilter={true}
              actorFilter={selectedActor}
              onActorFilterChange={setSelectedActor}
              actorOptions={actorOptions}
              showActorFilter={true}
              dateFrom={startDate}
              onDateFromChange={setStartDate}
              dateTo={endDate}
              onDateToChange={setEndDate}
              showDateRange={true}
              onResetFilters={handleResetFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        )}
      </div>

      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#E5262C]" />
            {showUserTimeline ? 'Timeline Activity' : 'Activity Logs'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="group/tabs-list inline-flex w-fit items-center justify-center rounded-2xl p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none backdrop-blur-sm mb-1 bg-gray-100/80 border border-gray-200/60" variant="default">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                All Activity
              </TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.name} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  {role.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <GlassTable
                columns={[
                  { key: "activity", header: "Activity" },
                  { key: "time", header: "Time", width: "11rem" },
                  { key: "status", header: "Status", width: "8rem" },
                  { key: "actions", header: "", width: "3rem" },
                ]}
                rows={logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return {
                    id: log.id,
                    className: isExpanded ? "border-b-0 bg-gray-50/70" : undefined,
                    showDetail: isExpanded,
                    detailContent: (
                      <div className="bg-gray-50/70">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Record ID</span>
                            <span className="font-medium text-gray-900 font-mono text-xs">{log.recordId}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Table</span>
                            <span className="font-medium text-gray-900">{formatTableForDisplay(log.tableName)}</span>
                          </div>
                          {log.revertedAt ? (
                            <>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Reverted At</span>
                                <span className="font-medium text-gray-900">{formatWIBDate(log.revertedAt)}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Reverted By</span>
                                <span className="font-medium text-gray-900">{log.revertedByUserId || '—'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Actor</span>
                                <span className="font-medium text-gray-900">{log.actorName || 'System'}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Role</span>
                                <span className="font-medium text-gray-900">{log.actorRoleName || '—'}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          {log.beforeState && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Before State</h4>
                              </div>
                              <pre className="text-xs bg-white p-4 rounded-lg border border-gray-200/80 overflow-auto max-h-64 font-mono text-gray-800">
                                {JSON.stringify(log.beforeState, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.afterState && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">After State</h4>
                              </div>
                              <pre className="text-xs bg-white p-4 rounded-lg border border-gray-200/80 overflow-auto max-h-64 font-mono text-gray-800">
                                {JSON.stringify(log.afterState, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                    cells: [
                      <div key="activity">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <button
                            onClick={() => {
                              if (log.actorUserId) handleShowUserTimeline(log.actorUserId);
                            }}
                            className={`font-medium text-gray-900 ${log.actorUserId ? "hover:text-[#E5262C] hover:underline transition-colors cursor-pointer" : ""}`}
                            title={log.actorUserId ? `View ${log.actorName || 'System'}'s activity timeline` : undefined}
                          >
                            {log.actorName || 'System'}
                          </button>
                          {log.actorEmail && (
                            <span className="text-gray-500">{log.actorEmail}</span>
                          )}
                          <Badge variant="outline" className={`${getActionBadge(log.action)} shrink-0 ml-auto text-[10px]`}>
                            {log.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-700">
                            {formatTableForDisplay(log.tableName)}
                          </span>
                          <span className="text-gray-400">&bull;</span>
                          <span className="text-gray-600">
                            {getChangedFieldsSummary(log)}
                          </span>
                        </div>
                      </div>,
                      <div key="time" className="text-gray-500">
                        {formatWIBDate(log.createdAt)}
                      </div>,
                      <div key="status">
                        {log.revertedAt ? (
                          <Badge variant="outline" className="text-xs bg-gray-100/80 border-gray-200/80 text-gray-600">
                            Reverted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-200/80 text-green-700">
                            Active
                          </Badge>
                        )}
                      </div>,
                      <div key="actions" className="flex items-center justify-end gap-1">
                        {log.revertedAt ? (
                          <span className="text-xs text-gray-500 italic">(reverted)</span>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRevertDialog(log)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Revert this change"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLogId(
                                expandedLogId === log.id ? null : log.id
                              )}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                              title={isExpanded ? "Collapse details" : "View details"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>,
                    ],
                  };
                })}
                loading={loading}
                emptyMessage="No activity logs found"
              />

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {logToRevert && (
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent showCloseButton={false} className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                  <RotateCcw className="h-5 w-5 text-[#E5262C]" />
                </div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Revert Activity
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to revert this {logToRevert.action.toLowerCase()} action?
                This will restore the record to its state before this change.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Action</span>
                    <Badge variant="outline" className={`${getActionBadge(logToRevert.action)} mt-1`}>
                      {logToRevert.action}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Table</span>
                    <div className="font-medium text-gray-900 mt-1">
                      {formatTableForDisplay(logToRevert.tableName)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Record ID</span>
                    <div className="font-medium text-gray-900 font-mono mt-1 truncate">
                      {logToRevert.recordId}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Time</span>
                    <div className="font-medium text-gray-900 mt-1 text-xs">
                      {formatWIBDate(logToRevert.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {logToRevert.changedFields && logToRevert.changedFields.length > 0 && (
                <div className="rounded-xl border border-gray-200/80 p-4">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Changed Fields</span>
                  <div className="flex flex-wrap gap-1.5">
                    {logToRevert.changedFields.map(field => (
                      <Badge
                        key={field}
                        variant="outline"
                        className="text-xs bg-gray-100/80 border-gray-200/80 text-gray-700"
                      >
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-gray-200/60 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRevertDialogOpen(false)}
                disabled={isReverting}
                className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevert}
                disabled={isReverting}
                className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41e24] text-white font-medium shadow-sm"
              >
                {isReverting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Reverting...
                  </span>
                ) : (
                  'Confirm Revert'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
