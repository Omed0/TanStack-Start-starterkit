# Advanced Query Utilities - Complete Guide

## Overview

The new `api` utilities provide a clean, type-safe way to interact with your TanStack Start server functions. No more manual query key management or custom utilities - just import and use!

## Key Benefits

✅ **Full TypeScript Support** - Autocomplete and type checking for all operations  
✅ **Zero Boilerplate** - No need to wrap functions one by one  
✅ **Automatic Query Keys** - Generated from module and function names  
✅ **Clean API** - Simple, consistent interface: `api.module.function.queryOptions()`  
✅ **All TanStack Query Features** - Works seamlessly with refetch, invalidate, etc.

## Quick Start

### Basic Usage

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/fn";

// Query - GET operations
const { data, isLoading } = useQuery(api.todo.getAllTodos.queryOptions());

// Mutation - POST operations
const createTodo = useMutation(api.todo.createTodo.mutationOptions());
await createTodo.mutateAsync({ data: { text: "Hello" } });
```

## API Structure

The `api` object is organized by module (feature area):

```
api
├── todo          - Todo operations
├── queue         - Queue management
├── backup        - Database backup/restore
├── analytics     - PostHog analytics
├── file          - File uploads/management
└── user          - User management
```

Each module contains functions that provide:
- `.queryOptions()` - For use with `useQuery`
- `.mutationOptions()` - For use with `useMutation`

## Complete Examples

### 1. Todo Operations

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/fn";

function TodoList() {
  const queryClient = useQueryClient();

  // Get all todos
  const { data: todos, isLoading } = useQuery(
    api.todo.getAllTodos.queryOptions()
  );

  // Create todo
  const createTodo = useMutation({
    ...api.todo.createTodo.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo", "getAllTodos"] });
    },
  });

  // Toggle todo
  const toggleTodo = useMutation({
    ...api.todo.toggleTodo.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo", "getAllTodos"] });
    },
  });

  // Delete todo
  const deleteTodo = useMutation({
    ...api.todo.deleteTodo.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo", "getAllTodos"] });
    },
  });

  return (
    <div>
      {todos?.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() =>
              toggleTodo.mutate({
                data: { id: todo.id, completed: !todo.completed },
              })
            }
          />
          <span>{todo.text}</span>
          <button onClick={() => deleteTodo.mutate({ data: { id: todo.id } })}>
            Delete
          </button>
        </div>
      ))}

      <button
        onClick={() => createTodo.mutate({ data: { text: "New todo" } })}
      >
        Add Todo
      </button>
    </div>
  );
}
```

### 2. Queue Management

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/fn";
import { QueueName } from "@/lib/bullmq";

function QueueManager() {
  // Get all queues status
  const { data: queues, refetch } = useQuery({
    ...api.queue.getQueuesStatus.queryOptions(),
    refetchInterval: 10000, // Auto-refetch every 10s
  });

  // Pause queue
  const pauseQueue = useMutation({
    ...api.queue.pauseQueue.mutationOptions(),
    onSuccess: () => refetch(),
  });

  // Resume queue
  const resumeQueue = useMutation({
    ...api.queue.resumeQueue.mutationOptions(),
    onSuccess: () => refetch(),
  });

  // Clean queue
  const cleanQueue = useMutation({
    ...api.queue.cleanQueue.mutationOptions(),
    onSuccess: (data) => {
      console.log(`Cleaned ${data.cleaned} jobs`);
      refetch();
    },
  });

  return (
    <div>
      {queues?.map((queue) => (
        <div key={queue.name}>
          <h3>{queue.name}</h3>
          <button
            onClick={() =>
              queue.isPaused
                ? resumeQueue.mutate({ data: { queueName: queue.name } })
                : pauseQueue.mutate({ data: { queueName: queue.name } })
            }
          >
            {queue.isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() =>
              cleanQueue.mutate({
                data: {
                  queueName: queue.name,
                  grace: 3600000,
                  limit: 100,
                  status: "completed",
                },
              })
            }
          >
            Clean
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. File Management

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/fn";

function FileManager() {
  const queryClient = useQueryClient();

  // Get all files
  const { data: files } = useQuery(api.file.getFiles.queryOptions());

  // Get presigned URLs for upload
  const getPresignedUrls = useMutation(
    api.file.getPresignedUrls.mutationOptions()
  );

  // Save file info to database
  const saveFileInfo = useMutation({
    ...api.file.saveFileInfo.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", "getFiles"] });
    },
  });

  // Delete file
  const deleteFile = useMutation({
    ...api.file.deleteFile.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", "getFiles"] });
    },
  });

  const handleUpload = async (files: File[]) => {
    // Step 1: Get presigned URLs
    const urls = await getPresignedUrls.mutateAsync({
      data: files.map((f) => ({
        originalName: f.name,
        size: f.size,
      })),
    });

    // Step 2: Upload to S3
    await Promise.all(
      urls.map((url, i) =>
        fetch(url.url, {
          method: "PUT",
          body: files[i],
        })
      )
    );

    // Step 3: Save file info
    await saveFileInfo.mutateAsync({ data: urls });
  };

  return (
    <div>
      <input type="file" multiple onChange={(e) => handleUpload([...e.target.files])} />
      
      {files?.map((file) => (
        <div key={file.id}>
          {file.originalName}
          <button onClick={() => deleteFile.mutate({ data: { id: file.id } })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 4. Backup Operations

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/fn";

function BackupManager() {
  const queryClient = useQueryClient();

  // List all backups
  const { data: backups } = useQuery(api.backup.listBackups.queryOptions());

  // Trigger manual backup
  const triggerBackup = useMutation({
    ...api.backup.triggerManualBackup.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backup", "listBackups"] });
    },
  });

  // Restore backup
  const restoreBackup = useMutation(
    api.backup.restoreBackupFromStorage.mutationOptions()
  );

  // Delete backup
  const deleteBackup = useMutation({
    ...api.backup.deleteBackupFromStorage.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backup", "listBackups"] });
    },
  });

  return (
    <div>
      <button
        onClick={() =>
          triggerBackup.mutate({
            data: {
              type: "full",
              retentionDays: 30,
              compress: true,
            },
          })
        }
      >
        Create Backup
      </button>

      {backups?.map((backup) => (
        <div key={backup.name}>
          {backup.filename}
          <button
            onClick={() =>
              restoreBackup.mutate({ data: { objectName: backup.name } })
            }
          >
            Restore
          </button>
          <button
            onClick={() =>
              deleteBackup.mutate({ data: { objectName: backup.name } })
            }
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. Analytics

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/fn";

function AnalyticsDashboard() {
  // Get overview metrics
  const { data: overview } = useQuery(
    api.analytics.getOverviewMetrics.queryOptions()
  );

  // Get insights
  const { data: insights } = useQuery(
    api.analytics.getInsights.queryOptions({
      data: {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
      },
    })
  );

  return (
    <div>
      <h2>Overview</h2>
      <pre>{JSON.stringify(overview, null, 2)}</pre>

      <h2>Insights</h2>
      <pre>{JSON.stringify(insights, null, 2)}</pre>
    </div>
  );
}
```

## Query Key Structure

Query keys are automatically generated in the format: `[module, functionName, input?]`

Examples:
```typescript
["todo", "getAllTodos"]                                    // No input
["queue", "getJobsByStatus", { data: { queueName: "..." } }]  // With input
["file", "getFileById", { data: { id: "123" } }]          // With params
```

This makes it easy to invalidate specific queries:

```typescript
// Invalidate all todo queries
queryClient.invalidateQueries({ queryKey: ["todo"] });

// Invalidate specific function
queryClient.invalidateQueries({ queryKey: ["todo", "getAllTodos"] });

// Invalidate with specific input
queryClient.invalidateQueries({ 
  queryKey: ["file", "getFileById", { data: { id: "123" } }] 
});
```

## Migration from Old System

### Before (old query-client.ts)
```typescript
import { api } from "@/fn";

// Old way - manual wrapping
const todos = useQuery(queryClient.todo.getAll.queryOptions());
const create = useMutation(queryClient.todo.create.mutationOptions({ ... }));
```

### After (new api utilities)
```typescript
import { api } from "@/fn";

// New way - automatic wrapping
const todos = useQuery(api.todo.getAllTodos.queryOptions());
const create = useMutation({ ...api.todo.createTodo.mutationOptions(), ... });
```

Key differences:
- Import from `@/fn/query-utils` instead of `@/lib/query-client`
- Use actual function names instead of abbreviated names
- Spread mutation options: `{ ...api.module.fn.mutationOptions(), onSuccess: ... }`
- All server functions are automatically wrapped

## Type Safety

The `api` object provides full TypeScript support:

```typescript
// ✅ Autocomplete shows all available modules
api.todo
api.queue
api.file
// etc...

// ✅ Autocomplete shows all functions in module
api.todo.getAllTodos
api.todo.createTodo
api.todo.toggleTodo
// etc...

// ✅ Autocomplete shows available methods
api.todo.createTodo.queryOptions
api.todo.createTodo.mutationOptions

// ✅ Type checking on mutation input
createTodo.mutate({
  data: { text: "hello" }  // ✅ Correct
});

createTodo.mutate({
  data: { content: "hello" }  // ❌ Error: 'content' doesn't exist
});
```

## Advanced Patterns

### Optimistic Updates

```typescript
const updateTodo = useMutation({
  ...api.todo.toggleTodo.mutationOptions(),
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["todo", "getAllTodos"] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["todo", "getAllTodos"]);

    // Optimistically update
    queryClient.setQueryData(["todo", "getAllTodos"], (old: any) =>
      old?.map((todo: any) =>
        todo.id === variables.data.id
          ? { ...todo, completed: variables.data.completed }
          : todo
      )
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["todo", "getAllTodos"], context?.previous);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["todo", "getAllTodos"] });
  },
});
```

### Dependent Queries

```typescript
function FileDetails({ fileId }: { fileId: string }) {
  // Query runs only when fileId exists
  const { data: file } = useQuery({
    ...api.file.getFileById.queryOptions({ data: { id: fileId } }),
    enabled: !!fileId,
  });

  return <div>{file?.originalName}</div>;
}
```

### Parallel Queries

```typescript
function Dashboard() {
  const todos = useQuery(api.todo.getAllTodos.queryOptions());
  const queues = useQuery(api.queue.getQueuesStatus.queryOptions());
  const files = useQuery(api.file.getFiles.queryOptions());

  // All three queries run in parallel
  if (todos.isLoading || queues.isLoading || files.isLoading) {
    return <Loading />;
  }

  return <div>...</div>;
}
```

## File Structure

```
src/fn/
├── query-utils.ts              # Main API utilities (import this)
├── QUERY_UTILS_EXAMPLES.tsx    # Usage examples
├── todos.ts                     # Server functions
├── queue.ts                     # Server functions
├── backup.ts                    # Server functions
├── analytics.ts                 # Server functions
├── files.ts                     # Server functions
└── users.ts                     # Server functions
```

## Summary

The new `api` utilities provide:

1. **One Import** - `import { api } from "@/fn/query-utils"`
2. **Full Types** - Complete TypeScript support
3. **Clean Syntax** - `api.module.function.queryOptions()` or `.mutationOptions()`
4. **Zero Config** - No manual wrapping or setup needed
5. **All Features** - Works with all TanStack Query capabilities

Happy querying! 🚀
