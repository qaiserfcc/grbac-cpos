# 04 - Sales & Returns Module

Status: pending
Assigned: Copilot

Purpose

Implement sales transactions, sale items, and returns processing.

Subtasks

- DB models and migrations for sales and sale_items
- Transactional service for creating sales (create Sale, create SaleItems, decrement inventory)
- Returns processing (update sale, increment inventory)
- Tests and Playwright scenarios

Acceptance Criteria

- Sales creation is transactional and tested
