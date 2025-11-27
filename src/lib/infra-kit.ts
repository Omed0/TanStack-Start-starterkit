// This file is called once at application startup, typically via a catch-all route from the auth Route (api/auth/$.ts) for my case,
// ensuring infrastructure initialization occurs before any middleware or routes attempt to use it.

/**
 * Initialize infra-kit configuration
 * This should be called once at application startup
 */
import { initFromEnv } from '@infra-kit/core';
import { initializeWorkers } from './jobs/init-workers';

// Initialize Redis/infrastructure immediately (synchronous)
// This MUST happen before any middleware or routes try to use it
// for me i call this file on route catch all auth service ./api/auth/$.ts
initFromEnv();

// Use an IIFE (Immediately Invoked Function Expression) to ensure
// the asynchronous initialization runs once when the module is loaded.
// This pattern implicitly ensures "run once" behavior for module-level side effects.
(async () => {
    try {
        console.log("Starting InfraKit initialization...");
        // Workers initialization is async, but config is already set up
        await initializeWorkers();
        console.log("InfraKit initialized successfully");
    } catch (error) {
        console.error("Failed to initialize InfraKit:", error);
        // Depending on the application's needs, you might want to
        // re-throw the error or exit the process if initialization is critical.
        // process.exit(1);
    }
})();