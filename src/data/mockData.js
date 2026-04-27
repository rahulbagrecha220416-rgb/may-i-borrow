
export const MOCK_USERS = [
    { id: 'u1', name: 'Rahul', email: 'rahul@example.com', avatar: 'https://i.pravatar.cc/150?u=u1', groups: ['g1', 'g2'] },
    { id: 'u2', name: 'Priya', email: 'priya@example.com', avatar: 'https://i.pravatar.cc/150?u=u2', groups: ['g1'] },
    { id: 'u3', name: 'Amit', email: 'amit@example.com', avatar: 'https://i.pravatar.cc/150?u=u3', groups: ['g1', 'g2'] }
];

export const MOCK_GROUPS = [
    {
        id: 'g1',
        name: 'Prestige Apartment Tower A',
        description: 'Neighbors from Tower A sharing tools and kids items.',
        members: ['u1', 'u2', 'u3'],
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop'
    },
    {
        id: 'g2',
        name: 'Cycling Club Indiranagar',
        description: 'Weekend riders group.',
        members: ['u1', 'u3'],
        image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=500&auto=format&fit=crop'
    }
];

export const MOCK_ITEMS = [
    {
        id: 'i1',
        ownerId: 'u2',
        groupId: 'g1',
        name: 'Dyson Airwrap Multistyler',
        category: 'Electronics',
        description: 'Complete set with all attachments. Perfect for parties.',
        availableUntil: '2026-02-01',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8ae?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Flat 402, Sunshine Apts'
    },
    {
        id: 'i2',
        ownerId: 'u3',
        groupId: 'g1',
        name: 'Bosch Professional Impact Drill',
        category: 'Tools',
        description: 'Cordless, 18V. Comes with drill bit set.',
        availableUntil: '2026-06-01',
        status: 'BORROWED',
        borrowedBy: 'u1',
        returnBy: '2026-01-10',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Sector 4, HSR Layout'
    },
    {
        id: 'i3',
        ownerId: 'u1',
        groupId: 'g2',
        name: 'Thule 2-Bike Car Rack',
        category: 'Sports',
        description: 'Trunk mount, fits most sedans. Secure straps included.',
        availableUntil: '2026-12-31',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop',
        visibility: 'network',
        pickupAddress: 'Indiranagar 12th Main',
        surcharge: 50
    },
    {
        id: 'i4',
        ownerId: 'u4',
        groupId: 'g1',
        name: 'KitchenAid Stand Mixer',
        category: 'Kitchen',
        description: 'Classic red. Includes whisk and dough hook.',
        availableUntil: '2026-03-15',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Prestige Tower A'
    },
    {
        id: 'i5',
        ownerId: 'u2',
        groupId: 'g2',
        name: 'Camping Tent (4 Person)',
        category: 'Sports',
        description: 'Waterproof, easy setup. Used twice.',
        availableUntil: '2026-05-20',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500&auto=format&fit=crop',
        visibility: 'network',
        pickupAddress: 'Koramangala 4th Block',
        surcharge: 100
    },
    {
        id: 'i6',
        ownerId: 'u3',
        groupId: 'g1',
        name: 'JBL PartyBox Speaker',
        category: 'Electronics',
        description: 'Massive sound, built-in lights. Great for house parties.',
        availableUntil: '2026-02-28',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=500&auto=format&fit=crop',
        visibility: 'network',
        pickupAddress: 'Whitefield',
        surcharge: 200
    },
    {
        id: 'i7',
        ownerId: 'u5',
        groupId: 'g1',
        name: 'Aluminum Extension Ladder',
        category: 'Tools',
        description: '12-foot reach. Lightweight but sturdy.',
        availableUntil: '2026-11-01',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Sarjapur Road'
    },
    {
        id: 'i8',
        ownerId: 'u1',
        groupId: 'g2',
        name: 'GoPro Hero 10 Black',
        category: 'Electronics',
        description: 'Includes waterproof case and chest mount.',
        availableUntil: '2026-04-10',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&auto=format&fit=crop',
        visibility: 'network',
        pickupAddress: 'Indiranagar',
        surcharge: 150
    },
    {
        id: 'i9',
        ownerId: 'u2',
        groupId: 'g1',
        name: 'Barbeque Grill (Portable)',
        category: 'Kitchen',
        description: 'Charcoal grill, foldable legs. Perfect for balconies.',
        availableUntil: '2026-08-15',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1555077402-dd19082ef765?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Sunshine Apts'
    },
    {
        id: 'i10',
        ownerId: 'u4',
        groupId: 'g1',
        name: 'Catan Board Game',
        category: 'Party',
        description: 'Base game + 5-6 player extension.',
        availableUntil: '2027-01-01',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1610890716171-6b1c9f85581d?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Prestige Tower B'
    },
    {
        id: 'i11',
        ownerId: 'u3',
        groupId: 'g2',
        name: 'Canon DSLR 50mm Lens',
        category: 'Electronics',
        description: 'Canon EF 50mm f/1.8 STM. Great for portraits.',
        availableUntil: '2026-06-30',
        status: 'AVAILABLE',
        image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&auto=format&fit=crop',
        visibility: 'network',
        pickupAddress: 'Koramangala',
        surcharge: 100
    },
    {
        id: 'i12',
        ownerId: 'u1',
        groupId: 'g1',
        name: 'High Pressure Washer',
        category: 'Tools',
        description: 'Karcher K2. Good for cleaning cars and patios.',
        availableUntil: '2026-03-01',
        status: 'AVAILABLE',
        image: 'https://plus.unsplash.com/premium_photo-1663089688180-444ff0066e5d?w=500&auto=format&fit=crop',
        visibility: 'group',
        pickupAddress: 'Indiranagar'
    }
];
