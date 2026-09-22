# Complete useEffect Runtime Fix

Based on the user's scan of the current client, these four pages contained the unsafe
pattern `useEffect(load, ...)`, where `load` can return a Promise:

- client/pages/admin/authenticity.js
- client/pages/admin/copilot.js
- client/pages/admin/image-intelligence.js
- client/pages/admin/risk.js

They are changed to invoke load from a synchronous effect callback.

Replace these four files in the current project, then clear `.next` and restart Next.js.

PowerShell:
cd D:\Waventravetric\client
Remove-Item .next -Recurse -Force
npm run dev

The other useEffect occurrences shown in the user's scan already use callback functions
and are not the direct `useEffect(load, ...)` problem.
