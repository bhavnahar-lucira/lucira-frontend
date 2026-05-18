export const MEGA_MENU = [

    /* ✅ FIRST ITEM (NO DROPDOWN) */
    {
        label: "BEST SELLERS",
        type: "link",
        href: "/collections/bestsellers"
    },

    {
        label: "ENGAGEMENT RINGS",
        type: "mega",
        layout: "5-col-featured",
        href: "/collections/engagement-rings",
        featured: {
            title: "Featured",
            items: [
                { label: "Latest Designs", href: "/collections/latest-designs" },
                { label: "Bestsellers", href: "/collections/bestsellers" }
            ],
            featuredIn: {
                title: "Featured In",
                items: [
                    { label: "New Arrivals", href: "/collections/new-arrivals" },
                    { label: "Men's Ring", href: "/collections/mens-rings" },
                    { label: "Best Selling", href: "/collections/bestsellers" }
                ]
            }
        },
        columns: [
            {
                title: "Shop By Style",
                type: "icon",
                items: [
                    { label: "Solitaire", href: "/collections/solitaire-engagement-rings" },
                    { label: "Halo", href: "/collections/halo-rings" },
                    { label: "Side-Stone", href: "/collections/side-stone-rings" },
                    { label: "Trilogy", href: "/collections/trilogy-rings" },
                    { label: "Toi et Moi", href: "/collections/toi-et-moi-rings" },
                    { label: "Eternity", href: "/collections/eternity-rings" },
                    { label: "Stackable", href: "/collections/stackable-rings" },
                    { label: "Couple Bands", href: "/collections/couple-bands" },
                    { label: "Shop All Styles", href: "/collections/engagement-rings" }
                ]
            },

            {
                title: "Shop By Shape",
                type: "icon",
                items: [
                    { label: "Round", href: "/collections/round-rings" },
                    { label: "Oval", href: "/collections/oval-rings" },
                    { label: "Emerald", href: "/collections/emerald-rings" },
                    { label: "Pear", href: "/collections/pear-rings" },
                    { label: "Marquise", href: "/collections/marquise-rings" },
                    { label: "Cushion", href: "/collections/cushion-rings" },
                    { label: "Princess", href: "/collections/princess-rings" },
                    { label: "Heart", href: "/collections/heart-rings" },
                    { label: "Special Cuts", href: "/collections/special-cuts-rings" },
                    { label: "Shop All Shapes", href: "/collections/engagement-rings" }
                ]
            },

            {
                title: "Shop By Metal",
                type: "icon",
                items: [                    
                    { label: "Yellow Gold", href: "/collections/yellow-gold-rings" },
                    { label: "White Gold", href: "/collections/white-gold-rings" },
                    { label: "Rose Gold", href: "/collections/rose-gold-rings" },
                    { label: "Platinum", href: "/collections/platinum-rings" },
                ]
            },

            {
                title: "Shop By Price",
                type: "text",
                items: [
                    { label: "Below 50k", href: "/collections/rings-below-rs-50k" },
                    { label: "50k - 100k", href: "/collections/rings-between-rs-50k-to-rs-100k" },
                    { label: "100k - 150k", href: "/collections/rings-between-rs-100k-to-rs-150k" },
                    { label: "150k - 200k", href: "/collections/rings-between-rs-150k-to-rs-200k" },
                    { label: "200k and above", href: "/collections/rings-above-200k" },
                ]
            }
        ],
        banner: {
            image: "/images/menu/engagement-ring.jpg",
            title: "Yellow Gold Rings",
            subtitle: "232 Products",
            href: "/collections/yellow-gold-rings"
        }
    },

    {
        label: "RINGS",
        type: "mega",
        layout: "5-col-featured",
        href: "/collections/rings",
        featured: [
            { label: "Best Selling", href: "#" },
            { label: "New Arrival", href: "#" },
            { label: "Men's Rings", href: "#" }
        ],
        columns: [
             {
                title: "Shop By Style",
                type: "icon",
                items: [
                    { label: "Solitaire", href: "/collections/solitaire-rings" },
                    { label: "Halo", href: "/collections/halo-rings" },
                    { label: "Side-Stone", href: "/collections/side-stone-rings" },
                    { label: "Trilogy", href: "/collections/trilogy-rings" },
                    { label: "Toi et Moi", href: "/collections/toi-et-moi-rings" },
                    { label: "Eternity", href: "/collections/eternity-rings" },
                    { label: "Stackable", href: "/collections/stackable-rings" },
                    { label: "Couple Bands", href: "/collections/couple-bands" },
                    { label: "Shop All Styles", href: "/collections/rings" }
                ]
            },

            {
                title: "Shop By Shape",
                type: "icon",
                items: [
                    { label: "Round", href: "/collections/round-rings" },
                    { label: "Oval", href: "/collections/oval-rings" },
                    { label: "Emerald", href: "/collections/emerald-rings" },
                    { label: "Pear", href: "/collections/pear-rings" },
                    { label: "Marquise", href: "/collections/marquise-rings" },
                    { label: "Cushion", href: "/collections/cushion-rings" },
                    { label: "Princess", href: "/collections/princess-rings" },
                    { label: "Heart", href: "/collections/heart-rings" },
                    { label: "Special Cuts", href: "/collections/special-cuts-rings" },
                    { label: "Shop All Shapes", href: "/collections/rings" }
                ]
            },

            {
                title: "Shop By Metal",
                type: "icon",
                items: [                    
                    { label: "Yellow Gold", href: "/collections/yellow-gold-rings" },
                    { label: "White Gold", href: "/collections/white-gold-rings" },
                    { label: "Rose Gold", href: "/collections/rose-gold-rings" },
                    { label: "Platinum", href: "/collections/platinum-rings" },
                ]
            },

            {
                title: "Shop By Price",
                type: "text",
                items: [
                    { label: "Below 50k", href: "/collections/rings-below-rs-50k" },
                    { label: "50k - 100k", href: "/collections/rings-between-rs-50k-to-rs-100k" },
                    { label: "100k - 150k", href: "/collections/rings-between-rs-100k-to-rs-150k" },
                    { label: "150k - 200k", href: "/collections/rings-between-rs-150k-to-rs-200k" },
                    { label: "200k and above", href: "/collections/rings-above-200k" },
                ]
            }
        ],
        banner: {
            image: "/images/menu/wedding-ring.jpg",
            title: "Yellow Gold Rings",
            subtitle: "232 Products",
            href: "/collections/wedding-rings"
        }
    },

    {
        label: "EARRINGS",
        type: "mega",
        layout: "5-col-featured",
        href: "/collections/earrings",
        featured: [
            { label: "Best Selling", href: "#" },
            { label: "New Arrival", href: "#" },
            { label: "Men's Rings", href: "#" }
        ],
        columns: [
            {
                title: "Shop By Style",
                type: "icon",
                items: [
                    { label: "Hoops", href: "/collections/diamond-hoop-earrings" },
                    { label: "Studs", href: "/collections/stud-earrings" },
                    { label: "Sui Dhagas", href: "/collections/sui-dhagas" },
                    { label: "Dangles", href: "/collections/dangles" },
                    { label: "Solitaire", href: "/collections/solitaire-earrings" },
                    { label: "Halo", href: "/collections/earrings-halo" },
                    { label: "Gemstone", href: "/collections/earrings-gemstone" },
                    { label: "Couple Bands", href: "/collections/mens-stud" },
                ]
            },

            {
                title: "Shop By Shape",
                type: "icon",
                items: [
                    { label: "Round", href: "/collections/earrings-round" },
                    { label: "Oval", href: "/collections/earrings-oval" },
                    { label: "Emerald", href: "/collections/earrings-emerald" },
                    { label: "Pear", href: "/collections/earrings-pear" },
                    { label: "Marquise", href: "/collections/earrings-marquise" },
                    { label: "Cushion", href: "/collections/earrings-cushion" },
                    { label: "Princess", href: "/collections/earrings-princess" },
                    { label: "Special Cuts", href: "/collections/earrings-special-cuts" },
                ]
            },

            {
                title: "Shop By Metal",
                type: "icon",
                items: [                   
                    { label: "Yellow Gold", href: "/collections/earrings-yellow-gold" },
                    { label: "White Gold", href: "/collections/earrings-white-gold" },
                    { label: "Rose Gold", href: "/collections/earrings-rose-gold" },
                    { label: "Platinum", href: "/collections/earrings-platinum" },
                    // { label: "Shop All Metal", href: "#" }
                ]
            },

            {
                title: "Shop By Price",
                type: "text",
                items: [
                    { label: "Under 10K", href: "/collections/earrings-below-rs-10k" },
                    { label: "10K - 20K", href: "/collections/earrings-between-rs-10k-to-rs-20k" },
                    { label: "20K - 30K", href: "/collections/earrings-between-rs-20k-to-rs-30k" },
                    { label: "30K - 50K", href: "/collections/earrings-between-rs-30k-to-rs-50k" },
                    { label: "50K - 75K", href: "/collections/earrings-between-rs-50k-to-rs-75k" },
                    { label: "75K - 100K", href: "/collections/earrings-between-rs-75k-to-rs-100k" },
                    { label: "100K And Above", href: "/collections/earrings-above-rs-100k" }
                ]
            }
        ],
        banner: {
            image: "/images/menu/earring.jpg",
            title: "Hoops",
            subtitle: "232 Products",
            href: "/collections/diamond-hoop-earrings"
        }
    },

    {
        label: "MORE JEWELRY",
        type: "mega",
        layout: "4-col-no-featured",
        href: "/collections/jewelry",

        columns: [
            {
                title: "Bracelets",
                type: "icon",
                items: [
                    { label: "Chain Bracelets", href: "/collections/chain-bracelets" },
                    { label: "Cuff Bracelets", href: "/collections/cuff-bracelets" },
                    { label: "Tennis Bracelets", href: "/collections/diamond-tennis-bracelets" },
                    { label: "Men's Bracelets", href: "/collections/mens-bracelets" },
                    { label: "Shop All Bracelets", href: "/collections/bracelets" }
                ]
            },

            {
                title: "Necklaces & Chains",
                type: "icon",
                items: [
                    { label: "Chain Necklaces", href: "/collections/chain-necklaces" },
                    { label: "Pendant Necklaces", href: "/collections/pendant-necklaces" },
                    { label: "Tennis Necklaces", href: "/collections/tennis-necklaces" },
                    { label: "Gold Chains", href: "/collections/gold-chains" },
                    { label: "Shop All Necklaces", href: "/collections/necklaces" }
                ]
            },

            {
                title: "Nosepin",
                type: "icon",
                items: [
                    { label: "Stud Nosepins", href: "/collections/nosepins" },
                    { label: "Ring Nosepins", href: "/collections/nosepins" },
                    { label: "Hook Nosepins", href: "/collections/nosepins" },
                    { label: "Shop All Nosepins", href: "/collections/nosepins" }
                ]
            },

            {
                title: "Mangalsutra",
                type: "icon",
                items: [
                    { label: "Mangalsutra Necklaces", href: "/collections/mangalsutra-necklaces" },
                    { label: "Mangalsutra Bracelets", href: "/collections/mangalsutra-bracelets" },
                    { label: "Shop All Mangalsutra", href: "/collections/mangalsutra" }
                ]
            }
        ],

        banner: {
            image: "/images/menu/more-jewellery.jpg",
            title: "Tennis Bracelets",
            subtitle: "232 Products",
            href: "/collections/diamond-tennis-bracelets"
        }
    },

     {
        label: "solitaire",
        type: "mega",
        layout: "5-col-featured",
        href: "/collections/solitaires",
        featured: [
            { label: "Rings", href: "/collections/solitaire-rings" },
            { label: "Earrings", href: "/collections/solitaire-earrings" },
            { label: "Bracelets", href: "/collections/solitaires-bracelets" },
            { label: "Necklaces", href: "/collections/solitaires-necklaces" },
            { label: "Chain Pendants", href: "/collections/solitaires-chain-pendants" },
            { label: "Men's", href: "/collections/solitaires-mens" }
        ],
        columns: [
            {
                title: "Shop By Shape",
                type: "icon",
                items: [
                    { label: "Round", href: "/collections/solitaire-round" },
                    { label: "Heart", href: "/collections/solitaires-heart" },
                    { label: "Oval", href: "/collections/solitaires-oval" },
                    { label: "Marquise", href: "/collections/solitaires-marquise" },
                    { label: "Princess", href: "/collections/solitaires-princess" },
                    { label: "Emerald", href: "/collections/solitaires-emerald" },
                    { label: "Pear", href: "/collections/solitaires-pear" },
                    { label: "Cushion", href: "/collections/solitaires-cushion" },
                ]
            },            

            {
                title: "Shop By Metal",
                type: "icon",
                items: [                   
                    { label: "Yellow Gold", href: "/collections/solitaires-yellow-gold" },
                    { label: "White Gold", href: "/collections/solitaires-white-gold" },
                    { label: "Rose Gold", href: "/collections/solitaires-rose-gold" },
                ]
            },

            {
                title: "Shop By Price",
                type: "text",
                items: [
                    { label: "Below 50k", href: "/collections/solitaires-below-rs-50k" },
                    { label: "50k - 100k", href: "/collections/solitaires-between-rs-50k-to-rs-100k" },
                    { label: "100k - 150k", href: "/collections/solitaires-between-rs-100k-to-rs-150k" },
                    { label: "150k - 200k", href: "/collections/solitaires-between-rs-150k-to-rs-200k" },
                    { label: "200k and above", href: "/collections/solitaires-above-rs-200k" }
                ]
            }
        ],
        banner: {
            image: "/images/menu/earring.jpg",
            title: "Solitaires",
            subtitle: "232 Products",
            href: "/collections/solitaires"
        }
    },

    {
        label: "COLLECTIONS",
        type: "image-grid",
        href: "/collections/hexa",
        items: [
            {
                title: "Cotton Candy",
                description: "Playful enamel hues meet fine diamonds",
                image: "/images/menu/candy.jpg",
                href: "/collections/cotton-candy"
            },
            {
                title: "On The Move",
                description: "Secure-fit designs with safety locks",
                image: "/images/menu/move.jpg",
                href: "/collections/sports-collection"
            },
            {
                title: "Hexa",
                description: "Celestial-inspired hexagon collection",
                image: "/images/menu/hexa.jpg",
                href: "/collections/hexa"
            },
             {
                title: "Eterna",
                description: "More than forever",
                image: "/images/menu/Eterna.jpg",
                href: "/collections/eterna"
            }
        ]
    },

    {
        label: "GIFTING",
        type: "mega",
        layout: "3-col",
        href: "#",
        columns: [
            {
                title: "Shop By Occasion",
                type: "text",
                items: [
                    { label: "Valentine’s", href: "/collections/valentines-gift" },
                    { label: "Birthday", href: "/collections/birthday-gifts" },
                    { label: "Anniversary", href: "/collections/anniversary-gifts" },
                    { label: "Engagement", href: "#" },
                    { label: "Wedding", href: "#" },
                    { label: "Shop All", href: "#" }
                ]
            },
            {
                title: "Shop For",
                type: "text",
                items: [
                    { label: "For Her", href: "/collections/gifts-for-her" },
                    { label: "For Him", href: "/collections/gifts-for-him" },
                    { label: "For Couples", href: "/collections/couple-bands" },
                    { label: "For Mothers", href: "/collections/gift-for-mother" },
                    { label: "For Kids", href: "#" }
                ]
            },
            {
                title: "Price",
                type: "text",
                items: [
                    { label: "Under 30K", href: "/collections/gift-below-rs-30k" },
                    { label: "Under 50K", href: "/collections/gift-below-rs-50k" },
                    { label: "Under 100K", href: "/collections/gift-below-rs-100k" },
                    { label: "All Price Range", href: "#" }
                ]
            }
        ],
        banner: {
            image: "/images/menu/gifting.jpg",
            title: "Anniversary",
            subtitle: "232 Products",
            href: "/collections/anniversary-gifts"
        }
    },

    {
        label: "9KT COLLECTION",
        type: "link",
        href: "/collections/9kt-collection"
    }

];