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

export interface Watch {
  id: string
  user_id: string
  keyword: string
  category_id: string | null
  kind: ItemKind | null
  active: boolean
  created_at: string
  category: Category | null
}

export interface Review {
  id: string
  reviewer_id: string
  target_id: string
  item_id: string | null
  rating: number
  comment: string
  created_at: string
  reviewer: { id: string; display_name: string; avatar_emoji: string } | null
  item: Pick<Item, 'id' | 'title'> | null
}

export interface Message {
  id: string
  item_id: string
  user_id: string
  body: string
  created_at: string
  user: { id: string; display_name: string; avatar_emoji: string } | null
}

export interface Reputation {
  user_id: string
  avg_rating: number
  reviews_count: number
  points: number
  helped_count: number
  score: number
  badge: 'newbie' | 'trusted' | 'hero' | 'legend'
}

export interface AdminOverview {
  stats: Stats
  top_users: {
    id: string
    display_name: string
    avatar_emoji: string
    campus: string | null
    points: number
    reviews_count: number
    avg_rating: number
  }[]
  recent_items: Item[]
  category_breakdown: { id: string; label: string; emoji: string; color: string; count: number }[]
  daily: { day: string; count: number }[]
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
