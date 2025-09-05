# Deployment Checklist - v2.0.0

## 🚀 Pre-Deployment Checklist

### ✅ Code & Testing
- [x] All E2E tests pass: `./test-e2e-verification.sh`
- [x] Code review completed and approved
- [x] Branch ready for squash merge: `feat/care-gfp-delete-ui`
- [x] Release notes prepared: `RELEASE_NOTES.md`

### ✅ Data Backup
- [ ] **CRITICAL**: Backup existing data
  ```bash
  cp server/data/store.json server/data/store.backup.$(date +%F-%H%M).json
  ```
- [ ] Verify backup file exists and is readable
- [ ] Test backup restoration process

### ✅ Environment Preparation
- [ ] Set `NODE_ENV=production` in production environment
- [ ] Verify `X-Dev-Token` is disabled in production
- [ ] Update API base URL for production
- [ ] Configure production proxy settings

---

## 🔄 Deployment Steps

### 1. **Code Deployment**
```bash
# Merge feature branch to main (squash merge)
git checkout main
git merge --squash feat/care-gfp-delete-ui
git commit -m "feat: multi-item CRUD for Care/GFP + WeeklyDocs 2.0

- Add robust multi-item CRUD with nanoid, versioning, timestamps
- Implement WeeklyDocs 2.0 with WeekPicker and DayEditor
- Create data migration script for existing data
- Add E2E verification tests
- Update frontend with CarePlanList and ImplementationPlanList
- Add standardized query keys and API helpers
- Update documentation and dev scripts

BREAKING CHANGE: Data structure changed to arrays with nanoid IDs"
```

### 2. **Tag Release**
```bash
git tag -a v2.0.0 -m "Release v2.0.0: Multi-item CRUD + WeeklyDocs 2.0"
git push origin v2.0.0
```

### 3. **Deploy to Production**
- [ ] Deploy code changes to production server
- [ ] Verify application starts without errors
- [ ] Check application logs for any startup issues

### 4. **Data Migration**
```bash
# Run dry-run first
npm run migrate:prod:dry-run

# If dry-run successful, run actual migration
npm run migrate:prod
```

### 5. **Post-Deployment Verification**
```bash
# Run production smoke tests
./scripts/smoke-prod.sh

# Verify all endpoints return correct status codes
curl -s http://your-prod-url/api/health | jq
```

---

## 🧪 Post-Deployment Testing

### ✅ API Endpoints Verification
- [ ] Health check: `GET /api/health` → 200
- [ ] Care Plans: Create → Read → Update → Delete (201/200/200/204)
- [ ] Implementation Plans: Create → Read → Update → Delete (201/200/200/204)
- [ ] WeeklyDocs: Create → Add Entry → Update Entry → Delete Entry → Delete Doc (201/201/200/204/204)

### ✅ UI Functionality
- [ ] Frontend loads without errors
- [ ] CarePlanList displays multiple items correctly
- [ ] ImplementationPlanList displays multiple items correctly
- [ ] WeeklyDocView with WeekPicker and DayEditor works
- [ ] Quick actions (Edit, Copy, Duplicate, Archive, Delete) function
- [ ] Search and filter functionality works
- [ ] Toast notifications display correctly

### ✅ Data Integrity
- [ ] Existing data migrated correctly (44 care plans, 36 implementation plans)
- [ ] New items can be created without overwriting existing ones
- [ ] Version tracking works (v1, v2, v3...)
- [ ] Timestamps are properly set and updated

---

## 📊 Monitoring Setup

### ✅ Error Monitoring
- [ ] Set up logging for 4xx/5xx responses on new endpoints:
  - `/api/care-plans/*`
  - `/api/implementation-plans/*`
  - `/api/weekly-docs/*`
- [ ] Configure alerts for error rates >1% / 5 minutes
- [ ] Monitor PUT/POST/DELETE operation success rates

### ✅ Performance Monitoring
- [ ] Monitor response times for new endpoints
- [ ] Track database/JSON file access patterns
- [ ] Monitor memory usage with new data structures

### ✅ User Experience Monitoring
- [ ] Track successful CRUD operations
- [ ] Monitor WeeklyDocs usage patterns
- [ ] Track search and filter usage

---

## 🧯 Rollback Plan

### Immediate Rollback (if critical issues)
```bash
# 1. Stop application
# 2. Restore data from backup
cp server/data/store.backup.YYYY-MM-DD-HHMM.json server/data/store.json

# 3. Revert code to previous version
git checkout v1.x.x
git tag -a v1.x.x+1 -m "Rollback to v1.x.x due to critical issues"

# 4. Restart application
```

### Gradual Rollback (if non-critical issues)
- [ ] Disable new features via feature flags (if implemented)
- [ ] Monitor error rates and user feedback
- [ ] Plan fix and re-deploy

---

## 📋 Success Criteria

### ✅ Technical Success
- [ ] All smoke tests pass
- [ ] No 4xx/5xx errors in production logs
- [ ] Data migration completed successfully
- [ ] All new endpoints respond correctly

### ✅ User Success
- [ ] Users can create multiple care plans per client
- [ ] Users can create multiple implementation plans per client
- [ ] Users can use WeeklyDocs 2.0 features
- [ ] No data loss reported
- [ ] Performance remains acceptable

### ✅ Business Success
- [ ] Improved user workflow efficiency
- [ ] Better data organization and tracking
- [ ] Enhanced reporting capabilities
- [ ] Positive user feedback

---

## 📞 Support & Communication

### ✅ Internal Communication
- [ ] Notify team of successful deployment
- [ ] Share release notes with stakeholders
- [ ] Update internal documentation

### ✅ User Communication
- [ ] Prepare user announcement (if applicable)
- [ ] Update user documentation
- [ ] Provide migration guidance if needed

### ✅ Support Preparation
- [ ] Update support documentation
- [ ] Prepare FAQ for common questions
- [ ] Set up monitoring alerts

---

## 🎯 Post-Release Tasks

### ✅ Documentation Updates
- [ ] Update user guides with new features
- [ ] Update API documentation
- [ ] Update deployment guides

### ✅ Future Planning
- [ ] Collect user feedback on new features
- [ ] Plan v2.1.0 enhancements
- [ ] Schedule UI polish tasks

---

## 🎉 Success Declaration

**Release v2.0.0 is successful when:**
- [ ] All deployment steps completed
- [ ] All smoke tests pass
- [ ] No critical issues reported within 24 hours
- [ ] User adoption of new features begins
- [ ] Performance metrics remain stable

---

**🚀 Ready for deployment! Follow this checklist step by step for a successful v2.0.0 release.**
