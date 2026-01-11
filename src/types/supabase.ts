// Supabase database types
// Generated from schema in supabase/migrations/

export type MembershipStatus = 'active' | 'alumni' | 'inactive'

export type RoleCategory =
  | 'ns'           // National Shura
  | 'council'      // The Council
  | 'regional'     // Regional Shura
  | 'subregional'  // SR roles
  | 'neighbor_net' // NN roles
  | 'cabinet'      // Cabinet roles
  | 'cloud'        // Cloud structure

export type ScopeType =
  | 'national'
  | 'region'
  | 'subregion'
  | 'neighbor_net'
  | 'department'
  | 'team'

// Education entry stored as JSONB in users table
export interface EducationJson {
  school_name?: string
  school_custom?: string
  degree_type?: string
  field_of_study?: string
  graduation_year?: number
}

// Core tables
export interface User {
  id: string
  email: string
  auth_id?: string | null
  claimed_at?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  personal_email?: string | null
  ethnicity?: string | null
  date_of_birth?: string | null // DATE stored as string
  education_level?: string | null
  education: EducationJson[]
  skills: string[]
  onboarding_completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Region {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subregion {
  id: string
  region_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NeighborNet {
  id: string
  subregion_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  department_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  user_id: string
  neighbor_net_id?: string | null
  region_id?: string | null
  status: MembershipStatus
  joined_at?: string | null
  left_at?: string | null
  created_at: string
  updated_at: string
}

export interface RoleType {
  id: string
  name: string
  code: string
  category: RoleCategory
  scope_type: ScopeType
  max_per_scope?: number | null
  description?: string | null
  created_at: string
}

export interface RoleAssignment {
  id: string
  user_id: string
  role_type_id?: string | null
  role_type_custom?: string | null
  scope_id?: string | null
  amir_user_id?: string | null
  amir_custom_name?: string | null
  start_date?: string | null
  end_date?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface UserProject {
  id: string
  user_id: string
  project_type?: string | null
  project_type_custom?: string | null
  role?: string | null
  description?: string | null
  amir_user_id?: string | null
  amir_custom_name?: string | null
  start_month?: number | null
  start_year?: number | null
  end_month?: number | null
  end_year?: number | null
  is_current: boolean
  created_at: string
  updated_at: string
}

// Joined types for queries
export interface UserWithRelations extends User {
  memberships?: Membership[]
  role_assignments?: RoleAssignment[]
  user_projects?: UserProject[]
}

// Insert/Update types (omit auto-generated fields)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'email' | 'auth_id'>>

export type RoleAssignmentInsert = Omit<RoleAssignment, 'id' | 'created_at' | 'updated_at'>
export type RoleAssignmentUpdate = Partial<Omit<RoleAssignment, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export type UserProjectInsert = Omit<UserProject, 'id' | 'created_at' | 'updated_at'>
export type UserProjectUpdate = Partial<Omit<UserProject, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export type MembershipInsert = Omit<Membership, 'id' | 'created_at' | 'updated_at'>
export type MembershipUpdate = Partial<Omit<Membership, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
