# Real-Time Sync Engine

## Purpose

The sync engine keeps vehicle ESL tags aligned with dealer inventory changes.

## Input Events

- Inventory feed updated
- API/webhook received
- CSV uploaded
- Vehicle manually edited
- VIN-to-ESL pairing created
- Price mismatch resolved
- Vehicle sold
- Manual push requested

## Processing Flow

1. Receive inventory change.
2. Normalize external data.
3. Match vehicle by VIN.
4. Compare tracked fields:
   - price
   - status
   - mileage
   - stock number
   - year/make/model/trim
5. Update vehicle record.
6. If assigned ESL exists, create sync event.
7. Render label image.
8. Push image to ESL provider.
9. Record result.
10. Retry if failed.

## Change Detection

Important fields:
- source_price
- displayed_price
- website_verified_price
- status
- mileage
- vehicle_url
- price_type

## Job Queue

Jobs:
- fetch_inventory_source
- normalize_inventory_payload
- verify_website_price
- detect_vehicle_changes
- render_label
- push_esl_update
- retry_failed_push
- refresh_device_status

## Retry Rules

- Retry 3 times for transient provider failures
- Exponential backoff
- Mark FAILED after max attempts
- Alert dashboard on failed status

## Real-Time Language

Use "real-time" in product language, but technically define it as:

LotSync updates assigned ESL tags in near real time after receiving updated inventory data from the dealer's connected source.

This protects against sources that only update every few hours.
