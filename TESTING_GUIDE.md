# 🧪 Porter MVP - Complete Testing Guide

## Prerequisites Checklist

### Backend Setup
- [ ] MongoDB running and connected
- [ ] Redis running (`redis-cli ping` returns `PONG`)
- [ ] Backend server running (`npm run dev` in porter folder)
- [ ] Environment variables configured (.env file)
- [ ] Port 5000 available

### Driver App Setup
- [ ] Node modules installed (`npm install`)
- [ ] .env file created from .env.example
- [ ] EXPO_PUBLIC_API_URL set to your machine's IP
- [ ] Expo CLI installed globally
- [ ] Android emulator or physical device ready

---

## Test Scenario 1: Driver Registration & Login

### Step 1.1: Register Driver Account (API)

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "phone": "+919876543210",
  "name": "Test Driver",
  "role": "driver",
  "driverProfile": {
    "vehicleType": "mini-truck",
    "vehicleNumber": "MH01AB1234",
    "isKYCVerified": true,
    "isAvailable": false
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

### Step 1.2: Start Driver App

```powershell
cd c:\Users\hamee\OneDrive\Desktop\porter\driver-app
npm start
```

- Press `a` for Android emulator
- Or scan QR code with Expo Go on physical device

### Step 1.3: Login Flow

1. **Enter Phone Number**
   - Input: `9876543210` (without +91)
   - Click "Send OTP"
   - ✅ Should see "OTP Sent" toast

2. **Check Backend Logs for OTP**
   - Look for: `OTP for +919876543210: 123456`
   - Note the 6-digit OTP

3. **Enter OTP**
   - Input each digit in the 6 boxes
   - Auto-focus should move to next box
   - ✅ Should auto-submit when 6th digit entered
   - ✅ Should see "Login successful" toast
   - ✅ Should navigate to Home Screen

4. **Verify Persistent Login**
   - Close app completely
   - Reopen app
   - ✅ Should auto-login (no login screen)
   - ✅ Should go directly to Home Screen

**✅ Test 1 PASSED** if all steps completed successfully

---

## Test Scenario 2: Go Online & Location Tracking

### Step 2.1: Initial State Check

**On Home Screen:**
- ✅ Should see "Hi, Test Driver!"
- ✅ Should see "Go online to start earning"
- ✅ Toggle switch should be OFF (⚫ Offline)
- ✅ Should see offline empty state with 😴 icon

### Step 2.2: Grant Permissions

1. **Toggle Switch to Online**
   - Click the switch
   - ✅ Should see location permission dialog

2. **Grant Foreground Location**
   - Click "Allow" or "While using the app"
   - ✅ Should see background location permission dialog

3. **Grant Background Location (Optional)**
   - Click "Allow all the time" or "Allow"
   - Note: Background permission improves tracking when app is minimized

### Step 2.3: Verify Online Status

**After Permissions Granted:**
- ✅ Toggle should be ON (🟢 Online)
- ✅ Should see "🟢 Online • Ready" or "🟢 Online • Connecting..."
- ✅ Should transition to "🟢 Online • Ready" within 2-3 seconds
- ✅ Offline empty state should disappear
- ✅ Should see "Available Trips" header
- ✅ Should show empty job feed with "No Trips Available"

### Step 2.4: Verify Location Updates (Backend Logs)

**Check backend console:**
```
✅ Updated location for driver 67xxx: [19.0760, 72.8777]
```

- Should see location updates every ~10 seconds
- Coordinates should match your device's GPS location

### Step 2.5: Verify Redis GEO Index

```bash
redis-cli

# Check driver in GEO index
GEOPOS driver:locations <driverId>
# Should return: 1) "72.8777" 2) "19.0760"

# Check driver metadata
GET driver:metadata:<driverId>
# Should return JSON with vehicleType, isAvailable, etc.

# Check available drivers set
SMEMBERS driver:available
# Should include your driverId
```

**✅ Test 2 PASSED** if online status works and location updates

---

## Test Scenario 3: Receive & Accept Booking

### Step 3.1: Create Customer Booking (API)

First, create a customer account and get auth token:

```bash
# Register customer
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "phone": "+919123456789",
  "name": "Test Customer",
  "role": "customer"
}

# Send OTP
POST http://localhost:5000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919123456789"
}

# Verify OTP (check backend logs for OTP)
POST http://localhost:5000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+919123456789",
  "otp": "123456"
}

# Save the accessToken from response
```

Now create booking:

```bash
POST http://localhost:5000/api/bookings
Authorization: Bearer <customer_access_token>
Content-Type: application/json

{
  "pickup": {
    "address": "Bandra West, Mumbai, Maharashtra",
    "coordinates": {
      "lat": 19.0596,
      "lng": 72.8295
    },
    "landmark": "Near Linking Road",
    "instructions": "Call on arrival"
  },
  "drop": {
    "address": "Andheri East, Mumbai, Maharashtra",
    "coordinates": {
      "lat": 19.1136,
      "lng": 72.8697
    },
    "landmark": "Near Metro Station"
  },
  "vehicleType": "mini-truck",
  "paymentMethod": "cod",
  "requirements": {
    "helper": true,
    "fragile": false,
    "heavy": true,
    "notes": "Please handle boxes carefully"
  }
}
```

### Step 3.2: Verify Booking Notification

**On Driver App (Job Feed Screen):**

Within 1-2 seconds, you should see:

- ✅ Booking card appears automatically
- ✅ Shows customer name: "Test Customer"
- ✅ Shows pickup address: "Bandra West, Mumbai..."
- ✅ Shows dropoff address: "Andheri East, Mumbai..."
- ✅ Shows distance: "~8.5 km"
- ✅ Shows duration: "~25 min"
- ✅ Shows earning: "₹XXX" (80% of fare)
- ✅ Shows vehicle type chip: "mini-truck"
- ✅ Shows special requirements chips:
  - "Helper Needed"
  - "Heavy Load"
- ✅ Shows "Accept" and "Reject" buttons

**Backend Logs Should Show:**
```
✅ Notified 1 drivers for booking 67xxx
```

**Socket.IO Event (Check Developer Tools):**
```javascript
Event: 'booking:new_request'
Data: {
  bookingId: "67xxx",
  pickup: { ... },
  dropoff: { ... },
  // ... more details
}
```

### Step 3.3: Accept Booking

1. **Click "Accept" Button**
   - ✅ Should see confirmation dialog: "Are you sure you want to accept this booking?"

2. **Click "Accept" in Dialog**
   - ✅ Should show loading spinner on button
   - ✅ Should see "Booking Accepted!" toast
   - ✅ Should navigate to Active Trip Screen

3. **Verify Backend Updates**
   - Backend logs:
   ```
   ✅ Assigned driver 67xxx to booking 67yyy
   ```
   - ✅ Driver should be marked as unavailable
   - ✅ Customer should receive Socket.IO event: `booking:driver_assigned`

**✅ Test 3 PASSED** if booking notification received and accepted

---

## Test Scenario 4: Navigate & Start Trip

### Step 4.1: Verify Active Trip Screen

**On Active Trip Screen:**

- ✅ Full-screen map visible
- ✅ Driver marker (car 🚗) at your location
- ✅ Pickup marker (green pin 📍) at pickup location
- ✅ Yellow route line connecting driver to pickup
- ✅ Top card shows:
  - Status: "🚗 Going to Pickup"
  - Address: "Bandra West, Mumbai..."
  - Navigation button: 🧭
- ✅ Bottom card shows:
  - Customer avatar and name
  - Phone number
  - Call button 📞
  - Trip stats (distance, duration, earning)
  - "Start Trip" button (enabled)

### Step 4.2: Test Navigation Features

1. **Open in Maps**
   - Click 🧭 button in top card
   - ✅ Should open Google Maps (Android) or Apple Maps (iOS)
   - ✅ Should show route to pickup location

2. **Call Customer**
   - Click 📞 button
   - ✅ Should open phone dialer with customer's number

3. **View Trip Details**
   - Click "View Full Details"
   - ✅ Should show modal with:
     - Pickup address and landmark
     - Dropoff address and landmark
     - Special requirements chips
     - Notes: "Please handle boxes carefully"
   - Click "Close"
   - ✅ Modal should dismiss

4. **Center on Location**
   - Move map around
   - Click FAB button (crosshairs icon) on right side
   - ✅ Map should animate back to driver location

### Step 4.3: Verify Location Tracking

**Driver App:**
- ✅ Driver marker should update every 5 seconds
- ✅ Driver marker should rotate based on heading (if moving)
- ✅ Route line should update as driver moves

**Backend Logs:**
```
✅ Updated location for driver 67xxx: [19.0612, 72.8301]
✅ Updated location for driver 67xxx: [19.0628, 72.8307]
... (every 5 seconds)
```

**Customer Side (If Testing):**
- Customer should receive Socket.IO events: `driver:location_update`
- Location payload should include lat, lng, heading

### Step 4.4: Start Trip

1. **Drive to Pickup** (or simulate by manually moving on map)
   - You can use Android Studio's location simulation
   - Or physically move if testing on device

2. **Click "Start Trip" Button**
   - ✅ Should see confirmation dialog: "Have you picked up the customer and ready to start?"

3. **Click "Start Trip" in Dialog**
   - ✅ Should show loading spinner
   - ✅ Should see "Trip Started" toast
   - ✅ Top card should change to: "🏁 Going to Destination"
   - ✅ Map should switch to show dropoff marker
   - ✅ Route line should now connect driver to dropoff
   - ✅ Button should change to "Complete Trip"

4. **Verify Backend**
   ```
   POST /api/driver/bookings/67yyy/start - 200
   ✅ Trip started for booking 67yyy
   ```

**✅ Test 4 PASSED** if navigation and trip start work

---

## Test Scenario 5: Complete Trip & Earnings

### Step 5.1: Navigate to Dropoff

**On Map:**
- ✅ Dropoff marker (red square 🏁) visible
- ✅ Yellow route line to dropoff
- ✅ Driver marker updating every 5 seconds
- ✅ Top card: "🏁 Going to Destination"

### Step 5.2: Complete Trip

1. **Drive to Dropoff** (or simulate)

2. **Click "Complete Trip" Button**
   - ✅ Should see confirmation dialog: "Have you reached the destination?"

3. **Click "Complete" in Dialog**
   - ✅ Should show loading spinner
   - ✅ Should see success alert: "Trip Completed! 🎉"
   - ✅ Alert message: "You earned ₹XXX"
   - ✅ Click "OK"

4. **Verify Navigation**
   - ✅ Should navigate back to Home Screen
   - ✅ Should see Job Feed again
   - ✅ Driver should be online and available
   - ✅ Toggle should still be ON

### Step 5.3: Verify Earnings Update

**Backend Request:**
```bash
GET http://localhost:5000/api/driver/earnings
Authorization: Bearer <driver_access_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "earnings": {
      "total": 160,     // If fare was 200, driver gets 80%
      "pending": 160,
      "withdrawn": 0
    },
    "recentBookings": [ ... ]
  }
}
```

### Step 5.4: Verify Database Updates

```bash
# MongoDB
use porter;
db.bookings.findOne({ _id: ObjectId("67yyy") });
# Should show:
# - status: "completed"
# - driverAssignment.completedAt: <timestamp>

db.users.findOne({ _id: ObjectId("<driverId>") });
# Should show:
# - driverProfile.earnings.total: 160
# - driverProfile.earnings.pending: 160
# - driverProfile.isAvailable: true
```

**✅ Test 5 PASSED** if trip completes and earnings calculated

---

## Test Scenario 6: Reject Booking

### Step 6.1: Create Another Booking

Use same API call from Test 3.1 to create new booking

### Step 6.2: Verify Notification

- ✅ New booking card appears in Job Feed

### Step 6.3: Reject Booking

1. **Click "Reject" Button**
   - ✅ Should immediately remove booking card
   - ✅ Should see "Booking Rejected" toast

2. **Verify Backend**
   ```bash
   POST /api/driver/bookings/67zzz/reject - 200
   ```

3. **Verify Database**
   - Booking should still exist with status "searching"
   - Driver ID should be removed from `notifiedDrivers` array

**✅ Test 6 PASSED** if rejection works

---

## Test Scenario 7: Offline Mode

### Step 7.1: Go Offline

1. **Toggle Switch to OFF**
   - ✅ Should see "You are now Offline" toast
   - ✅ Should see offline empty state with 😴
   - ✅ Job feed should disappear
   - ✅ Socket.IO should disconnect

2. **Verify Backend**
   ```bash
   POST /api/driver/availability { isAvailable: false }
   ```

3. **Create New Booking**
   - Create booking via API
   - ✅ Driver should NOT receive notification
   - ✅ No card should appear

### Step 7.2: Go Back Online

1. **Toggle Switch to ON**
   - ✅ Should connect Socket.IO
   - ✅ Should start location tracking
   - ✅ Job feed should appear

**✅ Test 7 PASSED** if online/offline toggle works

---

## Test Scenario 8: Persistent State

### Step 8.1: Kill and Restart App

1. **Force close app** (swipe away from recent apps)
2. **Reopen app**
   - ✅ Should auto-login (no login screen)
   - ✅ Should remember online/offline state
   - ✅ Should reconnect Socket.IO if was online

### Step 8.2: Logout and Login Again

1. **Open Profile Menu**
   - Click profile icon in top right
   - ✅ Should see profile modal

2. **Click "Logout"**
   - ✅ Should see confirmation: "Are you sure you want to logout?"
   - Click "Logout"
   - ✅ Should disconnect Socket.IO
   - ✅ Should navigate to Login Screen

3. **Login Again**
   - Enter phone and OTP
   - ✅ Should login successfully
   - ✅ Should go to Home Screen
   - ✅ Should be offline by default

**✅ Test 8 PASSED** if state persists correctly

---

## Test Scenario 9: Error Handling

### Step 9.1: Network Errors

1. **Enable Airplane Mode** (while online)
   - ✅ Socket.IO should disconnect
   - ✅ Should see "Connecting..." status
   - ✅ Location updates should fail silently

2. **Disable Airplane Mode**
   - ✅ Socket.IO should reconnect automatically
   - ✅ Should see "Ready" status again
   - ✅ Location updates should resume

### Step 9.2: Backend Errors

1. **Stop Backend Server**
2. **Try to Accept Booking**
   - ✅ Should show error toast: "Failed to accept booking"

3. **Restart Backend**
4. **Try Again**
   - ✅ Should work normally

### Step 9.3: Invalid Data

1. **Try to login with invalid OTP**
   - Enter wrong OTP
   - ✅ Should show error: "Invalid OTP"
   - ✅ Should clear OTP fields
   - ✅ Should focus first field

**✅ Test 9 PASSED** if errors handled gracefully

---

## Performance Benchmarks

### Expected Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| App Launch Time | < 2s | Time from tap to Home Screen |
| Login Flow | < 5s | Phone input → OTP → Home |
| Location Update | 5-10s | Check backend logs interval |
| Booking Notification | < 100ms | Time from API call to card appearance |
| Map Render | < 1s | Time to fully render Active Trip map |
| Accept Booking | < 500ms | Click to navigation |
| Socket.IO Latency | < 50ms | Check Network tab in DevTools |

### How to Measure

1. **App Launch Time**
   ```
   - Force close app
   - Start stopwatch
   - Open app
   - Stop when Home Screen visible
   ```

2. **Booking Notification Latency**
   ```
   - Start stopwatch
   - Make API call to create booking
   - Stop when card appears in app
   ```

3. **Socket.IO Latency**
   ```
   - Open React Native Debugger
   - Watch Network → WebSocket
   - Check message timestamps
   ```

---

## Common Issues & Solutions

### Issue 1: No Booking Notifications

**Symptoms:**
- Created booking but driver doesn't receive notification

**Troubleshooting:**
1. Check if driver is online (toggle ON)
2. Check Socket.IO connection status (should be "Ready")
3. Verify driver is within 10km of pickup
4. Check backend logs for "Notified X drivers"
5. Verify booking status is "searching"
6. Check Redis: `SMEMBERS driver:available` includes driverId

### Issue 2: Location Not Updating

**Symptoms:**
- Driver marker stays at same position

**Troubleshooting:**
1. Check location permissions granted
2. Verify GPS is enabled on device
3. Check backend logs for location updates
4. Try restarting location tracking (toggle offline/online)
5. On emulator, manually send location via Android Studio

### Issue 3: Map Not Loading

**Symptoms:**
- Blank screen on Active Trip

**Troubleshooting:**
1. Check Google Maps API key (if using production)
2. Verify react-native-maps installed
3. Check booking data has valid coordinates
4. Look for console errors in debugger

### Issue 4: Socket.IO Won't Connect

**Symptoms:**
- Status always shows "Connecting..."

**Troubleshooting:**
1. Check backend is running
2. Verify EXPO_PUBLIC_API_URL is correct
3. Check firewall isn't blocking WebSocket
4. Verify backend Socket.IO is initialized
5. Check backend logs for connection attempts

### Issue 5: OTP Not Received

**Symptoms:**
- "Send OTP" works but no OTP in logs

**Troubleshooting:**
1. Check backend logs (OTP should be printed)
2. Verify Twilio credentials in .env
3. For development, use console OTP
4. Check phone number format (+91XXXXXXXXXX)

---

## ✅ Final Checklist

### Before Demo

- [ ] Backend running without errors
- [ ] Redis running and accessible
- [ ] MongoDB connected
- [ ] Driver account registered
- [ ] Customer account registered
- [ ] .env files configured
- [ ] Location permissions granted
- [ ] Network stable
- [ ] Battery sufficient (if physical device)

### Demo Script

1. [ ] Login as driver
2. [ ] Go online (show location tracking)
3. [ ] Create booking (show auto-match)
4. [ ] Accept booking (show navigation)
5. [ ] Start trip (show tracking)
6. [ ] Complete trip (show earnings)
7. [ ] Show earnings dashboard

### Success Criteria

- [ ] Complete flow works end-to-end
- [ ] No crashes or freezes
- [ ] Notifications appear < 2 seconds
- [ ] Location updates smooth
- [ ] Earnings calculated correctly
- [ ] UI responsive and smooth

---

## 🎯 Next Steps After Testing

1. **Fix Any Issues Found**
   - Document bugs
   - Prioritize by severity
   - Fix critical issues first

2. **Gather Metrics**
   - Record performance benchmarks
   - Note any slowdowns
   - Check memory usage

3. **User Feedback**
   - Note confusing UI elements
   - Identify missing features
   - Collect improvement ideas

4. **Prepare for Production**
   - Set up proper API keys
   - Configure production URLs
   - Enable error tracking (Sentry)
   - Set up analytics (Mixpanel)
   - Add push notifications

---

**Happy Testing! 🚀**
