-- Projetos novos do Supabase não liberam as tabelas do schema public para a API automaticamente.
-- As regras de RLS continuam valendo: cada usuário só acessa as próprias linhas.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_transfer(uuid, uuid, date, text, uuid, integer, numeric, integer, numeric, integer) to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
