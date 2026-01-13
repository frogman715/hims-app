# 👨‍💻 DEVELOPER WORKFLOW GUIDE

**For:** Dev A & Dev B  
**Duration:** 5 weeks  
**Updated:** Jan 13, 2026  

---

## 🎯 YOUR MISSION

Build **9 new features** for HANMARINE HIMS in **5 weeks** while maintaining code quality and team coordination.

---

## 📅 FEATURE ASSIGNMENT

### **Dev A (Frontend + Backend Specialist)**
Comfortable with UI, forms, data formatting, and PDF generation

**Features:**
1. PDF Generation (Week 1)
2. Email Notifications (Week 1-2)
3. Dashboard Enhanced (Week 3)
4. SIUPPAK Auto-generation (Week 4)
5. Document Compliance Matrix (Week 5)

**Tools:** Next.js, React, Prisma, Puppeteer, SendGrid

### **Dev B (Backend + Real-time Specialist)**
Comfortable with WebSockets, real-time systems, and complex queries

**Features:**
1. WebSocket Real-time (Week 2)
2. Advanced Search (Week 3)
3. Mobile App PWA (Week 4)
4. Audit Trail (Week 4-5)

**Tools:** Socket.io, React Query, Prisma, Service Workers

---

## 🔄 DAILY WORKFLOW

### **MORNING (9:00 AM) - Standup**

**Time:** 15 minutes  
**Participants:** Dev A & Dev B + Project Lead (optional)

```
Format:
1. Dev A: "Yesterday: [what done], Today: [what doing], Blocker: [yes/no]"
2. Dev B: "Yesterday: [what done], Today: [what doing], Blocker: [yes/no]"
3. Discuss blockers & sync
4. Done!
```

**Example:**
```
Dev A: "Yesterday: Finished PDF generator service, started HTML templates. 
        Today: Finishing templates and creating API routes. 
        Blocker: No"

Dev B: "Yesterday: Read WebSocket spec and setup Socket.io. 
        Today: Creating event handlers and React hooks. 
        Blocker: Need to clarify which events to broadcast"
```

### **WORK TIME (9:15 AM - 5:00 PM)**

**Split your time:**
- 6-7 hours: Coding
- 30 min: Testing locally
- 30 min: Code review (peer)
- 30 min: Documentation
- Breaks as needed

**Stay productive:**
- No distractions (turn off Slack notifications if needed)
- Hydrate & move around
- Lunch break (1 hour)
- Communicate blockers immediately

### **AFTERNOON (5:00 PM) - Code Review & Sync**

**Time:** 30 minutes  
**Process:**

1. **Push your work to GitHub:**
   ```bash
   git add .
   git commit -m "feat: description of what you did"
   git push origin feature/your-feature
   ```

2. **Review peer's PR:**
   - Check code follows patterns
   - Run locally if possible
   - Test the feature
   - Leave constructive feedback
   - Approve if good

3. **Address feedback on your PR:**
   - Read review comments
   - Make changes
   - Commit & push
   - Reply to comments

4. **Merge if approved:**
   ```bash
   # On GitHub: Click "Merge Pull Request"
   ```

5. **Deploy to staging** (after merge):
   ```bash
   git checkout main
   git pull origin main
   npm install
   npm run build
   npm run dev  # Test locally
   ```

---

## 📝 CODING STANDARDS

### **Naming Conventions**

**Files & Folders:**
```typescript
// Components (PascalCase)
src/components/FormDownloadButton.tsx
src/components/CrewTimeline.tsx

// Functions (camelCase)
src/lib/pdf/generator.ts
src/lib/email/sender.ts

// Interfaces (PascalCase + I prefix if needed)
interface FormData { ... }
interface EmailNotification { ... }
```

**Variables & Functions:**
```typescript
// Functions - camelCase
const generatePDF = () => { ... }
const sendEmail = async () => { ... }

// Constants - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5242880; // 5MB
const API_TIMEOUT = 5000;

// React hooks - use prefix
const useWebSocket = () => { ... }
const useRealtimeUpdates = () => { ... }
```

### **Code Structure**

**Imports:**
```typescript
// 1. External imports (sorted)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 2. Local imports (sorted)
import { generatePDF } from '@/lib/pdf/generator';
import { Button } from '@/components/ui/Button';

// 3. Types
import type { User } from '@prisma/client';
```

**Type Safety:**
```typescript
// ✅ Good - explicit types
async function sendEmail(
  recipientEmail: string,
  subject: string,
  body: string
): Promise<void> { ... }

// ❌ Bad - using any
async function sendEmail(email: any): Promise<any> { ... }
```

**Error Handling:**
```typescript
// ✅ Good - specific errors
try {
  const pdf = await generatePDF(form);
  return pdf;
} catch (error) {
  if (error instanceof PuppeteerError) {
    console.error('PDF generation failed:', error.message);
    throw new Error('Could not generate PDF');
  }
  throw error;
}

// ❌ Bad - swallowing errors
try {
  const pdf = await generatePDF(form);
} catch (error) {
  // Silent fail
}
```

### **Performance Rules**

```typescript
// ✅ Good - batch operations
const results = await Promise.all([
  prisma.form.findMany({ where: { status: 'PENDING' } }),
  prisma.document.findMany({ where: { expiryDate: { lt: tomorrow } } }),
]);

// ❌ Bad - sequential queries
const forms = await prisma.form.findMany({ where: { status: 'PENDING' } });
const documents = await prisma.document.findMany({ where: { expiryDate: { lt: tomorrow } } });
```

### **React Best Practices**

```typescript
// ✅ Good - properly memoized
const FormCard = memo(({ form, onApprove }: Props) => {
  const handleClick = useCallback(() => {
    onApprove(form.id);
  }, [form.id, onApprove]);

  return <div onClick={handleClick}>{form.type}</div>;
});

// ❌ Bad - re-renders on every parent update
export const FormCard = ({ form, onApprove }: Props) => {
  return <div onClick={() => onApprove(form.id)}>{form.type}</div>;
};
```

---

## 🧪 TESTING BEFORE COMMIT

### **Local Testing Checklist**

**Before pushing any code:**

```bash
# 1. Build test
npm run build

# 2. Lint check
npm run lint

# 3. Type check
npm run type-check

# 4. Run dev server & test manually
npm run dev
# Visit http://localhost:3000
# Click around & test your feature
# Check browser console for errors

# 5. Test in other browser (Chrome, Firefox)
# Ensure responsive on mobile

# 6. Run tests
npm test

# 7. Check git status
git status

# 8. Review changes
git diff
```

**If any fail, fix before pushing!**

### **Code Review Checklist**

**When reviewing peer's code:**

```
Code Quality:
[ ] TypeScript strict mode passes
[ ] ESLint passes
[ ] No console.log/debugger statements
[ ] No hardcoded values
[ ] Follows naming conventions

Functionality:
[ ] Feature works as described
[ ] All happy paths tested
[ ] Error cases handled
[ ] Matches spec

Performance:
[ ] No N+1 queries
[ ] Proper memoization used
[ ] API latency acceptable
[ ] No memory leaks

Security:
[ ] Input validation present
[ ] Authentication checked
[ ] Authorization enforced
[ ] No sensitive data exposed
[ ] SQL injection prevented

Documentation:
[ ] Code comments where needed
[ ] Complex logic explained
[ ] Interfaces documented
[ ] README updated if needed
```

---

## 🌳 GIT WORKFLOW

### **Creating a Feature Branch**

```bash
# 1. Sync with main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/pdf-generation
# Name format: feature/kebab-case-description

# 3. Push empty branch to GitHub
git push -u origin feature/pdf-generation
```

### **Committing Code**

**Commit Often:**
```bash
# Good commits - specific and atomic
git commit -m "feat: add PDF generator service"
git commit -m "feat: create HTML templates for forms"
git commit -m "feat: add PDF download button to UI"

# Bad commits - too broad
git commit -m "WIP: PDF stuff"
```

**Commit Message Format:**
```
<type>: <description>

<optional detailed explanation>

Example:
feat: add PDF generation service

Create a new PDFGenerator service that:
- Uses puppeteer for rendering
- Supports HTML templates
- Handles errors gracefully
- Logs to database

Closes #123
```

**Types:**
```
feat:     New feature
fix:      Bug fix
refactor: Code reorganization
docs:     Documentation
style:    Formatting
test:     Test addition
chore:    Maintenance
```

### **Pushing to GitHub**

```bash
# Simple push
git push

# If branch tracking not set
git push -u origin feature/pdf-generation

# Force push (use carefully!)
git push --force-with-lease
```

### **Creating Pull Request**

**On GitHub:**

1. Go to repository
2. Click "Pull Requests" tab
3. Click "New Pull Request"
4. Select your branch
5. Fill title: `feat: PDF generation - download forms as PDF`
6. Fill description:
   ```
   ## What
   Adds ability to download forms as PDF files
   
   ## Why
   Users need to print/archive forms
   
   ## How
   - Puppeteer for PDF generation
   - HTML templates for styling
   - API endpoints for serving PDFs
   
   ## Testing
   - [x] PDF generation works
   - [x] Downloads correctly
   - [x] No memory leaks
   - [x] <5 second generation time
   
   Closes #123
   ```
7. Click "Create Pull Request"

### **After Code Review**

```bash
# Update with feedback
git add .
git commit -m "fix: address review feedback"
git push

# After approval, merge on GitHub
# (Click green "Merge" button)

# Delete branch locally
git checkout main
git branch -d feature/pdf-generation
```

---

## 📊 TRACKING PROGRESS

### **Weekly Progress Log**

**Keep a simple log:**

```markdown
## Week 1 Progress (Jan 13-19)

### Dev A
- [x] Installed puppeteer
- [x] Created PDF generator service
- [x] Created HTML templates
- [x] Created API routes
- [ ] React download button
- [ ] Testing
- Blocker: Template CSS not rendering - using inline styles

### Dev B
- [x] Read WebSocket spec
- [x] Setup Socket.io
- [x] Created event handlers
- [ ] React hooks
- [ ] Integration testing
- Blocker: None

### Team Progress
- [ ] PDF ready for review
- [x] Email setup started
- [ ] Deployment to staging
```

### **When Behind Schedule**

**If you're falling behind:**

1. **Identify the issue:**
   - Too many bugs?
   - Underestimated effort?
   - Blocked by something?

2. **Tell the team immediately:**
   - Don't wait until Friday
   - Discuss in standup
   - Ask for help

3. **Adjust scope:**
   - Can you simplify?
   - Can you skip edge cases?
   - Can someone help?

4. **Document decisions:**
   - Update the implementation plan
   - Note what's deferred
   - Plan for next phase

---

## 🎓 LEARNING RESOURCES

### **During Development**

**Need to learn something?**

1. Check the code spec first
2. Search official docs
3. Google the issue
4. Ask peer (Dev A/B)
5. Ask in team chat

**Examples:**
```
"How do I use Socket.io?" 
→ Check FEATURE_SPEC_3_WEBSOCKET.md first

"How does Prisma handle relations?"
→ https://www.prisma.io/docs/orm/prisma-client/queries/relations

"How do I make React memoization work?"
→ Google "React memo usecallback"
```

### **Recommended Documentation**

Keep these bookmarked:
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma ORM](https://www.prisma.io/docs/orm/prisma-client)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
- [MDN Web Docs](https://developer.mozilla.org)

---

## 🆘 TROUBLESHOOTING

### **"npm run build fails"**

```bash
# 1. Check error message - usually TypeScript
npm run build

# 2. Fix all TypeScript errors
# Usually missing types or type mismatches

# 3. Try again
npm run build

# Still stuck? Delete node_modules
rm -rf node_modules
npm install
npm run build
```

### **"ESLint complains about everything"**

```bash
# Auto-fix issues
npm run lint -- --fix

# Review remaining issues
npm run lint

# If rule is wrong, discuss in team
# Can add eslint-disable comments
```

### **"My feature branch is out of sync"**

```bash
# Fetch latest main
git fetch origin

# Rebase onto main
git rebase origin/main

# If conflicts, resolve them
# Then continue
git rebase --continue

# Force push (use with caution)
git push --force-with-lease
```

### **"I accidentally deleted something"**

```bash
# Check git log
git log --oneline | head -20

# Revert commit
git revert <commit-hash>

# Or reset (if not pushed)
git reset --hard <commit-hash>
```

### **"Test fails but works locally"**

```bash
# Make sure you're testing same code
npm run build
npm test

# Check database setup
# Make sure test database is clean

# Run single test
npm test -- FormButton.test.tsx

# Run with more info
npm test -- --verbose
```

---

## ✨ PRO TIPS

### **Development Speed**

1. **Use VS Code snippets** - Create shortcuts for common patterns
2. **Install extensions** - Thunder Client for API testing, Prisma for data
3. **Use `npm run dev`** - Has hot reload, super fast
4. **Browser DevTools** - Learn keyboard shortcuts (F12, Ctrl+Shift+J)
5. **GitHub Copilot** - Helps write boilerplate faster (if available)

### **Debugging**

1. **VS Code Debugger** - Add breakpoints, step through code
2. **Chrome DevTools** - Check network tab, React DevTools
3. **Prisma Studio** - Visualize database: `npx prisma studio`
4. **Console logs** - Simple but effective
5. **Error messages** - Read them carefully, they often say exactly what's wrong

### **Code Quality**

1. **Format often** - Prettier auto-formats on save
2. **Type everything** - Saves hours of debugging later
3. **Commit often** - Small commits are easier to review
4. **Test early** - Don't wait until end of feature
5. **Refactor constantly** - Keep code clean while fresh

### **Team Collaboration**

1. **Communicate early** - Tell team if blocked
2. **Help each other** - Review code together sometimes
3. **Share learnings** - Post resources in team chat
4. **Celebrate wins** - Feature merged? That's awesome!
5. **Be respectful** - Code reviews are about code, not people

---

## 🏁 READY TO START?

### **Tomorrow (Jan 14):**

**Dev A:**
1. Read FEATURE_SPEC_1_PDF_GENERATION.md
2. Understand the requirements
3. Create branch: `feature/pdf-generation`
4. Install puppeteer: `npm install puppeteer`

**Dev B:**
1. Read FEATURE_SPEC_3_WEBSOCKET.md
2. Understand the architecture
3. Create branch: `feature/websocket-realtime`
4. Install Socket.io: `npm install socket.io`

**Both:**
1. Setup `.env.local` (if not done)
2. Run `npm install` (if new dependencies)
3. Verify `npm run dev` works
4. First standup at 9:00 AM

### **Day After (Jan 15):**

**Dev A:** Start PDF service  
**Dev B:** Start WebSocket server  

### **Every Day:** Follow this workflow

---

## 📞 QUESTIONS?

**Where to ask:**
- Architecture question → Design docs
- Feature question → Feature spec
- Implementation question → Code templates
- Debugging question → Team standup
- Emergency → Message immediately

---

**Now go build amazing features! 🚀**

*Remember: Quality > Speed. Take your time to do it right.*

⚓ HANMARINE HIMS v2 🌊
