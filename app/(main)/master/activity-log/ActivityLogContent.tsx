"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import GlassTable, { GlassTableColumn, GlassTableRow } from "@/components/GlassTable";
import TableFilterSortMenu from "@/components/TableFilterSortMenu";
import { formatFullDateWithTime } from "@/lib/formatWIBDate";

interface ActivityLog {
  id: bigint;
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
  const [expandedLogId, setExpandedLogId] = useState<bigint | null>(null);
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

  const fetchLogs = async (filters: any = {}) => {
    setLoading(true);
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

  useEffect(() => {
    const filters: any = {};
    if (selectedTable) filters.table = selectedTable;
    if (selectedAction) filters.action = selectedAction;
    if (selectedActor) filters.actor = selectedActor;
    if (activeTab !== "all" && activeTab !== "role") filters.role = activeTab;
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
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
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
    { value: "", label: "All actions" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {showUserTimeline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeUserTimeline}
              className="h-8 w-8 p-0"
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
                : 'Track all changes across the system'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
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

      {/* Main Content Card */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="text-gray-900 font-semibold tracking-tight">
            {showUserTimeline ? 'User Activity' : activeTab === 'all' ? 'All Activity' : `${activeTab} Activity`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 px-6">
          {!showUserTimeline ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="group/tabs-list inline-flex w-fit items-center justify-center rounded-2xl p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:data-[variant=line]:rounded-none backdrop-blur-sm mb-1 bg-gray-100/80 border border-gray-200/60" variant="default">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">All Activity</TabsTrigger>
                {roles.map((role) => (
                  <TabsTrigger key={role.id} value={role.name} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                    {role.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <GlassTable
                  columns={[
                    { key: "actor", header: "Actor", width: "12rem" },
                    { key: "action", header: "Action", width: "6rem" },
                    { key: "table", header: "Table" },
                    { key: "changes", header: "Changes" },
                    { key: "time", header: "Time", width: "10rem" },
                    { key: "actions", header: "Actions", width: "8rem" },
                  ]}
                  rows={logs.map((log) => ({
                    id: log.id.toString(),
                    cells: [
                      <div key="actor" className="flex flex-col">
                        <span className="font-medium">{log.actorName || 'System'}</span>
                        {log.actorEmail && (
                          <span className="text-xs text-gray-500">{log.actorEmail}</span>
                        )}
                        {log.actorUserId && (
                          <button
                            onClick={() => handleShowUserTimeline(log.actorUserId!)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1"
                          >
                            View timeline
                          </button>
                        )}
                      </div>,
                      <Badge key="action" className={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>,
                      <span key="table" className="font-medium">
                        {formatTableForDisplay(log.tableName)}
                      </span>,
                      <span key="changes" className="text-sm text-gray-600">
                        {getChangedFieldsSummary(log)}
                      </span>,
                      <span key="time" className="text-sm">
                        {formatFullDateWithTime(log.createdAt)}
                      </span>,
                      <div key="actions" className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLogId(
                            expandedLogId === log.id ? null : log.id
                          )}
                          className="h-8 w-8 p-0"
                        >
                          {expandedLogId === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        {!log.revertedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRevertDialog(log)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Revert this change"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {log.revertedAt && (
                          <Badge variant="outline" className="text-xs">
                            Reverted
                          </Badge>
                        )}
                      </div>,
                    ],
                  }))}
                  loading={loading}
                  emptyMessage="No activity logs found"
                />

                {/* Expanded Details */}
                {expandedLogId && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    {(() => {
                      const log = logs.find(l => l.id === expandedLogId);
                      if (!log) return null;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Record ID:</span> {log.recordId}
                            </div>
                            <div>
                              <span className="font-medium">Table:</span> {log.tableName}
                            </div>
                            {log.revertedAt && (
                              <>
                                <div>
                                  <span className="font-medium">Reverted At:</span> {formatFullDateWithTime(log.revertedAt)}
                                </div>
                                <div>
                                  <span className="font-medium">Reverted By:</span> {log.revertedByUserId}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {log.beforeState && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Before State:</h4>
                              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                                {JSON.stringify(log.beforeState, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {log.afterState && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">After State:</h4>
                              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                                {JSON.stringify(log.afterState, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* User Timeline view - no tabs, just the table */}
              <GlassTable
                columns={[
                  { key: "actor", header: "Actor", width: "12rem" },
                  { key: "action", header: "Action", width: "6rem" },
                  { key: "table", header: "Table" },
                  { key: "changes", header: "Changes" },
                  { key: "time", header: "Time", width: "10rem" },
                  { key: "actions", header: "Actions", width: "8rem" },
                ]}
                rows={logs.map((log) => ({
                  id: log.id.toString(),
                  cells: [
                    <div key="actor" className="flex flex-col">
                      <span className="font-medium">{log.actorName || 'System'}</span>
                      {log.actorEmail && (
                        <span className="text-xs text-gray-500">{log.actorEmail}</span>
                      )}
                    </div>,
                    <Badge key="action" className={getActionBadge(log.action)}>
                      {log.action}
                    </Badge>,
                    <span key="table" className="font-medium">
                      {formatTableForDisplay(log.tableName)}
                    </span>,
                    <span key="changes" className="text-sm text-gray-600">
                      {getChangedFieldsSummary(log)}
                    </span>,
                    <span key="time" className="text-sm">
                      {formatFullDateWithTime(log.createdAt)}
                    </span>,
                    <div key="actions" className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLogId(
                          expandedLogId === log.id ? null : log.id
                        )}
                        className="h-8 w-8 p-0"
                      >
                        {expandedLogId === log.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {!log.revertedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRevertDialog(log)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Revert this change"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {log.revertedAt && (
                        <Badge variant="outline" className="text-xs">
                          Reverted
                        </Badge>
                      )}
                    </div>,
                  ],
                }))}
                loading={loading}
                emptyMessage="No activity logs found"
              />

              {/* Expanded Details - User Timeline */}
              {expandedLogId && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  {(() => {
                    const log = logs.find(l => l.id === expandedLogId);
                    if (!log) return null;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Record ID:</span> {log.recordId}
                          </div>
                          <div>
                            <span className="font-medium">Table:</span> {log.tableName}
                          </div>
                          {log.revertedAt && (
                            <>
                              <div>
                                <span className="font-medium">Reverted At:</span> {formatFullDateWithTime(log.revertedAt)}
                              </div>
                              <div>
                                <span className="font-medium">Reverted By:</span> {log.revertedByUserId}
                              </div>
                            </>
                          )}
                        </div>

                        {log.beforeState && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Before State:</h4>
                            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                              {JSON.stringify(log.beforeState, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.afterState && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">After State:</h4>
                            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                              {JSON.stringify(log.afterState, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Pagination - User Timeline */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revert Confirmation Dialog */}
      {logToRevert && (
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revert Activity Log Entry</DialogTitle>
              <DialogDescription>
                Are you sure you want to revert this {logToRevert.action.toLowerCase()} action?
                This will restore the record to its state before this change.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Action:</span> {logToRevert.action}
                </div>
                <div>
                  <span className="font-medium">Table:</span> {formatTableForDisplay(logToRevert.tableName)}
                </div>
                <div>
                  <span className="font-medium">Record ID:</span> {logToRevert.recordId}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {formatFullDateWithTime(logToRevert.createdAt)}
                </div>
              </div>
              
              {logToRevert.changedFields && logToRevert.changedFields.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Changed fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {logToRevert.changedFields.map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRevertDialogOpen(false)}
                disabled={isReverting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevert}
                disabled={isReverting}
                className="bg-[#E5262C] hover:bg-[#c91e24] text-white"
              >
                {isReverting ? 'Reverting...' : 'Confirm Revert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}