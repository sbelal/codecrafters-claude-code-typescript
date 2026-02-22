# ⚙️ Project Coding Conventions

This document outlines a set of coding conventions and best practices to be followed throughout this project. The goal is to ensure code quality, consistency, and maintainability, making the codebase easier to read, understand, and contribute to for all team members.

---

### Convention: Modularity and Decomposition

* Functions or methods should ideally be atomic. Break complex code into smaller parts.
* **Reason:** Smaller, atomic functions make your code significantly easier to read, test, and maintain.

---

### Convention: Surgical Type Mapping

* **Reason:** Keeps the public methods of services clean and focused on their primary responsibility, while isolating the complexity of SDK-specific transformations.
* **Implications:**
    * Service implementations should use private, dedicated mapping methods (e.g., `mapGenericMessageToProvider`) to transform internal abstractions into external SDK requirements.
    * These methods should handle the conversion of individual objects to facilitate better testing and reuse within the class.
