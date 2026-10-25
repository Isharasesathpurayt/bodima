import { getSupabase } from './supabase';
import { BoardingMember, CollectionPool, ExpenseItem, ShoppingRequest } from '../types';

const throwOnDatabaseError = (error: { message: string } | null) => {
  if (error) {
    console.error('Supabase database request failed:', error.message);
    throw error;
  }
};

// Cloud Database Bridge for Supabase
export const cloudDb = {
  // Test connection to Supabase
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase URL හෝ Anon Key ඇතුළත් කර නොමැත' };
    }

    try {
      const { data, error } = await supabase.rpc('connection_check');
      if (error) {
        return { success: false, message: `දත්ත සමුදාය සම්බන්ධ විය නොහැක: ${error.message}` };
      }
      if (data !== true) return { success: false, message: 'දත්ත සමුදාය සැකසුම තහවුරු කළ නොහැක.' };
      return { success: true, message: 'සාර්ථකව සම්බන්ධ විය! (Connected to Supabase)' };
    } catch (err: any) {
      return { success: false, message: err.message || 'සම්බන්ධතා දෝෂයක්' };
    }
  },

  // Users / Members
  async getMembers(bodimaId: string): Promise<BoardingMember[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('bodima_id', bodimaId)
        .order('created_at', { ascending: true });

      if (error || !data) return null;

      return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        roleDescriptionSi: u.role_title_si || 'සාමාජික',
        roleDescriptionEn: u.role_title_en || 'Boarder',
        avatar: u.avatar,
        isActive: Boolean(u.is_active),
        eatsAtBodima: u.eats_at_bodima !== false,
        bankDetails: u.bank_name ? {
          bankName: u.bank_name,
          accountNumber: u.bank_account,
          accountName: u.bank_account_name,
          branch: u.bank_branch
        } : undefined,
        isCollectorFor: u.role === 'admin' ? ['rent', 'food', 'toiletries'] : []
      }));
    } catch {
      return null;
    }
  },

  async saveMember(member: BoardingMember, bodimaId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('users').upsert({
        id: member.id,
        bodima_id: bodimaId,
        name: member.name,
        phone: member.phone,
        role_title_si: member.roleDescriptionSi,
        role_title_en: member.roleDescriptionEn,
        avatar: member.avatar,
        is_active: member.isActive,
        eats_at_bodima: member.eatsAtBodima !== false,
        bank_name: member.bankDetails?.bankName,
        bank_account: member.bankDetails?.accountNumber,
        bank_account_name: member.bankDetails?.accountName,
        bank_branch: member.bankDetails?.branch
      });
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  },

  // Collections
  async getCollections(bodimaId: string): Promise<CollectionPool[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data: pools, error } = await supabase
        .from('collections')
        .select('*')
        .eq('bodima_id', bodimaId)
        .order('created_at', { ascending: false });

      if (error || !pools) return null;

      const { data: payments } = await supabase
        .from('payments')
        .select('*');

      return pools.map((p: any) => {
        const poolPayments = (payments || []).filter((pay: any) => pay.collection_id === p.id);
        return {
          id: p.id,
          bodimaId: p.bodima_id,
          titleSi: p.title_si,
          titleEn: p.title_en,
          category: p.category,
          collectorId: p.collector_id,
          targetPerPerson: Number(p.target_per_person),
          dueDate: p.due_date,
          cycle: p.cycle,
          descriptionSi: p.description_si,
          descriptionEn: p.description_en,
          participatingMemberIds: Array.isArray(p.participating_member_ids) ? p.participating_member_ids : [],
          collectorBankDetails: p.collector_bank_info,
          isCompleted: Boolean(p.is_completed),
          createdAt: p.created_at,
          payments: poolPayments.map((pay: any) => ({
            memberId: pay.user_id,
            amount: Number(pay.amount),
            isPaid: Boolean(pay.is_paid),
            paidAt: pay.paid_at,
            paymentMethod: pay.payment_method,
            note: pay.note
          }))
        };
      });
    } catch {
      return null;
    }
  },

  async saveCollection(pool: CollectionPool): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('collections').upsert({
        id: pool.id,
        bodima_id: pool.bodimaId,
        title_si: pool.titleSi,
        title_en: pool.titleEn,
        category: pool.category,
        collector_id: pool.collectorId,
        target_per_person: pool.targetPerPerson,
        due_date: pool.dueDate,
        cycle: pool.cycle,
        description_si: pool.descriptionSi,
        description_en: pool.descriptionEn,
        participating_member_ids: pool.participatingMemberIds || [],
        collector_bank_info: pool.collectorBankDetails,
        is_completed: pool.isCompleted
      });
      throwOnDatabaseError(error);

      // Save payments
      if (pool.payments && pool.payments.length > 0) {
        const payRows = pool.payments.map(p => ({
          id: `p_${pool.id}_${p.memberId}`,
          collection_id: pool.id,
          user_id: p.memberId,
          amount: p.amount,
          is_paid: p.isPaid,
          paid_at: p.paidAt,
          payment_method: p.paymentMethod,
          note: p.note
        }));
        const { error: paymentsError } = await supabase.from('payments').upsert(payRows);
        throwOnDatabaseError(paymentsError);
      }
      return true;
    } catch {
      return false;
    }
  },

  async updatePayment(collectionId: string, memberId: string, isPaid: boolean, method?: string, note?: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('payments').update({
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: method,
        note: note
      }).eq('collection_id', collectionId).eq('user_id', memberId);
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  },

  // Expenses
  async getExpenses(bodimaId: string): Promise<ExpenseItem[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('bodima_id', bodimaId)
        .order('date', { ascending: false });

      if (error || !data) return null;

      return data.map((e: any) => ({
        id: e.id,
        bodimaId: e.bodima_id,
        titleSi: e.title_si,
        titleEn: e.title_en,
        category: e.category,
        amount: Number(e.amount),
        paidById: e.paid_by_id,
        date: e.date,
        receiptUrl: e.receipt_url,
        receiptName: e.receipt_name,
        notes: e.notes,
        collectionPoolId: e.collection_pool_id
      }));
    } catch {
      return null;
    }
  },

  async saveExpense(expense: ExpenseItem): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('expenses').upsert({
        id: expense.id,
        bodima_id: expense.bodimaId,
        title_si: expense.titleSi,
        title_en: expense.titleEn,
        category: expense.category,
        amount: expense.amount,
        paid_by_id: expense.paidById,
        date: expense.date,
        receipt_url: expense.receiptUrl,
        receipt_name: expense.receiptName,
        notes: expense.notes,
        collection_pool_id: expense.collectionPoolId
      });
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  },

  async deleteExpense(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  },

  // Shopping Requests
  async getShopping(bodimaId: string): Promise<ShoppingRequest[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('shopping_requests')
        .select('*')
        .eq('bodima_id', bodimaId)
        .order('requested_at', { ascending: false });

      if (error || !data) return null;

      return data.map((s: any) => ({
        id: s.id,
        bodimaId: s.bodima_id,
        catalogItemId: s.catalog_item_id,
        nameSi: s.name_si,
        nameEn: s.name_en,
        unitPrice: Number(s.unit_price),
        quantity: Number(s.quantity),
        unit: s.unit,
        requestedById: s.requested_by_id,
        requestedAt: s.requested_at,
        isPurchased: Boolean(s.is_purchased),
        votes: Array.isArray(s.votes) ? s.votes : [],
        notes: s.notes
      }));
    } catch {
      return null;
    }
  },

  async saveShopping(item: ShoppingRequest): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('shopping_requests').upsert({
        id: item.id,
        bodima_id: item.bodimaId,
        catalog_item_id: item.catalogItemId,
        name_si: item.nameSi,
        name_en: item.nameEn,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        unit: item.unit,
        requested_by_id: item.requestedById,
        requested_at: item.requestedAt,
        is_purchased: item.isPurchased,
        votes: item.votes,
        notes: item.notes
      });
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  },

  async deleteShopping(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('shopping_requests').delete().eq('id', id);
      throwOnDatabaseError(error);
      return true;
    } catch {
      return false;
    }
  }
};
