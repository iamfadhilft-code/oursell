export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      barcode_records: {
        Row: {
          barcode_type: string
          barcode_value: string
          business_id: string
          created_at: string | null
          id: string
          label_size: string | null
          product_id: string | null
          product_name: string
          product_sku: string
          selling_price: number
          updated_at: string | null
        }
        Insert: {
          barcode_type: string
          barcode_value: string
          business_id: string
          created_at?: string | null
          id?: string
          label_size?: string | null
          product_id?: string | null
          product_name: string
          product_sku: string
          selling_price?: number
          updated_at?: string | null
        }
        Update: {
          barcode_type?: string
          barcode_value?: string
          business_id?: string
          created_at?: string | null
          id?: string
          label_size?: string | null
          product_id?: string | null
          product_name?: string
          product_sku?: string
          selling_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barcode_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_applications: {
        Row: {
          applied_at: string | null
          brand_name: string
          business_category: string | null
          email: string
          id: string
          notes: string | null
          owner_name: string
          phone: string | null
          rejection_reason: string | null
          requested_username: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          applied_at?: string | null
          brand_name: string
          business_category?: string | null
          email: string
          id?: string
          notes?: string | null
          owner_name: string
          phone?: string | null
          rejection_reason?: string | null
          requested_username: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          applied_at?: string | null
          brand_name?: string
          business_category?: string | null
          email?: string
          id?: string
          notes?: string | null
          owner_name?: string
          phone?: string | null
          rejection_reason?: string | null
          requested_username?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          business_category: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          outlet_count: number | null
          owner_name: string
          registration_status: string | null
          slug: string
          tax_rate_default: number | null
          terminal_count: number | null
          updated_at: string | null
        }
        Insert: {
          business_category?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          outlet_count?: number | null
          owner_name: string
          registration_status?: string | null
          slug: string
          tax_rate_default?: number | null
          terminal_count?: number | null
          updated_at?: string | null
        }
        Update: {
          business_category?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          outlet_count?: number | null
          owner_name?: string
          registration_status?: string | null
          slug?: string
          tax_rate_default?: number | null
          terminal_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          business_id: string
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          order_id: string | null
          payment_mode: string | null
          type: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          business_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_mode?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          business_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_mode?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_core_audit_logs: {
        Row: {
          action: string
          actor: string
          actor_role: string
          details: Json | null
          id: string
          ip_address: string | null
          target_entity: string
          timestamp: string | null
        }
        Insert: {
          action: string
          actor: string
          actor_role: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_entity: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          actor?: string
          actor_role?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_entity?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      dev_core_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_permanent: boolean | null
          name: string
          password_hash: string
          permissions: Json | null
          role: string | null
          salt: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_permanent?: boolean | null
          name: string
          password_hash: string
          permissions?: Json | null
          role?: string | null
          salt: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_permanent?: boolean | null
          name?: string
          password_hash?: string
          permissions?: Json | null
          role?: string | null
          salt?: string
          username?: string
        }
        Relationships: []
      }
      held_carts: {
        Row: {
          business_id: string
          cashier_id: string | null
          created_at: string | null
          customer_name: string | null
          discount: number | null
          held_number: string
          id: string
          items: Json
          notes: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
        }
        Insert: {
          business_id: string
          cashier_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          discount?: number | null
          held_number: string
          id?: string
          items?: Json
          notes?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Update: {
          business_id?: string
          cashier_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          discount?: number | null
          held_number?: string
          id?: string
          items?: Json
          notes?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "held_carts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          business_id: string
          created_at: string | null
          discount: number | null
          id: string
          invoice_id: string
          line_total: number
          product_id: string | null
          product_title: string
          quantity: number
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          discount?: number | null
          id?: string
          invoice_id: string
          line_total?: number
          product_id?: string | null
          product_title: string
          quantity?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          discount?: number | null
          id?: string
          invoice_id?: string
          line_total?: number
          product_id?: string | null
          product_title?: string
          quantity?: number
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          cashier_id: string | null
          cashier_name: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          donation_amount: number | null
          grand_total: number
          id: string
          invoice_number: string
          order_status: string | null
          payment_method: string | null
          payment_status: string | null
          subtotal: number
          tax_amount: number | null
        }
        Insert: {
          business_id: string
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          donation_amount?: number | null
          grand_total?: number
          id?: string
          invoice_number: string
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal?: number
          tax_amount?: number | null
        }
        Update: {
          business_id?: string
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          donation_amount?: number | null
          grand_total?: number
          id?: string
          invoice_number?: string
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal?: number
          tax_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          id: string
          invoice_id: string | null
          payment_method: string
          reference_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          payment_method: string
          reference_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string
          reference_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          description: string | null
          id: string
          name: string
          permission_key: string
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          name: string
          permission_key: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          name?: string
          permission_key?: string
        }
        Relationships: []
      }
      plan_enquiries: {
        Row: {
          billing_cycle: string
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          plan_id: string | null
          plan_name: string
          price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          plan_id?: string | null
          plan_name: string
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          plan_id?: string | null
          plan_name?: string
          price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_enquiries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          annual_price: number
          badge: string | null
          created_at: string | null
          description: string
          features: Json
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          outlet_limit: number | null
          product_limit: number | null
          sort_order: number
          staff_limit: number
          terminal_limit: number | null
          updated_at: string | null
        }
        Insert: {
          annual_price?: number
          badge?: string | null
          created_at?: string | null
          description: string
          features?: Json
          id: string
          is_active?: boolean
          monthly_price?: number
          name: string
          outlet_limit?: number | null
          product_limit?: number | null
          sort_order?: number
          staff_limit?: number
          terminal_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_price?: number
          badge?: string | null
          created_at?: string | null
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          outlet_limit?: number | null
          product_limit?: number | null
          sort_order?: number
          staff_limit?: number
          terminal_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          brand_name: string | null
          business_id: string
          category_id: string | null
          category_name: string | null
          cost_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          mrp: number | null
          selling_price: number
          sku: string
          stock: number
          tax_rate: number | null
          title: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          barcode: string
          brand_name?: string | null
          business_id: string
          category_id?: string | null
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          mrp?: number | null
          selling_price?: number
          sku: string
          stock?: number
          tax_rate?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string
          brand_name?: string | null
          business_id?: string
          category_id?: string | null
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          mrp?: number | null
          selling_price?: number
          sku?: string
          stock?: number
          tax_rate?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          business_id: string
          buy_qty: number | null
          code: string
          created_at: string | null
          discount_value: number | null
          expires_at: string | null
          get_qty: number | null
          id: string
          is_active: boolean | null
          min_cart_value: number | null
          promo_type: string
          starts_at: string | null
          title: string
          usage_count: number | null
        }
        Insert: {
          business_id: string
          buy_qty?: number | null
          code: string
          created_at?: string | null
          discount_value?: number | null
          expires_at?: string | null
          get_qty?: number | null
          id?: string
          is_active?: boolean | null
          min_cart_value?: number | null
          promo_type: string
          starts_at?: string | null
          title: string
          usage_count?: number | null
        }
        Update: {
          business_id?: string
          buy_qty?: number | null
          code?: string
          created_at?: string | null
          discount_value?: number | null
          expires_at?: string | null
          get_qty?: number | null
          id?: string
          is_active?: boolean | null
          min_cart_value?: number | null
          promo_type?: string
          starts_at?: string | null
          title?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          business_id: string
          created_at: string | null
          expected_delivery: string | null
          id: string
          items: Json | null
          notes: string | null
          po_number: string
          status: string | null
          supplier_id: string
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          po_number: string
          status?: string | null
          supplier_id: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          po_number?: string
          status?: string | null
          supplier_id?: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          business_id: string
          card_sales: number | null
          cash_difference: number | null
          cash_sales: number | null
          cashier_id: string
          cashier_name: string
          closed_at: string | null
          closing_cash: number | null
          expected_cash: number | null
          expenses_total: number | null
          id: string
          khata_sales: number | null
          notes: string | null
          opened_at: string | null
          opening_cash: number | null
          status: string | null
          terminal_id: string | null
          total_sales: number | null
          upi_sales: number | null
        }
        Insert: {
          business_id: string
          card_sales?: number | null
          cash_difference?: number | null
          cash_sales?: number | null
          cashier_id: string
          cashier_name: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          expenses_total?: number | null
          id?: string
          khata_sales?: number | null
          notes?: string | null
          opened_at?: string | null
          opening_cash?: number | null
          status?: string | null
          terminal_id?: string | null
          total_sales?: number | null
          upi_sales?: number | null
        }
        Update: {
          business_id?: string
          card_sales?: number | null
          cash_difference?: number | null
          cash_sales?: number | null
          cashier_id?: string
          cashier_name?: string
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          expenses_total?: number | null
          id?: string
          khata_sales?: number | null
          notes?: string | null
          opened_at?: string | null
          opening_cash?: number | null
          status?: string | null
          terminal_id?: string | null
          total_sales?: number | null
          upi_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_records: {
        Row: {
          business_id: string
          can_give_discount: boolean | null
          created_at: string | null
          email: string | null
          employee_id: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          password_hash: string | null
          permissions: Json | null
          pin_hash: string
          role: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          can_give_discount?: boolean | null
          created_at?: string | null
          email?: string | null
          employee_id: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          permissions?: Json | null
          pin_hash: string
          role: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          can_give_discount?: boolean | null
          created_at?: string | null
          email?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          permissions?: Json | null
          pin_hash?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      store_expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string | null
          id: string
          notes: string | null
          paid_to: string | null
          payment_method: string | null
          recorded_by: string | null
          shift_id: string | null
          title: string
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          shift_id?: string | null
          title: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          shift_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_expenses_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      store_memberships: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          annual_price: number | null
          billing_cycle: string | null
          business_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_price: number | null
          outlet_limit: number | null
          plan_id: string | null
          plan_tier: string
          product_limit: number | null
          staff_limit: number | null
          status: string
          terminal_limit: number | null
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          billing_cycle?: string | null
          business_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price?: number | null
          outlet_limit?: number | null
          plan_id?: string | null
          plan_tier?: string
          product_limit?: number | null
          staff_limit?: number | null
          status?: string
          terminal_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          billing_cycle?: string | null
          business_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price?: number | null
          outlet_limit?: number | null
          plan_id?: string | null
          plan_tier?: string
          product_limit?: number | null
          staff_limit?: number | null
          status?: string
          terminal_limit?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string
          company_name: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean | null
          name: string
          outstanding_balance: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outstanding_balance?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outstanding_balance?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      support_inbox: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          sender_email: string
          status: string | null
          store_name: string | null
          subject: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          sender_email: string
          status?: string | null
          store_name?: string | null
          subject: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          sender_email?: string
          status?: string | null
          store_name?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_inbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
