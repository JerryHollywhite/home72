export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    role: 'owner' | 'staff'
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role: 'owner' | 'staff'
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'owner' | 'staff'
                    created_at?: string
                }
            }
            rooms: {
                Row: {
                    id: string
                    room_number: string
                    price: number
                    capacity: number
                    facilities: any
                    photos: string[]
                    status: 'available' | 'occupied' | 'maintenance'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    room_number: string
                    price: number
                    capacity?: number
                    facilities?: any
                    photos?: string[]
                    status?: 'available' | 'occupied' | 'maintenance'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    room_number?: string
                    price?: number
                    capacity?: number
                    facilities?: any
                    photos?: string[]
                    status?: 'available' | 'occupied' | 'maintenance'
                    created_at?: string
                    updated_at?: string
                }
            }
            tenants: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    email: string | null
                    room_id: string | null
                    start_date: string
                    due_date: string
                    contract_url: string | null
                    id_card_url: string | null
                    status: 'active' | 'inactive'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    email?: string | null
                    room_id?: string | null
                    start_date: string
                    due_date: string
                    contract_url?: string | null
                    id_card_url?: string | null
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    email?: string | null
                    room_id?: string | null
                    start_date?: string
                    due_date?: string
                    contract_url?: string | null
                    id_card_url?: string | null
                    status?: 'active' | 'inactive'
                    created_at?: string
                    updated_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    tenant_id: string
                    month: string
                    amount: number
                    status: 'pending' | 'verified' | 'rejected'
                    proof_url: string | null
                    pay_date: string | null
                    verified_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    month: string
                    amount: number
                    status?: 'pending' | 'verified' | 'rejected'
                    proof_url?: string | null
                    pay_date?: string | null
                    verified_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    month?: string
                    amount?: number
                    status?: 'pending' | 'verified' | 'rejected'
                    proof_url?: string | null
                    pay_date?: string | null
                    verified_at?: string | null
                    created_at?: string
                }
            }
            reports: {
                Row: {
                    id: string
                    tenant_id: string
                    message: string
                    photo_url: string | null
                    status: 'open' | 'in_progress' | 'done'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    message: string
                    photo_url?: string | null
                    status?: 'open' | 'in_progress' | 'done'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    message?: string
                    photo_url?: string | null
                    status?: 'open' | 'in_progress' | 'done'
                    created_at?: string
                    updated_at?: string
                }
            }
            booking: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    room_id: string
                    booking_date: string
                    dp_amount: number | null
                    status: 'pending' | 'confirmed' | 'canceled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    room_id: string
                    booking_date: string
                    dp_amount?: number | null
                    status?: 'pending' | 'confirmed' | 'canceled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    room_id?: string
                    booking_date?: string
                    dp_amount?: number | null
                    status?: 'pending' | 'confirmed' | 'canceled'
                    created_at?: string
                }
            }
        }
    }
}
