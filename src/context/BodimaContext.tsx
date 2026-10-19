import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BoardingMember,
  CollectionPool,
  ExpenseItem,
  ShoppingRequest,
  CatalogItem,
  PaymentStatus,
  CollectionCategory,
  BankDetails
} from '../types';
import {
  initialMembers,
  initialCollections,
  initialExpenses,
  initialShoppingRequests
} from '../data/initialData';
import { defaultCatalogItems } from '../i18n/defaultCatalog';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { cloudDb } from '../lib/cloudDb';
import { apiFetch } from '../lib/apiClient';

export interface OverdueItem {
  poolId: string;
  poolTitleSi: string;
  poolTitleEn: string;
  category: CollectionCategory;
  member: BoardingMember;
  collector: BoardingMember;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

interface BodimaContextType {
  members: BoardingMember[];
  collections: CollectionPool[];
  expenses: ExpenseItem[];
  shoppingList: ShoppingRequest[];
  catalog: CatalogItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Member actions
  addMember: (member: Omit<BoardingMember, 'id'>) => void;
  updateMember: (id: string, updates: Partial<BoardingMember>) => void;
  deleteMember: (id: string) => void;

  // Collection actions
  createCollectionPool: (poolData: {
    titleSi: string;
    titleEn: string;
    category: CollectionCategory;
    collectorId: string;
    targetPerPerson: number;
    dueDate: string;
    cycle: 'monthly' | 'weekly' | 'one-time';
    descriptionSi?: string;
    descriptionEn?: string;
    participatingMemberIds?: string[];
    collectorBankDetails?: BankDetails;
  }) => void;
  updatePaymentStatus: (
    poolId: string,
    memberId: string,
    isPaid: boolean,
    method?: 'cash' | 'transfer',
    note?: string
  ) => void;
  completeCollectionPool: (id: string, isCompleted?: boolean) => void;
  deleteCollectionPool: (id: string) => void;

  // Expense actions
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Shopping actions
  addShoppingRequest: (request: {
    nameSi: string;
    nameEn: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    requestedById: string;
    notes?: string;
    catalogItemId?: string;
  }) => void;
  toggleVoteShoppingRequest: (requestId: string, memberId: string) => void;
  togglePurchasedShoppingRequest: (requestId: string) => void;
  deleteShoppingRequest: (requestId: string) => void;
  convertShoppingListToExpense: (paidById: string, receiptUrl?: string) => void;

  // Catalog actions
  addCatalogItem: (item: Omit<CatalogItem, 'id' | 'lastUpdated'>) => CatalogItem;
  updateCatalogItemPrice: (id: string, newPrice: number) => void;
  deleteCatalogItem: (id: string) => void;

  // Helpers & computed metrics
  getFinancialSummary: () => {
    totalCollected: number;
    totalExpenses: number;
    remainingBalance: number;
    categories: {
      category: CollectionCategory;
      labelSi: string;
      labelEn: string;
      collected: number;
      expenses: number;
      balance: number;
      activeCount: number;
    }[];
  };
  getOverduePayments: () => OverdueItem[];
  getMemberById: (id: string) => BoardingMember | undefined;
  getShoppingListTotal: () => number;
  getShoppingListPerPerson: () => number;
  getMonthlyExpensesTotal: () => number;
  generateWhatsAppReminderLink: (memberId: string, poolId: string) => {
    url: string;
    messageText: string;
    memberPhone: string;
  };
  resetToDefaultData: () => void;
}

const STORAGE_KEY = 'bodima_state_v3';

// Clear legacy dummy test data from previous versions
try {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('bodima_state_v1') || key.startsWith('bodima_state_v2')) {
      localStorage.removeItem(key);
    }
  });
} catch {}

const BodimaContext = createContext<BodimaContextType | undefined>(undefined);

export const BodimaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const { bodima, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  const bodimaId = bodima?.id || 'b_default';

  const [members, setMembers] = useState<BoardingMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_members_${bodimaId}`);
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [collections, setCollections] = useState<CollectionPool[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_collections_${bodimaId}`);
    return saved ? JSON.parse(saved) : initialCollections;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses_${bodimaId}`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [shoppingList, setShoppingList] = useState<ShoppingRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_shopping_${bodimaId}`);
    return saved ? JSON.parse(saved) : initialShoppingRequests;
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_catalog`);
    return saved ? JSON.parse(saved) : defaultCatalogItems;
  });

  // If members is empty and user is logged in, automatically add logged in user as first member
  useEffect(() => {
    if (user && members.length === 0) {
      const initialUserMember: BoardingMember = {
        id: user.id,
        name: user.name,
        roleDescriptionSi: user.roleTitleSi || 'සාමාජික / භාරකරු',
        roleDescriptionEn: user.roleTitleEn || 'Boarder / Admin',
        phone: user.phone || '+94',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isActive: true,
        eatsAtBodima: user.eatsAtBodima !== false,
        bankDetails: user.bankDetails,
        isCollectorFor: ['rent', 'food', 'toiletries']
      };
      setMembers([initialUserMember]);
      cloudDb.saveMember(initialUserMember, bodimaId);
    }
  }, [user, members.length, bodimaId]);

  // Sync from Cloud Database (Supabase) or Backend API when Bodima changes
  useEffect(() => {
    // 1. Try fetching from Supabase first if configured
    cloudDb.getMembers(bodimaId).then(cloudMembers => {
      if (cloudMembers !== null) {
        setMembers(cloudMembers);
      } else {
        // Fallback to Backend API
        apiFetch(`/api/users?bodimaId=${bodimaId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.length) {
              setMembers(
                data.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  phone: u.phone,
                  roleDescriptionSi: u.roleTitleSi || 'සාමාජික',
                  roleDescriptionEn: u.roleTitleEn || 'Boarder',
                  avatar: u.avatar,
                  isActive: Boolean(u.isActive),
                  eatsAtBodima: u.eatsAtBodima !== false,
                  bankDetails: u.bankDetails
                }))
              );
            }
          })
          .catch(() => {});
      }
    });

    cloudDb.getCollections(bodimaId).then(cloudCollections => {
      if (cloudCollections !== null) {
        setCollections(cloudCollections);
      } else {
        apiFetch(`/api/collections?bodimaId=${bodimaId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.length) setCollections(data);
          })
          .catch(() => {});
      }
    });

    cloudDb.getExpenses(bodimaId).then(cloudExpenses => {
      if (cloudExpenses !== null) {
        setExpenses(cloudExpenses);
      } else {
        apiFetch(`/api/expenses?bodimaId=${bodimaId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.length) setExpenses(data);
          })
          .catch(() => {});
      }
    });

    cloudDb.getShopping(bodimaId).then(cloudShopping => {
      if (cloudShopping !== null) {
        setShoppingList(cloudShopping);
      } else {
        apiFetch(`/api/shopping?bodimaId=${bodimaId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.length) setShoppingList(data);
          })
          .catch(() => {});
      }
    });

    apiFetch('/api/catalog')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && data.length) setCatalog(data);
      })
      .catch(() => {});
  }, [bodimaId]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_collections`, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_shopping`, JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_catalog`, JSON.stringify(catalog));
  }, [catalog]);

  const getMemberById = (id: string): BoardingMember | undefined => {
    return members.find(m => m.id === id);
  };

  // Member actions
  const addMember = (data: Omit<BoardingMember, 'id'>) => {
    const newMember: BoardingMember = {
      ...data,
      id: `m_${Date.now()}`
    };
    setMembers(prev => [...prev, newMember]);
    cloudDb.saveMember(newMember, bodimaId);

    // Also add to any existing active collection pools as unpaid
    setCollections(prev =>
      prev.map(pool => {
        if (pool.isCompleted) return pool;
        const alreadyIn = pool.payments.some(p => p.memberId === newMember.id);
        if (alreadyIn) return pool;
        return {
          ...pool,
          payments: [
            ...pool.payments,
            {
              memberId: newMember.id,
              amount: pool.targetPerPerson,
              isPaid: false
            }
          ]
        };
      })
    );
  };

  const updateMember = (id: string, updates: Partial<BoardingMember>) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const updated = { ...m, ...updates };
        cloudDb.saveMember(updated, bodimaId);
        return updated;
      }
      return m;
    }));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Collection actions
  const createCollectionPool = (data: {
    titleSi: string;
    titleEn: string;
    category: CollectionCategory;
    collectorId: string;
    targetPerPerson: number;
    dueDate: string;
    cycle: 'monthly' | 'weekly' | 'one-time';
    descriptionSi?: string;
    descriptionEn?: string;
    participatingMemberIds?: string[];
    collectorBankDetails?: BankDetails;
  }) => {
    // If specific members are selected, use them.
    // If category is food and no specific members specified, default to eaters only!
    let targetMemberIds = data.participatingMemberIds;
    if (!targetMemberIds || targetMemberIds.length === 0) {
      if (data.category === 'food') {
        targetMemberIds = members.filter(m => m.isActive && m.eatsAtBodima !== false).map(m => m.id);
      } else {
        targetMemberIds = members.filter(m => m.isActive).map(m => m.id);
      }
    }

    const initialPayments: PaymentStatus[] = targetMemberIds.map(uid => ({
      memberId: uid,
      amount: data.targetPerPerson,
      isPaid: false
    }));

    const poolId = `col_${Date.now()}`;
    const newPool: CollectionPool = {
      id: poolId,
      bodimaId,
      ...data,
      participatingMemberIds: targetMemberIds,
      collectorBankDetails: data.collectorBankDetails,
      payments: initialPayments,
      createdAt: new Date().toISOString().split('T')[0],
      isCompleted: false
    };

    setCollections(prev => [newPool, ...prev]);
    cloudDb.saveCollection(newPool);

    // Send to backend
    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...data,
        bodimaId,
        participatingMemberIds: targetMemberIds,
        collectorBankDetails: data.collectorBankDetails
      })
    }).catch(err => console.error('Failed to save collection to backend:', err));
  };

  const updatePaymentStatus = (
    poolId: string,
    memberId: string,
    isPaid: boolean,
    method?: 'cash' | 'transfer',
    note?: string
  ) => {
    // Sync to Cloud DB & Backend
    cloudDb.updatePayment(poolId, memberId, isPaid, method, note);
    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch(`/api/collections/${poolId}/payments/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ isPaid, paymentMethod: method, note })
    }).catch(() => {});

    setCollections(prev =>
      prev.map(pool => {
        if (pool.id !== poolId) return pool;
        const updatedPayments = pool.payments.map(p => {
          if (p.memberId !== memberId) return p;
          return {
            ...p,
            isPaid,
            paidAt: isPaid ? new Date().toISOString().split('T')[0] : undefined,
            paymentMethod: isPaid ? method || 'cash' : undefined,
            note: note !== undefined ? note : p.note
          };
        });

        // Check if all are paid
        const allPaid = updatedPayments.every(p => p.isPaid);

        return {
          ...pool,
          payments: updatedPayments,
          isCompleted: allPaid
        };
      })
    );
  };

  const completeCollectionPool = (id: string, isCompleted: boolean = true) => {
    // Send to backend
    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch(`/api/collections/${id}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ isCompleted })
    }).catch(err => console.error('Failed to complete collection on backend:', err));

    setCollections(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, isCompleted };
          cloudDb.saveCollection(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteCollectionPool = (id: string) => {
    // Send to backend
    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch(`/api/collections/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }).catch(err => console.error('Failed to delete collection on backend:', err));

    setCollections(prev => prev.filter(p => p.id !== id));
  };

  // Expense actions
  const addExpense = (expenseData: Omit<ExpenseItem, 'id'>) => {
    const newExpense: ExpenseItem = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      bodimaId
    };
    setExpenses(prev => [newExpense, ...prev]);
    cloudDb.saveExpense(newExpense);

    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ...newExpense, bodimaId })
    }).catch(() => {});
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    cloudDb.deleteExpense(id);
    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }).catch(() => {});
  };

  // Catalog actions
  const addCatalogItem = (itemData: Omit<CatalogItem, 'id' | 'lastUpdated'>): CatalogItem => {
    const newItem: CatalogItem = {
      ...itemData,
      id: `cat_${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setCatalog(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateCatalogItemPrice = (id: string, newPrice: number) => {
    setCatalog(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              estimatedPrice: newPrice,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : item
      )
    );
  };

  const deleteCatalogItem = (id: string) => {
    setCatalog(prev => prev.filter(item => item.id !== id));
  };

  // Shopping actions
  const addShoppingRequest = (requestData: {
    nameSi: string;
    nameEn: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    requestedById: string;
    notes?: string;
    catalogItemId?: string;
  }) => {
    let catalogId = requestData.catalogItemId;

    // If it's not from catalog, check if existing or add to catalog automatically
    if (!catalogId) {
      const existing = catalog.find(
        c =>
          c.nameSi.toLowerCase() === requestData.nameSi.toLowerCase() ||
          c.nameEn.toLowerCase() === requestData.nameEn.toLowerCase()
      );
      if (existing) {
        catalogId = existing.id;
        // update price if changed
        if (existing.estimatedPrice !== requestData.unitPrice) {
          updateCatalogItemPrice(existing.id, requestData.unitPrice);
        }
      } else {
        const added = addCatalogItem({
          nameSi: requestData.nameSi,
          nameEn: requestData.nameEn || requestData.nameSi,
          category: 'Other',
          unit: requestData.unit,
          estimatedPrice: requestData.unitPrice
        });
        catalogId = added.id;
      }
    }

    const newRequest: ShoppingRequest = {
      id: `req_${Date.now()}`,
      bodimaId,
      catalogItemId: catalogId,
      nameSi: requestData.nameSi,
      nameEn: requestData.nameEn || requestData.nameSi,
      unitPrice: requestData.unitPrice,
      quantity: requestData.quantity,
      unit: requestData.unit,
      requestedById: requestData.requestedById,
      requestedAt: new Date().toISOString().split('T')[0],
      isPurchased: false,
      votes: [requestData.requestedById], // requester auto votes
      notes: requestData.notes
    };

    setShoppingList(prev => [newRequest, ...prev]);
    cloudDb.saveShopping(newRequest);

    const token = localStorage.getItem('bodima_jwt_token');
    apiFetch('/api/shopping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(newRequest)
    }).catch(() => {});
  };

  const toggleVoteShoppingRequest = (requestId: string, memberId: string) => {
    setShoppingList(prev =>
      prev.map(item => {
        if (item.id !== requestId) return item;
        const hasVoted = item.votes.includes(memberId);
        const updated = {
          ...item,
          votes: hasVoted
            ? item.votes.filter(id => id !== memberId)
            : [...item.votes, memberId]
        };
        cloudDb.saveShopping(updated);
        return updated;
      })
    );
  };

  const togglePurchasedShoppingRequest = (requestId: string) => {
    setShoppingList(prev =>
      prev.map(item => {
        if (item.id === requestId) {
          const updated = { ...item, isPurchased: !item.isPurchased };
          cloudDb.saveShopping(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteShoppingRequest = (requestId: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== requestId));
    cloudDb.deleteShopping(requestId);
  };

  const convertShoppingListToExpense = (paidById: string, receiptUrl?: string) => {
    const unpurchasedItems = shoppingList.filter(item => !item.isPurchased);
    if (unpurchasedItems.length === 0) return;

    const totalCost = unpurchasedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const itemsSummary = unpurchasedItems
      .map(i => `${i.nameSi} (${i.quantity} ${i.unit})`)
      .join(', ');

    // Add to expenses
    addExpense({
      titleSi: `සතිපතා බඩු ගැනීම (${unpurchasedItems.length} අයිතම)`,
      titleEn: `Weekly Groceries (${unpurchasedItems.length} items)`,
      category: 'food',
      amount: totalCost,
      paidById,
      date: new Date().toISOString().split('T')[0],
      receiptUrl: receiptUrl,
      notes: itemsSummary
    });

    // Mark all as purchased
    setShoppingList(prev => prev.map(item => ({ ...item, isPurchased: true })));
  };

  // Helper & computed functions
  const getOverduePayments = (): OverdueItem[] => {
    const today = new Date().toISOString().split('T')[0];
    const overdueList: OverdueItem[] = [];

    collections.forEach(pool => {
      if (pool.isCompleted) return;
      if (pool.dueDate < today) {
        const days = Math.floor(
          (new Date(today).getTime() - new Date(pool.dueDate).getTime()) / (1000 * 3600 * 24)
        );

        pool.payments.forEach(payment => {
          if (!payment.isPaid) {
            const member = getMemberById(payment.memberId);
            const collector = getMemberById(pool.collectorId);
            if (member && collector) {
              overdueList.push({
                poolId: pool.id,
                poolTitleSi: pool.titleSi,
                poolTitleEn: pool.titleEn,
                category: pool.category,
                member,
                collector,
                amount: payment.amount,
                dueDate: pool.dueDate,
                daysOverdue: days
              });
            }
          }
        });
      }
    });

    return overdueList;
  };

  const getShoppingListTotal = (): number => {
    return shoppingList
      .filter(item => !item.isPurchased)
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getShoppingListPerPerson = (): number => {
    // Only divide by members who eat at the bodima!
    const eatingMembers = members.filter(m => m.isActive && m.eatsAtBodima !== false);
    const count = eatingMembers.length > 0 ? eatingMembers.length : members.filter(m => m.isActive).length;
    if (count === 0) return 0;
    const total = getShoppingListTotal();
    return Math.round((total / count) * 100) / 100;
  };

  const getMonthlyExpensesTotal = (): number => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    return expenses
      .filter(exp => exp.date.startsWith(currentMonth))
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const generateWhatsAppReminderLink = (memberId: string, poolId: string) => {
    const member = getMemberById(memberId);
    const pool = collections.find(p => p.id === poolId);
    if (!member || !pool) return { url: '', messageText: '', memberPhone: '' };

    const collector = getMemberById(pool.collectorId);
    const collectorName = collector ? collector.name : 'භාරකරු';
    const poolTitle = language === 'si' ? pool.titleSi : pool.titleEn;

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = pool.dueDate < today;

    // Check for collector bank details (either attached to pool or collector's profile)
    const bank = pool.collectorBankDetails || collector?.bankDetails;
    let bankText = '';
    if (bank && bank.accountNumber) {
      if (language === 'si') {
        bankText = `\n\n💳 Online Transfer සඳහා ගිණුම් විස්තර:\n• බැංකුව: ${bank.bankName}\n• ගිණුම් අංකය: ${bank.accountNumber}\n• ගිණුමේ නම: ${bank.accountName}${bank.branch ? `\n• ශාඛාව: ${bank.branch}` : ''}`;
      } else {
        bankText = `\n\n💳 Bank Details for Online Transfer:\n• Bank: ${bank.bankName}\n• Account No: ${bank.accountNumber}\n• Account Name: ${bank.accountName}${bank.branch ? `\n• Branch: ${bank.branch}` : ''}`;
      }
    }

    let messageText = '';
    if (language === 'si') {
      const overdueNotice = isOverdue ? '⚠️ [ගෙවීමේ දිනය ඉක්මවා ඇත!]\n' : '';
      messageText = `${overdueNotice}මචං ${member.name}, \n\nබෝඩිමේ "${poolTitle}" සඳහා ඔබේ කොටස වන රු. ${pool.targetPerPerson.toLocaleString()} තවම ගෙවා නොමැත.\nඅවසන් දිනය: ${pool.dueDate}\n\nකරුණාකර හැකි ඉක්මනින් ${collectorName} ට ලබාදෙන්න හෝ පහත ගිණුමට Transfer කරන්න.${bankText}\n\nස්තූතියි! 🙏\n(බෝඩිම - Bodima Management App)`;
    } else {
      const overdueNotice = isOverdue ? '⚠️ [PAYMENT OVERDUE!]\n' : '';
      messageText = `${overdueNotice}Hi ${member.name}, \n\nYour contribution of Rs. ${pool.targetPerPerson.toLocaleString()} for "${poolTitle}" is currently pending.\nDue date: ${pool.dueDate}\n\nPlease hand it over to ${collectorName} or transfer to the account below.${bankText}\n\nThank you! 🙏\n(Bodima Management App)`;
    }

    // Format phone number for international WhatsApp link
    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    return {
      url,
      messageText,
      memberPhone: member.phone
    };
  };

  const getFinancialSummary = () => {
    let totalCollected = 0;
    collections.forEach(pool => {
      pool.payments.forEach(p => {
        if (p.isPaid) totalCollected += p.amount;
      });
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBalance = totalCollected - totalExpenses;

    const categoryMeta: { [key in CollectionCategory]: { si: string; en: string } } = {
      food: { si: 'කෑම සහ උයන බඩු', en: 'Food & Groceries' },
      rent: { si: 'මාසික බෝඩිම් කුලිය', en: 'Monthly Rent' },
      toiletries: { si: 'සබන් සහ කුස්සියේ පොදු බඩු', en: 'Soap & Supplies' },
      utilities: { si: 'විදුලි/ජල බිල්පත්', en: 'Utilities' },
      other: { si: 'වෙනත් වියදම්', en: 'Other' }
    };

    const categories = (['food', 'rent', 'toiletries', 'utilities', 'other'] as CollectionCategory[]).map(cat => {
      let collected = 0;
      let activeCount = 0;
      collections.forEach(pool => {
        if (pool.category === cat) {
          if (!pool.isCompleted) activeCount++;
          pool.payments.forEach(p => {
            if (p.isPaid) collected += p.amount;
          });
        }
      });

      const catExpenses = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        category: cat,
        labelSi: categoryMeta[cat].si,
        labelEn: categoryMeta[cat].en,
        collected,
        expenses: catExpenses,
        balance: collected - catExpenses,
        activeCount
      };
    });

    return {
      totalCollected,
      totalExpenses,
      remainingBalance,
      categories
    };
  };

  const resetToDefaultData = () => {
    setMembers(initialMembers);
    setCollections(initialCollections);
    setExpenses(initialExpenses);
    setShoppingList(initialShoppingRequests);
    setCatalog(defaultCatalogItems);
    localStorage.removeItem(`${STORAGE_KEY}_members`);
    localStorage.removeItem(`${STORAGE_KEY}_collections`);
    localStorage.removeItem(`${STORAGE_KEY}_expenses`);
    localStorage.removeItem(`${STORAGE_KEY}_shopping`);
    localStorage.removeItem(`${STORAGE_KEY}_catalog`);
  };

  return (
    <BodimaContext.Provider
      value={{
        members,
        collections,
        expenses,
        shoppingList,
        catalog,
        activeTab,
        setActiveTab,
        addMember,
        updateMember,
        deleteMember,
        createCollectionPool,
        updatePaymentStatus,
        completeCollectionPool,
        deleteCollectionPool,
        addExpense,
        deleteExpense,
        addShoppingRequest,
        toggleVoteShoppingRequest,
        togglePurchasedShoppingRequest,
        deleteShoppingRequest,
        convertShoppingListToExpense,
        addCatalogItem,
        updateCatalogItemPrice,
        deleteCatalogItem,
        getFinancialSummary,
        getOverduePayments,
        getMemberById,
        getShoppingListTotal,
        getShoppingListPerPerson,
        getMonthlyExpensesTotal,
        generateWhatsAppReminderLink,
        resetToDefaultData
      }}
    >
      {children}
    </BodimaContext.Provider>
  );
};

export const useBodima = () => {
  const context = useContext(BodimaContext);
  if (!context) {
    throw new Error('useBodima must be used within a BodimaProvider');
  }
  return context;
};
