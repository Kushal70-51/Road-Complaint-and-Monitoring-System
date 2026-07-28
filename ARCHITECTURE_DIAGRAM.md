# 🏗️ AI CATEGORIZATION - ARCHITECTURE & COMPONENT DIAGRAM

## 🎯 COMPONENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        Upload Page                              │
│                    (frontend/pages/Upload.js)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Form Component                         │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Photo Input                                      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Location Input                                   │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Location Map Picker                              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Description Textarea                             │   │  │
│  │  │  (onChange: handleInputChange → formData.desc)   │   │  │
│  │  └──────────┬───────────────────────────────────────┘   │  │
│  │             │ pass description prop                      │  │
│  │             ↓                                            │  │
│  │  ╔══════════════════════════════════════════════════╗   │  │
│  │  ║    AICategorizationBadge Component      ✨ NEW  ║   │  │
│  │  ║                                                  ║   │  │
│  │  ║  Props:                                         ║   │  │
│  │  ║  - description (from textarea)                  ║   │  │
│  │  ║  - severity (from state)                        ║   │  │
│  │  ║  - onCategoryDetected (callback)                ║   │  │
│  │  ║                                                  ║   │  │
│  │  ║  State:                                         ║   │  │
│  │  ║  - aiSuggestion (category data)                ║   │  │
│  │  ║  - loading (boolean)                            ║   │  │
│  │  ║  - error (error message)                        ║   │  │
│  │  ║                                                  ║   │  │
│  │  ║  Render:                                        ║   │  │
│  │  ║  - Loading state (shimmer)                      ║   │  │
│  │  ║  - Error state (red badge)                      ║   │  │
│  │  ║  - Success state (colored badge)                ║   │  │
│  │  ╚═══════════┬════════════════════════════════════╝   │  │
│  │             │ calls onCategoryDetected()              │  │
│  │             ↓                                          │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Category Dropdown  ✨ NEW                        │ │  │
│  │  │ - Updates from: handleCategoryDetected()         │ │  │
│  │  │ - User can override                              │ │  │
│  │  │ - Selected value in formData.category            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Severity Dropdown                                │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ Submit Button                                    │ │  │
│  │  │ - Sends formData (including category)            │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 STATE FLOW

```
┌──────────────────────────────────────────────────────────┐
│             Upload Component State                       │
│                                                          │
│  formData: {                                            │
│    image: File,                                         │
│    location: string,                                    │
│    description: string,                                 │
│    category: 'Pothole' | 'Waterlogging' | ... ← NEW    │
│    severity: 'Low' | 'Medium' | 'High' | 'Critical',   │
│    lat: string,                                         │
│    lng: string,                                         │
│    path: Array,                                         │
│    routePath: Array                                     │
│  }                                                       │
│                                                          │
│  handleCategoryDetected(category):                       │
│    → setFormData(prev => ({ ...prev, category }))        │
│    → Updates dropdown value                              │
│    → Sends with form on submit                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📡 API FLOW

```
FRONTEND                           BACKEND                    AI API
┌──────────────────┐        ┌──────────────────┐      ┌──────────────┐
│   Upload Page    │        │  Express Route   │      │  OpenAI      │
│                  │        │                  │      │  GPT-3.5     │
│ User types desc  │        │                  │      │              │
│      ↓           │        │                  │      │              │
│ 500ms debounce   │        │                  │      │              │
│      ↓           │        │                  │      │              │
│ Badge shows load │        │                  │      │              │
│      │           │        │                  │      │              │
│      │ POST      │        │                  │      │              │
│      ├──────────→│        │                  │      │              │
│      │  /suggest-│        │                  │      │              │
│      │  category │        │                  │      │              │
│      │           │        │ Parse request    │      │              │
│      │           │        │      ↓           │      │              │
│      │           │        │ Validate desc    │      │              │
│      │           │        │      ↓           │      │              │
│      │           │        │ Build prompt     │      │              │
│      │           │        │      │           │      │              │
│      │           │        │      │ POST      │      │              │
│      │           │        │      ├──────────→│      │              │
│      │           │        │      │ Request   │      │              │
│      │           │        │      │           │  Process description
│      │           │        │      │           │ ←─ Return JSON     │
│      │           │        │      │ Response  │      │              │
│      │           │        │      ↓           │      │              │
│      │           │        │ Parse JSON       │      │              │
│      │           │        │ Validate cat.    │      │              │
│      │  Response │        │ Bound confidence │      │              │
│      │←──────────┤        │      ↓           │      │              │
│ Update badge     │        │ Send response    │      │              │
│ Show category    │        │      ↓           │      │              │
│ Auto-select (if) │        │      ├──────────→      │              │
│      ↓           │        │      │           │      │              │
│ onCategoryDet()  │        │                  │      │              │
│      ↓           │        │                  │      │              │
│ Update form      │        │                  │      │              │
│ state.category   │        │                  │      │              │
└──────────────────┘        └──────────────────┘      └──────────────┘
```

---

## 🎨 UI STATE MACHINE

```
                    ┌─────────────────────┐
                    │   Initial State     │
                    │   (No badge)        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ User types (10+ ch) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Debounce 500ms      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
        ┌──────────→│ LOADING STATE       │◄──────────┐
        │           │ Shimmer animation   │           │
        │           │ "AI analyzing..."   │           │
        │           └──────────┬──────────┘           │
        │                      │                      │
        │          ┌───────────┴───────────┐          │
        │          │                       │          │
        │  ┌───────▼───────┐      ┌───────▼──────┐   │
        │  │ API SUCCESS   │      │ API FAILURE  │   │
        │  └───────┬───────┘      └───────┬──────┘   │
        │          │                      │          │
        │  ┌───────▼─────────────────────▼─────┐    │
        │  │  Parse Response & Confidence      │    │
        │  └───────┬─────────────────────────  ┘    │
        │          │                                │
        │  ┌───────▼────────────────────────────┐   │
        │  │ Check Confidence Level             │   │
        │  └─┬─────────────────────────────┬───┘   │
        │    │                             │        │
        │  >80%                          <80%      │
        │    │                             │        │
        │  ┌─▼──────────┐           ┌────▼──────┐  │
        │  │ HIGH CONF  │           │ LOW CONF  │  │
        │  │ Green badge│           │ Pulse anim│  │
        │  │ Auto-select│           │ Ask verify│  │
        │  └────────────┘           └───────────┘  │
        │                                           │
        └───────────────┬──────────────────────────┘
                        │
                        ↓
                   ┌─────────────┐
                   │ SUCCESS     │
                   │ STATE       │
                   │             │
                   │ User sees:  │
                   │ - Category  │
                   │ - Conf %    │
                   │ - Reason    │
                   └────────────┘
```

---

## 📊 DATA STRUCTURES

### Request Format
```javascript
POST /api/complaints/suggest-category

{
  "description": "There is a large pothole on Main Street",
  "severity": "High"
}
```

### Response Format (Success)
```javascript
{
  "category": "Pothole",
  "confidence": 0.95,
  "reason": "Clear mention of 'pothole' with location context"
}
```

### Response Format (Error/Fallback)
```javascript
{
  "category": "Other",
  "confidence": 0,
  "reason": "Unable to categorize. Please select manually."
}
```

### Component Props
```javascript
<AICategorizationBadge
  description={string}              // Min 10 chars
  severity={string}                 // 'Low'|'Medium'|'High'|'Critical'
  onCategoryDetected={(cat) => {}}   // Callback when AI suggests
/>
```

### Component Internal State
```javascript
{
  aiSuggestion: {
    category: string,
    confidence: number (0-1),
    reason: string
  },
  loading: boolean,
  error: string | null
}
```

---

## 🧮 RENDERING LOGIC

```
┌─────────────────────────────────────────────────┐
│  AICategorizationBadge Render Logic             │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────▼──────────────┐
    │ Description too short?  │
    │ (< 10 chars or empty)   │
    └──────┬───────────┬──────┘
           │           │
         YES          NO
           │           │
     ┌─────▼──┐   ┌────▼──────────┐
     │ Return │   │ Is loading?    │
     │ null   │   └─┬──────────┬───┘
     │ (hide) │     │          │
     └────────┘    YES        NO
                    │          │
              ┌─────▼──┐  ┌────▼────────┐
              │Loading │  │ Has error?  │
              │Badge   │  └─┬──────┬────┘
              └────────┘    │      │
                           YES     NO
                            │      │
                      ┌─────▼──┐ ┌▼─────────────┐
                      │ Error  │ │ Has AI Sugg? │
                      │ Badge  │ └─┬──────┬─────┘
                      └────────┘   │      │
                                  YES     NO
                                   │      │
                            ┌──────▼──┐ ┌▼──────┐
                            │Success  │ │Return │
                            │Badge    │ │null   │
                            │(colored)│ │(hide) │
                            └─────────┘ └───────┘
```

---

## 🔌 EVENT FLOW

```
User Action                         Component State           Form State
─────────────                       ──────────────             ──────────

User types in description
         ↓
onChange event fired
         ↓
handleInputChange()
         ↓
setFormData({ description: ... })
         ↓
Component re-renders
         ↓
AICategorizationBadge receives new prop
         ↓
useEffect triggered (description changed)
         ↓
Clear previous debounce timer
         ↓
Set new debounce timer (500ms)
         ↓
[Wait for user to stop typing]
         ↓
Debounce timer expires
         ↓
setLoading(true)
         ↓
Fetch POST /suggest-category
         ↓
[Waiting for API response]
         ↓
Response received
         ↓
Parse JSON response
         ↓
Check confidence > 0.8
  ├─ YES → Call onCategoryDetected(category)
  └─ NO  → Show badge, let user choose
         ↓
setAiSuggestion(data)
setLoading(false)
         ↓
Badge renders with suggestion
         ↓
Parent receives onCategoryDetected callback
         ↓
handleCategoryDetected called in Upload.js
         ↓
setFormData({ category: suggestedCategory })
         ↓
Category dropdown value updates
         ↓
User sees category auto-selected
```

---

## 📦 COMPONENT SIZE IMPACT

```
Bundle Size Before:  ~350KB (gzipped)
                     ↓
Add AICategorizationBadge.js  +2KB
Add ai-badge.css              +1KB
                     ↓
Bundle Size After:   ~353KB (gzipped)

Impact: < 1% increase
```

---

## ⚡ PERFORMANCE CHARACTERISTICS

```
Timeline                    Event
────────────────────────────────────────
0ms                    User starts typing
500ms                  Debounce delay (waiting for user)
500ms                  User stops typing
~600ms                 Badge shows "Loading"
~1500-2000ms           OpenAI API responds
~2100ms                Badge shows suggestion
~2150ms                Category dropdown updates (if >80%)
~2200ms                User can see and interact
```

---

## 🔐 Security Boundaries

```
┌───────────────────────────────────────────────┐
│  Frontend (Public - Browser Code)             │
├───────────────────────────────────────────────┤
│                                               │
│  AICategorizationBadge.js                    │
│  - NO API keys                               │
│  - NO sensitive data                         │
│  - Makes fetch to /suggest-category          │
│  - Handles responses safely                  │
│                                               │
│  (API key CANNOT be in frontend code)        │
└────────────────────┬──────────────────────────┘
                     │
                    CORS
                     │
┌────────────────────▼──────────────────────────┐
│  Backend (Secure - Server Code)               │
├───────────────────────────────────────────────┤
│                                               │
│  complaintRoutes.js /suggest-category         │
│  - HAS OPENAI_API_KEY (in .env)              │
│  - Validates input                           │
│  - Makes authorized call to OpenAI           │
│  - Returns sanitized response                │
│  - Error handling                            │
│                                               │
└────────────────────┬──────────────────────────┘
                     │
              HTTPS/HTTPS
                     │
┌────────────────────▼──────────────────────────┐
│  OpenAI API (External Service)                │
├───────────────────────────────────────────────┤
│  - Processes complaint text                  │
│  - Returns categorization                    │
│  - Follows OpenAI privacy policy             │
└────────────────────────────────────────────────┘
```

---

## 🎯 INTEGRATION POINTS

```
Upload.js (Main Component)
├── Imports AICategorizationBadge
├── Passes props: description, severity, onCategoryDetected
├── Receives callback: onCategoryDetected(category)
├── Updates formData.category
├── Sends category with form submission
└── Backend receives in POST /upload

Backend /upload Endpoint
├── Receives complaint with category field
├── Saves to MongoDB
├── Category becomes part of complaint record
└── Available in dashboard, reports, analytics
```

---

**This architecture ensures clean separation of concerns, easy maintenance, and optimal performance!**

