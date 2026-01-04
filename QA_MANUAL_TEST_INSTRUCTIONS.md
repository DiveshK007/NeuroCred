# QA Manual Test Instructions

## 🎯 Purpose
This document provides step-by-step instructions for manually testing the safety fixes that cannot be verified through code analysis alone.

---

## 🔴 CRITICAL: Wallet & Network Failures

### Test 1.1: Wallet Disconnection During Transaction Signing

**Steps:**
1. Open application at `http://localhost:3000`
2. Connect wallet (MetaMask)
3. Navigate to Staking page or Lend page
4. Click "Stake" or "Accept Offer" button
5. **While MetaMask popup is open**, disconnect wallet in MetaMask (click "Disconnect" in MetaMask)
6. Observe UI behavior

**Expected Result:**
- ✅ Transaction popup closes or shows error
- ✅ UI shows disconnected state
- ✅ No transaction submitted
- ✅ Error message displayed: "Wallet disconnected. Please reconnect and try again."

**Actual Result:** _______________________

---

### Test 1.2: Wallet Disconnection During Transaction Confirmation

**Steps:**
1. Connect wallet
2. Start a transaction (e.g., stake tokens)
3. Approve transaction in MetaMask
4. **While `tx.wait()` is pending**, disconnect wallet in MetaMask
5. Observe UI behavior

**Expected Result:**
- ✅ Error caught and displayed
- ✅ Loading state cleared (`isLoading = false`)
- ✅ User notified with clear error message
- ✅ Transaction hash shown if transaction was submitted

**Actual Result:** _______________________

---

### Test 2.1: Network Switch During Transaction Signing

**Steps:**
1. Connect wallet on QIE Testnet
2. Start a transaction (e.g., stake tokens)
3. **While MetaMask popup is open**, switch to Ethereum Mainnet in MetaMask
4. Observe error handling

**Expected Result:**
- ✅ Transaction fails with clear error
- ✅ Error message: "Wrong network! Expected QIE Testnet..."
- ✅ Page may reload (if chain change handler triggers)
- ✅ No transaction sent to wrong network

**Actual Result:** _______________________

---

### Test 2.2: Network Switch During Transaction Confirmation

**Steps:**
1. Connect wallet on QIE Testnet
2. Start a transaction and approve in MetaMask
3. **While `tx.wait()` is pending**, switch to Ethereum Mainnet
4. Observe timeout/error handling

**Expected Result:**
- ✅ Transaction wait should timeout or fail
- ✅ Error shown: "Transaction confirmation timeout" or network error
- ✅ UI not stuck in loading state
- ✅ Transaction hash shown for manual checking

**Actual Result:** _______________________

---

## 🟠 HIGH: Transaction State & Race Conditions

### Test 4.1: Rapid Button Clicks (Double-Submission)

**Steps:**
1. Connect wallet
2. Navigate to Staking page
3. Enter stake amount (e.g., 100)
4. **Rapidly click "Stake" button 10 times** before MetaMask popup appears
5. Check browser console for warnings
6. Check MetaMask for number of transactions

**Expected Result:**
- ✅ Only ONE transaction created in MetaMask
- ✅ Console shows: "Transaction already in progress, ignoring duplicate request"
- ✅ Button disabled after first click (`isLoading = true`)
- ✅ No multiple pending transactions

**Actual Result:** _______________________

**Console Output:** _______________________

---

### Test 5.1: Transaction Timeout with Slow Network

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G" or "Offline"
4. Connect wallet
5. Start a transaction (e.g., stake)
6. Approve in MetaMask
7. Wait for timeout (should be 5 minutes)

**Expected Result:**
- ✅ After 5 minutes, timeout error shown
- ✅ Error message: "Transaction confirmation timeout. Check your wallet for transaction status."
- ✅ Loading state cleared
- ✅ Transaction hash displayed (if transaction was submitted)
- ✅ User can check transaction status manually

**Actual Result:** _______________________

**Timeout Duration:** _______________________

---

### Test 6.1: Multiple Simultaneous API Calls

**Steps:**
1. Connect wallet
2. Open browser DevTools Console
3. Rapidly navigate between pages:
   - Dashboard → Portfolio → Loans → Dashboard
4. Check console for errors
5. Verify data loads correctly on each page

**Expected Result:**
- ✅ No React warnings about state updates
- ✅ No "Cannot read property" errors
- ✅ All data loads correctly
- ✅ No race conditions (last response doesn't overwrite earlier ones incorrectly)

**Actual Result:** _______________________

**Console Errors:** _______________________

---

## 🟡 MEDIUM: Input Validation & Data Integrity

### Test 7.1: Invalid Input Handling

**Steps:**
1. Connect wallet
2. Navigate to Staking page
3. Try to stake with each invalid input:
   - `-100` (negative)
   - `0` (zero)
   - `abc` (non-numeric)
   - `1.5.5` (invalid decimal)
   - `999999999999999999` (extremely large)
4. Observe validation and error messages

**Expected Result:**
- ✅ Negative: Error "Invalid stake amount. Please enter a positive number."
- ✅ Zero: Error "Invalid stake amount. Please enter a positive number."
- ✅ Non-numeric: Input rejected or error shown
- ✅ Invalid decimal: Input rejected or error shown
- ✅ Extremely large: Error before transaction (if exceeds balance) or handled gracefully

**Actual Result:** _______________________

---

### Test 9.1: BigInt Precision with Large Amounts

**Steps:**
1. Connect wallet
2. Navigate to Lend page
3. Request loan for very large amount (e.g., 1e20 wei = 100 QIE)
4. Check loan offer display in chat
5. Verify amounts are displayed correctly (no precision loss)

**Expected Result:**
- ✅ Amount displayed correctly in chat offer card
- ✅ No rounding errors
- ✅ Amount matches what was requested
- ✅ Transaction uses correct amount (if accepted)

**Actual Result:** _______________________

**Requested Amount:** _______________________

**Displayed Amount:** _______________________

---

## 🟢 LOW: Edge Cases & UX Issues

### Test 10.1: RPC Failover

**Steps:**
1. Open browser DevTools
2. Go to Network tab
3. Block primary RPC endpoint (find requests to `rpc1testnet.qie.digital` or `rpc1mainnet.qie.digital`)
4. Try to load score or submit transaction
5. Observe failover behavior

**Expected Result:**
- ✅ Automatic failover to backup RPC
- ✅ No user-visible error (seamless)
- ✅ Request succeeds with backup RPC
- ✅ Or clear error if all RPCs fail

**Actual Result:** _______________________

---

### Test 11.1: Page Reload During Transaction

**Steps:**
1. Connect wallet
2. Start a transaction (e.g., stake)
3. Approve in MetaMask
4. **Immediately refresh page** (F5) while transaction is pending
5. Check if transaction continues
6. Check if transaction status is preserved

**Expected Result:**
- ✅ Transaction continues in background (MetaMask handles it)
- ✅ User can check transaction status in wallet
- ✅ No errors in console
- ✅ Page loads correctly after refresh

**Actual Result:** _______________________

---

### Test 13.1: Loading State Cleanup on Cancel

**Steps:**
1. Connect wallet
2. Start a transaction (e.g., stake)
3. **Cancel transaction in MetaMask** (click "Reject")
4. Observe UI state

**Expected Result:**
- ✅ Loading state cleared (`isLoading = false`)
- ✅ Button re-enabled
- ✅ Spinner hidden
- ✅ Error message shown: "Transaction rejected by user."
- ✅ No UI stuck in loading state

**Actual Result:** _______________________

---

## 🔵 BACKEND: API & Data Integrity

### Test 14.1: Backend Error Handling

**Steps:**
1. Stop backend server (if running locally)
2. Try to generate score via API
3. Observe error response

**Expected Result:**
- ✅ Graceful error (500 or connection error)
- ✅ Clear error message (not stack trace)
- ✅ Frontend handles error gracefully
- ✅ User sees friendly error message

**Actual Result:** _______________________

---

### Test 15.1: Rate Limiting

**Steps:**
1. Open browser console
2. Run this code to send rapid requests:
   ```javascript
   for (let i = 0; i < 100; i++) {
     fetch('http://localhost:8000/api/score/0x1234567890123456789012345678901234567890')
       .then(r => console.log(i, r.status));
   }
   ```
3. Observe rate limiting behavior

**Expected Result:**
- ✅ After ~30 requests, 429 errors returned
- ✅ Rate limit message in response
- ✅ Backend doesn't crash
- ✅ Normal requests still work after rate limit resets

**Actual Result:** _______________________

---

## 🛡️ SECURITY: Hostile User Behavior

### Test 16.1: XSS Attack in Chat

**Steps:**
1. Connect wallet
2. Navigate to Lend page
3. In chat, send message: `<script>alert('xss')</script>`
4. Observe if script executes

**Expected Result:**
- ✅ Script does NOT execute
- ✅ Message is sanitized
- ✅ No alert popup
- ✅ Message displayed as text (escaped)

**Actual Result:** _______________________

---

### Test 16.2: SQL Injection Attempt

**Steps:**
1. Try to use address: `'; DROP TABLE users; --`
2. Try to send this in API request
3. Observe validation

**Expected Result:**
- ✅ Address validation rejects invalid format
- ✅ No SQL execution
- ✅ Error: "Invalid address format"
- ✅ Database not affected

**Actual Result:** _______________________

---

### Test 17.1: Replay Attack (Old Signature)

**Steps:**
1. Generate loan offer (note signature)
2. Accept offer (transaction succeeds)
3. Generate new loan offer
4. Try to use OLD signature with NEW offer
5. Observe rejection

**Expected Result:**
- ✅ Transaction fails on-chain
- ✅ Error: "Nonce already used" or "Invalid signature"
- ✅ Old signature cannot be reused
- ✅ Only current offer can be accepted

**Actual Result:** _______________________

---

## 📋 Test Execution Log

**Date:** _______________
**Tester:** _______________
**Environment:** Testnet / Mainnet (circle one)

| Test # | Status | Notes | Issues Found |
|--------|--------|-------|--------------|
| 1.1    | ⬜ Pass / ⬜ Fail | | |
| 1.2    | ⬜ Pass / ⬜ Fail | | |
| 2.1    | ⬜ Pass / ⬜ Fail | | |
| 2.2    | ⬜ Pass / ⬜ Fail | | |
| 4.1    | ⬜ Pass / ⬜ Fail | | |
| 5.1    | ⬜ Pass / ⬜ Fail | | |
| 6.1    | ⬜ Pass / ⬜ Fail | | |
| 7.1    | ⬜ Pass / ⬜ Fail | | |
| 9.1    | ⬜ Pass / ⬜ Fail | | |
| 10.1   | ⬜ Pass / ⬜ Fail | | |
| 11.1   | ⬜ Pass / ⬜ Fail | | |
| 13.1   | ⬜ Pass / ⬜ Fail | | |
| 14.1   | ⬜ Pass / ⬜ Fail | | |
| 15.1   | ⬜ Pass / ⬜ Fail | | |
| 16.1   | ⬜ Pass / ⬜ Fail | | |
| 16.2   | ⬜ Pass / ⬜ Fail | | |
| 17.1   | ⬜ Pass / ⬜ Fail | | |

---

## 🚨 Critical Issues Found

**List any critical issues discovered during manual testing:**

1. 
2. 
3. 

---

## ✅ Sign-Off

**All critical tests passed:** ⬜ Yes / ⬜ No

**Ready for mainnet:** ⬜ Yes / ⬜ No

**Blockers:**
- 
- 

**Notes:**
- 

