// role_types.category for admin-granted permission roles (today only Event
// Admin). They are not YM positions: members can't pick or edit them, and
// they are never displayed as a role (#74). Access checks use
// is_event_admin() in the database, not this label.
export const SYSTEM_ROLE_CATEGORY = 'system'
