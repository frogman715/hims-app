# ⚡ QUICK REFERENCE CARD - 9 FEATURES SPRINT

**Print this out or bookmark it! 📌**

---

## 🎯 YOUR ROLE

**Dev A (Frontend + Backend):**
- Features: PDF, Email, Dashboard, SIUPPAK, Document Matrix
- Time: 10-13 days total
- Focus: Data formatting, forms, PDFs, reports

**Dev B (Backend + Real-time):**
- Features: WebSocket, Search, Mobile, Audit
- Time: 10-13 days total
- Focus: Real-time, complex queries, APIs, WebSocket

---

## 📅 THIS WEEK (Jan 13-19)

| Day | Dev A | Dev B | Both |
|-----|-------|-------|------|
| Mon | Setup PDF branch | Setup Email branch | 9 AM Standup |
| Tue | PDF service | Email setup | Code review |
| Wed | PDF templates | SendGrid integration | Code review |
| Thu | PDF API routes | Email handlers | Code review |
| Fri | React component | Full test | Code review |
| Fri 5PM | **Ready for PR** | **Ready for PR** | **Review & Merge** |

---

## 📚 DOCUMENTATION QUICK LINKS

**START HERE:**
- [MASTER_IMPLEMENTATION_INDEX.md](MASTER_IMPLEMENTATION_INDEX.md) ⭐ Overview
- [IMPLEMENTATION_PLAN_ALL_FEATURES.md](IMPLEMENTATION_PLAN_ALL_FEATURES.md) ⏰ Timeline

**YOUR FEATURE SPECS:**
- [FEATURE_SPEC_1_PDF_GENERATION.md](FEATURE_SPEC_1_PDF_GENERATION.md) (Dev A)
- [FEATURE_SPEC_2_EMAIL_NOTIFICATIONS.md](FEATURE_SPEC_2_EMAIL_NOTIFICATIONS.md) (Dev A/B)
- [FEATURE_SPEC_3_WEBSOCKET.md](FEATURE_SPEC_3_WEBSOCKET.md) (Dev B)

**HOW TO WORK:**
- [DEVELOPER_WORKFLOW_GUIDE.md](DEVELOPER_WORKFLOW_GUIDE.md) 👨‍💻 Daily guide
- [EXECUTIVE_SUMMARY_9_FEATURES.md](EXECUTIVE_SUMMARY_9_FEATURES.md) 📊 Overview

---

## 🔧 SETUP COMMANDS

```bash
# 1. Sync with main
git checkout main && git pull origin main

# 2. Create feature branch (YOUR NAME)
git checkout -b feature/pdf-generation        # Dev A - Week 1
git checkout -b feature/email-notifications   # Dev A - Week 1-2
git checkout -b feature/websocket-realtime    # Dev B - Week 2
git checkout -b feature/dashboard-enhanced    # Dev A - Week 3
git checkout -b feature/advanced-search       # Dev B - Week 3
git checkout -b feature/mobile-app            # Dev A/B - Week 4
git checkout -b feature/siuppak-autogen       # Dev A - Week 4
git checkout -b feature/audit-trail           # Dev B - Week 4-5
git checkout -b feature/document-matrix       # Dev A - Week 5

# 3. Install dependencies
npm install puppeteer                    # PDF (Week 1)
npm install @sendgrid/mail              # Email (Week 1)
npm install socket.io socket.io-client  # WebSocket (Week 2)
npm install recharts                    # Dashboard (Week 3)
npm install qrcode.react                # Mobile (Week 4)

# 4. Start coding!
npm run dev
```

---

## 📋 FEATURE CHECKLIST

### **Week 1 - PDF Generation (Dev A)**
- [ ] Branch created & pushed
- [ ] Puppeteer installed
- [ ] PDF generator service created
- [ ] HTML templates done
- [ ] API routes created
- [ ] React button component
- [ ] Local testing passed
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 1-2 - Email Notifications (Dev A/B)**
- [ ] SendGrid account created
- [ ] API key added to `.env`
- [ ] Email sender service created
- [ ] Email templates created (5 types)
- [ ] Notification handlers created
- [ ] Database migration done
- [ ] API routes created
- [ ] Integration with form status
- [ ] Local testing passed
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 2 - WebSocket Real-time (Dev B)**
- [ ] Socket.io installed & setup
- [ ] WebSocket manager created
- [ ] Event handlers created
- [ ] React hook created
- [ ] Components created
- [ ] Integration with API routes
- [ ] Tested with multiple clients
- [ ] Latency verified < 100ms
- [ ] Auto-reconnect tested
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 3 - Dashboard Enhanced (Dev A)**
- [ ] Components created
- [ ] Charts integrated (recharts)
- [ ] KPI cards created
- [ ] Timeline component created
- [ ] Real-time updates integrated
- [ ] Responsive tested
- [ ] Mobile tested
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 3 - Advanced Search (Dev B)**
- [ ] Filter component created
- [ ] Search API created
- [ ] Multiple filter types
- [ ] Save searches feature
- [ ] CSV export feature
- [ ] Excel export feature
- [ ] Performance tested
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 4 - Mobile App (Dev A/B)**
- [ ] PWA manifest updated
- [ ] Service worker created
- [ ] Offline mode tested
- [ ] Check-in page created
- [ ] QR scanner integrated
- [ ] Document viewer added
- [ ] Signature capture added
- [ ] Offline caching works
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 4 - SIUPPAK Auto-gen (Dev A)**
- [ ] Formatter created
- [ ] Generation service created
- [ ] Monthly reports work
- [ ] Semester reports work
- [ ] PDF export works
- [ ] Submission API created
- [ ] Auto-scheduling works
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 4-5 - Audit Trail (Dev B)**
- [ ] Audit model created
- [ ] Logging service created
- [ ] API routes created
- [ ] Event hooks added
- [ ] Audit UI created
- [ ] Export functionality added
- [ ] Archive functionality added
- [ ] Compliance reports working
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

### **Week 5 - Document Matrix (Dev A)**
- [ ] Rules engine created
- [ ] Compliance dashboard created
- [ ] Per-rank requirements added
- [ ] Compliance tracking works
- [ ] Auto-alerts working
- [ ] Reports working
- [ ] PR created & reviewed
- [ ] **MERGED ✅**

---

## 🚀 DAILY CHECKLIST

**Every morning:**
- [ ] Read standup notes from yesterday
- [ ] Check your feature spec
- [ ] Start coding (6-7 hours focused)

**Afternoon (5 PM):**
- [ ] `npm run build` (must pass!)
- [ ] `npm run lint` (must pass!)
- [ ] Commit your work: `git commit -m "feat: description"`
- [ ] Push: `git push`
- [ ] Review peer's code
- [ ] Write standup update

**Before merge:**
- [ ] TypeScript ✅
- [ ] ESLint ✅
- [ ] Tests pass ✅
- [ ] Docs updated ✅
- [ ] Code reviewed ✅
- [ ] Ready to merge ✅

---

## 🆘 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `npm run build` fails | `npm run lint -- --fix` then rebuild |
| TypeScript errors | Hover over error in VS Code, fix type |
| Branch is behind main | `git fetch && git rebase origin/main` |
| Merge conflicts | Edit files, then `git add .` & `git commit` |
| Lost uncommitted code | `git reflog` to find it |
| Need to undo commit | `git revert <commit-hash>` |
| ESLint won't fix | Check if it's a rule issue, ask team |
| Database issue | `npx prisma studio` to see data |
| Feature not working | Check console (F12), check network tab |
| Unit test fails | Run single test: `npm test -- --watch` |

---

## 📞 STANDUP TEMPLATE

**Use this every day at 9 AM:**

```
[Name]: 
Yesterday: [What I completed]
Today: [What I'm working on]
Blocker: [Yes/No - if yes, describe]
```

**Example:**
```
Dev A:
Yesterday: Finished PDF HTML templates
Today: Creating API routes for PDF download
Blocker: No

Dev B:
Yesterday: Setup Socket.io server
Today: Creating event handlers
Blocker: Confused about role-based broadcasting - need clarification
```

---

## 🎁 GIT COMMIT EXAMPLES

**Good commits (specific & atomic):**
```
git commit -m "feat: add PDF generator service"
git commit -m "feat: create HTML email templates"
git commit -m "feat: add Socket.io real-time events"
git commit -m "fix: handle PDF generation timeout"
git commit -m "test: add PDF generator unit tests"
```

**Bad commits (too broad):**
```
git commit -m "WIP"
git commit -m "more stuff"
git commit -m "fixed things"
```

---

## 📊 SUCCESS CHECKLIST

**End of Week 1:**
- [ ] PDF feature deployed to staging
- [ ] Email service ready
- [ ] 0 blocking issues
- [ ] Team trained & confident

**End of Week 2:**
- [ ] Email feature deployed
- [ ] WebSocket working real-time
- [ ] 0 critical bugs
- [ ] Performance metrics good

**End of Week 3:**
- [ ] WebSocket deployed
- [ ] Dashboard & Search done
- [ ] All UX features working
- [ ] User feedback positive

**End of Week 4:**
- [ ] Mobile, SIUPPAK, Audit started
- [ ] 5 features in production
- [ ] 4 features ready to deploy
- [ ] No tech debt

**End of Week 5:**
- [ ] All 9 features done! 🎉
- [ ] Regression tested
- [ ] Security audit passed
- [ ] Ready for production

---

## ⏰ TIME TRACKING

**Track your time daily:**

```markdown
## Week 1 Time Log

Jan 15 (PDF):
- 09:00-12:00: Setup & service creation (3 hrs)
- 13:00-17:00: Templates & testing (4 hrs)
- Total: 7 hours ✅

Jan 16 (PDF):
- 09:00-12:00: API routes (3 hrs)
- 13:00-14:30: React component (1.5 hrs)
- 14:30-17:00: Testing (2.5 hrs)
- Total: 7 hours ✅

...etc
```

---

## 📱 BOOKMARK THESE URLS

**Internal Docs:**
- This repo: [MASTER_IMPLEMENTATION_INDEX.md](MASTER_IMPLEMENTATION_INDEX.md)

**External Docs:**
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs)
- [SendGrid API](https://docs.sendgrid.com)
- [Socket.io](https://socket.io/docs)
- [MDN Web Docs](https://developer.mozilla.org)

---

## 💡 PRO TIPS

1. **Commit often** - Small commits are easier to review
2. **Test locally first** - Don't push broken code
3. **Read error messages** - They usually tell you exactly what's wrong
4. **Ask for help** - Team is here to support
5. **Document as you go** - Don't leave it for the end
6. **Coffee is your friend** ☕
7. **Take breaks** - Walks help creativity
8. **Read specs carefully** - Saves hours of rework

---

## 🎯 NORTH STAR

**Remember why we're building this:**

✅ Users can download forms (PDF)  
✅ Users get notified of changes (Email)  
✅ Users see real-time updates (WebSocket)  
✅ Managers have better visibility (Dashboard)  
✅ Crew can search faster (Search)  
✅ Mobile crew can work offline (Mobile)  
✅ Reports auto-generate (SIUPPAK)  
✅ Compliance is auditable (Audit)  
✅ Document requirements tracked (Matrix)  

**These features make our app PROFESSIONAL & INTERNATIONAL-SCALE!** 🚀

---

**Print this out. Keep it handy. Reference daily.**

**Good luck! You've got this! 💪**

⚓ HANMARINE HIMS v2 🌊
