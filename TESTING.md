# Testing Guide for Wallet Transfer & Mobile Features

## Quick Start Testing

### 1. Start Development Server
```bash
cd /home/nhac/vault/gambino-users
npm run dev
```

The app should start at `http://localhost:3000`

### 2. Login and Access Dashboard
1. Navigate to `http://localhost:3000/login`
2. Login with your credentials
3. Go to Dashboard (`http://localhost:3000/dashboard`)

---

## Testing Transfer Functionality

### Desktop Testing

1. **Open Transfer Modal**
   - Click the "Send Tokens" button (gold/yellow button)
   - Modal should appear with dark overlay

2. **Test Form Fields**
   - **Token Selector**: Switch between SOL, GAMBINO, USDC
     - Notice balance boxes highlight the selected token
   - **Recipient Address**:
     - Try entering invalid addresses (too short/long)
     - Use the "Paste" button to test clipboard
   - **Amount Field**:
     - Click "Use Max" to auto-fill max balance
     - Try entering amounts larger than balance
     - Test decimal values (e.g., 0.000001)

3. **Test Validation**
   - Leave fields empty and submit → should show error
   - Enter amount > balance → should show insufficient funds error
   - Enter short address (< 32 chars) → should show invalid address error
   - Enter valid Solana address (32-44 chars) → should accept

4. **Test ESC Key**
   - Press ESC → modal should close

5. **Test Copy Buttons**
   - Click "Copy Address" on wallet address
   - Button should change to "Copied!" for 2 seconds

---

## Testing Mobile Responsiveness

### Method 1: Chrome DevTools (Easiest)

1. **Open DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Toggle Device Toolbar**
   - Press `Ctrl+Shift+M` (Windows/Linux)
   - Press `Cmd+Shift+M` (Mac)
   - Or click the phone/tablet icon

3. **Test Different Devices**
   ```
   Recommended test devices:
   - iPhone SE (375x667) - Small mobile
   - iPhone 12 Pro (390x844) - Standard mobile
   - iPhone 14 Pro Max (430x932) - Large mobile
   - iPad Air (820x1180) - Tablet
   - Samsung Galaxy S20 (360x800) - Android
   ```

4. **Test Mobile Features**
   - [ ] Navbar hamburger menu opens/closes
   - [ ] Transfer modal fits on screen
   - [ ] All buttons are easy to tap (44px minimum)
   - [ ] Inputs don't zoom on focus (iOS)
   - [ ] Modal scrolls if needed
   - [ ] QR code is visible and sized well
   - [ ] Balance cards stack vertically
   - [ ] Copy/Paste buttons work

### Method 2: Test on Real Mobile Device

1. **Find Your Local IP**
   ```bash
   # On Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1

   # Or simpler
   hostname -I
   ```

2. **Update Next.js Dev Server**
   ```bash
   # Stop current server, then run:
   npm run dev -- -H 0.0.0.0
   ```

3. **Access from Phone**
   - Make sure phone is on same WiFi
   - Open browser on phone
   - Go to `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

4. **Test Touch Experience**
   - Tap all buttons - should feel responsive
   - Test scrolling in modal
   - Test copy/paste functionality
   - Pinch to zoom should be disabled in inputs

---

## Testing Checklist

### Transfer Modal
- [ ] Modal opens when clicking "Send Tokens"
- [ ] Modal closes with X button
- [ ] Modal closes with ESC key
- [ ] Modal closes with Cancel button
- [ ] Background is darkened with blur
- [ ] Body scroll is locked when modal open
- [ ] Token selector changes balance highlight
- [ ] "Use Max" button fills correct balance
- [ ] "Paste" button pastes from clipboard
- [ ] Form validates empty fields
- [ ] Form validates insufficient balance
- [ ] Form validates invalid address length
- [ ] Submit button shows loading state
- [ ] Success message appears after transfer
- [ ] Error message appears on failure
- [ ] Balance refreshes after successful transfer

### Mobile Layout
- [ ] Cards stack on mobile (< 640px)
- [ ] Buttons are full-width on mobile
- [ ] Text is readable at all sizes
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough (44px)
- [ ] QR code displays properly
- [ ] Wallet address wraps correctly
- [ ] Stats boxes responsive
- [ ] Navbar mobile menu works

### Copy/Paste Functionality
- [ ] "Copy Address" button works
- [ ] Button shows "Copied!" feedback
- [ ] "Paste" button in transfer modal works
- [ ] Private key copy works

---

## Testing Without Backend API

If `/api/wallet/transfer` endpoint isn't ready yet:

### Modify Dashboard Temporarily

Add this mock function for testing:

```javascript
// In src/app/dashboard/page.js
// Replace the handleTransfer function with this:

const handleTransfer = async (e) => {
  e.preventDefault();
  setTransferError('');
  setTransferSuccess('');

  // Validation
  if (!transferForm.recipientAddress || !transferForm.amount) {
    setTransferError('Please fill in all fields');
    return;
  }

  const amount = parseFloat(transferForm.amount);
  if (isNaN(amount) || amount <= 0) {
    setTransferError('Please enter a valid amount greater than 0');
    return;
  }

  const currentBalance = Number(balances?.[transferForm.tokenType] ?? 0);
  if (amount > currentBalance) {
    setTransferError(`Insufficient ${transferForm.tokenType} balance. You have ${currentBalance.toLocaleString()}`);
    return;
  }

  if (transferForm.recipientAddress.length < 32 || transferForm.recipientAddress.length > 44) {
    setTransferError('Invalid Solana wallet address');
    return;
  }

  try {
    setTransferLoading(true);

    // MOCK: Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // MOCK: Simulate success
    setTransferSuccess(`Successfully sent ${amount} ${transferForm.tokenType} to ${transferForm.recipientAddress.slice(0, 8)}...${transferForm.recipientAddress.slice(-6)}`);

    // Reset form
    setTransferForm({
      recipientAddress: '',
      amount: '',
      tokenType: 'SOL'
    });

    // Close modal after 2 seconds
    setTimeout(() => {
      setShowTransferModal(false);
      setTransferSuccess('');
    }, 2000);
  } catch (e) {
    setTransferError('Transfer failed (MOCK MODE)');
  } finally {
    setTransferLoading(false);
  }
};
```

---

## Common Issues & Solutions

### Issue: Modal won't open
**Solution**: Check browser console for errors. Make sure balances are loaded.

### Issue: Clipboard paste doesn't work
**Solution**: Browser security requires user interaction first. Click in the address field before pasting.

### Issue: Mobile keyboard covers input
**Solution**: This is normal. The modal should scroll to keep the input visible.

### Issue: Transfer button stays disabled
**Solution**: Make sure all required fields are filled and valid.

### Issue: Can't access from phone
**Solution**:
- Check firewall isn't blocking port 3000
- Use correct IP address
- Make sure phone is on same network

---

## Performance Testing

### Mobile Performance Checklist
- [ ] Page loads in < 3 seconds on 3G
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts when loading
- [ ] Images load progressively
- [ ] Modal opens without lag

### Test Commands
```bash
# Check bundle size
npm run build

# Analyze what's in the bundle
npx next build --profile
```

---

## Browser Compatibility Testing

Test on these browsers:
- [ ] Chrome/Edge (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile iOS)
- [ ] Samsung Internet (Mobile)

---

## Accessibility Testing

- [ ] Tab through form with keyboard
- [ ] All buttons have focus states
- [ ] Modal can be closed with keyboard
- [ ] Screen reader announces modal
- [ ] Color contrast is sufficient

---

## Video Recording Test Sessions

To record issues for debugging:

**On Desktop:**
- Use OBS Studio or browser recording
- Chrome: Right-click → Inspect → Performance → Record

**On Mobile:**
- iOS: Screen recording built-in
- Android: Screen recording in quick settings

---

## Questions to Answer While Testing

1. Can you complete a transfer in under 30 seconds?
2. Are all touch targets easy to tap on mobile?
3. Is the copy/paste flow intuitive?
4. Does the "Use Max" button make sense?
5. Are error messages clear and helpful?
6. Does the success feedback feel satisfying?

---

## Next Steps After Testing

1. Note any bugs or UX issues
2. Test with real blockchain transactions (when backend ready)
3. Add transaction history feature
4. Consider adding recent recipients list
5. Add transaction confirmation step for large amounts
