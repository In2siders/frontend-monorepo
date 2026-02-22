# Online Users Detection Plan

1. Subscribe chat clients to a `presence:update` websocket event after room join.
2. Send a heartbeat every 30 seconds while chat is open to keep online status fresh.
3. Mark users online immediately on `presence:update` connect events.
4. Mark users offline when `presence:update` disconnect events are received.
5. Keep a local `onlineUsersByRoom` cache to avoid repeated metadata fetches.
6. Reconcile cache with a secure REST endpoint on reconnect to avoid stale state.
7. Show degraded status if websocket is disconnected for more than 90 seconds.
8. Never expose full online rosters for rooms the current user is not a member of.
