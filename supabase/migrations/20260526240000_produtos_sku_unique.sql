-- SKU único para upsert do catálogo legado (evita duplicar ao sincronizar)

create unique index if not exists produtos_sku_unique
  on public.produtos (sku)
  where sku is not null;
