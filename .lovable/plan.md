
# Update NeuronWriter to Use Your Deployed Edge Function

## Summary
Your edge function is deployed as `hyper-worker` but our code is calling `neuronwriter-proxy`. We need to update the function name in the code to match your deployment.

## Changes Required

### 1. Update NeuronWriterService.ts
**File:** `src/lib/sota/NeuronWriterService.ts`

Change line 125 from:
```typescript
const { data, error } = await supabase!.functions.invoke('neuronwriter-proxy', {
```

To:
```typescript
const { data, error } = await supabase!.functions.invoke('hyper-worker', {
```

### 2. Verify Supabase Client Configuration
**File:** `src/integrations/supabase/client.ts`

Ensure `VITE_SUPABASE_URL` is set to:
```
https://ousxeycrhvuwaejhpqgv.supabase.co
```

This should already be configured from the secrets you added earlier.

## Technical Details

| Item | Current Value | New Value |
|------|---------------|-----------|
| Function name in code | `neuronwriter-proxy` | `hyper-worker` |
| Your Supabase URL | - | `https://ousxeycrhvuwaejhpqgv.supabase.co` |
| Function endpoint | - | `https://ousxeycrhvuwaejhpqgv.supabase.co/functions/v1/hyper-worker` |

## After Implementation
1. Test the NeuronWriter integration by entering your API key
2. Verify projects load correctly
3. The CORS errors should be resolved since calls now route through your Supabase edge function
