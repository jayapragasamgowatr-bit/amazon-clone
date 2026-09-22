const STATUS_RANK = Object.freeze({
  Pending: 0,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
  Cancelled: 99,
});

const ALLOWED_STATUSES = Object.freeze(Object.keys(STATUS_RANK));

const isValidStatus = (status) => ALLOWED_STATUSES.includes(status);

const canTransitionStatus = (from, to) => {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === to) return true;
  if (from === 'Cancelled') return false;
  if (from === 'Delivered') return to === 'Cancelled';
  if (to === 'Cancelled') return true;
  return STATUS_RANK[to] > STATUS_RANK[from];
};

const shouldRestoreStockOnCancellation = (status) => status !== 'Delivered';

module.exports = {
  STATUS_RANK,
  ALLOWED_STATUSES,
  isValidStatus,
  canTransitionStatus,
  shouldRestoreStockOnCancellation,
};
