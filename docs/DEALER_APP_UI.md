# Dealer Mobile App UI

## Purpose

The dealer mobile app is for lot employees installing, pairing, reassigning, and validating ESL tags.

## MVP Platform

Build as a responsive web app first using Next.js/PWA.
Native iOS/Android can come later.

## Required Screens

### 1. Login

Fields:
- Email
- Password

Roles:
- owner
- manager
- lot_staff

### 2. Home

Cards:
- Scan VIN
- Scan ESL Tag
- Pair Tag
- Unassigned Vehicles
- Available Tags
- Sync Alerts

### 3. Scan VIN

Employee scans VIN barcode from:
- Windshield
- Door jamb
- Paper sticker

Result:
- VIN detected
- Vehicle lookup
- Show year/make/model/stock/price
- If VIN not found, allow manual create for driveway testing

### 4. Scan ESL

Employee scans:
- ESL QR code
- ESL printed device ID
- Minew device ID if available

Result:
- Device found
- Battery/status shown
- Current assignment shown if any

### 5. Confirm Pairing

Show:
- Vehicle photo if available
- VIN
- Stock number
- Year/make/model
- Current source price
- ESL device ID
- Current ESL status

Button:
- Pair Tag

Warning:
If ESL is already assigned, show Reassign confirmation.

### 6. Pairing Success

Show:
- VIN paired to ESL
- Label rendering status
- Push status
- Last update timestamp

Actions:
- View label preview
- Test push
- Pair another

### 7. Reassign Tag

Flow:
- Scan existing ESL
- Show current vehicle
- Scan new VIN
- Confirm reassignment
- Old assignment becomes inactive
- New assignment becomes active

### 8. Unpair Tag

Use when:
- Vehicle sold
- Tag removed
- Tag broken
- Vehicle no longer on lot

Actions:
- Mark tag available
- Optional blank/sold display push

### 9. Sync Status

Per vehicle:
- Source price
- Website verified price
- ESL displayed price
- Last source update
- Last ESL push
- Sync status

### 10. Offline/Bad Network State

For MVP:
- Show offline warning
- Do not allow final pairing without API confirmation
- Future: offline queue

## Camera Requirements

Use browser camera APIs for PWA scanning.
Libraries Cursor may use:
- html5-qrcode
- zxing-js/browser

## Pairing UX Rule

Pairing must require two scans:
1. VIN
2. ESL device code

Never pair a tag based on manual text entry alone unless admin override is used.
