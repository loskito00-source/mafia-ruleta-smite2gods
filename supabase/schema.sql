-- Ejecutar en Supabase: Dashboard -> SQL Editor -> New query -> pegar y correr.
-- Guarda las builds (screenshots de items) subidas a Cloudinary, y su relacion
-- muchos-a-muchos con dioses: una misma foto puede etiquetarse con varios
-- dioses, y cada dios muestra sus builds de forma independiente.

create extension if not exists pgcrypto;

create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  image_public_id text not null,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists build_gods (
  build_id uuid not null references builds(id) on delete cascade,
  god_id text not null,
  primary key (build_id, god_id)
);

create index if not exists build_gods_god_id_idx on build_gods (god_id);
create index if not exists builds_created_at_idx on builds (created_at desc);

alter table builds enable row level security;
alter table build_gods enable row level security;

-- Sin login: la app es de uso privado entre amigos, cualquiera con el link
-- puede leer, agregar y borrar builds. Si en el futuro quieres cerrarlo,
-- cambia estas policies para exigir auth.
create policy "public read builds" on builds for select using (true);
create policy "public insert builds" on builds for insert with check (true);
create policy "public delete builds" on builds for delete using (true);

create policy "public read build_gods" on build_gods for select using (true);
create policy "public insert build_gods" on build_gods for insert with check (true);
create policy "public delete build_gods" on build_gods for delete using (true);

-- Realtime: publica los inserts/deletes de `builds` por websocket para que
-- todos los que tengan la página de builds abierta vean aparecer las
-- nuevas al instante (ver src/lib/builds.ts -> useBuildsRealtime).
-- Idempotente: "alter publication ... add table" falla si ya está agregada.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'builds'
  ) then
    alter publication supabase_realtime add table builds;
  end if;
end $$;
