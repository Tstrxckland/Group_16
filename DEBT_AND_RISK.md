# Risk & Technical Debt Inventory
**Project:** SafeSpace
**Course:** Senior Project II  
**Module:** Project Reset – From Prototypes to Products  
**Prepared By:** Tykyrah Strickland  
**Date:** 02/2/2026

**Audit Scope:**
This audit considers both the generated codebase and the Lovable.dev UI flows that informed its structure.

## 1. Technical Debt Audit

### 1.1 Architectural Debt

#### Item 1: Monolithic Frontend Structure
**Category:** Architectural Debt  
**Description:**  
The Lovable.dev-generated prototype concentrates UI rendering, business logic, and data access within a limited number of components, prioritizing rapid prototyping over maintainability.

**Impact:**  
This increases coupling, makes debugging difficult, and raises the risk of regression when scaling features.

**Remediation Plan:**  
Refactor into modular components and introduce a service layer for API interactions.

---

### 1.2 Test Debt

#### Item 2: Lack of Automated Testing
**Category:** Test Debt  
**Description:**  
The project currently lacks unit and integration tests for AI-generated components.

**Impact:**  
Changes cannot be verified confidently, increasing the likelihood of hidden bugs.

**Remediation Plan:**  
Introduce a testing framework (e.g., Vitest/Jest) and add baseline tests for critical flows.

---

### 1.3 Documentation Debt

#### Item 3: Limited Architectural Documentation
**Category:** Documentation Debt  
**Description:**  
There is minimal documentation explaining system structure or design decisions.

**Impact:**  
New contributors struggle to understand the system and technical decisions are not traceable.

**Remediation Plan:**  
Expand README and document architecture decisions in `/docs`.

---

## 2. AI & System Risk Assessment

### Risk 1: AI Hallucinated Logic
**Description:**  
AI-generated code may introduce logic that appears functional but is incorrect or insecure.

**Impact:**  
Silent failures or unexpected behavior in production.

**Mitigation Strategy:**  
Require human verification and code reviews for all AI-generated output.

---

### Risk 2: Security & Prompt Injection
**Description:**  
User input could influence AI behavior or expose sensitive logic.

**Impact:**  
Potential data leakage or unintended actions.

**Mitigation Strategy:**  
Sanitize inputs and establish clear trust boundaries between user input and AI prompts.

---

### Risk 3: Dependency on External AI Platforms
**Description:**  
The system relies on Lovable.dev and third-party APIs that may change or become unavailable.

**Impact:**  
System instability or broken functionality.

**Mitigation Strategy:**  
Abstract external dependencies and document fallback strategies.

---

## 3. Backlog Integration Plan

### Selected Technical Debt Items
1. Monolithic Frontend Structure  
2. Lack of Automated Testing  
3. Limited Architectural Documentation  

### GitHub Issues Created
- TBD  
- TBD  
- TBD  

### AI-Aware Acceptance Criteria
Acceptance criteria were drafted using LLM assistance and reviewed by human team members to ensure correctness and feasibility.
