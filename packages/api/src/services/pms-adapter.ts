import { query } from '../config/database';

/**
 * PMS (Property Management System) adapter interface.
 * Abstracts the reservation/guest data source so the system
 * can work with manual data or external PMS integrations.
 */
export interface PmsAdapter {
  getReservations(tenantId: string, hotelId: string, date: string): Promise<any[]>;
  getArrivals(tenantId: string, hotelId: string, date: string): Promise<any[]>;
  getDepartures(tenantId: string, hotelId: string, date: string): Promise<any[]>;
  getGuestProfile(tenantId: string, guestId: string): Promise<any>;
  syncReservation(tenantId: string, externalId: string): Promise<any>;
}

/**
 * Manual PMS Adapter: reads from the local reservations table.
 * Used when operating without an external PMS integration.
 */
export class ManualPmsAdapter implements PmsAdapter {
  async getReservations(tenantId: string, hotelId: string, date: string) {
    const result = await query(
      `SELECT r.*, g.first_name, g.last_name, g.email, g.vip_status,
              rm.room_number, rm.room_type
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.tenant_id = $1 AND r.hotel_id = $2
         AND $3 BETWEEN r.check_in_date AND r.check_out_date
       ORDER BY r.check_in_date`,
      [tenantId, hotelId, date]
    );
    return result.rows;
  }

  async getArrivals(tenantId: string, hotelId: string, date: string) {
    const result = await query(
      `SELECT r.*, g.first_name, g.last_name, g.email, g.phone, g.vip_status,
              rm.room_number, rm.room_type
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.tenant_id = $1 AND r.hotel_id = $2
         AND r.check_in_date = $3
         AND r.status IN ('confirmed', 'arriving_today')
       ORDER BY g.vip_status DESC, g.last_name`,
      [tenantId, hotelId, date]
    );
    return result.rows;
  }

  async getDepartures(tenantId: string, hotelId: string, date: string) {
    const result = await query(
      `SELECT r.*, g.first_name, g.last_name, g.email, g.vip_status,
              rm.room_number, rm.room_type
       FROM reservations r
       JOIN guests g ON g.id = r.guest_id
       LEFT JOIN rooms rm ON rm.id = r.room_id
       WHERE r.tenant_id = $1 AND r.hotel_id = $2
         AND r.check_out_date = $3
         AND r.status = 'checked_in'
       ORDER BY g.last_name`,
      [tenantId, hotelId, date]
    );
    return result.rows;
  }

  async getGuestProfile(tenantId: string, guestId: string) {
    const result = await query(
      `SELECT * FROM guests WHERE id = $1 AND tenant_id = $2`,
      [guestId, tenantId]
    );
    return result.rows[0] || null;
  }

  async syncReservation(_tenantId: string, _externalId: string) {
    // Manual adapter has no external system to sync with
    return { message: 'Manual mode: no external sync available' };
  }
}

/**
 * Infor HMS Adapter stub.
 * TODO: Implement Infor HMS API integration
 * Pseudocode:
 *   1. Initialize with Infor HMS API credentials (base URL, API key, property ID)
 *   2. getReservations: GET /api/v1/reservations?date={date}&propertyId={propertyId}
 *   3. getArrivals: GET /api/v1/arrivals?date={date}
 *   4. getDepartures: GET /api/v1/departures?date={date}
 *   5. getGuestProfile: GET /api/v1/guests/{guestId}
 *   6. syncReservation: GET /api/v1/reservations/{externalId}, then upsert locally
 *   7. Map external data format to internal schema
 *   8. Handle rate limiting, retries, and error mapping
 */
export class InforHmsAdapter implements PmsAdapter {
  private _baseUrl: string;
  private _apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this._baseUrl = baseUrl;
    this._apiKey = apiKey;
  }

  async getReservations(_tenantId: string, _hotelId: string, _date: string): Promise<any[]> {
    // TODO: Implement Infor HMS API call
    return Promise.resolve([]);
  }

  async getArrivals(_tenantId: string, _hotelId: string, _date: string): Promise<any[]> {
    return Promise.resolve([]);
  }

  async getDepartures(_tenantId: string, _hotelId: string, _date: string): Promise<any[]> {
    return Promise.resolve([]);
  }

  async getGuestProfile(_tenantId: string, _guestId: string) {
    throw new Error('Infor HMS integration not yet implemented');
  }

  async syncReservation(_tenantId: string, _externalId: string) {
    throw new Error('Infor HMS integration not yet implemented');
  }
}

/**
 * Factory to get the appropriate PMS adapter based on configuration.
 */
export function getPmsAdapter(type: string = 'manual'): PmsAdapter {
  switch (type) {
    case 'infor':
      return new InforHmsAdapter(
        process.env.INFOR_HMS_URL || '',
        process.env.INFOR_HMS_API_KEY || ''
      );
    case 'manual':
    default:
      return new ManualPmsAdapter();
  }
}
