export const bookingStatuses = {
  PENDING: { label: 'Pending Verification', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const paymentStatuses = {
  PENDING: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  VERIFIED: { label: 'Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const allocationStatuses = {
  PENDING: { label: 'Unallocated', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ALLOCATED: { label: 'Room Allocated', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REVOKED: { label: 'Revoked', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};
