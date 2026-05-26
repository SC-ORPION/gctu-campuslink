import { useState, useEffect } from 'react';

export interface Booking {
  id: string;
  hostelId: string;
  hostelName: string;
  roomNumber: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

class BookingStore {
  private currentBooking: Booking | null = {
    id: 'B001',
    hostelId: 'h1',
    hostelName: 'Tesano Palace Hostel',
    roomNumber: 'A-204',
    amount: 3200,
    status: 'PENDING',
    createdAt: new Date().toLocaleDateString(),
  };
  private listeners = new Set<() => void>();

  getBooking() {
    return this.currentBooking;
  }

  setBooking(booking: Booking | null) {
    this.currentBooking = booking;
    this.emit();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const bookingStoreInstance = new BookingStore();

export function useBookingStore() {
  const [currentBooking, setCurrentBooking] = useState(bookingStoreInstance.getBooking());

  useEffect(() => {
    const unsubscribe = bookingStoreInstance.subscribe(() => {
      setCurrentBooking(bookingStoreInstance.getBooking());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    currentBooking,
    setBooking: (b: Booking | null) => bookingStoreInstance.setBooking(b),
  };
}
