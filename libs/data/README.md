# data

This library contains shared TypeScript interfaces, DTOs, and data models for the Secure Task Management System.

## Purpose

- **Models**: Database entity models (User, Organization, Role, Permission, Task)
- **DTOs**: Data Transfer Objects for API requests/responses
- **Interfaces**: Shared TypeScript interfaces for type safety

## Building

Run `nx build data` to build the library.

## Running unit tests

Run `nx test data` to execute the unit tests via [Jest](https://jestjs.io).

## Usage

```typescript
import { User, Task, CreateTaskDto } from '@data';
```
