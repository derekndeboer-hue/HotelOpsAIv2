import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const reportTypeEnum = z.enum([
  'occupancy',
  'work_orders',
  'housekeeping',
  'guest_requests',
  'labor',
  'response_times',
  'kpi_summary',
]);

export const reportGranularityEnum = z.enum(['day', 'week', 'month']);

export const reportZoneEnum = z.enum(['fleming', 'simonton', 'all']);

export const reportFormatEnum = z.enum(['csv', 'json']);

// ── Core range schema ─────────────────────────────────────────────────────────

export const reportRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    zone: reportZoneEnum.default('all'),
    granularity: reportGranularityEnum.default('day'),
  })
  .refine((v) => v.from <= v.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });

export const reportExportSchema = reportRangeSchema.and(
  z.object({
    format: reportFormatEnum.default('csv'),
    report_type: reportTypeEnum,
  }),
);

// ── Response row shapes ───────────────────────────────────────────────────────

export const kpiSummarySchema = z.object({
  occupancy_pct: z.number().nullable(),
  adr: z.number().nullable(), // null until rate data is available
  avg_wo_resolution_hours: z.number().nullable(),
  avg_hk_clean_minutes: z.number().nullable(),
  guest_request_resolution_median_minutes: z.number().nullable(),
  open_critical_wo_count: z.number(),
});

export const occupancyRowSchema = z.object({
  date: z.string(),
  occupied_rooms: z.number(),
  total_rooms: z.number(),
  occupancy_pct: z.number(),
});

export const workOrderReportSchema = z.object({
  by_status: z.array(z.object({ status: z.string(), count: z.number() })),
  by_category: z.array(z.object({ category: z.string(), count: z.number() })),
  by_priority: z.array(z.object({ priority: z.string(), count: z.number() })),
  by_zone: z.array(z.object({ zone: z.string().nullable(), count: z.number() })),
  avg_time_to_acknowledge_hours: z.number().nullable(),
  avg_time_to_complete_hours: z.number().nullable(),
  sla_compliance_pct: z.number().nullable(),
  time_series: z.array(
    z.object({ date: z.string(), opens: z.number(), closes: z.number() }),
  ),
});

export const housekeepingReportSchema = z.object({
  completed_count: z.number(),
  avg_clean_minutes_by_type: z.array(
    z.object({ type: z.string(), avg_minutes: z.number().nullable() }),
  ),
  inspection_pass_rate_pct: z.number().nullable(),
  common_area_completion_pct: z.number().nullable(),
  dnd_reattempt_count: z.number(),
});

export const guestRequestReportSchema = z.object({
  by_type: z.array(z.object({ request_type: z.string(), count: z.number() })),
  by_destination: z.array(z.object({ routed_to: z.string().nullable(), count: z.number() })),
  median_resolution_minutes: z.number().nullable(),
  auto_routed_to_wo_pct: z.number().nullable(),
  open_count: z.number(),
});

export const laborReportSchema = z.object({
  headcount_by_role: z.array(
    z.object({ role: z.string(), active_staff: z.number() }),
  ),
  hk_tasks_per_hour: z.array(
    z.object({ staff_id: z.string(), name: z.string(), tasks_per_hour: z.number().nullable() }),
  ),
  maint_wo_per_day: z.array(
    z.object({ staff_id: z.string(), name: z.string(), wo_per_day: z.number().nullable() }),
  ),
  // TODO: overtime flag — no schedule table yet, placeholder returns 0
  overtime_flags: z.array(z.object({ staff_id: z.string(), overtime_hours: z.number() })),
});

export const responseTimeReportSchema = z.object({
  wo_ack: z.object({ p50: z.number().nullable(), p90: z.number().nullable(), p99: z.number().nullable() }),
  wo_resolve: z.object({ p50: z.number().nullable(), p90: z.number().nullable(), p99: z.number().nullable() }),
  hk_complete: z.object({ p50: z.number().nullable(), p90: z.number().nullable(), p99: z.number().nullable() }),
  guest_request_resolve: z.object({ p50: z.number().nullable(), p90: z.number().nullable(), p99: z.number().nullable() }),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ReportType = z.infer<typeof reportTypeEnum>;
export type ReportGranularity = z.infer<typeof reportGranularityEnum>;
export type ReportZone = z.infer<typeof reportZoneEnum>;
export type ReportFormat = z.infer<typeof reportFormatEnum>;
export type ReportRange = z.infer<typeof reportRangeSchema>;
export type ReportExportInput = z.infer<typeof reportExportSchema>;
export type KpiSummary = z.infer<typeof kpiSummarySchema>;
export type OccupancyRow = z.infer<typeof occupancyRowSchema>;
export type WorkOrderReport = z.infer<typeof workOrderReportSchema>;
export type HousekeepingReport = z.infer<typeof housekeepingReportSchema>;
export type GuestRequestReport = z.infer<typeof guestRequestReportSchema>;
export type LaborReport = z.infer<typeof laborReportSchema>;
export type ResponseTimeReport = z.infer<typeof responseTimeReportSchema>;
