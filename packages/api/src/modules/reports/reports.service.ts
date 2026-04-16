import { query } from '../../config/database';
import type {
  ReportRange,
  KpiSummary,
  OccupancyRow,
  WorkOrderReport,
  HousekeepingReport,
  GuestRequestReport,
  LaborReport,
  ResponseTimeReport,
  ReportType,
  ReportFormat,
} from '@hotel-ops/shared/validators/reports';

// SLA thresholds: urgent=2h, high=8h, normal=24h, low=72h — encoded directly in SQL CASE.

// ── Zone filter SQL helper ────────────────────────────────────────────────────

/** _zoneClause: reserved for future per-zone report filtering. */
export function _zoneClause(zone: string | undefined, tableAlias = ''): string {
  const col = tableAlias ? `${tableAlias}.zone` : 'zone';
  if (!zone || zone === 'all') return '';
  return `AND ${col} = '${zone === 'fleming' ? 'fleming' : 'simonton'}'`;
}

// ── Granularity truncation ────────────────────────────────────────────────────

function dateTrunc(granularity: string): string {
  const g = granularity === 'week' ? 'week' : granularity === 'month' ? 'month' : 'day';
  return `date_trunc('${g}', `;
}

// ── KPI summary ───────────────────────────────────────────────────────────────

export async function getKpiSummary(range: ReportRange): Promise<KpiSummary> {
  const [occRow, woRow, hkRow, grRow] = await Promise.all([
    query<{ occupancy_pct: string | null }>(
      `SELECT ROUND(
         COUNT(*) FILTER (WHERE is_occupied = true)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100, 1
       ) AS occupancy_pct
       FROM rooms`,
    ),
    query<{ avg_resolution_hours: string | null; open_critical_count: string }>(
      `SELECT
         ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
           FILTER (WHERE completed_at IS NOT NULL AND created_at BETWEEN $1 AND $2::DATE + 1), 2
         ) AS avg_resolution_hours,
         COUNT(*) FILTER (WHERE priority IN ('urgent', 'high') AND status NOT IN ('completed', 'cancelled'))::TEXT
           AS open_critical_count
       FROM work_orders
       WHERE created_at BETWEEN $1 AND $2::DATE + 1`,
      [range.from, range.to],
    ),
    query<{ avg_clean_minutes: string | null }>(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
         FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL
                   AND date BETWEEN $1 AND $2), 1
       ) AS avg_clean_minutes
       FROM housekeeping_assignments`,
      [range.from, range.to],
    ),
    query<{ median_minutes: string | null }>(
      `SELECT ROUND(
         percentile_cont(0.5) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
         ) FILTER (WHERE resolved_at IS NOT NULL
                     AND created_at BETWEEN $1 AND $2::DATE + 1),
       1) AS median_minutes
       FROM guest_requests`,
      [range.from, range.to],
    ),
  ]);

  return {
    occupancy_pct: occRow.rows[0]?.occupancy_pct != null ? Number(occRow.rows[0].occupancy_pct) : null,
    // TODO: ADR requires rate_plan price mapping table — not available in Phase 1
    adr: null,
    avg_wo_resolution_hours: woRow.rows[0]?.avg_resolution_hours != null
      ? Number(woRow.rows[0].avg_resolution_hours) : null,
    avg_hk_clean_minutes: hkRow.rows[0]?.avg_clean_minutes != null
      ? Number(hkRow.rows[0].avg_clean_minutes) : null,
    guest_request_resolution_median_minutes: grRow.rows[0]?.median_minutes != null
      ? Number(grRow.rows[0].median_minutes) : null,
    open_critical_wo_count: Number(woRow.rows[0]?.open_critical_count ?? 0),
  };
}

// ── Occupancy report ──────────────────────────────────────────────────────────

export async function getOccupancyReport(range: ReportRange): Promise<OccupancyRow[]> {
  const trunc = dateTrunc(range.granularity);
  const totalRooms = await query<{ total: string }>(
    `SELECT COUNT(*)::TEXT AS total FROM rooms`,
  );
  const total = Number(totalRooms.rows[0]?.total ?? 0);

  const result = await query<{
    date: string;
    occupied_rooms: string;
  }>(
    // generate_series produces one row per day; LEFT JOIN counts distinct reservations
    // that were checked_in and spanned that day. Buckets by granularity.
    `WITH series AS (
       SELECT generate_series($1::DATE, $2::DATE, '1 day'::INTERVAL)::DATE AS day
     )
     SELECT ${trunc}s.day)::DATE::TEXT AS date,
            COUNT(DISTINCT r.id)::TEXT AS occupied_rooms
     FROM series s
     LEFT JOIN reservations r
       ON r.status = 'checked_in'
      AND s.day >= r.check_in_date
      AND s.day < r.check_out_date
     GROUP BY ${trunc}s.day)::DATE
     ORDER BY ${trunc}s.day)::DATE`,
    [range.from, range.to],
  );

  return result.rows.map((r) => ({
    date: r.date,
    occupied_rooms: Number(r.occupied_rooms),
    total_rooms: total,
    occupancy_pct: total > 0 ? Math.round((Number(r.occupied_rooms) / total) * 1000) / 10 : 0,
  }));
}

// ── Work-order report ─────────────────────────────────────────────────────────

export async function getWorkOrderReport(range: ReportRange): Promise<WorkOrderReport> {
  // Zone filter joins to rooms (WOs that target rooms) — location-targeted WOs have no zone.
  const zoneJoin = range.zone && range.zone !== 'all'
    ? `LEFT JOIN rooms r ON r.id = wo.room_id`
    : '';
  const zoneWhere = range.zone && range.zone !== 'all'
    ? `AND (r.zone = '${range.zone}' OR wo.room_id IS NULL)`
    : '';

  const [byStatus, byCategory, byPriority, byZone, timing, timeSeries, slaRows] =
    await Promise.all([
      query<{ status: string; count: string }>(
        `SELECT wo.status, COUNT(*)::TEXT AS count
         FROM work_orders wo ${zoneJoin}
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}
         GROUP BY wo.status ORDER BY count DESC`,
        [range.from, range.to],
      ),
      query<{ category: string; count: string }>(
        `SELECT wo.category, COUNT(*)::TEXT AS count
         FROM work_orders wo ${zoneJoin}
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}
         GROUP BY wo.category ORDER BY count DESC`,
        [range.from, range.to],
      ),
      query<{ priority: string; count: string }>(
        `SELECT wo.priority, COUNT(*)::TEXT AS count
         FROM work_orders wo ${zoneJoin}
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}
         GROUP BY wo.priority ORDER BY count DESC`,
        [range.from, range.to],
      ),
      // By zone: count WOs per room zone (NULL = location-targeted)
      query<{ zone: string | null; count: string }>(
        `SELECT r2.zone, COUNT(*)::TEXT AS count
         FROM work_orders wo
         LEFT JOIN rooms r2 ON r2.id = wo.room_id
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1
         GROUP BY r2.zone ORDER BY count DESC`,
        [range.from, range.to],
      ),
      query<{ avg_ack_hours: string | null; avg_complete_hours: string | null }>(
        `SELECT
           ROUND(AVG(EXTRACT(EPOCH FROM (started_at - created_at)) / 3600)
             FILTER (WHERE started_at IS NOT NULL), 2) AS avg_ack_hours,
           ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
             FILTER (WHERE completed_at IS NOT NULL), 2) AS avg_complete_hours
         FROM work_orders wo ${zoneJoin}
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}`,
        [range.from, range.to],
      ),
      // Opens: WOs created in bucket. Closes: WOs completed in bucket.
      query<{ date: string; opens: string; closes: string }>(
        `SELECT bucket::TEXT AS date, opens::TEXT, closes::TEXT
         FROM (
           SELECT ${dateTrunc(range.granularity)}wo.created_at)::DATE AS bucket,
                  COUNT(*) AS opens,
                  COUNT(*) FILTER (
                    WHERE wo.completed_at IS NOT NULL
                      AND wo.completed_at BETWEEN $1 AND $2::DATE + 1
                  ) AS closes
           FROM work_orders wo ${zoneJoin}
           WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}
           GROUP BY bucket
         ) t
         ORDER BY bucket`,
        [range.from, range.to],
      ),
      // SLA: for each priority fetch completed WOs and check resolution vs threshold
      query<{ priority: string; total: string; within_sla: string }>(
        `SELECT wo.priority,
                COUNT(*) FILTER (WHERE wo.completed_at IS NOT NULL)::TEXT AS total,
                COUNT(*) FILTER (
                  WHERE wo.completed_at IS NOT NULL
                    AND CASE wo.priority
                          WHEN 'urgent' THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600 <= 2
                          WHEN 'high'   THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600 <= 8
                          WHEN 'normal' THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600 <= 24
                          WHEN 'low'    THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600 <= 72
                          ELSE false
                        END
                )::TEXT AS within_sla
         FROM work_orders wo ${zoneJoin}
         WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1 ${zoneWhere}
           AND wo.priority IN ('urgent', 'high', 'normal', 'low')
         GROUP BY wo.priority`,
        [range.from, range.to],
      ),
    ]);

  // Compute overall SLA compliance %
  let totalCompleted = 0;
  let totalWithinSla = 0;
  for (const r of slaRows.rows) {
    totalCompleted += Number(r.total);
    totalWithinSla += Number(r.within_sla);
  }
  const slaCompliancePct =
    totalCompleted > 0 ? Math.round((totalWithinSla / totalCompleted) * 1000) / 10 : null;

  return {
    by_status: byStatus.rows.map((r) => ({ status: r.status, count: Number(r.count) })),
    by_category: byCategory.rows.map((r) => ({ category: r.category, count: Number(r.count) })),
    by_priority: byPriority.rows.map((r) => ({ priority: r.priority, count: Number(r.count) })),
    by_zone: byZone.rows.map((r) => ({ zone: r.zone, count: Number(r.count) })),
    avg_time_to_acknowledge_hours: timing.rows[0]?.avg_ack_hours != null
      ? Number(timing.rows[0].avg_ack_hours) : null,
    avg_time_to_complete_hours: timing.rows[0]?.avg_complete_hours != null
      ? Number(timing.rows[0].avg_complete_hours) : null,
    sla_compliance_pct: slaCompliancePct,
    time_series: timeSeries.rows.map((r) => ({
      date: r.date,
      opens: Number(r.opens),
      closes: Number(r.closes),
    })),
  };
}

// ── Housekeeping report ───────────────────────────────────────────────────────

export async function getHousekeepingReport(range: ReportRange): Promise<HousekeepingReport> {
  const [main, dndCount] = await Promise.all([
    query<{
      completed_count: string;
      inspection_pass_rate_pct: string | null;
      common_area_completion_pct: string | null;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('completed', 'inspected'))::TEXT AS completed_count,
         ROUND(
           COUNT(*) FILTER (WHERE inspection_result = 'pass')::NUMERIC /
           NULLIF(COUNT(*) FILTER (WHERE inspection_result IS NOT NULL), 0) * 100, 1
         )::TEXT AS inspection_pass_rate_pct,
         ROUND(
           COUNT(*) FILTER (WHERE location_id IS NOT NULL AND status IN ('completed', 'inspected'))::NUMERIC /
           NULLIF(COUNT(*) FILTER (WHERE location_id IS NOT NULL), 0) * 100, 1
         )::TEXT AS common_area_completion_pct
       FROM housekeeping_assignments
       WHERE date BETWEEN $1 AND $2`,
      [range.from, range.to],
    ),
    query<{ dnd_count: string }>(
      `SELECT COUNT(*)::TEXT AS dnd_count
       FROM housekeeping_assignments
       WHERE date BETWEEN $1 AND $2
         AND status IN ('dnd_pending', 'dnd_escalated')`,
      [range.from, range.to],
    ),
  ]);

  const byType = await query<{ type: string; avg_minutes: string | null }>(
    `SELECT type,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
              FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 1
            )::TEXT AS avg_minutes
     FROM housekeeping_assignments
     WHERE date BETWEEN $1 AND $2
     GROUP BY type ORDER BY type`,
    [range.from, range.to],
  );

  const row = main.rows[0];
  return {
    completed_count: Number(row?.completed_count ?? 0),
    avg_clean_minutes_by_type: byType.rows.map((r) => ({
      type: r.type,
      avg_minutes: r.avg_minutes != null ? Number(r.avg_minutes) : null,
    })),
    inspection_pass_rate_pct:
      row?.inspection_pass_rate_pct != null ? Number(row.inspection_pass_rate_pct) : null,
    common_area_completion_pct:
      row?.common_area_completion_pct != null ? Number(row.common_area_completion_pct) : null,
    dnd_reattempt_count: Number(dndCount.rows[0]?.dnd_count ?? 0),
  };
}

// ── Guest request report ──────────────────────────────────────────────────────

export async function getGuestRequestReport(range: ReportRange): Promise<GuestRequestReport> {
  const [byType, byDest, agg] = await Promise.all([
    query<{ request_type: string; count: string }>(
      `SELECT request_type, COUNT(*)::TEXT AS count
       FROM guest_requests
       WHERE created_at BETWEEN $1 AND $2::DATE + 1
       GROUP BY request_type ORDER BY count DESC`,
      [range.from, range.to],
    ),
    query<{ routed_to: string | null; count: string }>(
      `SELECT routed_to, COUNT(*)::TEXT AS count
       FROM guest_requests
       WHERE created_at BETWEEN $1 AND $2::DATE + 1
       GROUP BY routed_to ORDER BY count DESC`,
      [range.from, range.to],
    ),
    query<{
      median_minutes: string | null;
      auto_wo_pct: string | null;
      open_count: string;
    }>(
      `SELECT
         ROUND(percentile_cont(0.5) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
         ) FILTER (WHERE resolved_at IS NOT NULL), 1)::TEXT AS median_minutes,
         ROUND(
           COUNT(*) FILTER (WHERE routed_to = 'maintenance')::NUMERIC /
           NULLIF(COUNT(*), 0) * 100, 1
         )::TEXT AS auto_wo_pct,
         COUNT(*) FILTER (WHERE status = 'open')::TEXT AS open_count
       FROM guest_requests
       WHERE created_at BETWEEN $1 AND $2::DATE + 1`,
      [range.from, range.to],
    ),
  ]);

  const a = agg.rows[0];
  return {
    by_type: byType.rows.map((r) => ({ request_type: r.request_type, count: Number(r.count) })),
    by_destination: byDest.rows.map((r) => ({ routed_to: r.routed_to, count: Number(r.count) })),
    median_resolution_minutes: a?.median_minutes != null ? Number(a.median_minutes) : null,
    auto_routed_to_wo_pct: a?.auto_wo_pct != null ? Number(a.auto_wo_pct) : null,
    open_count: Number(a?.open_count ?? 0),
  };
}

// ── Labor report ──────────────────────────────────────────────────────────────

export async function getLaborReport(range: ReportRange): Promise<LaborReport> {
  const [headcount, hkProductivity, maintProductivity] = await Promise.all([
    query<{ role: string; active_staff: string }>(
      `SELECT s.role, COUNT(DISTINCT s.id)::TEXT AS active_staff
       FROM staff s
       WHERE s.is_active = true
         AND (
           EXISTS (
             SELECT 1 FROM housekeeping_assignments ha
             WHERE ha.assigned_to = s.id AND ha.date BETWEEN $1 AND $2
           )
           OR EXISTS (
             SELECT 1 FROM work_orders wo
             WHERE wo.assigned_to = s.id
               AND wo.created_at BETWEEN $1 AND $2::DATE + 1
           )
         )
       GROUP BY s.role ORDER BY s.role`,
      [range.from, range.to],
    ),
    query<{ staff_id: string; first_name: string; last_name: string; tasks_per_hour: string | null }>(
      `SELECT s.id AS staff_id, s.first_name, s.last_name,
              ROUND(
                COUNT(ha.id)::NUMERIC /
                NULLIF(
                  SUM(EXTRACT(EPOCH FROM (ha.completed_at - ha.started_at)) / 3600)
                    FILTER (WHERE ha.completed_at IS NOT NULL AND ha.started_at IS NOT NULL),
                  0
                ), 2
              )::TEXT AS tasks_per_hour
       FROM staff s
       JOIN housekeeping_assignments ha ON ha.assigned_to = s.id
       WHERE ha.date BETWEEN $1 AND $2
         AND ha.status IN ('completed', 'inspected')
       GROUP BY s.id ORDER BY s.last_name`,
      [range.from, range.to],
    ),
    query<{ staff_id: string; first_name: string; last_name: string; wo_per_day: string | null }>(
      `SELECT s.id AS staff_id, s.first_name, s.last_name,
              ROUND(
                COUNT(wo.id)::NUMERIC /
                NULLIF(($2::DATE - $1::DATE + 1), 0),
              2)::TEXT AS wo_per_day
       FROM staff s
       JOIN work_orders wo ON wo.assigned_to = s.id
       WHERE wo.created_at BETWEEN $1 AND $2::DATE + 1
         AND wo.status = 'completed'
       GROUP BY s.id ORDER BY s.last_name`,
      [range.from, range.to],
    ),
  ]);

  return {
    headcount_by_role: headcount.rows.map((r) => ({
      role: r.role,
      active_staff: Number(r.active_staff),
    })),
    hk_tasks_per_hour: hkProductivity.rows.map((r) => ({
      staff_id: r.staff_id,
      name: `${r.first_name} ${r.last_name}`,
      tasks_per_hour: r.tasks_per_hour != null ? Number(r.tasks_per_hour) : null,
    })),
    maint_wo_per_day: maintProductivity.rows.map((r) => ({
      staff_id: r.staff_id,
      name: `${r.first_name} ${r.last_name}`,
      wo_per_day: r.wo_per_day != null ? Number(r.wo_per_day) : null,
    })),
    // TODO: overtime calculation requires a shift schedule table (not in Phase 1)
    overtime_flags: [],
  };
}

// ── Response time report ──────────────────────────────────────────────────────

export async function getResponseTimeReport(range: ReportRange): Promise<ResponseTimeReport> {
  const [woAck, woResolve, hkComplete, grResolve] = await Promise.all([
    query<{ p50: string | null; p90: string | null; p99: string | null }>(
      `SELECT
         ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (started_at - created_at)) / 60)
           FILTER (WHERE started_at IS NOT NULL), 1)::TEXT AS p50,
         ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (started_at - created_at)) / 60)
           FILTER (WHERE started_at IS NOT NULL), 1)::TEXT AS p90,
         ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (started_at - created_at)) / 60)
           FILTER (WHERE started_at IS NOT NULL), 1)::TEXT AS p99
       FROM work_orders
       WHERE created_at BETWEEN $1 AND $2::DATE + 1`,
      [range.from, range.to],
    ),
    query<{ p50: string | null; p90: string | null; p99: string | null }>(
      `SELECT
         ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL), 1)::TEXT AS p50,
         ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL), 1)::TEXT AS p90,
         ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL), 1)::TEXT AS p99
       FROM work_orders
       WHERE created_at BETWEEN $1 AND $2::DATE + 1`,
      [range.from, range.to],
    ),
    query<{ p50: string | null; p90: string | null; p99: string | null }>(
      `SELECT
         ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 1)::TEXT AS p50,
         ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 1)::TEXT AS p90,
         ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)
           FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL), 1)::TEXT AS p99
       FROM housekeeping_assignments
       WHERE date BETWEEN $1 AND $2`,
      [range.from, range.to],
    ),
    query<{ p50: string | null; p90: string | null; p99: string | null }>(
      `SELECT
         ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
           FILTER (WHERE resolved_at IS NOT NULL), 1)::TEXT AS p50,
         ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
           FILTER (WHERE resolved_at IS NOT NULL), 1)::TEXT AS p90,
         ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
           FILTER (WHERE resolved_at IS NOT NULL), 1)::TEXT AS p99
       FROM guest_requests
       WHERE created_at BETWEEN $1 AND $2::DATE + 1`,
      [range.from, range.to],
    ),
  ]);

  const toNum = (v: string | null | undefined) => (v != null ? Number(v) : null);
  const mapRow = (r: { p50: string | null; p90: string | null; p99: string | null }) => ({
    p50: toNum(r.p50),
    p90: toNum(r.p90),
    p99: toNum(r.p99),
  });

  return {
    wo_ack: mapRow(woAck.rows[0] ?? { p50: null, p90: null, p99: null }),
    wo_resolve: mapRow(woResolve.rows[0] ?? { p50: null, p90: null, p99: null }),
    hk_complete: mapRow(hkComplete.rows[0] ?? { p50: null, p90: null, p99: null }),
    guest_request_resolve: mapRow(grResolve.rows[0] ?? { p50: null, p90: null, p99: null }),
  };
}

// ── Export ────────────────────────────────────────────────────────────────────

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      headers.map((h) => {
        const v = row[h];
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
      }).join(','),
    );
  }
  return lines.join('\n');
}

// Flatten a nested report object into a flat array of rows for CSV export.
function flattenForCsv(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    // Return the first array property we find, else wrap the object
    for (const v of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(v) && v.length > 0) return v as Record<string, unknown>[];
    }
    return [data as Record<string, unknown>];
  }
  return [];
}

export async function exportReport(
  reportType: ReportType,
  range: ReportRange,
  format: ReportFormat,
): Promise<{ data: string; contentType: string; filename: string }> {
  let payload: unknown;

  switch (reportType) {
    case 'kpi_summary':
      payload = await getKpiSummary(range);
      break;
    case 'occupancy':
      payload = await getOccupancyReport(range);
      break;
    case 'work_orders':
      payload = await getWorkOrderReport(range);
      break;
    case 'housekeeping':
      payload = await getHousekeepingReport(range);
      break;
    case 'guest_requests':
      payload = await getGuestRequestReport(range);
      break;
    case 'labor':
      payload = await getLaborReport(range);
      break;
    case 'response_times':
      payload = await getResponseTimeReport(range);
      break;
    default:
      throw new Error(`Unknown report type: ${reportType as string}`);
  }

  const filename = `${reportType}_${range.from}_${range.to}`;

  if (format === 'json') {
    return {
      data: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
      filename: `${filename}.json`,
    };
  }

  const rows = flattenForCsv(payload);
  return {
    data: toCsv(rows),
    contentType: 'text/csv',
    filename: `${filename}.csv`,
  };
}
