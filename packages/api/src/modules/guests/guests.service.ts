import { query } from '../../config/database';
import { AppError } from '../../middleware/error';
import { generateId } from '../../utils/helpers';

export async function searchGuests(hotelId: string, searchTerm: string, limit: number = 20) {
  const result = await query<any>(
    `SELECT id, first_name, last_name, email, phone, vip_status,
            total_stays, last_stay_date, created_at
     FROM guests
     WHERE hotel_id = $1
       AND (
         first_name ILIKE $2
         OR last_name ILIKE $2
         OR email ILIKE $2
         OR phone ILIKE $2
         OR CONCAT(first_name, ' ', last_name) ILIKE $2
       )
     ORDER BY last_name, first_name
     LIMIT $3`,
    [hotelId, `%${searchTerm}%`, limit],
  );
  return result.rows;
}

export async function getGuestProfile(guestId: string) {
  const guestResult = await query<any>(
    `SELECT * FROM guests WHERE id = $1`,
    [guestId],
  );
  if (guestResult.rows.length === 0) throw new AppError('Guest not found', 404);

  const [stays, practices, interactions] = await Promise.all([
    query<any>(
      `SELECT r.id, r.room_id, r.check_in_date, r.check_out_date,
              r.confirmation_number, r.status, rm.room_number, rm.room_type
       FROM reservations r
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.guest_id = $1
       ORDER BY r.check_in_date DESC
       LIMIT 20`,
      [guestId],
    ),
    query<any>(
      `SELECT id, category, key, value, confidence, source, noted_by, created_at
       FROM guest_practices
       WHERE guest_id = $1
       ORDER BY created_at DESC`,
      [guestId],
    ),
    query<any>(
      `SELECT gi.id, gi.interaction_type, gi.description, gi.staff_id, gi.created_at,
              s.first_name AS staff_first_name, s.last_name AS staff_last_name
       FROM guest_interactions gi
       LEFT JOIN staff s ON s.id = gi.staff_id
       WHERE gi.guest_id = $1
       ORDER BY gi.created_at DESC
       LIMIT 20`,
      [guestId],
    ),
  ]);

  return {
    ...guestResult.rows[0],
    stays: stays.rows,
    practices: practices.rows,
    interactions: interactions.rows,
  };
}

export async function createGuest(
  hotelId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    vipStatus?: string;
    notes?: string;
    preferences?: Record<string, any>;
  },
) {
  const hotelResult = await query<any>(
    `SELECT tenant_id FROM hotels WHERE id = $1 LIMIT 1`,
    [hotelId],
  );
  const tenantId = hotelResult.rows[0]?.tenant_id;

  const id = generateId();
  await query(
    `INSERT INTO guests (
      id, tenant_id, hotel_id, first_name, last_name, email, phone,
      date_of_birth, vip_status, notes, preferences, total_stays,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, NOW(), NOW())`,
    [
      id, tenantId, hotelId, data.firstName, data.lastName,
      data.email ?? null, data.phone ?? null, data.dateOfBirth ?? null,
      data.vipStatus ?? 'none', data.notes ?? null,
      data.preferences ? JSON.stringify(data.preferences) : null,
    ],
  );
  return { id, ...data };
}

export async function updateGuest(guestId: string, updates: Record<string, any>) {
  const FIELD_MAP: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    dateOfBirth: 'date_of_birth',
    vipStatus: 'vip_status',
    notes: 'notes',
    preferences: 'preferences',
  };

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const col = FIELD_MAP[key];
    if (col) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(key === 'preferences' ? JSON.stringify(value) : value);
    }
  }

  params.push(guestId);
  await query(
    `UPDATE guests SET ${setClauses.join(', ')} WHERE id = $${idx}`,
    params,
  );
  return { id: guestId, ...updates };
}

export async function addPractice(
  guestId: string,
  data: { practiceType: string; description: string; triggeredBy?: string },
) {
  // Resolve tenant_id from guest record (required by RLS policy)
  const guestRow = await query<any>(`SELECT tenant_id FROM guests WHERE id = $1 LIMIT 1`, [guestId]);
  const tenantId = guestRow.rows[0]?.tenant_id ?? null;

  const id = generateId();
  await query(
    `INSERT INTO guest_practices (
      id, tenant_id, guest_id, category, key, value,
      source, noted_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NOW(), NOW())`,
    [
      id,
      tenantId,
      guestId,
      data.practiceType,   // category
      'note',              // key — free-text description stored under generic key
      data.description,    // value
      data.triggeredBy ?? null, // source
    ],
  );
  return { id, category: data.practiceType, key: 'note', value: data.description, source: data.triggeredBy ?? null };
}

export async function getPractices(guestId: string) {
  const result = await query<any>(
    `SELECT id, category, key, value, confidence, source, noted_by, created_at
     FROM guest_practices
     WHERE guest_id = $1
     ORDER BY created_at DESC`,
    [guestId],
  );
  return result.rows;
}

export async function addPreference(
  guestId: string,
  data: { category: string; key: string; value: string },
) {
  const id = generateId();
  await query(
    `INSERT INTO guest_preferences (id, guest_id, category, key, value, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (guest_id, category, key)
     DO UPDATE SET value = EXCLUDED.value`,
    [id, guestId, data.category, data.key, data.value],
  );
  return { id, ...data };
}

export async function getUpcomingRepeatGuests(hotelId: string) {
  const result = await query<any>(
    `SELECT g.id, g.first_name, g.last_name, g.email, g.vip_status,
            g.total_stays, g.preferences,
            r.check_in_date, r.check_out_date, r.confirmation_number,
            rm.room_number, rm.room_type
     FROM guests g
     JOIN reservations r ON r.guest_id = g.id
     LEFT JOIN rooms rm ON rm.id = r.room_id
     WHERE g.hotel_id = $1
       AND g.total_stays >= 2
       AND r.check_in_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND r.status IN ('confirmed', 'pending')
     ORDER BY r.check_in_date ASC`,
    [hotelId],
  );
  return result.rows;
}
