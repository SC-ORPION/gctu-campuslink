import { useState, useEffect } from 'react';

export interface Hostel {
  id: string;
  name: string;
  location: string;
  price: number;
  capacity: number;
  available: number;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  rating: number;
  image: string;
}

class HostelStore {
  private hostels: Hostel[] = [
    {
      id: 'h1',
      name: 'Tesano Palace Hostel',
      location: 'Tesano (2 mins from campus)',
      price: 3200,
      capacity: 120,
      available: 14,
      gender: 'MIXED',
      rating: 4.8,
      image: '/hostel-images/tesano_palace.jpg',
    },
    {
      id: 'h2',
      name: 'Royal Elite Hostel',
      location: 'Tesano (5 mins from campus)',
      price: 2800,
      capacity: 80,
      available: 8,
      gender: 'FEMALE',
      rating: 4.5,
      image: '/hostel-images/royal_elite.jpg',
    },
    {
      id: 'h3',
      name: 'Academic Heights Hostel',
      location: 'Tesano (8 mins from campus)',
      price: 2500,
      capacity: 100,
      available: 32,
      gender: 'MALE',
      rating: 4.2,
      image: '/hostel-images/academic_heights.jpg',
    }
  ];
  private selectedHostelId: string | null = null;
  private listeners = new Set<() => void>();

  getHostels() {
    return this.hostels;
  }

  getSelectedHostelId() {
    return this.selectedHostelId;
  }

  setSelectedHostelId(id: string | null) {
    this.selectedHostelId = id;
    this.emit();
  }

  addHostel(hostel: Hostel) {
    this.hostels.push(hostel);
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

export const hostelStoreInstance = new HostelStore();

export function useHostelStore() {
  const [hostels, setHostels] = useState(hostelStoreInstance.getHostels());
  const [selectedHostelId, setSelectedHostelId] = useState(hostelStoreInstance.getSelectedHostelId());

  useEffect(() => {
    const unsubscribe = hostelStoreInstance.subscribe(() => {
      setHostels([...hostelStoreInstance.getHostels()]);
      setSelectedHostelId(hostelStoreInstance.getSelectedHostelId());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    hostels,
    selectedHostel: hostels.find((h) => h.id === selectedHostelId) || null,
    setSelectedHostelId: (id: string | null) => hostelStoreInstance.setSelectedHostelId(id),
    addHostel: (h: Hostel) => hostelStoreInstance.addHostel(h),
  };
}
