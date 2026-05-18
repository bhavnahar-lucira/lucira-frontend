const CDN = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/";

export const PAGE_DATA = {
  sections: {
    banner: {
      desktop_image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Old_20Gold_20Exchange_20Banner_20Check.png?v=1766992082",
      mobile_image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Old_20Gold_20Exchange_20Banner_20Mobile.png?v=1766992598",
      heading: "OLD GOLD EXCHANGE",
      subheading: "Don’t let your gold stay locked away, upgrade it into modern designs you’ll love wearing every day.",
      overlay_color: "#ffffff",
      overlay_opacity: 0,
      text_color: "#ffffff"
    },
    calculator: {
      exchange_bonus_percent: 5
    },
    how_it_works: {
      heading: "HOW IT WORKS",
      subheading: "A simple, transparent, four-step process.",
      video: CDN + "LJ-R00635.mp4",
      steps: [
        {
          image: CDN + "Store_3.jpg",
          number: "1",
          title: "Bring Your Gold"
        },
        {
          image: CDN + "Gold-Evaluation.jpg",
          number: "2",
          title: "Gold Evaluation"
        },
        {
          image: CDN + "Calculator.jpg",
          number: "3",
          title: "Price Calculation"
        },
        {
          image: CDN + "Set_3ad98f0c-2a4c-4b9f-8d4e-2cc52fc92466.jpg",
          number: "4",
          title: "Exchange Instantly"
        }
      ]
    },
    store_locator: {
      heading: "Find a Store",
      subheading: "Search or use your location",
      stores: [
        {
          name: "Chembur Lucira Store",
          city: "Mumbai",
          pincode: "400071",
          address: "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd, Chembur, Mumbai, Maharashtra 400071",
          phone: "+919004402038",
          url: "/collections/chembur-store",
          appointment_url: "https://api.whatsapp.com/send/?phone=%2B+919004402038&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Chembur+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
          image: CDN + "Store-Collection-Banner_1.jpg",
          lat: 19.0575954,
          lng: 72.9006959
        },
        {
          name: "Pune Lucira Store",
          city: "Pune",
          pincode: "411005",
          address: "Shop no. 3,4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd, Pune, Maharashtra 411005",
          phone: "+918433667236",
          url: "/collections/pune-store",
          appointment_url: "https://api.whatsapp.com/send/?phone=%2B8433667236&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Pune+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
          image: CDN + "Store-PLP-2.jpg",
          lat: 18.5233007,
          lng: 73.8478627
        },
        {
          name: "Borivali Lucira Store",
          city: "Mumbai",
          pincode: "400066",
          address: "Sky City Mall, S-40, 2nd Floor, Western Express Hwy, Borivali East, Mumbai - 400066",
          phone: "+918433667238",
          url: "/collections/sky-city-borivali-store",
          appointment_url: "https://api.whatsapp.com/send/?phone=%2B8433667238&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Borivali+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
          image: CDN + "Store-Collection-Banner3_jpg.jpg",
          lat: 19.2226574,
          lng: 72.8643243
        }
      ]
    },
    other_stores: {
      heading: "",
      subtext: "",
      stores: [
        {
          name: "Borivali Lucira Store",
          city: "Mumbai",
          pincode_range: "400000 – 499999",
          address: "2nd Floor, Sky City Mall, S-40, Western Express Hwy, Borivali East, Mumbai, Maharashtra 400066",
          phone: "+91 84336 67238",
          timings: "10:00 AM - 10:00 PM",
          image: CDN + "Borivali-Store-Live-Desktop-Banner.jpg_1_4602c036-9533-4256-96ec-b92f07cfa58a.jpg",
          map_link: "https://www.google.com/maps/dir//Lucira+Jewelry+%7C+Jewelry+Store+in+Borivali+Mumbai,+2nd+Floor,+Sky+City+Mall,+S-40,+Western+Express+Hwy,+Borivali+East,+Mumbai,+Maharashtra+400066/@19.1791104,72.8399872,5859m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3be7b13efc944429:0x8e0b915ac78ac1!2m2!1d72.8643243!2d19.2226574?entry=ttu&g_ep=EgoyMDI2MDIyMi4wIKXMDSoASAFQAw%3D%3D",
          appointment_link: "/collections/chembur-store"
        },
        {
          name: "Pune Lucira Store",
          city: "Pune",
          pincode_range: "400000 – 499999",
          address: "Shop no. 3,4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd, Pune, Maharashtra 411005",
          phone: "84336 67236",
          timings: "10:00 AM - 10:00 PM",
          image: CDN + "Store-PLP-2.jpg",
          map_link: "https://maps.app.goo.gl/855qqLVXAPRdRMUx7",
          appointment_link: "/collections/pune-store"
        },
        {
          name: "Chembur Lucira Store",
          city: "Mumbai",
          pincode_range: "400000 – 499999",
          address: "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd, Chembur Gaothan, Chembur, Mumbai, Maharashtra 400071",
          phone: "92705 74975",
          timings: "10:30 AM - 10:00 PM",
          image: CDN + "Store-Collection-Banner_1.webp",
          map_link: "https://maps.app.goo.gl/bULwWE9jzs1nsSP89",
          appointment_link: "/collections/chembur-store"
        }
      ]
    },
    usp: {
      heading: "Why Choose Our Gold Exchange",
      subheading: "Fair pricing, clear steps and trusted experts at every stage.",
      features: [
        {
          icon: CDN + "Transparent_Valuation.svg",
          title: "Transparent Valuation",
          desc: "We weigh, test and assess your gold right in front of you."
        },
        {
          icon: CDN + "Best_Exchange_Rates.svg",
          title: "Best-in-Class Exchange Rates",
          desc: "Get fair, competitive value for every gram of gold."
        },
        {
          icon: CDN + "Instant_Upgrade.svg",
          title: "Instant Upgrade Options",
          desc: "Use your gold value immediately to upgrade to any of the Lucira designs"
        },
        {
          icon: CDN + "Professional_Handling.svg",
          title: "Safe, Professional Handling",
          desc: "Handled by trained experts, ensuring complete safety and zero damage."
        }
      ]
    },
    faq: {
      heading: "FAQ'S",
      description: "Everything you need to know before you exchange.",
      items: [
        {
          question: "What types of gold can I exchange?",
          answer: "You can bring in any gold jewellery, broken, old, unused or outdated pieces. We accept all karats, with or without stones."
        },
        {
          question: "How is my gold’s value calculated?",
          answer: "We assess purity, weight and the live gold market rate. The entire evaluation happens in front of you for complete transparency."
        },
        {
          question: "Can I use the exchange value to buy any jewellery?",
          answer: "Yes, you can redeem the full value toward any jewelry at Lucira stores whether it's a new design, a daily-wear piece or a custom order."
        },
        {
          question: "How long does the entire gold evaluation process take?",
          answer: "The entire process approximately takes around 10 - 15 minutes, depending on the number of pieces. We work quickly without losing accuracy."
        },
        {
          question: "Can I get the value in cash instead of buying jewellery?",
          answer: "Currently, the exchange value can be redeemed only toward jewelry purchases ensuring you get maximum benefit and upgraded designs."
        },
        {
          question: "Do you accept gold coins or bars?",
          answer: "Yes, we accept gold coins and bars for exchange, provided they meet all our purity checks."
        },
        {
          question: "What type of gold is accepted under the Old Gold Exchange (OGE) program?",
          answer: "We accept gold of all karats under the Old Gold Exchange program. However, only plain gold is eligible for value assessment."
        },
        {
          question: "Are gold items with stones, diamonds, or beads accepted?",
          answer: "Gold items containing stones, diamonds, beads, or any other non-gold components may be accepted only for their gold content. No value will be given for stones, beads, or embellishments."
        },
        {
          question: "Will I receive any value for stones or beads present in my jewellery?",
          answer: "No. Under the Old Gold Exchange process, stones, beads, and other non-gold elements are not valued, and customers will not receive any exchange value for them."
        },
        {
          question: "Why is value not given for stones or beads?",
          answer: "The Old Gold Exchange program is designed to assess and exchange gold weight and purity only, in line with standard refining and valuation practices."
        }
      ]
    }
  }
};