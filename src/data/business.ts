// Single source of truth for the business details shown on the contact page,
// footer, about page and policy pages. Keep these identical to the details
// registered in Google Merchant Center.
//
// Fields left as an empty string are not rendered anywhere on the site.

export const business = {
  tradingName: 'Online Blinds Express',
  legalName: '', // Registered company name, e.g. "Online Blinds Express Ltd"
  companyNumber: '', // Companies House registration number
  vatNumber: '', // VAT registration number, if VAT registered
  email: 'sales@onlineblindsexpress.co.uk',
  phone: '', // Display format, e.g. "01924 000000"
  hours: '', // e.g. "Monday to Friday, 9am – 5pm"
  responseTime: '1-3 working days',
  address: {
    lines: ['Unit C2, Carlinghow Mills'],
    city: 'Batley',
    postcode: 'WF17 8LL',
    country: 'United Kingdom',
  },
};

export const businessAddressLines = [
  ...business.address.lines,
  `${business.address.city} ${business.address.postcode}`,
  business.address.country,
];

export const businessPhoneHref = business.phone ? `tel:${business.phone.replace(/[^\d+]/g, '')}` : '';
