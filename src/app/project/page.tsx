"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  GitBranch,
  History,
  Info,
  RefreshCw,
  UserCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/auth-context";
import { useWorkflow } from "@/context/workflow-context";
import {
  ProcessStage,
  User,
  WorkflowActionType,
  WorkflowNotification,
  WorkflowStage,
  WorkflowStageStatus,
} from "@/types";
import { cn } from "@/lib/utils";
import { TechnicalPanel } from "./components/TechnicalPanel";

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

const statusText: Record<WorkflowStageStatus, string> = {
  [WorkflowStageStatus.PENDING]: "Chờ tiếp nhận",
  [WorkflowStageStatus.IN_PROGRESS]: "Đang thực hiện",
  [WorkflowStageStatus.COMPLETED]: "Đã hoàn thành",
};

const actionText: Record<WorkflowActionType, string> = {
  [WorkflowActionType.STARTED]: "Khởi tạo",
  [WorkflowActionType.COMPLETED]: "Hoàn thành",
};

const statusIcon: Record<WorkflowStageStatus, JSX.Element> = {
  [WorkflowStageStatus.PENDING]: <Clock className="h-4 w-4" />,
  [WorkflowStageStatus.IN_PROGRESS]: <Info className="h-4 w-4" />,
  [WorkflowStageStatus.COMPLETED]: <CheckCircle className="h-4 w-4" />,
};

const statusDotClasses: Record<WorkflowStageStatus, string> = {
  [WorkflowStageStatus.PENDING]: "bg-gray-300 border-gray-300",
  [WorkflowStageStatus.IN_PROGRESS]: "bg-primary border-primary",
  [WorkflowStageStatus.COMPLETED]: "bg-emerald-500 border-emerald-500",
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
};

const findAssignee = (accounts: User[], stage: WorkflowStage) =>
  accounts.find((acc) => acc.id === stage.assigneeId);

const PROCESS_STAGE_LABELS: Record<ProcessStage, string> = {
  [ProcessStage.CUTTING]: "Cắt phôi",
  [ProcessStage.ASSEMBLY]: "Gá tổ hợp",
  [ProcessStage.WELDING]: "Hàn hoàn thiện",
  [ProcessStage.PAINTING]: "Sơn xuất xưởng",
};

const ProjectWorkflowPage = () => {
  const { user, accounts, getRoleLabel } = useAuth();
  const {
    workflow,
    canCompleteStage,
    completeStage,
    resetWorkflow,
    getNotificationsForUser,
    markNotificationsAsRead,
  } = useWorkflow();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const stageLookup = useMemo(() => {
    const lookup = new Map<string, WorkflowStage>();
    workflow.stages.forEach((stage) => lookup.set(stage.id, stage));
    return lookup;
  }, [workflow.stages]);

  const userNotifications = useMemo<WorkflowNotification[]>(
    () => (user ? getNotificationsForUser(user.id) : []),
    [user, getNotificationsForUser]
  );

  const unreadNotifications = useMemo(
    () => userNotifications.filter((item) => !item.read).length,
    [userNotifications]
  );

  const stats = useMemo(() => {
    const total = workflow.stages.length;
    const completed = workflow.stages.filter(
      (stage) => stage.status === WorkflowStageStatus.COMPLETED
    ).length;
    const inProgress = workflow.stages.filter(
      (stage) => stage.status === WorkflowStageStatus.IN_PROGRESS
    ).length;
    const pending = total - completed - inProgress;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [workflow.stages]);

  const currentAssignableStage = useMemo(() => {
    if (!user) return null;
    return workflow.stages.find(
      (stage) => stage.assigneeId === user.id && stage.status === WorkflowStageStatus.IN_PROGRESS
    );
  }, [workflow.stages, user]);

  const handleCompleteStage = (stage: WorkflowStage) => {
    if (!user) return;
    const result = completeStage(
      stage.id,
      `Hoàn thành bởi ${user.name} (${getRoleLabel(user.role)})`
    );

    if (!result.success) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({ type: "success", message: `${stage.title} đã được đánh dấu hoàn thành.` });
  };

  const handleReset = () => {
    resetWorkflow();
    setFeedback({ type: "success", message: "Đã khởi tạo lại quy trình demo." });
  };

  const timelineEvents = useMemo(() => [...workflow.history].reverse(), [workflow.history]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#212121]">
            Luồng triển khai BOM dự án
          </h1>
          <p className="text-[#616161] mt-1">
            Theo dõi tiến trình chuyển giao công việc giữa phòng kỹ thuật, điều phối và 4 xưởng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden lg:flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <UserCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold text-[#212121]">{user.name}</p>
                <p className="text-xs text-[#616161]">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2">Làm mới quy trình</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "px-4 py-3 rounded-lg border text-sm",
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {feedback.message}
        </div>
      )}

      <Card className="space-y-6" padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryTile
            title="Tổng số bước"
            value={stats.total}
            description="Các đầu việc trong luồng"
          />
          <SummaryTile
            title="Đang thực hiện"
            value={stats.inProgress}
            description="Bước đang chờ xử lý"
            tone="info"
          />
          <SummaryTile
            title="Đã hoàn thành"
            value={stats.completed}
            description="Bước đã xác nhận"
            tone="success"
          />
          <SummaryTile
            title="Tiến độ chung"
            value={`${stats.completionRate}%`}
            description={`${stats.completed}/${stats.total} bước hoàn thành`}
            tone="neutral"
          />
        </div>
        {currentAssignableStage && (
          <div className="border border-emerald-100 bg-emerald-50 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            Bạn đang phụ trách bước <strong>{currentAssignableStage.title}</strong>. Hoàn thành các kiểm tra cần thiết và xác nhận khi đã sẵn sàng chuyển giao.
          </div>
        )}
      </Card>

      {user && (
        <Card className="space-y-4" padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-secondary">
                Thông báo dành cho bạn
              </h2>
            </div>
            {unreadNotifications > 0 && (
              <Badge className="bg-primary/10 text-primary">
                {unreadNotifications} chưa đọc
              </Badge>
            )}
          </div>
          <div className="space-y-3">
            {userNotifications.length === 0 ? (
              <p className="text-sm text-secondary/60">
                Hiện chưa có thông báo. Khi công đoạn trước hoàn thành, hệ thống sẽ gửi thông báo cho bạn.
              </p>
            ) : (
              userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border px-3 py-2 ${
                    notification.read
                      ? "border-gray-100 bg-white"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <p className="text-sm font-semibold text-secondary">
                    {notification.stageTitle}
                  </p>
                  <p className="text-xs text-secondary/70 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-secondary/50 mt-1">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
          {userNotifications.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markNotificationsAsRead(user.id)}
              >
                Đánh dấu đã đọc
              </Button>
            </div>
          )}
        </Card>
      )}

      <TechnicalPanel />

      <Card className="space-y-6" padding="lg">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-[#212121]">Tiến trình theo vai trò</h2>
        </div>
        <ol className="relative border-l border-gray-200 pl-6 space-y-8">
          {workflow.stages.map((stage, index) => {
            const assignee = findAssignee(accounts, stage);
            const isActionable = canCompleteStage(stage.id);

            return (
              <li key={stage.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white",
                    statusDotClasses[stage.status]
                  )}
                />
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#9E9E9E]">Bước {index + 1}</span>
                        <Badge variant={stage.status}>{statusText[stage.status]}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-[#212121]">{stage.title}</h3>
                      <p className="text-sm text-[#616161]">{stage.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#424242] mt-2">
                        <span className="inline-flex items-center gap-1">
                          <UserCircle className="h-4 w-4 text-primary" />
                          {assignee ? assignee.name : "Chưa gán"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {statusIcon[stage.status]}
                          {getRoleLabel(stage.role)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#757575]">
                          <History className="h-4 w-4" />
                          {formatDateTime(stage.updatedAt)}
                        </span>
                      </div>
                      {stage.dependsOn && stage.dependsOn.length > 0 && (
                        <div className="text-xs text-[#757575] bg-gray-50 border border-dashed border-gray-200 rounded-md px-3 py-2 mt-3">
                          Phụ thuộc: {stage.dependsOn.map((depId) => {
                            const dependency = stageLookup.get(depId);
                            return dependency
                              ? `${dependency.title} (${statusText[dependency.status]})`
                              : depId;
                          }).join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-stretch gap-2 min-w-[220px]">
                      <Button
                        variant={isActionable ? "primary" : "secondary"}
                        disabled={!isActionable}
                        onClick={() => handleCompleteStage(stage)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="ml-2">Xác nhận hoàn thành</span>
                      </Button>
                      {!isActionable && stage.status !== WorkflowStageStatus.COMPLETED && (
                        <p className="text-xs text-[#757575] leading-5">
                          {stage.status === WorkflowStageStatus.PENDING
                            ? "Chờ bước trước hoàn tất."
                            : stage.assigneeId !== user?.id
                            ? "Chỉ người được gán mới có thể xác nhận."
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-[#212121]">History luồng</h2>
        </div>
        <div className="space-y-3">
          {timelineEvents.map((event) => {
            const stage = stageLookup.get(event.stageId);
            const actor = accounts.find((acc) => acc.id === event.actorId);
            return (
              <div
                key={event.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={stage?.status ?? WorkflowStageStatus.PENDING}>
                    {actionText[event.action]}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-[#212121]">
                      {stage ? stage.title : event.stageId}
                    </p>
                    <p className="text-xs text-[#616161]">
                      {actor ? `${actor.name} · ${getRoleLabel(actor.role)}` : event.actorId}
                    </p>
                    {event.note && (
                      <p className="text-xs text-[#757575] mt-1">{event.note}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[#9E9E9E] font-medium">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

interface SummaryTileProps {
  title: string;
  value: string | number;
  description: string;
  tone?: "neutral" | "info" | "success";
}

const SummaryTile = ({ title, value, description, tone = "neutral" }: SummaryTileProps) => {
  const toneClasses = {
    neutral: "bg-gray-50 border-gray-100",
    info: "bg-blue-50 border-blue-100",
    success: "bg-emerald-50 border-emerald-100",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3", toneClasses[tone])}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">{title}</p>
      <p className="text-2xl font-semibold text-[#212121] mt-1">{value}</p>
      <p className="text-xs text-[#616161] mt-1">{description}</p>
    </div>
  );
};

export default ProjectWorkflowPage;
