# Crew List Management System - Data Flow & Structure

## 🎯 **OVERVIEW**
Crew List adalah sistem terintegrasi yang menggabungkan data dari **Applications**, **Assignments**, **Documents**, **Replacements**, dan **Monthly Checklists** untuk memberikan gambaran lengkap komplement awak kapal.

## 📊 **DATA FLOW HIERARCHY**

```
SEAFARER APPLICATIONS → ASSIGNMENTS → CREW LIST → REPLACEMENTS & CHECKLISTS
       ↓                ↓            ↓                ↓
   Documents        Documents    Documents       Documents
   Status           Status       Status          Status
   Interviews       Vessel       Vessel          Vessel
                    Principal    Principal       Principal
```

## 🔗 **RELATIONSHIPS & DEPENDENCIES**

### 1. **SEAFARER → APPLICATIONS → ASSIGNMENTS**
```typescript
Seafarer {
  id, fullName, nationality, dateOfBirth
  applications: Application[]
  assignments: Assignment[]
  documents: SeafarerDocument[]
}

Application {
  id, seafarerId, appliedRank, status
  seafarer: Seafarer
  interview?: Interview
}

Assignment {
  id, seafarerId, vesselId, principalId
  rank, signOnDate, signOffPlan, signOffDate?, status
  seafarer: Seafarer
  vessel: Vessel
  principal: Principal
}
```

### 2. **ASSIGNMENT STATUS FLOW**
```
PLANNED → ONBOARD → COMPLETED
    ↓         ↓         ↓
  Future    Current   Past
 Arrivals  Active     Departed
```

### 3. **CREW LIST AGGREGATION**
```typescript
CrewList = Assignment[]
  .filter(assignment => assignment.status !== 'COMPLETED' || recentDeparture)
  .groupBy(vesselId)
  .map(vesselGroup => ({
    vesselId,
    vesselName,
    crewMembers: vesselGroup.map(transformToCrewMember),
    activeCrew: count(status === 'ONBOARD'),
    totalCrew: vesselGroup.length
  }))
```

## 🎨 **UI COMPONENTS STRUCTURE**

### **Main Crew List Page** (`/crewing/crew-list`)
```
├── Header (Back + Title + Add Crew)
├── Summary Cards (Total Vessels, Active Crew, Departures, Avg Contract)
├── Vessel Cards Grid
│   ├── Vessel Header (Name, Active/Total count)
│   ├── Expandable Crew Table
│   └── Collapsed Summary
└── Empty State
```

### **Vessel Detail Page** (`/crewing/crew-list/vessel/[id]`)
```
├── Header (Back + Vessel Name + Add Crew)
├── Summary Cards (Vessel, Active, Departed, Capacity)
├── Detailed Crew Grid (Cards with full info)
└── Empty State
```

### **Add Crew Member** (`/crewing/crew-list/new`)
```
├── Header (Back + Title)
├── Multi-section Form
│   ├── Basic Info (Name, Rank, Nationality, DOB)
│   ├── Assignment Info (Vessel, Contract, Dates)
│   └── Emergency & Medical Info
└── Actions (Cancel, Create)
```

## 🔄 **INTEGRATION POINTS**

### **With Applications**
- Crew list shows application status for planned arrivals
- Link to application details for background info

### **With Documents**
- Document expiry warnings in crew cards
- Compliance status indicators

### **With Replacements**
- Replacement planning linked to crew departures
- Automatic crew gap identification

### **With Monthly Checklists**
- Checklist completion status per crew member
- ON/OFF signing tracking

## 📈 **STATUS MANAGEMENT**

### **Assignment Status Mapping**
```typescript
Assignment.status → CrewList.status
'PLANNED'    → 'PLANNED'   (Upcoming arrivals)
'ONBOARD'    → 'ONBOARD'   (Currently active)
'COMPLETED'  → 'DEPARTED'  (Recent departures only)
```

### **Color Coding**
```typescript
'ONBOARD'  → Green  (Active crew)
'DEPARTED' → Red    (Departed crew)
'PLANNED'  → Blue   (Planned arrivals)
```

## 🚀 **API ENDPOINTS NEEDED**

### **Enhanced Assignments API**
```
GET /api/assignments?vesselId={id}  // Filter by vessel
GET /api/assignments?status={status} // Filter by status
GET /api/assignments?dateRange=...   // Date filtering
```

### **Crew List Specific API** (Future)
```
GET /api/crew-list              // Aggregated crew data
GET /api/crew-list/vessel/{id}  // Vessel-specific crew
POST /api/crew-list             // Create crew member (via assignment)
```

## 🎯 **BEST PRACTICES**

### **Data Consistency**
1. **Single Source of Truth**: All crew data comes from Assignments table
2. **Status Synchronization**: Assignment status drives crew list status
3. **Real-time Updates**: Changes in assignments reflect immediately in crew list

### **Performance**
1. **Efficient Queries**: Include only necessary related data
2. **Caching**: Cache vessel/principal data to reduce joins
3. **Pagination**: For large crew lists

### **User Experience**
1. **Progressive Disclosure**: Summary → Details → Full Profile
2. **Visual Hierarchy**: Status colors, icons, and badges
3. **Quick Actions**: Direct links to related modules

## 🔧 **IMPLEMENTATION CHECKLIST**

- [x] Basic crew list structure
- [x] Vessel-specific views
- [x] Add crew member form
- [ ] API integration with assignments
- [ ] Document integration
- [ ] Replacement planning links
- [ ] Monthly checklist integration
- [ ] Status synchronization
- [ ] Real-time updates
- [ ] Performance optimization

## 🎨 **VISUAL DESIGN PRINCIPLES**

1. **Gradient Backgrounds**: Consistent blue-to-indigo gradients
2. **Card-based Layout**: Clean, modern card interfaces
3. **Status Indicators**: Color-coded status badges
4. **Responsive Grid**: 4-column layout for modules
5. **Interactive Elements**: Hover effects and smooth transitions

This structure ensures the crew list becomes the central hub connecting all crewing-related modules with clear data flow and intuitive navigation.