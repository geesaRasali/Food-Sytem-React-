export const ROLES = {
  ADMIN: "admin",
  MANAGEMENT_STAFF: "management staff",
  STOREKEEPER: "storekeeper",
  KITCHEN_STAFF: "kitchen staff",
  DELIVERY_STAFF: "delivery staff",
  // Legacy value for existing seeded data.
  STAFF: "staff",
};

export const normalizeRole = (role = "") => {
  if ((role || "").toLowerCase() === ROLES.STAFF) {
    return ROLES.MANAGEMENT_STAFF;
  }
  return (role || "").toLowerCase();
};

export const ADMIN_PANEL_ROLES = [
  ROLES.ADMIN,
  ROLES.MANAGEMENT_STAFF,
  ROLES.STOREKEEPER,
  ROLES.KITCHEN_STAFF,
  ROLES.DELIVERY_STAFF,
  ROLES.STAFF,
];

export const PERMISSIONS = {
  dashboard: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.STOREKEEPER],
  addFood: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF],
  listFood: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF],
  categories: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF],
  stockControl: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.STOREKEEPER],
  supplierManagement: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.STOREKEEPER],
  kitchenMonitoring: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.KITCHEN_STAFF],
  deliveryMonitoring: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.DELIVERY_STAFF],
  orders: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF, ROLES.STAFF],
  messages: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF],
  staffUsers: [ROLES.ADMIN],
  reports: [ROLES.ADMIN, ROLES.MANAGEMENT_STAFF],
  settings: [
    ROLES.ADMIN,
    ROLES.MANAGEMENT_STAFF,
    ROLES.STOREKEEPER,
    ROLES.KITCHEN_STAFF,
    ROLES.DELIVERY_STAFF,
  ],
};

export const isAdminPanelRole = (role = "") => ADMIN_PANEL_ROLES.includes((role || "").toLowerCase());

export const hasPermission = (role, permissionKey) => {
  const normalizedRole = normalizeRole(role);
  return (PERMISSIONS[permissionKey] || []).includes(normalizedRole);
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGEMENT_STAFF]: "Management Staff",
  [ROLES.STOREKEEPER]: "Storekeeper",
  [ROLES.KITCHEN_STAFF]: "Kitchen Staff",
  [ROLES.DELIVERY_STAFF]: "Delivery Staff",
  [ROLES.STAFF]: "Management Staff",
};

export const STAFF_ROLE_OPTIONS = [
  ROLES.MANAGEMENT_STAFF,
  ROLES.STOREKEEPER,
  ROLES.KITCHEN_STAFF,
  ROLES.DELIVERY_STAFF,
];
