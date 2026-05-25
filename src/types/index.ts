export type GenderRule = 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED';
export type Campus = 'TESANO' | 'ABEKA';
export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'ROOM_UNASSIGNED';
export type PaymentStatus = 'PENDING' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'FAILED';

export interface Hostel {
  id: string;
  name: string;
  campus: Campus;
  gender_rule: GenderRule;
  location_name?: string;
  distance_from_campus?: string;
  status: 'OPEN' | 'CLOSED' | 'FULL';
  images?: string[];
  description?: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  building_id: string;
  room_number: string;
  capacity: number;
  gender_rule: 'MALE_ONLY' | 'FEMALE_ONLY';
  current_occupancy: number;
  price: number;
  ac_available: boolean;
  wifi_available: boolean;
  kitchen_available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  hostel_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  allocation_mode: 'AUTO' | 'MANUAL';
  created_at: string;
}
