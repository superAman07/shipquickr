# 📦 Push Log — Files to Deploy

> Track all modified/created files per session. Push only these files to avoid full redeployment.

---

## 🗓️ March 24, 2026 — Night Push

### Courier Integration & Rate Calculator
| File | Change |
|------|--------|
| `lib/services/xpressbees.ts` | Fixed TS types, dynamic transit time, improved API error passthrough |
| `lib/services/shadowfax.ts` | Added `courierPartnerId`, fixed TS types |
| `lib/services/delhivery.ts` | Warehouse name `.trim()`, error passthrough |
| `app/api/user/rate-calculator/route.ts` | Case-insensitive courier filter |
| `app/api/admin/rate-calculator/route.ts` | Added Xpressbees & Shadowfax |
| `app/api/user/courier-services/route.ts` | Case-insensitive courier filter |
| `app/api/user/shipment/confirm/route.ts` | User-friendly Delhivery errors |
| `app/(dashboard)/user/dashboard/rate-calculator/page.tsx` | Premium UI, pincode validation, scroll |
| `app/(dashboard)/user/dashboard/ship-order/[orderId]/page.tsx` | Premium courier selection UI |

### Order ID Shortening
| File | Change |
|------|--------|
| `app/(dashboard)/user/dashboard/(orders)/single-order/page.tsx` | Short order ID `SQ2403XXXXXX` |
| `app/(dashboard)/user/dashboard/(orders)/clone-order/[id]/CloneOrderPage.tsx` | Short order ID |
| `app/(dashboard)/admin/dashboard/(orders)/clone-order/[id]/CloneOrderPage.tsx` | Short order ID |
### Cancel Route & Shipment Confirm Fixes
| File | Change |
|------|--------|
| `app/api/user/orders/cancel/route.ts` | Routes cancellation to correct courier (Delhivery/Xpressbees/Shadowfax) |
| `app/api/user/shipment/confirm/route.ts` | Case-insensitive courier assignment check + Delhivery error passthrough |

### Git Command
```bash
git add \
  "lib/services/xpressbees.ts" \
  "lib/services/shadowfax.ts" \
  "lib/services/delhivery.ts" \
  "app/api/user/rate-calculator/route.ts" \
  "app/api/admin/rate-calculator/route.ts" \
  "app/api/user/courier-services/route.ts" \
  "app/api/user/shipment/confirm/route.ts" \
  "app/api/user/orders/cancel/route.ts" \
  "app/(dashboard)/user/dashboard/rate-calculator/page.tsx" \
  "app/(dashboard)/user/dashboard/ship-order/[orderId]/page.tsx" \
  "app/(dashboard)/user/dashboard/(orders)/single-order/page.tsx" \
  "app/(dashboard)/user/dashboard/(orders)/clone-order/[id]/CloneOrderPage.tsx" \
  "app/(dashboard)/admin/dashboard/(orders)/clone-order/[id]/CloneOrderPage.tsx"

git commit -m "feat: Courier integration, Rate Calculator UI, Ship Order UI, shorter Order IDs, cancel routing fix"

git push origin main && git push client main
```

---

> ✅ Add new entries below as we continue working today.
