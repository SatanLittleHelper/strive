## Calorie Service Frontend Integration Plan (Angular → Go backend)

### Goals
- Replace in-browser calculations with Go API calls.
- Remove localStorage usage.
- Leverage PWA capabilities for resilient UX: offline queue, background sync, caching.

### API Contracts
- POST `/api/calories/calculate` → `CalorieResults`
- GET `/api/calories/last` → `{ data, results } | 404`
- JSON fields match current TS models.

### Angular Changes
- `CalorieApiService`:
  - `calculateCalories(data)` → `HttpClient.post<CalorieResults>`
  - `getCaloriesResult()` → `HttpClient.get<{data: CalorieCalculationData; results: CalorieResults} | null>`
  - Remove `setTimeout` and client-side formulas (optionally keep as fallback behind feature flag)
- `CalorieCalculatorService` remains the same (signals/state unchanged).
- Add `ApiBaseUrl` configuration via environments.

### PWA Enhancements (no localStorage)
- IndexedDB Request Queue
  - Store pending calculation requests when offline
  - Replay on reconnect (online event) or via Background Sync
- Background Sync (if supported)
  - Register sync tag `calories-calc-sync`
  - Service Worker consumes queued requests and POSTs to backend
- Caching Strategy via Angular Service Worker
  - `ngsw-config.json`: dataGroups for
    - `POST /api/calories/calculate` → freshness (no cache of responses, but queue when offline)
    - `GET /api/calories/last` → performance with short maxAge and ETag revalidation
- ETag/If-None-Match
  - Use ETag headers from backend for `last` endpoint; SW respects 304

### Error Handling
- Unified API error mapper (status → user-visible message)
- Timeouts and retry with backoff for idempotent `GET /last` only
- For `POST /calculate` avoid automatic retries in foreground; rely on queue/sync

### Security
- Add interceptor for Telegram initData/JWT header
- CORS aligned on backend

### Testing
- HttpClientTestingModule specs for both methods (200/404/error)
- E2E or integration test covering offline queue replay (can be documented/manual if complex)

### Migration Steps
1. Implement backend (per backend plan)
2. Add Angular env `apiBaseUrl` and HTTP interceptor
3. Replace `CalorieApiService` internals with HttpClient
4. Configure `ngsw-config.json` dataGroups (cache + queue)
5. Implement IndexedDB queue + SW sync handler
6. Update docs and remove old client-side logic

### Open Questions
- Auth source: Telegram initData or other?
- Should client fallback to local compute when offline (feature flag)? Default: no.


