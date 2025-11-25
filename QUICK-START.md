# Quick Start Testing Guide

## 🚀 Fastest Way to Test (2 Minutes)

### Option 1: Test with Chrome DevTools Mobile Emulation

```bash
# 1. Start the dev server
npm run dev

# 2. Open your browser
# Go to: http://localhost:3000

# 3. Open Chrome DevTools
# Press F12 (or Cmd+Option+I on Mac)

# 4. Toggle Device Toolbar
# Press Ctrl+Shift+M (or Cmd+Shift+M on Mac)
# Or click the phone icon in DevTools

# 5. Select a device
# Choose "iPhone 12 Pro" or "iPhone SE"
```

**Now test:**
1. Login to your account
2. Go to Dashboard
3. Click **"Send Tokens"** button (gold button)
4. Try filling out the transfer form
5. Test the mobile menu (hamburger icon)

---

## 📱 Test on Your Phone (5 Minutes)

### Step 1: Find Your Computer's IP Address

```bash
# Run this command:
hostname -I | awk '{print $1}'
```

Example output: `192.168.1.100`

### Step 2: Start Dev Server on Network

```bash
npm run dev -- -H 0.0.0.0
```

### Step 3: Open on Your Phone

1. Connect phone to **same WiFi** as computer
2. Open phone browser
3. Go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

---

## 🧪 Test Transfer Without Backend (Mock Mode)

If your backend API isn't ready:

### Terminal 1: Start Mock API Server
```bash
node test-mock.js
```

This starts a mock transfer API on port 3001.

### Terminal 2: Update Environment & Start App
```bash
# Add to .env.local (or create it)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env.local

# Start the app
npm run dev
```

Now transfers will use the mock API! It will:
- Simulate 1.5 second processing time
- Validate addresses and amounts
- Randomly fail 10% of the time (to test error handling)

---

## ✅ Quick Test Checklist

### Desktop Tests (5 minutes)
- [ ] Open transfer modal → Click "Send Tokens"
- [ ] Switch token types → Should highlight selected balance
- [ ] Click "Use Max" → Should fill max balance
- [ ] Click "Paste" → Should paste from clipboard
- [ ] Submit empty form → Should show errors
- [ ] Enter invalid address → Should show error
- [ ] Enter amount > balance → Should show insufficient funds
- [ ] Press ESC → Modal should close
- [ ] Click "Copy Address" → Should show "Copied!"

### Mobile Tests (5 minutes)
- [ ] Open hamburger menu → Should slide in
- [ ] Tap "Send Tokens" → Modal should fit screen
- [ ] Scroll in modal → Should work smoothly
- [ ] All buttons easy to tap → Minimum 44px
- [ ] Type in address field → Keyboard shouldn't zoom page
- [ ] QR code visible → Should be clear and sized well
- [ ] Balance cards stack vertically → No horizontal scroll

---

## 🎯 Key Features to Test

### 1. Transfer Modal
**How to access:** Dashboard → Click "Send Tokens"

**Test:**
- Token selector (SOL, GAMBINO, USDC)
- Paste button for recipient address
- Use Max button for amount
- Form validation messages
- Loading state during transfer
- Success/error messages

### 2. Copy Functionality
**Locations to test:**
- Wallet address "Copy Address" button
- Should show "Copied!" feedback for 2 seconds

### 3. Mobile Menu
**How to access:** Click hamburger icon (top right on mobile)

**Test:**
- Opens smoothly
- All links work
- Closes when clicking outside
- Closes when selecting a link

### 4. Responsive Layout
**Test at these widths:**
- 375px (iPhone SE)
- 768px (iPad)
- 1024px (Desktop)

---

## 🐛 Troubleshooting

### Can't access from phone
```bash
# Check firewall
sudo ufw allow 3000/tcp

# Or temporarily disable firewall
sudo ufw disable
```

### Port 3000 already in use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Transfer button doesn't work
- Open browser console (F12)
- Look for errors
- Make sure you're logged in
- Check that wallet is generated

### Modal won't close
- Try clicking outside the modal
- Press ESC key
- Check browser console for errors

---

## 📊 Test Data Examples

### Valid Solana Addresses (for testing)
```
DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC7H4SnYY5pVY
7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV
9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E
```

### Test Amounts
```
Valid: 0.1, 1.5, 10, 0.000001
Invalid: -1, 0, abc, empty
Too high: 999999 (more than balance)
```

---

## 📸 Screenshot Comparison

Take screenshots at these breakpoints:
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1440px width

Compare:
- Button sizes
- Text readability
- Spacing and alignment
- Touch target sizes

---

## ⚡ Performance Testing

```bash
# Build production version
npm run build

# Start production server
npm start

# Measure load time
# Should be < 2 seconds on 4G
```

---

## 🎥 Record Your Testing

**Desktop:**
- Chrome: F12 → Performance → Record
- Or use OBS Studio

**Mobile:**
- iOS: Control Center → Screen Recording
- Android: Quick Settings → Screen Recorder

---

## 💡 Pro Tips

1. **Test with empty balances** - Generate a new wallet to test 0 balance state
2. **Test with slow network** - Chrome DevTools → Network → Slow 3G
3. **Test with different zoom levels** - Ctrl+Plus/Minus
4. **Test keyboard navigation** - Tab through all form fields
5. **Test with VoiceOver/TalkBack** - Accessibility testing

---

## 📞 Getting Help

If you find issues:
1. Check browser console for errors (F12)
2. Check terminal for Next.js errors
3. Try clearing browser cache
4. Try incognito/private mode
5. Test in different browser

---

## 🎉 Success Criteria

Your implementation is working if:
- ✅ Transfer modal opens and displays correctly
- ✅ All validation works (address, amount, balance)
- ✅ Form submits and shows loading state
- ✅ Success/error messages display
- ✅ UI is fully responsive on mobile
- ✅ All buttons are easily tappable
- ✅ Copy/paste functionality works
- ✅ No console errors
- ✅ Modal closes properly
- ✅ Everything works smoothly on phone

---

## Next: Full Testing Guide

For comprehensive testing, see: **TESTING.md**
