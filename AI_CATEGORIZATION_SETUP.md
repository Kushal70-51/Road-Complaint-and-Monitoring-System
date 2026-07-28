# AI-Powered Complaint Categorization - Integration Guide

## 📋 SUMMARY
This guide walks you through integrating the AI complaint categorization feature into your Road Complaint System. The feature automatically suggests complaint categories using OpenAI's GPT-3.5-turbo model with a beautiful, responsive UI component.

---

## 🎯 WHAT WAS CREATED

### 1. **Frontend Components**
- ✅ `AICategorizationBadge.js` - Intelligent badge component showing AI suggestions
- ✅ `ai-badge.css` - Beautiful styling matching your design system
- ✅ Updated `Upload.js` - Integrated AI badge into complaint form

### 2. **Backend Endpoint**
- ✅ `POST /api/complaints/suggest-category` - OpenAI integration endpoint

### 3. **Styling**
- Uses existing CSS variables from `global.css`
- Responsive design (mobile, tablet, desktop)
- Smooth animations from `animations.css`

---

## 🚀 SETUP STEPS

### Step 1: Get OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (you'll need it in next step)

### Step 2: Add API Key to Backend Environment
Edit `backend/.env` and add:
```
OPENAI_API_KEY=sk-xxx...xxxxx
```

**⚠️ SECURITY WARNING:**
- Never commit `.env` to GitHub
- Your `.gitignore` should already have `.env` listed
- If accidentally committed, regenerate the API key immediately at OpenAI dashboard

### Step 3: Verify Frontend API URL (Optional)
If your frontend and backend are on different URLs, ensure this in your frontend code:

The component uses: `process.env.REACT_APP_API_URL || 'http://localhost:5000'`

If needed, add to `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000
```
OR for production:
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Step 4: Import CSS in App.js
Make sure `ai-badge.css` is imported in your main App.js:

Already added in the component, but verify this exists in `frontend/src/App.js`:
```javascript
import './styles/ai-badge.css';
```

### Step 5: Test the Feature
1. Start backend: `npm start` (in `backend/` folder)
2. Start frontend: `npm start` (in `frontend/` folder)
3. Go to "Submit Road Complaint" page
4. Type in description field
5. After 500ms, AI badge should appear below description
6. Check category dropdown - should be auto-selected if confidence > 80%

---

## 📁 FILES CREATED/MODIFIED

### **Created Files:**
```
frontend/src/components/AICategorizationBadge.js    (NEW)
frontend/src/styles/ai-badge.css                   (NEW)
```

### **Modified Files:**
```
frontend/src/pages/Upload.js                       (MODIFIED - 3 changes)
backend/routes/complaintRoutes.js                  (MODIFIED - 1 endpoint added)
backend/.env                                        (MODIFIED - add OPENAI_API_KEY)
```

---

## 🔧 EXACT CODE CHANGES

### Change 1: Import AICategorizationBadge in Upload.js
**File:** `frontend/src/pages/Upload.js`
**Line:** After line 6
```javascript
import AICategorizationBadge from '../components/AICategorizationBadge';
```

### Change 2: Add category to formData state
**File:** `frontend/src/pages/Upload.js`
**Line:** ~11-20
```javascript
const [formData, setFormData] = useState({
  image: null,
  location: '',
  description: '',
  category: 'Other',  // ← ADDED THIS LINE
  severity: 'Medium',
  lat: '',
  lng: '',
  path: [],
  routePath: []
});
```

### Change 3: Add handler function
**File:** `frontend/src/pages/Upload.js`
**After Line:** 83 (after handleRouteChange function)
```javascript
const handleCategoryDetected = (category) => {
  setFormData(prev => ({ ...prev, category }));
};
```

### Change 4: Send category in form submission
**File:** `frontend/src/pages/Upload.js`
**Line:** ~105-120
```javascript
const data = new FormData();
data.append('image', formData.image);
data.append('location', formData.location);
data.append('description', formData.description);
data.append('category', formData.category);  // ← ADDED THIS LINE
data.append('severity', formData.severity);
// ... rest of code
```

### Change 5: Add AI Badge and Category Dropdown to JSX
**File:** `frontend/src/pages/Upload.js`
**Location:** Between description textarea and severity select (around line 182-205)

**REMOVE THIS:**
```javascript
<div className="form-group">
  <label>Severity Level *</label>
  <select
    name="severity"
    value={formData.severity}
    onChange={handleInputChange}
  >
    <option value="Low">Low - Minor damage, no safety risk</option>
    <option value="Medium">Medium - Noticeable damage, slight safety concern</option>
    <option value="High">High - Severe damage, significant safety risk</option>
    <option value="Critical">Critical - Extremely hazardous</option>
  </select>
</div>
```

**REPLACE WITH THIS:**
```javascript
<AICategorizationBadge 
  description={formData.description}
  severity={formData.severity}
  onCategoryDetected={handleCategoryDetected}
/>

<div className="form-group">
  <label>Issue Category *</label>
  <select
    name="category"
    value={formData.category}
    onChange={handleInputChange}
  >
    <option value="Other">Other</option>
    <option value="Pothole">Pothole</option>
    <option value="Waterlogging">Waterlogging</option>
    <option value="Broken Streetlight">Broken Streetlight</option>
    <option value="Road Crack">Road Crack</option>
    <option value="Missing Signage">Missing Signage</option>
    <option value="Garbage Dump">Garbage Dump</option>
  </select>
  {errors.category && <span className="error">{errors.category}</span>}
</div>

<div className="form-group">
  <label>Severity Level *</label>
  <select
    name="severity"
    value={formData.severity}
    onChange={handleInputChange}
  >
    <option value="Low">Low - Minor damage, no safety risk</option>
    <option value="Medium">Medium - Noticeable damage, slight safety concern</option>
    <option value="High">High - Severe damage, significant safety risk</option>
    <option value="Critical">Critical - Extremely hazardous</option>
  </select>
</div>
```

### Change 6: Backend - Add suggest-category endpoint
**File:** `backend/routes/complaintRoutes.js`
**Location:** Before `module.exports = router;` (around line 240)

The endpoint has already been added in the file. Verify it exists and has proper structure.

---

## 🎨 UI/UX FEATURES

### ✅ Auto-Detection Flow
1. User types description (min 10 characters)
2. Wait 500ms after user stops typing
3. Show loading spinner 🤖 with shimmer animation
4. AI analyzes and returns suggestion
5. Display badge with category, confidence, and reason

### ✅ Smart Category Selection
- **If confidence > 80%:** Auto-select category in dropdown
- **If confidence 50-80%:** Show medium confidence, highlight category field with pulse
- **If confidence < 50%:** Show low confidence warning, ask user to confirm manually

### ✅ Visual States
- **Loading:** Shimmer animation, "AI analyzing..." text
- **Success:** Green for high (>80%), yellow for medium (50-80%), gray for low (<50%)
- **Error:** Red error state, doesn't block form submission
- **Badge content:** Category, confidence %, reason, hint text

### ✅ Responsive Design
- Desktop: Full badge layout with all info visible
- Tablet: Maintains layout with smaller text
- Mobile: Stack category badge on separate line, compact view

---

## 🔐 ENVIRONMENT VARIABLES

### Required Variables
```bash
# backend/.env
OPENAI_API_KEY=sk_...your_key_here...
```

### Optional Variables (Frontend)
```bash
# frontend/.env (only if using custom backend URL)
REACT_APP_API_URL=http://localhost:5000
```

### Make Sure .gitignore Has These
```
# backend/.gitignore should have:
.env
.env.local
.env.*.local

# frontend/.env is typically tracked, but .env.local is not
```

---

## 🧪 TESTING CHECKLIST

- [ ] Backend starts without errors
- [ ] OpenAI API key is valid (check by making POST request to /suggest-category)
- [ ] Frontend loads complaint form
- [ ] Type complaint description (min 10 chars)
- [ ] Wait 500ms - badge appears
- [ ] Badge shows category, confidence %, and reason
- [ ] If confidence > 80%, category dropdown auto-selects
- [ ] If confidence < 80%, category field shows pulse animation
- [ ] Can override category manually
- [ ] Form submits with category field
- [ ] Mobile responsive - test on small screen

---

## 🐛 TROUBLESHOOTING

### Issue: Badge not appearing
**Solution:** 
- Check browser console for errors
- Verify `AICategorizationBadge.js` is in `frontend/src/components/`
- Verify `ai-badge.css` is created
- Check that component is imported in Upload.js

### Issue: OpenAI API errors
**Solution:**
- Check `OPENAI_API_KEY` in `backend/.env` is correct
- Verify key has API credits and access
- Check backend logs for full error message
- Badge will gracefully degrade to manual selection

### Issue: "Cannot find module cloudinary" or other backend errors
**Solution:**
- Run `npm install` in backend folder
- Make sure all dependencies from `backend/package.json` are installed

### Issue: Badge appears but doesn't suggest category
**Solution:**
- Check network tab in browser DevTools
- Look for POST request to `/api/complaints/suggest-category`
- If request fails, check backend console for errors
- Verify OpenAI API key is valid

### Issue: Category dropdown not auto-selecting
**Solution:**
- Badge confidence might be <= 80% (by design)
- Try with a clearer description
- You can manually select category - AI is just a suggestion

---

## 📊 OPENAI API COSTS

**Pricing:** As of 2024, GPT-3.5-turbo is ~$0.0005 per 1K input tokens

**Estimated costs:**
- 100 complaints/month: ~$0.02
- 1000 complaints/month: ~$0.20
- 10000 complaints/month: ~$2.00

**Cost optimization:**
- Component uses debounce (500ms) - reduces API calls
- Only calls API when description >= 10 characters
- Users can disable by not typing
- Can cache results if needed (future enhancement)

---

## ✨ FUTURE ENHANCEMENTS

Potential improvements you can add:
1. **Cache results** - Don't re-process same descriptions
2. **User feedback** - Track if user overrides AI suggestion for learning
3. **Analytics** - Log which categories are most common
4. **Confidence threshold** - Increase/decrease auto-selection threshold
5. **Multiple models** - Allow switching between GPT-3.5 and GPT-4
6. **Offline mode** - Use local ML models if API is down
7. **Dark mode** - Theme badge to match dark theme when implemented

---

## 📞 SUPPORT

If you face issues:
1. Check browser DevTools Console (F12 → Console tab)
2. Check backend logs in terminal where `npm start` is running
3. Verify all files are created in correct locations
4. Verify `.env` file has correct API key format
5. Check OpenAI dashboard for account status

---

## ✅ VERIFICATION CHECKLIST

Before considering feature complete:
- [ ] All files created in correct locations
- [ ] Backend `.env` has `OPENAI_API_KEY`
- [ ] Frontend loads without console errors
- [ ] Complaint form has category dropdown
- [ ] AI badge appears after typing description
- [ ] Category auto-selects on high confidence
- [ ] Manual category selection works
- [ ] Form submission includes category
- [ ] Mobile responsive works
- [ ] No existing functionality broken

---

**That's it! 🎉 Your AI-powered complaint categorization is now live!**

