# Analytics Page Specification

## Overview
This analytics page provides a unified, decision-focused view of store performance. Every chart and KPI must answer a clear business question and be visually simple.

---

## 1. KPI Summary Bar (Above Fold)

### Description
Top-level metrics that give instant clarity into business health.

### Metrics to Show
- **Today Revenue**
- **Today Profit**
- **This Month Revenue**
- **This Month Profit**
- **Number of Transactions**
- **Average Ticket Value**
- **Total Inventory Value**
- **Gross Margin %**

### Visualization
Each KPI card includes:
- Numeric value
- Percentage change vs. previous period
- Small sparkline trend

### Purpose
Provide instant sense of performance at a glance.

---

## 2. Revenue & Profit Over Time Chart

### Visualization
**Dual-axis Line Chart**
- X-axis: Time (Day/Week/Month toggle)
- Left Y-axis: Revenue
- Right Y-axis: Profit

### Controls
- Date range selector
- Time granularity toggle (Daily / Weekly / Monthly)

### Purpose
Reveal trends in sales and profit growth or decline.

---

## 3. Top Performing Products

### Visualization
**Top 10 Horizontal Bar Chart**

### Columns/Fields
- Product Name
- Units Sold
- Revenue
- Profit
- Margin %

### Purpose
Show what products drive sales and profit, highlight restock priorities.

---

## 4. Slow & Dead Stock

### Visualization
**Stacked Vertical Bar Chart**
- Categories:
  - No movement 30+ days
  - No movement 60+ days
  - No movement 90+ days

### Metrics
- Count of SKUs
- Value tied in dead stock

### Purpose
Make money trapped in inventory visible.

---

## 5. Category Performance

### Visualization
Choose based on number of categories:
- **Donut Chart** (few categories)
- **Horizontal Bar Chart** (many)

### Metrics
- Revenue share by category
- Profit share by category

### Purpose
Understand which product families contribute most.

---

## 6. Payment Method Breakdown

### Visualization
**Donut Chart**

### Metrics
- Cash
- Card
- Transfer
- Mobile payments

### Purpose
Helps with cash reconciliation and payment trends.

---

## 8. Inventory Value Trends

### Visualization
**Line Chart**

### Metrics
- Total inventory value over time

### Purpose
Shows rising or falling inventory investment.

---

## 9. Optional Advanced: Hourly Sales Heatmap

### Visualization
**Heatmap (Days vs Hours)**

### Purpose
Find best selling hours and improve staffing.

---

## UI & Interaction Rules

### General Guidelines
- Keep page clean and minimal.
- Avoid clutter — maximum 7 main visuals.
- Use color to highlight good vs. concerning trends (e.g., red for dead stock).
- All metrics update dynamically with date range.

### Interactivity
- Hover tooltips on charts
- Drill-down capability — tap a KPI to explore details
- Export PDF / email report button

---

## Business Logic Rules

### Timeframes
- Default: Last 30 days
- Optional: Custom range selection

## Prioritization

| Priority | Feature |
|----------|---------|
| High | KPI Summary, Revenue/Profit Trends, Top Products |
| Medium | Dead Stock, Category Performance, Payment Breakdown |
| Low | Employee Performance, Heatmap |

---

## Notes

- Align metrics with real store data (POS, inventory counts, cost of goods).  
- Ensure profit calculation subtracts cost/discounts correctly.  
- Keep visuals responsive for phone access.  
