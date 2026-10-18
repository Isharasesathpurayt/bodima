import { BoardingMember, CollectionPool, ExpenseItem, ShoppingRequest } from '../types';

export const initialMembers: BoardingMember[] = [
  {
    id: 'm1',
    name: 'කසුන් පෙරේරා (Kasun)',
    roleDescriptionSi: 'මාසික බෝඩිම් කුලී භාරකරු',
    roleDescriptionEn: 'Monthly Rent Collector',
    phone: '+94771234567',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    eatsAtBodima: true,
    bankDetails: {
      bankName: 'Commercial Bank',
      accountNumber: '8001234567',
      accountName: 'K. A. Kasun Perera',
      branch: 'Maharagama'
    },
    isCollectorFor: ['rent']
  },
  {
    id: 'm2',
    name: 'නුවන් වික්‍රමසිංහ (Nuwan)',
    roleDescriptionSi: 'සතිපතා කෑම මුදල් භාරකරු',
    roleDescriptionEn: 'Weekly Food Collector',
    phone: '+94719876543',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    eatsAtBodima: true,
    bankDetails: {
      bankName: 'Bank of Ceylon (BOC)',
      accountNumber: '1009876543',
      accountName: 'Nuwan Wickramasinghe',
      branch: 'Nugegoda'
    },
    isCollectorFor: ['food']
  },
  {
    id: 'm3',
    name: 'දසුන් බණ්ඩාර (Dasun)',
    roleDescriptionSi: 'සබන් සහ පිරිසිදුකාරක භාරකරු',
    roleDescriptionEn: 'Soap & Cleaning Supplies Collector',
    phone: '+94701122334',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    eatsAtBodima: true,
    bankDetails: {
      bankName: 'Sampath Bank',
      accountNumber: '0044556677',
      accountName: 'Dasun Bandara',
      branch: 'Maharagama'
    },
    isCollectorFor: ['toiletries']
  },
  {
    id: 'm4',
    name: 'චාමර ජයවර්ධන (Chamara)',
    roleDescriptionSi: 'සාමාජික',
    roleDescriptionEn: 'Boarder',
    phone: '+94784455667',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    eatsAtBodima: true,
    isCollectorFor: []
  },
  {
    id: 'm5',
    name: 'සචිත් ලියනගේ (Sachith)',
    roleDescriptionSi: 'සාමාජික',
    roleDescriptionEn: 'Boarder',
    phone: '+94762233445',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    isActive: true,
    eatsAtBodima: false, // Does NOT eat food cooked at bodima
    isCollectorFor: []
  }
];

// Sample receipt SVG representation
export const sampleReceiptUrl = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560' viewBox='0 0 400 560' fill='%23fefefe'><rect width='400' height='560' fill='%23ffffff' stroke='%23e2e8f0' stroke-width='2'/><path d='M0,0 L20,10 L40,0 L60,10 L80,0 L100,10 L120,0 L140,10 L160,0 L180,10 L200,0 L220,10 L240,0 L260,10 L280,0 L300,10 L320,0 L340,10 L360,0 L380,10 L400,0' fill='none' stroke='%23cbd5e1' stroke-width='2'/><text x='200' y='55' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='%230f172a'>CARGILLS FOOD CITY</text><text x='200' y='78' font-family='sans-serif' font-size='13' text-anchor='middle' fill='%2364748b'>High Level Rd, Maharagama</text><text x='200' y='96' font-family='sans-serif' font-size='11' text-anchor='middle' fill='%2394a3b8'>Tel: 011-2850021 | VAT: 12345678</text><line x1='30' y1='115' x2='370' y2='115' stroke='%23334155' stroke-dasharray='4,4'/><text x='30' y='140' font-family='sans-serif' font-size='12' fill='%23475569'>Date: 2026-10-16 18:42</text><text x='370' y='140' font-family='sans-serif' font-size='12' text-anchor='end' fill='%23475569'>Bill: %2389421</text><line x1='30' y1='155' x2='370' y2='155' stroke='%23e2e8f0'/><text x='30' y='180' font-family='sans-serif' font-size='13' fill='%231e293b'>Nadu Rice 5kg</text><text x='370' y='180' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>1,150.00</text><text x='30' y='210' font-family='sans-serif' font-size='13' fill='%231e293b'>Red Dhal 2kg</text><text x='370' y='210' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>680.00</text><text x='30' y='240' font-family='sans-serif' font-size='13' fill='%231e293b'>Eggs 10 Pack</text><text x='370' y='240' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>380.00</text><text x='30' y='270' font-family='sans-serif' font-size='13' fill='%231e293b'>Coconut Oil 1L</text><text x='370' y='270' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>650.00</text><text x='30' y='300' font-family='sans-serif' font-size='13' fill='%231e293b'>Sunlight Soap x3</text><text x='370' y='300' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>390.00</text><text x='30' y='330' font-family='sans-serif' font-size='13' fill='%231e293b'>Soya Meat x4</text><text x='370' y='330' font-family='sans-serif' font-size='13' text-anchor='end' fill='%231e293b'>560.00</text><line x1='30' y1='360' x2='370' y2='360' stroke='%23334155' stroke-width='2'/><text x='30' y='395' font-family='sans-serif' font-size='16' font-weight='bold' fill='%230f172a'>TOTAL (Rs.)</text><text x='370' y='395' font-family='sans-serif' font-size='18' font-weight='bold' text-anchor='end' fill='%23059669'>3,810.00</text><text x='30' y='425' font-family='sans-serif' font-size='12' fill='%2364748b'>Cash Tendered: 4,000.00</text><text x='370' y='425' font-family='sans-serif' font-size='12' text-anchor='end' fill='%2364748b'>Change: 190.00</text><line x1='30' y1='450' x2='370' y2='450' stroke='%23e2e8f0'/><text x='200' y='490' font-family='sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%23475569'>*** THANK YOU COME AGAIN ***</text><text x='200' y='515' font-family='sans-serif' font-size='10' text-anchor='middle' fill='%2394a3b8'>Verified for Bodima System</text><path d='M0,560 L20,550 L40,560 L60,550 L80,560 L100,550 L120,560 L140,550 L160,560 L180,550 L200,560 L220,550 L240,560 L260,550 L280,560 L300,550 L320,560 L340,550 L360,560 L380,550 L400,560' fill='none' stroke='%23cbd5e1' stroke-width='2'/></svg>";

export const initialCollections: CollectionPool[] = [
  {
    id: 'col-1',
    titleSi: 'ඔක්තෝබර් මාසික බෝඩිම් කුලිය',
    titleEn: 'October Boarding Rent',
    category: 'rent',
    collectorId: 'm1', // Kasun
    targetPerPerson: 12000,
    dueDate: '2026-10-10', // Past date! Chamara is overdue
    cycle: 'monthly',
    descriptionSi: 'අයිතිකරුට ගෙවිය යුතු මාසික කුලිය. කසුන්ට ලබාදෙන්න.',
    descriptionEn: 'Monthly rent for the landlord. Please pay to Kasun.',
    collectorBankDetails: {
      bankName: 'Commercial Bank',
      accountNumber: '8001234567',
      accountName: 'K. A. Kasun Perera',
      branch: 'Maharagama'
    },
    createdAt: '2026-10-01',
    isCompleted: false,
    payments: [
      { memberId: 'm1', amount: 12000, isPaid: true, paidAt: '2026-10-02', paymentMethod: 'cash' },
      { memberId: 'm2', amount: 12000, isPaid: true, paidAt: '2026-10-04', paymentMethod: 'transfer' },
      { memberId: 'm3', amount: 12000, isPaid: true, paidAt: '2026-10-05', paymentMethod: 'cash' },
      { memberId: 'm4', amount: 12000, isPaid: false, note: 'රු. 5,000 ක පාට් පේමන්ට් පොරොන්දු විය' }, // Overdue!
      { memberId: 'm5', amount: 12000, isPaid: true, paidAt: '2026-10-08', paymentMethod: 'transfer' },
    ]
  },
  {
    id: 'col-2',
    titleSi: 'මෙම සතියේ කෑම සහ එළවලු මුදල්',
    titleEn: 'This Week Cooking & Grocery Fund',
    category: 'food',
    collectorId: 'm2', // Nuwan
    targetPerPerson: 1800,
    dueDate: '2026-10-20',
    cycle: 'weekly',
    descriptionSi: 'සඳුදා සිට ඉරිදා දක්වා කෑමට අවශ්‍ය පරිප්පු, එළවලු, සහල් සඳහා.',
    descriptionEn: 'For food, dhal, veggies, and rice for this week.',
    participatingMemberIds: ['m1', 'm2', 'm3', 'm4'], // m5 (Sachith) doesn't eat!
    collectorBankDetails: {
      bankName: 'Bank of Ceylon (BOC)',
      accountNumber: '1009876543',
      accountName: 'Nuwan Wickramasinghe',
      branch: 'Nugegoda'
    },
    createdAt: '2026-10-16',
    isCompleted: false,
    payments: [
      { memberId: 'm1', amount: 1800, isPaid: true, paidAt: '2026-10-16', paymentMethod: 'transfer' },
      { memberId: 'm2', amount: 1800, isPaid: true, paidAt: '2026-10-16', paymentMethod: 'cash' },
      { memberId: 'm3', amount: 1800, isPaid: false },
      { memberId: 'm4', amount: 1800, isPaid: false },
    ]
  },
  {
    id: 'col-3',
    titleSi: 'සබන් සහ කුස්සියේ පොදු බඩු',
    titleEn: 'Soap & Kitchen Supplies',
    category: 'toiletries',
    collectorId: 'm3', // Dasun
    targetPerPerson: 550,
    dueDate: '2026-10-24',
    cycle: 'one-time',
    descriptionSi: 'සන්ලයිට් කැට 4ක්, විම් බෝතලයක් සහ හාපික් සඳහා.',
    descriptionEn: 'For Sunlight soap bars, Vim, and Harpic.',
    collectorBankDetails: {
      bankName: 'Sampath Bank',
      accountNumber: '0044556677',
      accountName: 'Dasun Bandara',
      branch: 'Maharagama'
    },
    createdAt: '2026-10-15',
    isCompleted: false,
    payments: [
      { memberId: 'm1', amount: 550, isPaid: true, paidAt: '2026-10-16', paymentMethod: 'cash' },
      { memberId: 'm2', amount: 550, isPaid: true, paidAt: '2026-10-16', paymentMethod: 'cash' },
      { memberId: 'm3', amount: 550, isPaid: true, paidAt: '2026-10-15', paymentMethod: 'cash' },
      { memberId: 'm4', amount: 550, isPaid: false },
      { memberId: 'm5', amount: 550, isPaid: false },
    ]
  }
];

export const initialExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    titleSi: 'කාගීල්ස් සුපර්මාකට් සතිපතා බඩු බිල',
    titleEn: 'Cargills Supermarket Weekly Groceries',
    category: 'food',
    amount: 3810,
    paidById: 'm2', // Nuwan
    date: '2026-10-16',
    receiptUrl: sampleReceiptUrl,
    receiptName: 'cargills_receipt_oct16.jpg',
    notes: 'හාල්, පරිප්පු, බිත්තර 10, තෙල් බෝතලය සහ සෝයා මීට්',
    collectionPoolId: 'col-2'
  },
  {
    id: 'exp-2',
    titleSi: 'ලිට්රෝ ගෑස් සිලින්ඩර් රීෆිල් එක',
    titleEn: 'Litro Gas Cylinder Refill (12.5kg)',
    category: 'utilities',
    amount: 3690,
    paidById: 'm1', // Kasun
    date: '2026-10-12',
    notes: 'ගෑස් ඉවර වෙලා ගෙනාවා. බිල්පත ලාච්චුවේ ඇත.',
    receiptUrl: sampleReceiptUrl
  },
  {
    id: 'exp-3',
    titleSi: 'හාපික් සහ විම් පිඟන් සෝදන දියර',
    titleEn: 'Harpic & Vim Dishwash Liquid',
    category: 'toiletries',
    amount: 770,
    paidById: 'm3', // Dasun
    date: '2026-10-15',
    receiptUrl: sampleReceiptUrl,
    notes: 'නාන කාමරයට හාපික් 1ක් සහ කුස්සියට විම් 1ක්'
  }
];

export const initialShoppingRequests: ShoppingRequest[] = [
  {
    id: 'req-1',
    catalogItemId: 'cat-1',
    nameSi: 'කැකුළු සහල් (Kakulu Rice)',
    nameEn: 'White Kakulu Rice',
    unitPrice: 220,
    quantity: 5,
    unit: 'kg',
    requestedById: 'm2', // Nuwan
    requestedAt: '2026-10-17',
    isPurchased: false,
    votes: ['m1', 'm2', 'm3', 'm4'],
    notes: 'මේ සතියට සහල් ඉවරයි, 5kg ක් ගේමු'
  },
  {
    id: 'req-2',
    catalogItemId: 'cat-3',
    nameSi: 'පරිප්පු (Dhal)',
    nameEn: 'Red Dhal',
    unitPrice: 340,
    quantity: 2,
    unit: 'kg',
    requestedById: 'm4', // Chamara
    requestedAt: '2026-10-18',
    isPurchased: false,
    votes: ['m1', 'm4', 'm5'],
    notes: 'රතු පරිප්පු 2kg ක්'
  },
  {
    id: 'req-3',
    catalogItemId: 'cat-6',
    nameSi: 'බිත්තර (Eggs)',
    nameEn: 'Eggs (Pack of 10)',
    unitPrice: 380,
    quantity: 2,
    unit: 'pack (10)',
    requestedById: 'm5', // Sachith
    requestedAt: '2026-10-18',
    isPurchased: false,
    votes: ['m1', 'm2', 'm5'],
    notes: 'රෑට උයන්න බිත්තර 20ක්'
  },
  {
    id: 'req-4',
    catalogItemId: 'cat-12',
    nameSi: 'සන්ලයිට් සබන් කැට (Sunlight Soap)',
    nameEn: 'Sunlight Laundry Soap Bar',
    unitPrice: 130,
    quantity: 3,
    unit: 'bar',
    requestedById: 'm3', // Dasun
    requestedAt: '2026-10-18',
    isPurchased: false,
    votes: ['m3', 'm2'],
    notes: 'රෙදි හෝදන්න සන්ලයිට්'
  }
];
