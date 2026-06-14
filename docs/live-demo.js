/**
 * Self-contained interactive Pinnacle demo for GitHub Pages.
 * No backend, no config.js, no iframe — runs entirely in the browser.
 */
(function () {
  var NAV = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "photos", label: "Photos", icon: "📷" },
    { id: "menu", label: "Menu", icon: "🍽️" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "staff", label: "Staff", icon: "👥" },
    { id: "tables", label: "Tables", icon: "🪑" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "finances", label: "Finances", icon: "💰" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "social", label: "Social", icon: "📱" },
    { id: "insights", label: "Command Center", icon: "🧠" },
  ];

  var ANALYTICS_TABS = [
    "Executive",
    "Sales",
    "Food & Inv.",
    "Labor",
    "Menu Eng.",
    "Marketing",
    "Guests",
    "Operations",
    "Purchasing",
    "Forecasting",
    "Profit",
    "External",
  ];

  var ANALYTICS_TAB_DATA = [
    { title: "Executive Summary", kpis: [{ l: "Revenue (7d)", v: "$24.8k", s: "+8% WoW" }, { l: "Net margin", v: "16.8%", s: "-1.2 pts" }, { l: "Labor %", v: "31.2%", s: "Above goal" }, { l: "Guest rating", v: "4.6", s: "Google" }], insight: "Labor and waste are the top two margin drags this week." },
    { title: "Sales Analytics", kpis: [{ l: "Avg check", v: "$41.20", s: "+$2.10" }, { l: "Covers (7d)", v: "612", s: "+14%" }, { l: "Dine-in mix", v: "68%", s: "Stable" }, { l: "Peak hour", v: "7–9pm", s: "Fri–Sat" }], insight: "Entrées driving lift; bar sales soft on weekdays." },
    { title: "Food Cost & Inventory", kpis: [{ l: "Food cost %", v: "28.4%", s: "On target" }, { l: "Variance", v: "1.8%", s: "Theoretical vs actual" }, { l: "Waste (7d)", v: "$420", s: "Above avg" }, { l: "Days on hand", v: "4.2", s: "Salmon low" }], insight: "Salmon and romaine are the biggest variance drivers." },
    { title: "Labor Management", kpis: [{ l: "Labor %", v: "31.2%", s: "Above 28% goal" }, { l: "Sales / labor hr", v: "$86", s: "Target $92" }, { l: "Overtime", v: "6.2%", s: "2 staff" }, { l: "Schedule var.", v: "+4.5%", s: "vs plan" }], insight: "Friday dinner is understaffed; Tuesday lunch overstaffed." },
    { title: "Menu Engineering", kpis: [{ l: "Stars", v: "8 items", s: "High margin + vol" }, { l: "Plowhorses", v: "5 items", s: "Reprice candidates" }, { l: "Puzzles", v: "3 items", s: "Promote" }, { l: "Dogs", v: "2 items", s: "Consider removal" }], insight: "Ribeye and truffle fries are top contributors." },
    { title: "Marketing & Acquisition", kpis: [{ l: "Marketing spend", v: "$1,240", s: "30 days" }, { l: "ROAS", v: "4.2×", s: "Instagram best" }, { l: "CAC", v: "$18", s: "Down 12%" }, { l: "Repeat rate", v: "34%", s: "+2 pts" }], insight: "Weekend brunch promo drove 22% of new guests." },
    { title: "Guest Experience", kpis: [{ l: "Avg rating", v: "4.6★", s: "Google" }, { l: "OpenTable", v: "4.5★", s: "142 reviews" }, { l: "Complaints (7d)", v: "3", s: "Wait time" }, { l: "Resolution", v: "4.2h", s: "Avg time" }], insight: "Wait-time complaints cluster on Saturday 7pm." },
    { title: "Operations", kpis: [{ l: "Avg ticket time", v: "18.4 min", s: "Target 18" }, { l: "Accuracy", v: "96.2%", s: "Good" }, { l: "Void rate", v: "1.8%", s: "Normal" }, { l: "Table turns", v: "2.4", s: "Dinner avg" }], insight: "Kitchen bottleneck at grill station 6–8pm." },
    { title: "Purchasing", kpis: [{ l: "Open POs", v: "2", s: "Sysco, US Foods" }, { l: "Price change", v: "+3.2%", s: "Produce" }, { l: "Savings opp.", v: "$180", s: "Switch vendor" }, { l: "On-time delivery", v: "94%", s: "Last 30d" }], insight: "US Foods beats Sysco on produce this week." },
    { title: "Forecasting & Planning", kpis: [{ l: "Sat covers", v: "142", s: "+22% vs LY" }, { l: "Staff needed Fri", v: "+1 server", s: "Dinner" }, { l: "Catering (7d)", v: "18", s: "Bookings" }, { l: "Inventory order", v: "$2.1k", s: "Suggested" }], insight: "Saturday dinner peak 7–9pm — add one server." },
    { title: "Profitability", kpis: [{ l: "Gross profit", v: "$18.2k", s: "7 days" }, { l: "Prime cost", v: "59.6%", s: "Food + labor" }, { l: "EBITDA est.", v: "$4.2k", s: "Weekly" }, { l: "Break-even", v: "82 covers", s: "/ day" }], insight: "Labor is the largest controllable profit leak." },
    { title: "External Factors", kpis: [{ l: "Weather (Sat)", v: "Clear", s: "Patio open" }, { l: "Local events", v: "2", s: "Farmers market" }, { l: "Competitor promos", v: "1", s: "Happy hour" }, { l: "Sentiment", v: "Positive", s: "Social" }], insight: "Farmers market Saturday AM may boost lunch traffic." },
  ];

  var SCENARIOS = {
    profit: {
      question: "What's hurting my profit this week?",
      headline: "Labor cost high for sales volume is your biggest profit drag",
      metrics: { sales: "$24.8k", profit: "$4.2k", labor: "31.2%" },
      laborClass: "amber",
      findings: [
        { status: "red", tag: "Labor", text: "Labor cost high for volume" },
        { status: "amber", tag: "Waste", text: "Waste eroding margin" },
        { status: "amber", tag: "Vendors", text: "Vendor prices rising" },
      ],
      scanned: ["Sales", "Labor", "Inventory", "Vendors", "Waste", "Reviews", "Staff"],
      confidence: "high",
    },
    rush: {
      question: "What needs my attention before dinner rush?",
      headline: "Two stations understaffed and 3 items below par level",
      metrics: { sales: "$18.2k", profit: "$3.1k", labor: "28.4%" },
      laborClass: "green",
      findings: [
        { status: "red", tag: "Staff", text: "Only 4 servers scheduled for Friday dinner" },
        { status: "amber", tag: "Inventory", text: "Salmon, romaine, and brioche buns low" },
        { status: "green", tag: "Reservations", text: "12 covers booked 6–8pm" },
      ],
      scanned: ["Labor", "Inventory", "Reservations", "Sales", "Staff"],
      confidence: "high",
    },
    order: {
      question: "Create a suggested order for tomorrow",
      headline: "Order 40 lb salmon, 3 cases romaine, 2 cases brioche — saves ~$180 vs last vendor",
      metrics: { sales: "$24.8k", profit: "$4.2k", labor: "31.2%" },
      laborClass: "amber",
      findings: [
        { status: "amber", tag: "Purchasing", text: "Sysco quote 8% above US Foods on produce" },
        { status: "green", tag: "Forecast", text: "Tomorrow lunch +18% vs same day last week" },
        { status: "green", tag: "Par levels", text: "Auto-filled from 14-day usage" },
      ],
      scanned: ["Inventory", "Vendors", "Forecasting", "Purchasing"],
      confidence: "medium",
    },
    coach: {
      question: "Who needs coaching and why?",
      headline: "Alex (server) has lowest check average — coaching on upselling could add $420/wk",
      metrics: { sales: "$24.8k", profit: "$4.2k", labor: "31.2%" },
      laborClass: "amber",
      findings: [
        { status: "red", tag: "Staff", text: "Alex — $28 avg check vs $41 team avg" },
        { status: "amber", tag: "Labor", text: "Jordan — 22 min avg table turn (target 18)" },
        { status: "green", tag: "Staff", text: "Sam — top performer, consider shift lead" },
      ],
      scanned: ["Staff", "Sales", "Labor", "Guests"],
      confidence: "high",
    },
    weekend: {
      question: "How busy will we be this weekend?",
      headline: "Saturday dinner forecast: 142 covers (+22% vs last Saturday)",
      metrics: { sales: "$31.5k", profit: "$5.8k", labor: "29.1%" },
      laborClass: "green",
      findings: [
        { status: "green", tag: "Forecast", text: "Saturday peak 7–9pm — add 1 server" },
        { status: "amber", tag: "Events", text: "Farmers market 2 blocks away Saturday AM" },
        { status: "green", tag: "Weather", text: "Clear skies — patio seating recommended" },
      ],
      scanned: ["Forecasting", "External Factors", "Reservations", "Sales"],
      confidence: "medium",
    },
  };

  var SCENARIO_KEYS = ["profit", "rush", "order", "coach", "weekend"];

  var state = {
    screen: "dashboard",
    scenarioKey: "profit",
    analyzing: false,
    analyticsTab: 0,
  };

  function screenHeader(title, desc) {
    return (
      '<div class="demo-page-header">' +
      '<h2 class="demo-screen-title">' + title + "</h2>" +
      (desc ? '<p class="demo-screen-desc">' + desc + "</p>" : "") +
      "</div>"
    );
  }

  function kpiRow(kpis) {
    return (
      '<div class="demo-kpi-row">' +
      kpis.map(function (k) {
        return (
          '<div class="demo-kpi"><label>' + k.l + "</label><strong" +
          (k.warn ? ' class="warn"' : "") +
          ">" + k.v + "</strong><span" +
          (k.up ? ' class="up"' : "") +
          ">" + k.s + "</span></div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function statusDot(status) {
    return '<span class="status-dot ' + status + '"></span>';
  }

  function renderInsights() {
    var s = SCENARIOS[state.scenarioKey];
    var findingsHtml = s.findings
      .map(function (f) {
        return (
          '<div class="cc-finding">' +
          statusDot(f.status) +
          '<span class="finding-tag">' +
          f.tag +
          "</span><span>" +
          f.text +
          "</span></div>"
        );
      })
      .join("");

    var scanHtml = state.analyzing
      ? '<span class="cc-scan-pulse"></span> Cross-checking sales, labor, inventory…'
      : '<span class="cc-scan-done">✓</span> Analysis complete — "' + s.confidence + '" confidence';

    return (
      '<div class="demo-screen demo-screen-insights' +
      (state.analyzing ? " is-loading" : "") +
      '" data-screen="insights">' +
      '<div class="cc-metrics">' +
      '<div class="cc-metric"><label>Sales</label><strong class="green">' +
      s.metrics.sales +
      "</strong></div>" +
      '<div class="cc-metric"><label>Profit</label><strong class="green">' +
      s.metrics.profit +
      "</strong></div>" +
      '<div class="cc-metric"><label>Labor</label><strong class="' +
      s.laborClass +
      '">' +
      s.metrics.labor +
      "</strong></div></div>" +
      '<div class="cc-question-box"><div class="cc-label">You asked:</div>' +
      '<div class="cc-question-text">' +
      s.question +
      "</div></div>" +
      '<div class="cc-headline-block"><div class="cc-headline">' +
      s.headline +
      "</div></div>" +
      '<div class="cc-findings">' +
      findingsHtml +
      "</div>" +
      '<div class="cc-scan' +
      (state.analyzing ? " active" : "") +
      '">' +
      scanHtml +
      "</div>" +
      '<div class="cc-scanned">Analyzed: ' +
      s.scanned.join(" · ") +
      "</div>" +
      '<div class="cc-controls">' +
      '<div class="cc-input-row">' +
      '<input type="text" class="cc-input demo-cc-input" placeholder="Ask anything about your restaurant…" value="' +
      s.question.replace(/"/g, "&quot;") +
      '" aria-label="Ask the Command Center" />' +
      '<button type="button" class="cc-analyze-btn demo-analyze-btn"' +
      (state.analyzing ? " disabled" : "") +
      ">Analyze</button></div>" +
      '<div class="cc-chips demo-cc-chips">' +
      SCENARIO_KEYS.map(function (key) {
        var sc = SCENARIOS[key];
        var labels = {
          profit: "Profit leaks",
          rush: "Before dinner rush",
          order: "Order for tomorrow",
          coach: "Coach employees",
          weekend: "Weekend forecast",
        };
        return (
          '<button type="button" class="cc-chip' +
          (state.scenarioKey === key ? " active" : "") +
          '" data-scenario="' +
          key +
          '">' +
          labels[key] +
          "</button>"
        );
      }).join("") +
      "</div></div></div>"
    );
  }

  function renderDashboard() {
    return (
      '<div class="demo-screen" data-screen="dashboard">' +
      screenHeader("Dashboard", "Downtown Bistro — daily operations overview") +
      kpiRow([
        { l: "Weekly revenue", v: "$24,820", s: "86 orders", up: true },
        { l: "Monthly expenses", v: "$18,450", s: "Last 30 days" },
        { l: "Active staff", v: "14", s: "42 menu items" },
        { l: "Photos uploaded", v: "128", s: "3 low stock alerts", warn: true },
      ]) +
      '<div class="demo-alert">⚠ Low stock: Salmon (8 lb), Romaine (2 cases), Brioche buns (1 case) — ' +
      '<button type="button" class="demo-link-btn" data-goto="insights" data-scenario="order">Ask AI to draft order →</button></div>' +
      '<div class="demo-panel"><div class="demo-panel-head">AI insights</div>' +
      '<div class="demo-insight-item"><span class="demo-insight-sev high">High</span><strong>Labor cost above target</strong><p>31.2% labor vs 28% goal — review Friday dinner schedule.</p>' +
      '<button type="button" class="demo-link-btn" data-goto="insights" data-scenario="profit">Open Command Center →</button></div>' +
      '<div class="demo-insight-item"><span class="demo-insight-sev medium">Medium</span><strong>Waste trending up</strong><p>$420 waste this week — prep variance on salmon and greens.</p></div>' +
      "</div>" +
      '<div class="demo-panel"><div class="demo-panel-head">Recent activity</div>' +
      '<div class="demo-list-item"><span>Order #2184 created</span><span></span><span>2m ago</span></div>' +
      '<div class="demo-list-item"><span>Inventory count updated</span><span></span><span>1h ago</span></div>' +
      '<div class="demo-list-item"><span>Schedule published</span><span></span><span>3h ago</span></div>' +
      "</div></div>"
    );
  }

  function renderPhotos() {
    var cats = [
      { name: "Menu Items", count: 24, color: "orange" },
      { name: "Inventory", count: 18, color: "blue" },
      { name: "Receipts", count: 12, color: "green" },
      { name: "Staff", count: 8, color: "purple" },
      { name: "Food Prep", count: 15, color: "red" },
      { name: "Marketing", count: 9, color: "pink" },
      { name: "Facility", count: 6, color: "slate" },
      { name: "Maintenance", count: 4, color: "amber" },
    ];
    return (
      '<div class="demo-screen" data-screen="photos">' +
      screenHeader("Photo Library", "Capture and organize photos by category") +
      '<div class="demo-upload-zone">📷 Drop photos or tap to upload — AI auto-tags by category</div>' +
      '<div class="demo-photo-grid">' +
      cats.map(function (c) {
        return (
          '<div class="demo-photo-cat demo-photo-cat-' + c.color + '">' +
          "<strong>" + c.name + "</strong><span>" + c.count + " photos</span></div>"
        );
      }).join("") +
      "</div>" +
      '<div class="demo-panel"><div class="demo-panel-head">Recent uploads</div>' +
      '<div class="demo-photo-row"><span class="demo-photo-thumb">🥩</span><div><strong>Ribeye plating</strong><br><span>Menu · AI: Premium cut, medium-rare</span></div></div>' +
      '<div class="demo-photo-row"><span class="demo-photo-thumb">🧾</span><div><strong>Sysco receipt</strong><br><span>Receipt · AI: $1,842 produce order</span></div></div>' +
      "</div></div>"
    );
  }

  function renderMenu() {
    var items = [
      { cat: "Mains", name: "Wood-Fired Ribeye", price: "$42", avail: true, cost: "$11.20" },
      { cat: "Mains", name: "Pan-Seared Salmon", price: "$34", avail: true, cost: "$9.80" },
      { cat: "Appetizers", name: "Burrata & Heirloom", price: "$16", avail: true, cost: "$4.10" },
      { cat: "Appetizers", name: "Crispy Calamari", price: "$14", avail: false, cost: "$3.60" },
      { cat: "Desserts", name: "Chocolate Lava Cake", price: "$12", avail: true, cost: "$2.40" },
      { cat: "Beverages", name: "House Old Fashioned", price: "$14", avail: true, cost: "$2.80" },
    ];
    return (
      '<div class="demo-screen" data-screen="menu">' +
      screenHeader("Menu Management", "Categories, pricing, availability, and recipe costs") +
      '<div class="demo-toolbar"><span class="demo-toolbar-pill active">All</span><span class="demo-toolbar-pill">Mains</span><span class="demo-toolbar-pill">Appetizers</span><span class="demo-toolbar-pill">Desserts</span><span class="demo-toolbar-pill">Beverages</span></div>' +
      '<div class="demo-menu-list">' +
      items.map(function (item) {
        return (
          '<div class="demo-menu-row">' +
          '<div><span class="demo-menu-cat">' + item.cat + "</span><strong>" + item.name + "</strong></div>" +
          '<div class="demo-menu-meta"><span>Cost ' + item.cost + "</span><strong>" + item.price + "</strong>" +
          '<span class="' + (item.avail ? "badge-done" : "badge-open") + '">' + (item.avail ? "Available" : "86'd") + "</span></div></div>"
        );
      }).join("") +
      "</div></div>"
    );
  }

  function renderAnalytics() {
    var tab = ANALYTICS_TAB_DATA[state.analyticsTab] || ANALYTICS_TAB_DATA[0];
    var tabsHtml = ANALYTICS_TABS.map(function (label, i) {
      return (
        '<button type="button" class="demo-analytics-tab' +
        (state.analyticsTab === i ? " active" : "") +
        '" data-tab="' + i + '">' + label + "</button>"
      );
    }).join("");

    return (
      '<div class="demo-screen" data-screen="analytics">' +
      screenHeader("Analytics", "12-tab intelligence suite — click any tab") +
      '<div class="demo-analytics-tabs" role="tablist">' + tabsHtml + "</div>" +
      '<div class="demo-analytics-content">' +
      '<h3 class="demo-analytics-tab-title">' + tab.title + "</h3>" +
      kpiRow(tab.kpis.map(function (k) {
        return { l: k.l, v: k.v, s: k.s, warn: k.v.indexOf("31.2") >= 0, up: k.s && k.s.indexOf("+") === 0 };
      })) +
      '<div class="demo-chart-placeholder">' +
      '<div class="demo-bars">' +
      [65, 82, 45, 90, 72, 88, 95, 78].map(function (h) {
        return '<div class="demo-bar" style="height:' + h + '%"></div>';
      }).join("") +
      '</div><p class="demo-chart-label">Trend — ' + tab.title + "</p></div>" +
      '<div class="demo-intel-card"><strong>AI insight</strong><p>' + tab.insight + '</p>' +
      '<button type="button" class="demo-link-btn demo-analytics-ai-btn" data-goto="insights" data-scenario="profit">Run deeper analysis in Command Center →</button></div>' +
      "</div></div>"
    );
  }

  function renderOrders() {
    return (
      '<div class="demo-screen" data-screen="orders">' +
      screenHeader("Orders", "Create orders, track status, and link to tables") +
      '<div class="demo-toolbar"><button type="button" class="demo-action-btn">+ New order</button><span class="demo-toolbar-pill active">All</span><span class="demo-toolbar-pill">Open</span><span class="demo-toolbar-pill">Paid</span></div>' +
      '<div class="demo-orders">' +
      [
        { id: "#2184", table: "Table 12", status: "Preparing", total: "$86.40", items: "2× Ribeye, 1× Caesar" },
        { id: "#2183", table: "Bar 3", status: "Served", total: "$42.00", items: "Burger, Fries, 2× Beer" },
        { id: "#2182", table: "Takeout", status: "New", total: "$31.50", items: "Pad Thai, Spring rolls" },
        { id: "#2181", table: "Table 8", status: "Paid", total: "$124.80", items: "Chef's tasting menu ×2" },
      ]
        .map(function (o) {
          var cls =
            o.status === "New"
              ? "badge-new"
              : o.status === "Preparing"
                ? "badge-open"
                : o.status === "Served"
                  ? "badge-open"
                  : "badge-done";
          return (
            '<div class="demo-order-card">' +
            '<div class="demo-order-top"><strong>' +
            o.id +
            "</strong><span class=\"" +
            cls +
            '">' +
            o.status +
            "</span></div>" +
            "<div>" +
            o.table +
            " · " +
            o.items +
            "</div>" +
            '<div class="demo-order-total">' +
            o.total +
            "</div></div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function renderInventory() {
    return (
      '<div class="demo-screen" data-screen="inventory">' +
      screenHeader("Inventory", "Stock levels, par levels, waste, and vendor pricing") +
      '<div class="demo-inv-list">' +
      [
        { name: "Atlantic Salmon", qty: "8 lb", par: "40 lb", status: "red" },
        { name: "Romaine Hearts", qty: "2 cases", par: "5 cases", status: "amber" },
        { name: "Brioche Buns", qty: "1 case", par: "3 cases", status: "amber" },
        { name: "Olive Oil (EVOO)", qty: "4 gal", par: "2 gal", status: "green" },
        { name: "Ribeye Strip", qty: "22 lb", par: "25 lb", status: "green" },
        { name: "Heavy Cream", qty: "3 qt", par: "4 qt", status: "amber" },
      ]
        .map(function (item) {
          return (
            '<div class="demo-inv-row">' +
            statusDot(item.status) +
            "<div><strong>" +
            item.name +
            "</strong><br><span>" +
            item.qty +
            " on hand · par " +
            item.par +
            "</span></div></div>"
          );
        })
        .join("") +
      "</div>" +
      '<button type="button" class="demo-action-btn demo-link-btn" data-goto="insights" data-scenario="order">Ask AI for suggested order →</button>' +
      "</div>"
    );
  }

  function renderStaff() {
    var team = [
      { name: "Alex Rivera", role: "Server", shift: "Fri 5–11pm", perf: "Check avg $28" },
      { name: "Sam Chen", role: "Shift Lead", shift: "Fri 4–12am", perf: "Top performer" },
      { name: "Jordan Lee", role: "Line Cook", shift: "Fri 3–11pm", perf: "18 min tickets" },
      { name: "Morgan Blake", role: "Bartender", shift: "Thu–Sat", perf: "$620/night avg" },
      { name: "Taylor Kim", role: "Host", shift: "Fri 5–10pm", perf: "4.8 guest score" },
    ];
    return (
      '<div class="demo-screen" data-screen="staff">' +
      screenHeader("Staff & Scheduling", "Team roster, roles, shifts, and performance") +
      kpiRow([
        { l: "Active staff", v: "14", s: "5 roles" },
        { l: "Scheduled (wk)", v: "312 hrs", s: "vs 298 plan" },
        { l: "Open shifts", v: "2", s: "Fri dinner", warn: true },
        { l: "Overtime risk", v: "2 staff", s: "This week" },
      ]) +
      '<div class="demo-staff-list">' +
      team.map(function (m) {
        return (
          '<div class="demo-staff-row"><div class="demo-staff-avatar">' + m.name.charAt(0) +
          '</div><div><strong>' + m.name + '</strong><br><span>' + m.role + " · " + m.shift +
          '</span></div><span class="demo-staff-perf">' + m.perf + "</span></div>"
        );
      }).join("") +
      "</div>" +
      '<button type="button" class="demo-link-btn" data-goto="insights" data-scenario="coach">Who needs coaching? Ask AI →</button>' +
      "</div>"
    );
  }

  function renderTables() {
    var tables = [
      { n: 1, seats: 2, status: "available" },
      { n: 2, seats: 2, status: "occupied" },
      { n: 3, seats: 4, status: "occupied" },
      { n: 4, seats: 4, status: "reserved" },
      { n: 5, seats: 4, status: "available" },
      { n: 6, seats: 6, status: "occupied" },
      { n: 7, seats: 2, status: "available" },
      { n: 8, seats: 8, status: "reserved" },
      { n: 9, seats: 4, status: "available" },
      { n: 10, seats: 2, status: "occupied" },
      { n: 11, seats: 4, status: "available" },
      { n: 12, seats: 6, status: "occupied" },
    ];
    return (
      '<div class="demo-screen" data-screen="tables">' +
      screenHeader("Table Floor Plan", "Visual map — available, occupied, and reserved") +
      '<div class="demo-table-legend">' +
      '<span><i class="demo-table-dot available"></i> Available (5)</span>' +
      '<span><i class="demo-table-dot occupied"></i> Occupied (5)</span>' +
      '<span><i class="demo-table-dot reserved"></i> Reserved (2)</span>' +
      "</div>" +
      '<div class="demo-table-grid">' +
      tables.map(function (t) {
        return (
          '<div class="demo-table demo-table-' + t.status + '">' +
          "<strong>T" + t.n + "</strong><span>" + t.seats + " seats</span></div>"
        );
      }).join("") +
      "</div></div>"
    );
  }

  function renderFinances() {
    return (
      '<div class="demo-screen" data-screen="finances">' +
      screenHeader("Finances", "Expenses, receipts, and P&L tracking") +
      kpiRow([
        { l: "Expenses (30d)", v: "$18,450", s: "Tracked" },
        { l: "Food purchases", v: "$8,220", s: "44% of spend" },
        { l: "Labor (payroll)", v: "$7,640", s: "41%" },
        { l: "Receipts scanned", v: "24", s: "AI extracted" },
      ]) +
      '<div class="demo-upload-zone demo-upload-sm">🧾 Scan receipt — AI extracts vendor, amount, and category</div>' +
      '<div class="demo-panel"><div class="demo-panel-head">Recent expenses</div>' +
      '<div class="demo-list-item"><span>Sysco — Produce</span><span class="badge-open">Food</span><span>$1,842</span></div>' +
      '<div class="demo-list-item"><span>US Foods — Protein</span><span class="badge-open">Food</span><span>$2,104</span></div>' +
      '<div class="demo-list-item"><span>PG&amp;E — Utilities</span><span class="badge-done">Ops</span><span>$680</span></div>' +
      '<div class="demo-list-item"><span>Local Linen Co.</span><span class="badge-done">Ops</span><span>$240</span></div>' +
      "</div></div>"
    );
  }

  function renderSocial() {
    return (
      '<div class="demo-screen" data-screen="social">' +
      screenHeader("Social & Web", "Publish posts, manage accounts, and track website traffic") +
      '<div class="demo-social-accounts">' +
      '<div class="demo-social-acct connected"><strong>Instagram</strong><span>2,840 followers · Connected</span></div>' +
      '<div class="demo-social-acct connected"><strong>Facebook</strong><span>1,120 followers · Connected</span></div>' +
      '<div class="demo-social-acct connected"><strong>Google Business</strong><span>4.6★ · 142 reviews</span></div>' +
      "</div>" +
      kpiRow([
        { l: "Scheduled posts", v: "3", s: "This week" },
        { l: "Website visitors", v: "4,280", s: "30 days" },
        { l: "Bounce rate", v: "38%", s: "Improving" },
        { l: "Top referrer", v: "Google", s: "62%" },
      ]) +
      '<div class="demo-compose"><label>Draft post</label>' +
      '<div class="demo-compose-box">Saturday brunch is back — reserve your patio table. 🥂 #DowntownBistro</div>' +
      '<div class="demo-compose-actions"><button type="button" class="demo-action-btn">Schedule</button><button type="button" class="demo-toolbar-pill">Publish now</button></div>' +
      "</div></div>"
    );
  }

  function renderDemo() {
    var navHtml = NAV.map(function (item) {
      return (
        '<button type="button" class="demo-nav-item' +
        (state.screen === item.id ? " active" : "") +
        '" data-screen="' +
        item.id +
        '" title="' +
        item.label +
        '"><span class="demo-nav-icon">' +
        item.icon +
        '</span><span class="demo-nav-label">' +
        item.label +
        "</span></button>"
      );
    }).join("");

    var screens =
      renderDashboard() +
      renderPhotos() +
      renderMenu() +
      renderInventory() +
      renderStaff() +
      renderTables() +
      renderOrders() +
      renderFinances() +
      renderAnalytics() +
      renderSocial() +
      renderInsights();

    return (
      '<div class="pinnacle-demo" id="pinnacle-live-demo">' +
      '<aside class="demo-sidebar">' +
      '<div class="demo-sidebar-brand">' +
      '<img src="./assets/logo-nav.svg" alt="Pinnacle" class="demo-sidebar-logo" width="140" height="28" />' +
      "</div>" +
      '<nav class="demo-sidebar-nav" aria-label="App navigation">' +
      navHtml +
      "</nav>" +
      '<div class="demo-sidebar-footer">' +
      '<div class="demo-user-name">Jordan Mitchell</div>' +
      '<span class="demo-user-badge">Owner</span>' +
      '<div class="demo-location">📍 Downtown Bistro</div>' +
      "</div></aside>" +
      '<div class="demo-main">' +
      screens +
      "</div></div>"
    );
  }

  function showScreen(screenId) {
    state.screen = screenId;
    refreshDemo();
  }

  function runAnalysis(scenarioKey) {
    if (state.analyzing) return;
    if (scenarioKey) state.scenarioKey = scenarioKey;
    state.screen = "insights";
    state.analyzing = true;
    refreshDemo();
    setTimeout(function () {
      state.analyzing = false;
      refreshDemo();
    }, 1400);
  }

  function getDemoContainer() {
    var modal = document.getElementById("app-embed-modal");
    if (modal && modal.classList.contains("open")) {
      return document.getElementById("app-embed-modal-body");
    }
    return document.getElementById("hero-app-embed");
  }

  function mountDemo(container) {
    if (!container) return;
    var scroll = container.querySelector(".demo-main");
    var scrollTop = scroll ? scroll.scrollTop : 0;
    container.innerHTML = renderDemo();
    var newScroll = container.querySelector(".demo-main");
    if (newScroll) newScroll.scrollTop = scrollTop;
    bindDemoEvents(container);
  }

  function refreshDemo() {
    mountDemo(getDemoContainer());
  }

  function bindDemoEvents(container) {
    container.querySelectorAll(".demo-nav-item").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        showScreen(btn.getAttribute("data-screen"));
      });
    });

    container.querySelectorAll(".demo-link-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var scenario = btn.getAttribute("data-scenario");
        runAnalysis(scenario || state.scenarioKey);
      });
    });

    var analyzeBtn = container.querySelector(".demo-analyze-btn");
    var input = container.querySelector(".demo-cc-input");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        runAnalysis(state.scenarioKey);
      });
    }
    if (input) {
      input.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      input.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.key === "Enter") runAnalysis(state.scenarioKey);
      });
    }

    container.querySelectorAll(".demo-cc-chips .cc-chip").forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.stopPropagation();
        runAnalysis(chip.getAttribute("data-scenario"));
      });
    });

    container.querySelectorAll(".demo-action-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    container.querySelectorAll(".demo-analytics-tab").forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.stopPropagation();
        state.analyticsTab = parseInt(tab.getAttribute("data-tab"), 10) || 0;
        refreshDemo();
      });
    });

    container.querySelectorAll(".demo-toolbar-pill").forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.stopPropagation();
        var parent = pill.parentElement;
        if (parent) {
          parent.querySelectorAll(".demo-toolbar-pill").forEach(function (p) {
            p.classList.remove("active");
          });
        }
        pill.classList.add("active");
      });
    });

    container.querySelectorAll(".demo-table").forEach(function (table) {
      table.addEventListener("click", function (e) {
        e.stopPropagation();
        var statuses = ["available", "occupied", "reserved"];
        var cur = table.className.match(/demo-table-(\w+)/);
        var idx = cur ? statuses.indexOf(cur[1]) : 0;
        table.className = "demo-table demo-table-" + statuses[(idx + 1) % statuses.length];
      });
    });

    container.querySelectorAll(".demo-screen").forEach(function (screen) {
      screen.hidden = screen.getAttribute("data-screen") !== state.screen;
    });
  }

  function initHeroDemo() {
    var heroSlot = document.getElementById("hero-app-embed");
    var expandBtn = document.getElementById("hero-embed-expand");
    var modal = document.getElementById("app-embed-modal");
    var modalBody = document.getElementById("app-embed-modal-body");
    var modalBackdrop = document.getElementById("app-embed-modal-backdrop");
    var closeBtn = document.getElementById("app-embed-close");

    if (!heroSlot) return;

    mountDemo(heroSlot);

    function openModal() {
      if (!modal || !modalBody) return;
      mountDemo(modalBody);
      modal.classList.add("open");
      document.body.classList.add("modal-open");
    }

    function closeModal() {
      if (!modal || !heroSlot) return;
      modal.classList.remove("open");
      document.body.classList.remove("modal-open");
      mountDemo(heroSlot);
    }

    if (expandBtn) {
      expandBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        openModal();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeModal();
      });
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", closeModal);
    }
    if (modal) {
      modal.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    var panel = modal && modal.querySelector(".app-embed-modal-panel");
    if (panel) {
      panel.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.classList.contains("open")) closeModal();
    });
  }

  function wireOptionalAppLinks() {
    var cfg = window.PINNACLE_CONFIG || {};
    var base = (cfg.appUrl || "").replace(/\/$/, "");
    document.querySelectorAll("[data-app-link]").forEach(function (el) {
      if (base) {
        el.setAttribute("href", base + (el.getAttribute("data-app-link") || "/"));
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var mobile = document.getElementById("nav-mobile");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        mobile.classList.toggle("open");
      });
      mobile.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.classList.remove("open");
        });
      });
    }
  }

  function init() {
    initHeroDemo();
    wireOptionalAppLinks();
    initNav();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
