/** Role options for new users and their display icons */
export const ROLES = [
  { value: 'developer', label: 'Developer', icon: '💻' },
  { value: 'qa', label: 'QA', icon: '🧪' },
  { value: 'scrum_master', label: 'Scrum Master', icon: '📋' },
  { value: 'po', label: 'PO', icon: '👤' },
  { value: 'other', label: 'Other', icon: '✦' },
]

export function getRoleIcon(role) {
  const r = ROLES.find((x) => x.value === (role || ''))
  return r?.icon ?? '✦'
}

export function getRoleLabel(role) {
  const r = ROLES.find((x) => x.value === (role || ''))
  return r?.label ?? 'Other'
}
