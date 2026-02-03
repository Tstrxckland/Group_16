# System Architecture

```mermaid
flowchart TD
    User((User))

    subgraph Frontend["Frontend (Lovable.dev / React)"]
        UI[UI Components]
        Dashboard[Personal Growth Dashboard]
        Journal[Journaling Tools]
        Challenges[Social Challenges]
        CalmTools[Quick Calm Tools]
    end

    subgraph Backend["Backend (Supabase)"]
        Auth[Authentication]
        DB[(PostgreSQL Database)]
        Storage[Secure Storage]
    end

    User --> UI
    UI --> Dashboard
    UI --> Journal
    UI --> Challenges
    UI --> CalmTools

    UI --> Auth
    Dashboard --> DB
    Journal --> DB
    Challenges --> DB
    CalmTools --> DB

