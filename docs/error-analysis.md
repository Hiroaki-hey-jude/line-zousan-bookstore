# Book detail page validation error

The Prisma error shown in development arises because the `BookDetailPage` handler calls `prisma.book.findUnique({ where: { id: params.id } })`, but `params.id` is `undefined` at runtime. Prisma requires at least one unique field (either `id` or `isbn`) in the `where` clause, so passing `{ id: undefined }` triggers a `PrismaClientValidationError`.

To avoid the failure, ensure the dynamic route always supplies an `id` and guard against missing values before querying Prisma, for example:

```ts
if (!params?.id) {
  return notFound();
}

const book = await prisma.book.findUnique({ where: { id: params.id } });
```

If you expect `isbn` to be used as the unique key, switch the query to `where: { isbn: params.isbn }` or include both keys as appropriate.
