# Forms

Every form in this app follows one pattern, so validation looks and behaves the same everywhere.

**Zod schema → `useForm` + resolver → shadcn `Form` components**

The login form (`src/features/auth/login-form.tsx`) is the reference example.

## 1. Define a Zod schema

Put the schema next to the form in `<feature>-schema.ts` and export the inferred type.

```ts
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;
```

Rules:

- All validation lives in the schema, never inline in components.
- Write messages for the user: say what to do ("Enter your email"), not what went wrong ("Invalid input").
- Check "required" first (`min(1, ...)`) so an empty field gets the right message.

## 2. Set up `useForm` with the resolver

```ts
const form = useForm<LoginValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

- Always provide `defaultValues` (prevents uncontrolled-to-controlled warnings).
- Use the default validation mode: validate on submit, then re-validate as the user edits.

## 3. Build the UI with shadcn `Form` components

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

- `FormMessage` shows the field's error directly under the input.
- Import `Form` from `@/components/ui/form`, not from `react-hook-form`.
- Use `noValidate` so Zod, not the browser, produces the messages.

## 4. Handle submit and server errors

Errors from the server go through `form.setError("root", { message })` and are shown in one `role="alert"` block. Clear them at the start of `onSubmit` with `form.clearErrors("root")`.

## 5. Mobile inputs

Use the right `type` and `inputMode`, set `autoComplete`, use `text-base` (16px) to prevent iOS zoom, and keep inputs and buttons at least 44px tall (`h-12`).

## 6. Test it

Test the form component with Testing Library: submit invalid input and assert the messages, then submit valid input and assert the submit handler ran. Mock `@/lib/supabase`. See `login-form.test.tsx`.

## Installing the packages

```bash
npm install react-hook-form @hookform/resolvers@5 zod --legacy-peer-deps
```

`@hookform/resolvers` is pinned to v5, and `--legacy-peer-deps` is needed because of optional peer dependency conflicts with Zod 4.
