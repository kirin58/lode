export type Role = 'user' | 'admin'
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
  role: Role
  points: number
  created_at: string
}

export interface UserWithSecret extends User {
  password_hash: string
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
}

export interface ItemWithMeta extends Item {
  category: Category | null
  owner: Pick<User, 'id' | 'display_name' | 'avatar_emoji' | 'campus'> | null
  claim_count: number
}

export interface Claim {
  id: string
  item_id: string
  claimant_id: string
  message: string
  status: ClaimStatus
  created_at: string
}

export interface ClaimWithMeta extends Claim {
  item: Item | null
  claimant: Pick<User, 'id' | 'display_name' | 'avatar_emoji'> | null
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

export interface ListItemsQuery {
  q?: string
  kind?: ItemKind | 'all'
  category?: string
  status?: ItemStatus | 'all'
  sort?: 'new' | 'hot' | 'reward'
  limit?: number
  offset?: number
  ownerId?: string
  claimedBy?: string
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

export interface Store {
  readonly driver: 'neon' | 'memory'
  init(): Promise<void>
  listCategories(): Promise<Category[]>
  createUser(input: {
    email: string
    password_hash: string
    display_name: string
    avatar_emoji?: string
    campus?: string | null
  }): Promise<User>
  findUserByEmail(email: string): Promise<UserWithSecret | null>
  findUserById(id: string): Promise<User | null>
  updateUser(
    id: string,
    patch: Partial<Pick<User, 'display_name' | 'avatar_emoji' | 'campus' | 'bio'>>
  ): Promise<User | null>
  listItems(query: ListItemsQuery): Promise<{ items: ItemWithMeta[]; total: number }>
  getItem(id: string): Promise<ItemWithMeta | null>
  createItem(item: Omit<Item, 'id' | 'created_at' | 'status'>): Promise<ItemWithMeta>
  updateItem(
    id: string,
    patch: Partial<Pick<Item, 'title' | 'description' | 'category_id' | 'location' | 'occurred_at' | 'contact_line' | 'image_url' | 'reward' | 'status'>>,
    ownerId: string
  ): Promise<ItemWithMeta | null>
  deleteItem(id: string, ownerId: string): Promise<boolean>
  createClaim(itemId: string, claimantId: string, message: string): Promise<Claim | null>
  listClaimsForOwner(ownerId: string): Promise<ClaimWithMeta[]>
  listClaimsByUser(userId: string): Promise<ClaimWithMeta[]>
  updateClaim(id: string, status: ClaimStatus, ownerId: string): Promise<ClaimWithMeta | null>
  notify(userId: string, itemId: string | null, kind: string, message: string): Promise<void>
  listNotifications(userId: string): Promise<NotificationRow[]>
  markNotificationsRead(userId: string): Promise<void>
  stats(): Promise<Stats>
}
