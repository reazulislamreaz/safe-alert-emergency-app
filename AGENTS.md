# AGENTS.md

## Project Development Guidelines

This file defines the mandatory architecture, technology stack, development standards, coding principles, and implementation rules for this project.

All AI agents, developers, and automated coding assistants working on this project **MUST read and follow this file before writing, modifying, refactoring, or deleting any code**.

---

# 1. Source of Truth

The project's **Full Architecture & Feature Scope Analysis** document is the primary source of truth for:

* Overall system architecture
* Feature scope
* Functional requirements
* Business logic
* Modules
* User flows
* Backend responsibilities
* Database requirements
* Real-time functionality
* Third-party integrations
* API behavior
* Technical constraints
* Implementation decisions

### Mandatory Rule

**Always review the Full Architecture & Feature Scope Analysis before writing or modifying code.**

Never implement a feature based only on assumptions.

Before starting implementation:

1. Read the relevant architecture and feature-scope documentation.
2. Understand the existing module structure.
3. Identify the affected business flow.
4. Check existing implementations and conventions.
5. Follow the documented architecture.
6. Implement only what is required.
7. Do not introduce functionality outside the defined scope unless explicitly requested.

If the documentation conflicts with an implementation assumption, **the documented architecture and feature scope take priority** unless the user explicitly approves a change.

---

# 2. Technology Stack

The project uses the following primary technology stack.

## Backend

* **Nest.js**
* **TypeScript**
* **Prisma ORM**
* **PostgreSQL**

## Real-Time Communication

* **Socket.io Gateway**

Use Nest.js Gateway and Socket.io according to the project's documented real-time architecture.

## Video / Audio Communication

* **Zeegocloud**

Follow the documented integration architecture for authentication, rooms, sessions, tokens, callbacks, and related video/audio functionality.

## Related Technologies

Additional technologies, libraries, packages, and infrastructure may be used when required by the architecture and feature scope.

However:

> **Do not introduce a new dependency or technology unless it provides a clear technical benefit and is consistent with the existing architecture.**

---

# 3. Mandatory Coding Principles

## 3.1 Best Practices

Always follow modern industry-standard development practices.

Prioritize:

* Clean Code
* SOLID principles
* Separation of concerns
* DRY principles
* KISS principles
* Strong TypeScript typing
* Modular architecture
* Secure coding practices
* Proper error handling
* Consistent naming conventions
* Maintainable code
* Scalable architecture
* Testability
* Production readiness

Do not sacrifice maintainability for short-term implementation speed.

---

# 4. Clean Code Rules

Write code that is:

* Simple
* Readable
* Predictable
* Maintainable
* Reusable where appropriate
* Easy to test
* Easy to debug
* Consistent with the existing codebase

Avoid:

* Duplicate code
* Dead code
* Unnecessary abstractions
* Large functions
* Large classes
* Deeply nested conditions
* Magic values
* Unclear variable names
* Unnecessary comments
* Premature optimization

Comments should explain **why** something is necessary, not simply describe what the code does.

---

# 5. Data Structures & Algorithms

Always select the most appropriate **Data Structure and Algorithm (DSA)** for the problem.

Consider:

* Time complexity
* Space complexity
* Scalability
* Database performance
* Memory usage
* Query efficiency
* Expected data volume

Prefer efficient and practical solutions.

Do not use a complex algorithm when a simpler solution provides the same or better production performance.

When processing large datasets, avoid approaches that unnecessarily increase:

* CPU usage
* Memory usage
* Database queries
* Network requests
* Iterations

---

# 6. No Unnecessary Loops or Logic

Avoid unnecessary:

* `for` loops
* `forEach`
* `map`
* `filter`
* `reduce`
* Nested loops
* Repeated iterations
* Array transformations
* Condition checks
* Object transformations
* Database queries
* API calls

Before adding a loop or transformation, ask:

> "Is this iteration actually necessary?"

Prefer efficient alternatives when appropriate.

For example:

* Use database-level filtering instead of fetching everything and filtering in application code.
* Use Prisma query capabilities instead of unnecessary JavaScript-side processing.
* Avoid multiple database queries when one optimized query can solve the problem.
* Avoid repeating the same computation.
* Avoid processing the same dataset multiple times.

The objective is not to eliminate loops completely, but to **avoid unnecessary computation and redundant logic**.

---

# 7. Database Rules

Use **PostgreSQL + Prisma** according to the documented architecture.

Prioritize:

* Proper relational modeling
* Appropriate indexes
* Efficient queries
* Correct relations
* Transaction safety
* Data integrity
* Pagination for large datasets
* Selective field retrieval
* Avoiding N+1 queries
* Proper constraints
* Proper migration practices

Do not fetch unnecessary database fields.

Do not load large datasets into application memory when the database can efficiently perform the required operation.

Always consider query performance and scalability.

---

# 8. Nest.js Architecture

Follow Nest.js modular architecture.

Prefer a clean separation such as:

```text
Controller
    ↓
Service
    ↓
Prisma / Repository Layer
    ↓
PostgreSQL
```

For real-time functionality:

```text
Socket.io Client
    ↓
Nest.js Gateway
    ↓
Service / Business Logic
    ↓
Prisma / Database
```

Keep responsibilities separated.

### Controllers

Controllers should:

* Handle HTTP requests
* Validate/request-bind input
* Call services
* Return appropriate responses

Controllers should **not contain complex business logic**.

### Services

Services should contain:

* Business logic
* Validation that belongs to business rules
* Orchestration
* Transaction coordination

### Prisma

Prisma should handle:

* Database access
* Queries
* Relations
* Transactions
* Persistence operations

Avoid putting business logic directly inside database queries unless it is specifically a database concern.

---

# 9. Socket.io Gateway Rules

For Socket.io functionality:

* Keep Gateway responsibilities focused on communication.
* Do not put complex business logic directly inside Gateway handlers.
* Delegate business operations to services.
* Validate incoming socket data.
* Handle authentication and authorization properly.
* Avoid unnecessary socket events.
* Use consistent event naming.
* Prevent duplicate event handling.
* Consider connection lifecycle and cleanup.
* Ensure real-time operations remain scalable.

Follow the architecture defined in the Feature Scope Analysis.

---

# 10. Zeegocloud Integration Rules

Zeegocloud functionality must follow the project's documented architecture.

Pay particular attention to:

* Authentication
* Token generation
* Room/session management
* User identity
* Authorization
* Meeting lifecycle
* Webhook/callback handling where applicable
* Security
* Error handling
* Real-time synchronization

Never expose sensitive credentials or server-side secrets to the client.

Keep Zeegocloud-specific business logic isolated and maintainable.

---

# 11. TypeScript Rules

Use TypeScript strictly and consistently.

Prefer:

* Explicit types where they improve clarity
* Interfaces/types for structured data
* Proper DTOs
* Enums or constants where appropriate
* Type-safe Prisma usage
* Avoiding `any`
* Reusable type definitions

Do not use `any` unless there is a legitimate technical reason.

Avoid unnecessary type assertions.

---

# 12. API Design

All APIs should follow consistent RESTful principles where applicable.

Consider:

* Proper HTTP methods
* Appropriate status codes
* Consistent response structures
* Validation
* Authentication
* Authorization
* Pagination
* Filtering
* Sorting
* Error handling
* API versioning when required by the architecture

Do not create duplicate endpoints for the same business operation without a clear reason.

---

# 13. Authentication & Authorization

Security is mandatory.

Always consider:

* Authentication
* Role-based access control
* Permission validation
* Resource ownership
* Input validation
* Sensitive data protection
* Token security
* Proper authorization at the service/business level

Never assume that authentication alone is sufficient.

A user must also be authorized to perform the requested operation.

---

# 14. Error Handling

Use consistent and meaningful error handling.

Errors should:

* Be predictable
* Provide useful information
* Avoid exposing sensitive implementation details
* Use appropriate Nest.js exceptions
* Be handled at the correct architectural layer

Do not silently swallow errors.

Do not add unnecessary `try/catch` blocks when they do not provide meaningful handling.

---

# 15. Performance Rules

Always consider performance before implementing a solution.

Pay attention to:

* Database queries
* Network requests
* CPU usage
* Memory usage
* Loops
* Large data processing
* Pagination
* Caching where appropriate
* Real-time event volume
* API response size

Do not optimize prematurely, but do not introduce obvious performance problems.

---

# 16. Dependency Rules

Before introducing a new package:

1. Check whether the existing stack already provides the required functionality.
2. Check whether the functionality can be implemented cleanly without a new dependency.
3. Consider package maintenance and security.
4. Consider bundle/runtime impact.
5. Ensure the dependency fits the existing architecture.

Avoid unnecessary dependencies.

---

# 17. Before Writing Code

Every implementation task must follow this process:

```text
1. Read AGENTS.md
        ↓
2. Review Full Architecture & Feature Scope Analysis
        ↓
3. Understand the existing codebase
        ↓
4. Identify affected modules
        ↓
5. Identify existing reusable logic
        ↓
6. Design the simplest appropriate solution
        ↓
7. Consider DSA and performance
        ↓
8. Implement using the existing architecture
        ↓
9. Check for unnecessary loops and logic
        ↓
10. Check database/query efficiency
        ↓
11. Check security and authorization
        ↓
12. Validate the implementation
```

---

# 18. Reuse Existing Code

Before creating new:

* Services
* Utilities
* Guards
* Decorators
* DTOs
* Types
* Prisma queries
* Helpers
* Modules
* Components
* Business logic

check whether an existing implementation can be reused.

Do not duplicate existing functionality.

However, do not force reuse when it makes the code less readable or creates inappropriate coupling.

---

# 19. Do Not Over-Engineer

Implement the simplest solution that satisfies:

* Current requirements
* Architecture
* Security
* Performance
* Maintainability
* Scalability

Avoid:

* Unnecessary design patterns
* Unnecessary abstractions
* Unnecessary interfaces
* Unnecessary wrappers
* Unnecessary services
* Unnecessary dependencies
* Future-proofing without a real requirement

**Simple does not mean careless.**

The implementation should be simple but production-ready.

---

# 20. Change Management

When modifying existing functionality:

* Understand the current implementation first.
* Preserve existing behavior unless the requirement changes it.
* Avoid unrelated refactoring.
* Do not modify unrelated files unnecessarily.
* Maintain backward compatibility where required.
* Check affected modules and dependencies.
* Consider database migration impact.
* Consider API compatibility.
* Consider Socket.io event compatibility.
* Consider Zeegocloud integration impact.

---

# 21. Final Implementation Checklist

Before considering any task complete, verify:

* [ ] Architecture documentation was reviewed.
* [ ] Feature scope was followed.
* [ ] Existing project conventions were followed.
* [ ] Clean Code principles were followed.
* [ ] Appropriate DSA was used.
* [ ] No unnecessary loops were introduced.
* [ ] No redundant logic was introduced.
* [ ] No unnecessary database queries were introduced.
* [ ] No unnecessary dependencies were added.
* [ ] TypeScript types are properly defined.
* [ ] Authentication and authorization were considered.
* [ ] Error handling is appropriate.
* [ ] Performance implications were considered.
* [ ] Security implications were considered.
* [ ] Existing functionality was not unintentionally broken.
* [ ] The implementation is production-ready.

---

# 22. Core Rule

The following principles should guide every implementation decision:

> **Follow the documented architecture.**

> **Implement only the required feature scope.**

> **Use clean, maintainable, production-ready code.**

> **Choose efficient data structures and algorithms.**

> **Avoid unnecessary loops, queries, transformations, and logic.**

> **Reuse existing functionality when appropriate.**

> **Prefer simple and efficient solutions over unnecessary complexity.**

> **Always read the architecture and Feature Scope Analysis before writing code.**

---

## Priority Order

When making implementation decisions, use this priority:

```text
1. Architecture & Feature Scope
2. Security & Correctness
3. Clean Code & Maintainability
4. Performance & Scalability
5. Simplicity
6. Developer Convenience
```

**The project architecture and Feature Scope Analysis always take priority over assumptions or personal implementation preferences.**
