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

-- ---------------------------------------------------------------------
-- Actualización: reacciones rápidas + dueño de build (para poder borrar y
-- editar solo la propia, sin login). Ejecutar también en Supabase.
-- ---------------------------------------------------------------------

-- Reacciones rápidas (emoji), por CARD (build + dios), no por build entera:
-- si una foto tiene varios dioses (varias cards en la grilla), reaccionar en
-- una no debe aparecer en las otras. Sin cuenta: el "voter_id" es un id
-- anónimo por dispositivo (ver src/lib/deviceId.ts), guardado en localStorage.
create table if not exists build_reactions (
  build_id uuid not null references builds(id) on delete cascade,
  god_id text not null,
  voter_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (build_id, god_id, voter_id, emoji)
);

create index if not exists build_reactions_build_god_idx on build_reactions (build_id, god_id);

alter table build_reactions enable row level security;

create policy "public read build_reactions" on build_reactions for select using (true);
create policy "public insert build_reactions" on build_reactions for insert with check (true);
create policy "public delete build_reactions" on build_reactions for delete using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'build_reactions'
  ) then
    alter publication supabase_realtime add table build_reactions;
  end if;
end $$;

-- Dueño de cada build, para poder borrar/editar solo la propia sin login:
-- guarda el id anónimo del dispositivo que la subió (ver src/lib/deviceId.ts).
-- Es una tabla aparte (y no una columna en `builds`) a propósito: así nunca
-- se expone por select público ni por el canal de realtime -- solo la puede
-- leer el backend con la service_role key (api/delete-build.ts,
-- api/update-build.ts), que compara el owner_token guardado acá contra el
-- que manda el navegador.
create table if not exists build_owners (
  build_id uuid primary key references builds(id) on delete cascade,
  owner_token text not null,
  created_at timestamptz not null default now()
);

alter table build_owners enable row level security;

-- Solo insert público (al crear la build). Nada de select/update/delete
-- público a propósito: sin eso, cualquiera podría leer el owner_token de
-- cualquier build y hacerse pasar por su dueño.
create policy "public insert build_owners" on build_owners for insert with check (true);

-- Antes cualquiera con el link podía borrar la build de cualquier otro.
-- Ahora solo se borra vía api/delete-build.ts, que sí valida el dueño.
drop policy if exists "public delete builds" on builds;

-- Mismo criterio para los tags de dioses de una build: antes cualquiera
-- podía destaggear los dioses de la build de otro. Editar pasa por
-- api/update-build.ts.
drop policy if exists "public delete build_gods" on build_gods;
