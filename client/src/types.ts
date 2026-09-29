export type ItemKind = 'lost' | 'found'
export type ItemStatus = 'open' | 'claimed' | 'returned' | 'closed'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  display_name: string
  avatar_emoji: string
  campus: string | null
  bio: string
  role: 'user' | 'admin'
  points: number
  created_at: string
}

export interface Category {
  id: string
  label: string
  emoji: string
  color: string
}

export interface Item {
  id: string
  kind: ItemKind
  title: string
  description: string
  category_id: string | null
  location: string
  occurred_at: string | null
  contact_name: string
  contact_line: string
  image_url: string | null
  reward: number
  status: ItemStatus
  owner_id: string
  created_at: string
  category: Category | null
  owner: {
    id: string
    display_name: string
    avatar_emoji: string
    campus: string | null
  } | null
  claim_count: number
  is_mine?: boolean
}

export interface Claim {
  id: string
  item_id: string
  claimant_id: string
  message: string
  status: ClaimStatus
  created_at: string
  item: Pick<Item, 'id' | 'title' | 'kind' | 'status'> | null
  claimant: { id: string; display_name: string; avatar_emoji: string } | null
}

export interface NotificationRow {
  id: string
  user_id: string
  item_id: string | null
  kind: string
  message: string
  read_at: string | null
  created_at: string
}

export interface Stats {
  total: number
  lost: number
  found: number
  open: number
  returned: number
  resolvedRate: number
  members: number
  claims: number
}

export interface ListItemsParams {
  q?: string
  kind?: ItemKind | 'all'
  category?: string
  status?: ItemStatus | 'all'
  sort?: 'new' | 'hot' | 'reward'
  limit?: number
  offset?: number
  mine?: string
  claimed?: string
}
