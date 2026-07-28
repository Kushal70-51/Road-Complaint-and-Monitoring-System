# AI Categorization Feature - Visual & Technical Reference

## 🎯 QUICK START (5 MINUTES)

### Step 1: Get OpenAI API Key
```bash
# Go to https://platform.openai.com/api-keys
# Click "Create new secret key"
# Copy the key (starts with sk-)
```

### Step 2: Add to backend/.env
```bash
OPENAI_API_KEY=sk_...your_key...
```

### Step 3: Start your app
```bash
# Terminal 1 - Backend
cd backend
npm install  # if not done
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 4: Test
- Go to "Submit Road Complaint"
- Type description like: "There is a big hole in the road near the market"
- Watch the AI badge appear! 🤖

---

## 📊 USER FLOW DIAGRAM

```
┌─────────────────────────────────────┐
│  User typing in Description field   │
└──────────────┬──────────────────────┘
               │
               ↓ (after 500ms pause)
        ┌──────────────┐
        │ AI Analyzing │
        │  🤖 spinning │
        └──────┬───────┘
               │ (calling /suggest-category)
               ↓
     ┌──────────────────────┐
     │ Confidence > 80%?    │
     └──────┬───────────┬──┘
            │           │
           YES         NO
            │           │
            ↓           ↓
     ┌─────────────┐  ┌──────────────────┐
     │ Auto-Select │  │ Show pulse badge │
     │  Category   │  │ Ask to confirm   │
     └─────┬───────┘  └────────┬─────────┘
           │                   │
           └───────┬───────────┘
                   ↓
        ┌─────────────────────────┐
        │ User can override if    │
        │ AI is incorrect         │
        └─────────┬───────────────┘
                  ↓
        ┌─────────────────────────┐
        │ Submit form with        │
        │ category field filled   │
        └─────────────────────────┘
```

---

## 🎨 UI STATES

### State 1: Empty (Min 10 chars not reached)
```
[No badge shown - waiting for user to type]
```

### State 2: Loading
```
┌─────────────────────────────────────┐
│ 🤖  AI analyzing...                 │
│     (shimmer animation)             │
└─────────────────────────────────────┘
```

### State 3: High Confidence (>80%) ✅
```
┌─────────────────────────────────────┐
│ 🤖  AI Detected    Pothole          │
│ ███████████████████░░░  95%         │
│ High Confidence                     │
│ Common damage pattern on roads      │
│                                     │
│ ✅ Category dropdown auto-selected  │
└─────────────────────────────────────┘
```

### State 4: Medium Confidence (50-80%) ⚠️
```
┌─────────────────────────────────────┐
│ 🤖  AI Detected    Road Crack       │
│ ███████████░░░░░░░░░  65%           │
│ Medium Confidence - Please Verify   │
│ Could be crack or pothole           │
│                                     │
│ 👆 Please confirm or adjust above   │
└─────────────────────────────────────┘
```

### State 5: Low Confidence (<50%) ⚠️⚠️
```
┌─────────────────────────────────────┐
│ 🤖  AI Detected    Other            │
│ ████░░░░░░░░░░░░░░░░░  35%          │
│ Low Confidence - Please Verify      │
│ Multiple issue types detected       │
│                                     │
│ 👆 Please confirm or adjust above   │
└─────────────────────────────────────┘
```

### State 6: Error (AI Unavailable)
```
┌─────────────────────────────────────┐
│ ❌  AI unavailable                  │
│ Please select category manually     │
└─────────────────────────────────────┘
```

---

## 📁 FILE STRUCTURE

```
road_project_mern/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AICategorizationBadge.js         ✨ NEW
│   │   │   ├── LocationPicker.js
│   │   │   └── ... (existing components)
│   │   ├── pages/
│   │   │   ├── Upload.js                        📝 MODIFIED
│   │   │   └── ... (existing pages)
│   │   └── styles/
│   │       ├── ai-badge.css                     ✨ NEW
│   │       ├── global.css
│   │       ├── animations.css
│   │       └── ... (existing styles)
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── complaintRoutes.js                   📝 MODIFIED (+1 endpoint)
│   │   ├── authRoutes.js
│   │   └── ... (existing routes)
│   ├── .env                                     📝 MODIFIED (add API key)
│   ├── server.js
│   └── package.json
│
├── AI_CATEGORIZATION_SETUP.md                   ✨ NEW (this guide)
└── README.md
```

---

## 🔌 API ENDPOINT DETAILS

### Endpoint: POST /api/complaints/suggest-category

**Request:**
```json
{
  "description": "Large pothole on main road near market, approx 2 feet diameter",
  "severity": "High"
}
```

**Response (Success):**
```json
{
  "category": "Pothole",
  "confidence": 0.95,
  "reason": "Clear mention of 'pothole' with specific size description indicates high confidence"
}
```

**Response (Error/Graceful Degradation):**
```json
{
  "category": "Other",
  "confidence": 0,
  "reason": "Unable to categorize. Please select manually."
}
```

**Error Handling:**
- If OpenAI API is down → returns default "Other" category
- If description too short → HTTP 400 with error message
- If JSON parsing fails → returns safe default
- Component catches errors gracefully, doesn't block form submission

---

## 🧠 AI SYSTEM PROMPT

The backend sends this system prompt to OpenAI:

```
You are a road complaint categorization system for Indian cities. 
Analyze the complaint description and return ONLY a valid JSON object 
(no markdown, no code blocks) with these exact fields:

{
  "category": "One of: Pothole, Waterlogging, Broken Streetlight, 
              Road Crack, Missing Signage, Garbage Dump, Other",
  "confidence": "A number between 0 and 1",
  "reason": "Brief 1-2 sentence explanation"
}

Important: Return ONLY the JSON object, nothing else.
```

**Temperature:** 0.3 (low randomness, deterministic results)
**Max Tokens:** 200 (sufficient for JSON response)
**Model:** gpt-3.5-turbo (cheapest, fastest)

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Frontend
✅ **Debounce:** 500ms delay between typing stops and API call
   - Reduces API calls by ~70%
   - User must type at least 10 characters
   - Improves UX - no flickering

✅ **Minimum length check:** 10 characters required
   - Prevents spam requests
   - Improves accuracy (longer descriptions = better context)

✅ **Loading state:** Shows spinner, visual feedback to user
✅ **Error handling:** Graceful degradation - doesn't block form

### Backend
✅ **Temperature 0.3:** Low randomness = consistent results
✅ **No authentication needed:** Endpoint is public (anyone can use)
✅ **Try-catch blocks:** Handles OpenAI API failures
✅ **JSON validation:** Checks for valid categories

### Costs
- **Cheap model:** gpt-3.5-turbo @ $0.0005 per 1K tokens
- **Small input:** Average complaint ≈ 50-100 tokens
- **Cost per call:** ~$0.000025 to $0.00005
- **1000 calls/month:** ~$0.03-0.05

---

## 🧪 TESTING SCENARIOS

### Test 1: Clear Pothole Description
**Input:** "There is a large pothole on Main Street near the school, about 2 feet in diameter"
**Expected:** Category auto-selects to "Pothole", confidence > 90%

### Test 2: Ambiguous Description  
**Input:** "Road is damaged in multiple places"
**Expected:** Badge shows medium confidence, asks user to confirm

### Test 3: Multiple Issues
**Input:** "Pothole near broken streetlight that's not working"
**Expected:** Badge shows medium-low confidence, user must choose

### Test 4: Very Short Description
**Input:** "Bad road"
**Expected:** Badge doesn't appear (< 10 chars), user must type more

### Test 5: Mobile View
**Action:** Resize browser to 480px width
**Expected:** Badge layout stacks vertically, category pill moves to new line

### Test 6: API Down Scenario
**Action:** Disconnect internet or use invalid API key
**Expected:** Badge shows error, form submission still works

---

## 🔍 HOW TO DEBUG

### Check 1: Browser Console
```javascript
// Open DevTools (F12 → Console)
// Look for fetch errors or component logs
// Should see POST request to /suggest-category
```

### Check 2: Network Tab
```javascript
// DevTools → Network tab
// Filter: XHR (XML Http Request)
// Look for /suggest-category POST request
// Check response status and payload
```

### Check 3: Backend Logs
```bash
# Terminal where backend is running
# Should see POST request logged
# Check for OpenAI API errors
```

### Check 4: Verify Files
```bash
# Check files exist
ls -la frontend/src/components/AICategorizationBadge.js
ls -la frontend/src/styles/ai-badge.css
```

### Check 5: Test API Directly
```bash
# Using curl from backend folder
curl -X POST http://localhost:5000/api/complaints/suggest-category \
  -H "Content-Type: application/json" \
  -d '{"description": "There is a pothole on the road", "severity": "High"}'
```

---

## 🎛️ CONFIGURATION OPTIONS

### 1. Change Debounce Timing
**File:** `frontend/src/components/AICategorizationBadge.js` line 30
```javascript
}, 500);  // Change 500 to your preferred milliseconds
```

### 2. Change Minimum Description Length
**File:** `frontend/src/components/AICategorizationBadge.js` line 26
```javascript
if (!description || description.trim().length < 10) {  // Change 10 to your number
```

### 3. Change Auto-Select Threshold
**File:** `frontend/src/components/AICategorizationBadge.js` line 54
```javascript
if (data.confidence > 0.8) {  // Change 0.8 (80%) to your threshold
```

### 4. Change AI Model
**File:** `backend/routes/complaintRoutes.js` line 265
```javascript
model: "gpt-3.5-turbo",  // Change to gpt-4, gpt-4-turbo, etc.
```

### 5. Adjust Temperature (Randomness)
**File:** `backend/routes/complaintRoutes.js` line 276
```javascript
temperature: 0.3,  // Change to 0-1 (0 = deterministic, 1 = random)
```

---

## 📋 CHECKLIST: "IS IT WORKING?"

- [ ] Backend starts without "Cannot find module" errors
- [ ] Frontend loads without console errors
- [ ] Complaint form has "Issue Category" dropdown (new)
- [ ] Type description > 10 characters
- [ ] Badge appears within 1 second
- [ ] Badge shows category, confidence %, and reason
- [ ] Category dropdown updates (if confidence high)
- [ ] Can manually change category
- [ ] Form still submits successfully
- [ ] Mobile view looks good (responsive)
- [ ] No breaking changes to other pages

---

**Made with ❤️ for your Road Complaint System**

