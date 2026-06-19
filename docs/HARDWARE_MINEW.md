# Minew Hardware Integration

## Hardware Strategy

LotSync will initially use Minew ESL hardware and gateways for testing and MVP.

Dealer-facing experience should be white-labeled as LotSync.

Do not expose Minew branding in:
- dealer dashboard
- mobile app
- onboarding materials
- label templates
- customer-facing docs

## Technical Strategy

Minew must be implemented as a provider adapter.

Business logic calls:

ESLService -> ESLProvider -> MinewProvider

Never:

VehicleService -> Minew API

## Required Minew Provider Functions

- register_device
- update_label
- get_device_status
- get_battery
- get_gateway_status
- list_devices
- push_image
- clear_label
- test_push

## Test Kit Setup Docs Needed

When the kit arrives, document:
- Gateway model
- ESL tag models
- Screen resolution
- Color support
- API/cloud access method
- Auth credentials needed
- Update latency
- Image format requirements
- Device ID format
- QR code/device label format

## Driveway Test Use

Use personal vehicles as test inventory.

Treat each car like a dealer vehicle:
- VIN
- stock number
- test price
- tag assignment
- price updates
- sold status
- reassignment
