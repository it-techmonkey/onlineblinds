# DNS backup before the Shopify switch — 1 November 2026

Domain `onlineblindsexpress.co.uk`, registrar 123-reg, nameservers ns29/ns30.domaincontrol.com. All 22 records as shown in 123-reg before any change.

| Type | Name | Data | TTL |
|---|---|---|---|
| A | @ | 216.150.1.1 (Vercel) | 8600 s |
| NS | @ | ns29.domaincontrol.com. | 1 h |
| NS | @ | ns30.domaincontrol.com. | 1 h |
| CNAME | account | shops.myshopify.com. | 1/2 h |
| CNAME | email | email.secureserver.net. | 1 h |
| CNAME | orders | shops.myshopify.com. | 1/2 h |
| CNAME | secureserver1._domainkey | s1.dkim.onlineblindsexpress_co_uk.cfe.onsecureserver.net. | 1 h |
| CNAME | secureserver2._domainkey | s2.dkim.onlineblindsexpress_co_uk.cfe.onsecureserver.net. | 1 h |
| CNAME | toql6bw4xcaq | gv-dvaliqczvtaesh.dv.googlehosted.com. | 1 h |
| CNAME | www | d5a292862970ca84.vercel-dns-016.com. (Vercel) | 8600 s |
| CNAME | _domainconnect | _domainconnect.ss.domaincontrol.com. | 1 h |
| SOA | @ | Primary nameserver: ns29.domaincontrol.com. | 1 h |
| MX | @ | smtp.secureserver.net. (priority 0) | 1 h |
| MX | @ | mailstore1.secureserver.net. (priority 10) | 1 h |
| TXT | @ | google-site-verification=6wCYZjOGU2itGREeMuAZmasnCHBAoXKVbnj3p22mbkc | 1 h |
| TXT | @ | google-site-verification=EaWZPXQFQ70LsU3pvQCmEMXGyRGToKKEfBj8x9GJgcM | 1 h |
| TXT | @ | v=spf1 include:secureserver.net -all | 1 h |
| TXT | shopify_verification_account | JX6DJ9C1 | 1 h |
| TXT | _dmarc | v=DMARC1; p=reject; rua=mailto:dmarc_rua@onsecureserver.net; | 1 h |
| TXT | _vercel | vc-domain-verify=onlineblindsexpress.co.uk,f9d87362d1a7a88509e8 | 1 h |
| TXT | _vercel | vc-domain-verify=www.onlineblindsexpress.co.uk,b9bffc1aef54800d8d55 | 1 h |
| SRV | _autodiscover._tcp.@ | 0 0 443 autodiscover.secureserver.net. | 1 h |

## Rollback to the Next.js site

1. In 123-reg set `A @` back to `216.150.1.1` and `CNAME www` back to `d5a292862970ca84.vercel-dns-016.com.`
2. In Shopify, Settings > Domains: set `orders.onlineblindsexpress.co.uk` as primary again (the live Next.js checkout uses it) and remove `www`/root if needed.
3. Vercel keeps both domains on project `techmonkeys-projects/onlineblinds`; the site also stays at https://onlineblinds.vercel.app.
