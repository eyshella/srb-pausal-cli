/**
 * Application configuration and constants
 * 
 * Copy this file to config.js and fill in your actual details
 */

export const config = {
  // Contractor details (your business information)
  contractor: {
    shortName: "YOUR NAME PR",
    longName: "YOUR NAME PR YOUR ACTIVITY YOUR CITY",
    person: "Your Firstname Lastname", // Responsible person (ime i prezime poreskog obveznika)
    address: "Your Street 123",
    city: "Your City",
    postalCode: "12345",
    country: "Serbia",
    taxId: "123456789", // PIB
    registrationNumber: "12345678", // Matični broj
    iban: "RS35000000000000000000",
    swift: "BANKRSBG",
    email: "your.email@example.com",
    activityCode: "6201 Računarsko programiranje" // Your business activity code
  },

  // Company details (your client's information)
  company: {
    name: "Client Company Name",
    address: "Client Address",
    city: "Client City",
    postalCode: "12345",
    country: "Malta", // or another EU country
    vatNumber: "MT12345678", //VAT / EIB / PIB
    registrationNumber: "C12345" //ID no / MB / Matični broj:
  },

  // Tax limits in RSD (Serbian Dinar)
  // These are the thresholds for small business tax exemption in Serbia
  limits: {
    calendarYear: 6000000, // 6 million RSD per calendar year
    rolling365Days: 8000000 // 8 million RSD per rolling 365 days
  },

  // Database
  database: {
    path: "./data.db" // Keep this as is
  },

  // Output directories
  output: {
    invoices: "./output/invoices",
    kpo: "./output/kpo"
  },

  // Assets
  logoPath: "./assets/logo.png", // Path to your company logo (optional)

  // Font (for Serbian characters like Š, Č, Ć, Ž)
  // a TTF/OTF font that supports Latin Extended (e.g., Noto Sans)
  fontPath: "./assets/NotoSans.ttf" // Keep this as is
};
