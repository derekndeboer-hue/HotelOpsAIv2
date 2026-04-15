import { query } from '../../config/database';
import { generateId } from '../../utils/helpers';

/**
 * Get the concierge directory (local businesses, services, attractions).
 */
export async function getDirectory(
  tenantId: string,
  hotelId: string,
  filters: { category?: string; search?: string } = {}
) {
  let sql = `
    SELECT id, name, category, description, address, phone, website,
           hours, price_range, hotel_relationship, rating, notes, is_active,
           created_at
    FROM concierge_directory
    WHERE tenant_id = $1 AND hotel_id = $2 AND is_active = true
  `;
  const params: any[] = [tenantId, hotelId];
  let paramIdx = 3;

  if (filters.category) {
    sql += ` AND category = $${paramIdx}`;
    params.push(filters.category);
    paramIdx++;
  }
  if (filters.search) {
    sql += ` AND (name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`;
    params.push(`%${filters.search}%`);
    paramIdx++;
  }

  sql += ' ORDER BY hotel_relationship DESC, rating DESC, name ASC';
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Add a directory entry.
 */
export async function addDirectoryEntry(
  tenantId: string,
  hotelId: string,
  userId: string,
  data: {
    name: string;
    category: string;
    description?: string;
    address?: string;
    phone?: string;
    website?: string;
    hours?: string;
    priceRange?: string;
    hotelRelationship?: string;
    rating?: number;
    notes?: string;
  }
) {
  const id = generateId();
  await query(
    `INSERT INTO concierge_directory (
      id, tenant_id, hotel_id, name, category, description, address,
      phone, website, hours, price_range, hotel_relationship, rating,
      notes, is_active, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, NOW(), NOW())`,
    [
      id, tenantId, hotelId, data.name, data.category,
      data.description || null, data.address || null, data.phone || null,
      data.website || null, data.hours || null, data.priceRange || null,
      data.hotelRelationship || 'none', data.rating || null,
      data.notes || null, userId,
    ]
  );

  return { id, ...data, isActive: true };
}

/**
 * Update a directory entry.
 */
export async function updateDirectoryEntry(
  tenantId: string,
  entryId: string,
  updates: Record<string, any>
) {
  const allowedFields: Record<string, string> = {
    name: 'name',
    category: 'category',
    description: 'description',
    address: 'address',
    phone: 'phone',
    website: 'website',
    hours: 'hours',
    priceRange: 'price_range',
    hotelRelationship: 'hotel_relationship',
    rating: 'rating',
    notes: 'notes',
    isActive: 'is_active',
  };

  const setClauses: string[] = ['updated_at = NOW()'];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbField = allowedFields[key];
    if (dbField) {
      setClauses.push(`${dbField} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  params.push(entryId, tenantId);
  await query(
    `UPDATE concierge_directory SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
    params
  );

  return { id: entryId, ...updates };
}

/**
 * Handle a guest inquiry: match interests to directory entries.
 * Ranks by hotel relationship (preferred partners first), then rating.
 */
export async function handleInquiry(
  tenantId: string,
  hotelId: string,
  userId: string,
  data: {
    guestId?: string;
    category: string;
    interests?: string[];
    budget?: string;
    notes?: string;
  }
) {
  // Find matching directory entries
  let sql = `
    SELECT id, name, category, description, address, phone, website,
           hours, price_range, hotel_relationship, rating
    FROM concierge_directory
    WHERE tenant_id = $1 AND hotel_id = $2 AND is_active = true
      AND category = $3
  `;
  const params: any[] = [tenantId, hotelId, data.category];
  let paramIdx = 4;

  if (data.budget) {
    sql += ` AND price_range = $${paramIdx}`;
    params.push(data.budget);
    paramIdx++;
  }

  // Rank: preferred > partner > recommended > none, then by rating
  sql += ` ORDER BY
    CASE hotel_relationship
      WHEN 'preferred' THEN 1
      WHEN 'partner' THEN 2
      WHEN 'recommended' THEN 3
      ELSE 4
    END ASC,
    rating DESC NULLS LAST
    LIMIT 10`;

  const matches = await query(sql, params);

  // Log the inquiry
  const inquiryId = generateId();
  await query(
    `INSERT INTO concierge_inquiries (
      id, tenant_id, hotel_id, guest_id, category, interests,
      budget, notes, staff_id, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      inquiryId, tenantId, hotelId, data.guestId || null,
      data.category, data.interests ? JSON.stringify(data.interests) : null,
      data.budget || null, data.notes || null, userId,
    ]
  );

  return {
    inquiryId,
    matches: matches.rows,
    matchCount: matches.rows.length,
  };
}

/**
 * Log a booking made through concierge.
 */
export async function logBooking(
  tenantId: string,
  hotelId: string,
  userId: string,
  data: {
    guestId: string;
    directoryEntryId?: string;
    serviceName: string;
    bookingDate: string;
    bookingTime?: string;
    partySize?: number;
    confirmationNumber?: string;
    notes?: string;
  }
) {
  const id = generateId();
  await query(
    `INSERT INTO concierge_bookings (
      id, tenant_id, hotel_id, guest_id, directory_entry_id,
      service_name, booking_date, booking_time, party_size,
      confirmation_number, notes, booked_by, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmed', NOW())`,
    [
      id, tenantId, hotelId, data.guestId, data.directoryEntryId || null,
      data.serviceName, data.bookingDate, data.bookingTime || null,
      data.partySize || null, data.confirmationNumber || null,
      data.notes || null, userId,
    ]
  );

  return { id, ...data, status: 'confirmed' };
}

/**
 * Get booking history for a guest.
 */
export async function getGuestHistory(tenantId: string, guestId: string) {
  const bookings = await query(
    `SELECT cb.id, cb.service_name, cb.booking_date, cb.booking_time,
            cb.party_size, cb.confirmation_number, cb.status, cb.notes,
            cb.created_at,
            cd.name AS directory_name, cd.category
     FROM concierge_bookings cb
     LEFT JOIN concierge_directory cd ON cd.id = cb.directory_entry_id
     WHERE cb.guest_id = $1 AND cb.tenant_id = $2
     ORDER BY cb.booking_date DESC`,
    [guestId, tenantId]
  );

  const inquiries = await query(
    `SELECT id, category, interests, budget, notes, created_at
     FROM concierge_inquiries
     WHERE guest_id = $1 AND tenant_id = $2
     ORDER BY created_at DESC
     LIMIT 20`,
    [guestId, tenantId]
  );

  return {
    bookings: bookings.rows,
    inquiries: inquiries.rows,
  };
}
